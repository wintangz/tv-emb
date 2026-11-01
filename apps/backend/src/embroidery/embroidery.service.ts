import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createSeedDatabase } from './embroidery.seed.js';
import type {
  Customer,
  DashboardMetrics,
  DashboardPayload,
  EmbroideryDatabase,
  EmbroideryDesign,
  EmbroideryMachine,
  EmbroideryOrder,
  Employee,
  InventoryItem,
  OrderStatus,
  PaymentStatus,
  QuoteBreakdown,
  QuoteInput,
} from './embroidery.types.js';

export function calculateEmployeeMonthlyCost(emp: Employee): number {
  const basePay =
    emp.payType === 'Monthly'
      ? emp.monthlyBaseSalary
      : emp.hourlyRate * emp.hoursWorkedMonth;
  const effectiveHourly =
    emp.payType === 'Monthly' ? emp.monthlyBaseSalary / 176 : emp.hourlyRate;
  const overtimePay = effectiveHourly * 1.5 * emp.overtimeHoursMonth;
  const stitchBonus =
    (emp.stitchesCompletedMonth / 10000) * emp.stitchBonusPer10k;
  return Math.round(basePay + overtimePay + stitchBonus + emp.allowanceAndBonus);
}

const ACTIVE_ORDER_STATUSES = new Set<OrderStatus>([
  'QUOTE',
  'DIGITIZING',
  'APPROVAL_PENDING',
  'IN_PRODUCTION',
  'QUALITY_CHECK',
]);

@Injectable()
export class EmbroideryService {
  private readonly dbFilePath: string;
  private db: EmbroideryDatabase;
  private cachedMetrics: DashboardMetrics | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    this.dbFilePath = path.join(dataDir, 'embroidery-db.json');
    this.db = this.loadDatabase();
  }

  private loadDatabase(): EmbroideryDatabase {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw) as EmbroideryDatabase;
        // Auto-migrate legacy USD database (where unitPrice < 1000) to VND seed data
        const hasLegacyUsd =
          (parsed.orders?.[0]?.unitPrice ?? 0) > 0 &&
          (parsed.orders?.[0]?.unitPrice ?? 0) < 1000;
        if (!hasLegacyUsd) {
          const fallbackSeed = createSeedDatabase();
          parsed.orders = (parsed.orders ?? []).map((o) => ({
            ...o,
            paymentStatus: o.paymentStatus ?? 'UNPAID',
            amountPaid: o.amountPaid ?? 0,
          }));
          if (!parsed.employees || parsed.employees.length === 0) {
            parsed.employees = fallbackSeed.employees;
          }
          return parsed;
        }
      }
    } catch {
      // Fallback to in-memory seed if disk read fails
    }
    const seeded = createSeedDatabase();
    this.saveDatabase(seeded, true);
    return seeded;
  }

  private saveDatabase(
    data: EmbroideryDatabase = this.db,
    immediate = false,
  ): void {
    this.cachedMetrics = null;
    if (immediate) {
      try {
        const dir = path.dirname(this.dbFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(
          this.dbFilePath,
          JSON.stringify(data, null, 2),
          'utf-8',
        );
      } catch {
        // Ignore write errors in restricted test sandboxes
      }
      return;
    }

    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      const dir = path.dirname(this.dbFilePath);
      void fs.promises
        .mkdir(dir, { recursive: true })
        .then(() =>
          fs.promises.writeFile(
            this.dbFilePath,
            JSON.stringify(this.db, null, 2),
            'utf-8',
          ),
        )
        .catch(() => {
          // Ignore background write errors
        });
    }, 120);
  }

  computeMetrics(): DashboardMetrics {
    if (this.cachedMetrics) {
      return this.cachedMetrics;
    }

    let activeOrdersCount = 0;
    let inProductionCount = 0;
    let pendingApprovalCount = 0;
    let totalQueuedStitches = 0;
    let monthlyRevenue = 0;
    let collectedRevenue = 0;

    for (const order of this.db.orders) {
      monthlyRevenue += order.totalPrice;
      collectedRevenue += order.amountPaid ?? 0;

      if (ACTIVE_ORDER_STATUSES.has(order.status)) {
        activeOrdersCount += 1;
        const remainingQty = Math.max(
          0,
          order.quantity - order.completedQuantity,
        );
        totalQueuedStitches += remainingQty * order.stitchCount;
      }
      if (order.status === 'IN_PRODUCTION') {
        inProductionCount += 1;
      } else if (
        order.status === 'APPROVAL_PENDING' ||
        order.status === 'DIGITIZING'
      ) {
        pendingApprovalCount += 1;
      }
    }

    const outstandingReceivables = Math.max(
      0,
      Math.round(monthlyRevenue - collectedRevenue),
    );

    let runningMachinesCount = 0;
    for (const m of this.db.machines) {
      if (m.status === 'RUNNING') runningMachinesCount += 1;
    }

    let lowStockItemsCount = 0;
    let inventoryValue = 0;
    for (const item of this.db.inventory) {
      if (item.quantity <= item.minThreshold) lowStockItemsCount += 1;
      inventoryValue += item.quantity * item.unitCost;
    }
    inventoryValue = Math.round(inventoryValue);

    const employees = this.db.employees ?? [];
    let activeEmployeesCount = 0;
    let monthlyLaborCost = 0;
    let paidLaborCost = 0;
    for (const emp of employees) {
      if (emp.status === 'ACTIVE') activeEmployeesCount += 1;
      monthlyLaborCost += calculateEmployeeMonthlyCost(emp);
      paidLaborCost += emp.amountPaidMonth ?? 0;
    }
    monthlyLaborCost = Math.round(monthlyLaborCost);
    paidLaborCost = Math.round(paidLaborCost);
    const unpaidLaborCost = Math.max(
      0,
      Math.round(monthlyLaborCost - paidLaborCost),
    );
    const estimatedNetProfit = Math.round(monthlyRevenue - monthlyLaborCost);

    this.cachedMetrics = {
      activeOrdersCount,
      inProductionCount,
      pendingApprovalCount,
      totalQueuedStitches,
      monthlyRevenue: Math.round(monthlyRevenue),
      collectedRevenue: Math.round(collectedRevenue),
      outstandingReceivables,
      runningMachinesCount,
      totalMachinesCount: this.db.machines.length,
      lowStockItemsCount,
      inventoryValue,
      activeEmployeesCount,
      totalEmployeesCount: employees.length,
      monthlyLaborCost,
      paidLaborCost,
      unpaidLaborCost,
      estimatedNetProfit,
    };

    return this.cachedMetrics;
  }

  getDashboard(): DashboardPayload {
    return {
      ...this.db,
      metrics: this.computeMetrics(),
    };
  }

  resetDatabase(): DashboardPayload {
    this.db = createSeedDatabase();
    this.saveDatabase(this.db, true);
    return this.getDashboard();
  }

  importDatabase(payload: Partial<EmbroideryDatabase>): DashboardPayload {
    if (
      payload.orders &&
      payload.designs &&
      payload.machines &&
      payload.inventory &&
      payload.customers
    ) {
      this.db = {
        orders: payload.orders,
        designs: payload.designs,
        machines: payload.machines,
        inventory: payload.inventory,
        customers: payload.customers,
        employees: payload.employees ?? this.db.employees,
      };
      this.saveDatabase();
    }
    return this.getDashboard();
  }

  // Orders
  getOrders(): EmbroideryOrder[] {
    return this.db.orders;
  }

  createOrder(payload: Partial<EmbroideryOrder>): EmbroideryOrder {
    const nextSeq = 101 + this.db.orders.length;
    const orderNumber = payload.orderNumber ?? `TV-2610-${nextSeq}`;
    const quantity = Number(payload.quantity ?? 24);
    const stitchCount = Number(payload.stitchCount ?? 8000);
    const unitPrice = Number(payload.unitPrice ?? 165000);
    const digitizingFee = Number(payload.digitizingFee ?? 0);
    const totalPrice =
      payload.totalPrice !== undefined
        ? Math.round(Number(payload.totalPrice))
        : Math.round(quantity * unitPrice + digitizingFee);

    const paymentStatus: PaymentStatus = payload.paymentStatus ?? 'UNPAID';
    const amountPaid =
      payload.amountPaid !== undefined
        ? Math.round(Number(payload.amountPaid))
        : paymentStatus === 'PAID'
          ? totalPrice
          : paymentStatus === 'DEPOSIT_PAID'
            ? Math.round(totalPrice * 0.5)
            : 0;

    const newOrder: EmbroideryOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerId: payload.customerId ?? 'cust-1',
      customerName: payload.customerName ?? 'Khách Lẻ Xưởng',
      companyName: payload.companyName ?? 'Đồng Phục Doanh Nghiệp',
      designId: payload.designId ?? 'des-1',
      designName: payload.designName ?? 'Logo Thêu Ngực Trái',
      garmentType: payload.garmentType ?? 'Port Authority K500 Polo',
      garmentColor: payload.garmentColor ?? 'Navy Blue',
      placement: payload.placement ?? 'Left Chest',
      quantity,
      completedQuantity: Number(payload.completedQuantity ?? 0),
      sizeBreakdown: payload.sizeBreakdown ?? {
        S: Math.floor(quantity * 0.15),
        M: Math.floor(quantity * 0.35),
        L: Math.floor(quantity * 0.3),
        XL: Math.floor(quantity * 0.15),
        XXL:
          quantity -
          (Math.floor(quantity * 0.15) +
            Math.floor(quantity * 0.35) +
            Math.floor(quantity * 0.3) +
            Math.floor(quantity * 0.15)),
      },
      stitchCount,
      colorCount: Number(payload.colorCount ?? 3),
      threadColors: payload.threadColors ?? ['#1e3a8a', '#f8fafc', '#dc2626'],
      status: payload.status ?? 'DIGITIZING',
      paymentStatus,
      amountPaid,
      assignedMachineId: payload.assignedMachineId ?? null,
      dueDate:
        payload.dueDate ??
        new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
      rushOrder: Boolean(payload.rushOrder),
      digitizingFee,
      unitPrice,
      totalPrice,
      notes: payload.notes ?? '',
    };

    this.db.orders.unshift(newOrder);

    const customer = this.db.customers.find(
      (c) =>
        c.id === newOrder.customerId ||
        c.company.toLowerCase() === newOrder.companyName.toLowerCase(),
    );
    if (customer) {
      customer.totalOrders += 1;
      customer.totalSpend = Math.round(
        customer.totalSpend + newOrder.totalPrice,
      );
    }

    this.saveDatabase();
    return newOrder;
  }

  updateOrder(id: string, payload: Partial<EmbroideryOrder>): EmbroideryOrder {
    const order = this.db.orders.find((o) => o.id === id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    if (payload.customerName !== undefined)
      order.customerName = payload.customerName;
    if (payload.companyName !== undefined)
      order.companyName = payload.companyName;
    if (payload.customerId !== undefined) order.customerId = payload.customerId;
    if (payload.designId !== undefined) order.designId = payload.designId;
    if (payload.designName !== undefined) order.designName = payload.designName;
    if (payload.garmentType !== undefined)
      order.garmentType = payload.garmentType;
    if (payload.garmentColor !== undefined)
      order.garmentColor = payload.garmentColor;
    if (payload.placement !== undefined) order.placement = payload.placement;
    if (payload.quantity !== undefined)
      order.quantity = Math.max(1, Number(payload.quantity));
    if (payload.completedQuantity !== undefined) {
      order.completedQuantity = Math.max(
        0,
        Math.min(order.quantity, Number(payload.completedQuantity)),
      );
    }
    if (payload.sizeBreakdown !== undefined)
      order.sizeBreakdown = payload.sizeBreakdown;
    if (payload.stitchCount !== undefined)
      order.stitchCount = Number(payload.stitchCount);
    if (payload.colorCount !== undefined)
      order.colorCount = Number(payload.colorCount);
    if (payload.threadColors !== undefined)
      order.threadColors = payload.threadColors;
    if (payload.status !== undefined) order.status = payload.status;
    if (payload.paymentStatus !== undefined)
      order.paymentStatus = payload.paymentStatus;
    if (payload.amountPaid !== undefined)
      order.amountPaid = Math.round(Number(payload.amountPaid));
    if (payload.assignedMachineId !== undefined)
      order.assignedMachineId = payload.assignedMachineId;
    if (payload.dueDate !== undefined) order.dueDate = payload.dueDate;
    if (payload.rushOrder !== undefined)
      order.rushOrder = Boolean(payload.rushOrder);
    if (payload.digitizingFee !== undefined)
      order.digitizingFee = Math.round(Number(payload.digitizingFee));
    if (payload.unitPrice !== undefined)
      order.unitPrice = Math.round(Number(payload.unitPrice));
    if (payload.totalPrice !== undefined) {
      order.totalPrice = Math.round(Number(payload.totalPrice));
    } else if (
      payload.quantity !== undefined ||
      payload.unitPrice !== undefined ||
      payload.digitizingFee !== undefined
    ) {
      order.totalPrice = Math.round(
        order.quantity * order.unitPrice + order.digitizingFee,
      );
    }
    if (payload.notes !== undefined) order.notes = payload.notes;

    this.saveDatabase();
    return order;
  }

  updateOrderStatus(
    id: string,
    status: OrderStatus,
    completedQuantity?: number,
    assignedMachineId?: string | null,
  ): EmbroideryOrder {
    const order = this.db.orders.find((o) => o.id === id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    order.status = status;
    if (completedQuantity !== undefined) {
      order.completedQuantity = Math.max(
        0,
        Math.min(order.quantity, Number(completedQuantity)),
      );
    } else if (
      status === 'COMPLETED' ||
      status === 'DELIVERED' ||
      status === 'QUALITY_CHECK'
    ) {
      order.completedQuantity = order.quantity;
    }

    if (assignedMachineId !== undefined) {
      order.assignedMachineId = assignedMachineId;
    }

    this.saveDatabase();
    return order;
  }

  deleteOrder(id: string): { deleted: boolean; id: string } {
    const idx = this.db.orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    this.db.orders.splice(idx, 1);
    this.saveDatabase();
    return { deleted: true, id };
  }

  // Designs
  getDesigns(): EmbroideryDesign[] {
    return this.db.designs;
  }

  createDesign(payload: Partial<EmbroideryDesign>): EmbroideryDesign {
    const nextCode = `TV-DST-0${41 + this.db.designs.length}`;
    const newDesign: EmbroideryDesign = {
      id: `des-${Date.now()}`,
      code: payload.code ?? nextCode,
      name: payload.name ?? 'Untitled Embroidery Design',
      clientName: payload.clientName ?? 'General Client',
      stitchCount: Number(payload.stitchCount ?? 7500),
      widthMm: Number(payload.widthMm ?? 90),
      heightMm: Number(payload.heightMm ?? 60),
      hoopSize: payload.hoopSize ?? '120x120mm Tubular',
      fileFormat: payload.fileFormat ?? 'DST',
      complexity: payload.complexity ?? 'Standard',
      digitizerNotes:
        payload.digitizerNotes ??
        'Standard underlay + 0.40mm pull compensation.',
      createdAt: new Date().toISOString().slice(0, 10),
      stitchPaths: payload.stitchPaths,
      jumpCount:
        payload.jumpCount !== undefined ? Number(payload.jumpCount) : undefined,
      trimCount:
        payload.trimCount !== undefined ? Number(payload.trimCount) : undefined,
      colorSequence:
        payload.colorSequence && payload.colorSequence.length > 0
          ? payload.colorSequence
          : [
              {
                needle: 1,
                threadCode: 'M-1800',
                name: 'Emerald Black',
                hex: '#0f172a',
              },
              {
                needle: 2,
                threadCode: 'M-1801',
                name: 'Super White',
                hex: '#f8fafc',
              },
              {
                needle: 3,
                threadCode: 'M-1838',
                name: 'Classic Red',
                hex: '#dc2626',
              },
            ],
    };

    this.db.designs.unshift(newDesign);
    this.saveDatabase();
    return newDesign;
  }

  updateDesign(
    id: string,
    payload: Partial<EmbroideryDesign>,
  ): EmbroideryDesign {
    const design = this.db.designs.find((d) => d.id === id);
    if (!design) {
      throw new NotFoundException(`Design ${id} not found`);
    }
    if (payload.name !== undefined) design.name = payload.name;
    if (payload.code !== undefined) design.code = payload.code;
    if (payload.clientName !== undefined)
      design.clientName = payload.clientName;
    if (payload.stitchCount !== undefined)
      design.stitchCount = Number(payload.stitchCount);
    if (payload.widthMm !== undefined) design.widthMm = Number(payload.widthMm);
    if (payload.heightMm !== undefined)
      design.heightMm = Number(payload.heightMm);
    if (payload.hoopSize !== undefined) design.hoopSize = payload.hoopSize;
    if (payload.fileFormat !== undefined)
      design.fileFormat = payload.fileFormat;
    if (payload.complexity !== undefined)
      design.complexity = payload.complexity;
    if (payload.digitizerNotes !== undefined)
      design.digitizerNotes = payload.digitizerNotes;
    if (payload.colorSequence !== undefined)
      design.colorSequence = payload.colorSequence;
    if (payload.stitchPaths !== undefined)
      design.stitchPaths = payload.stitchPaths;
    if (payload.jumpCount !== undefined)
      design.jumpCount = Number(payload.jumpCount);
    if (payload.trimCount !== undefined)
      design.trimCount = Number(payload.trimCount);

    this.saveDatabase();
    return design;
  }

  deleteDesign(id: string): { deleted: boolean; id: string } {
    const idx = this.db.designs.findIndex((d) => d.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Design ${id} not found`);
    }
    this.db.designs.splice(idx, 1);
    this.saveDatabase();
    return { deleted: true, id };
  }

  // Machines
  getMachines(): EmbroideryMachine[] {
    return this.db.machines;
  }

  createMachine(payload: Partial<EmbroideryMachine>): EmbroideryMachine {
    const newMachine: EmbroideryMachine = {
      id: `mach-${Date.now()}`,
      name: payload.name ?? `Line ${this.db.machines.length + 1} — Multi-Head`,
      brand: payload.brand ?? 'Tajima',
      model: payload.model ?? 'TMEZ-SC1501',
      heads: Number(payload.heads ?? 1),
      needlesPerHead: Number(payload.needlesPerHead ?? 15),
      maxSpm: Number(payload.maxSpm ?? 1200),
      currentSpm: Number(payload.currentSpm ?? 0),
      status: payload.status ?? 'IDLE',
      activeOrderId: payload.activeOrderId ?? null,
      activeOrderNumber: null,
      progressPercent: 0,
      totalStitchesToday: 0,
      threadBreaksToday: 0,
      lastMaintenanceDate:
        payload.lastMaintenanceDate ?? new Date().toISOString().slice(0, 10),
    };
    this.db.machines.push(newMachine);
    this.saveDatabase();
    return newMachine;
  }

  updateMachine(
    id: string,
    payload: Partial<EmbroideryMachine>,
  ): EmbroideryMachine {
    const machine = this.db.machines.find((m) => m.id === id);
    if (!machine) {
      throw new NotFoundException(`Machine ${id} not found`);
    }

    if (payload.name !== undefined) machine.name = payload.name;
    if (payload.brand !== undefined) machine.brand = payload.brand;
    if (payload.model !== undefined) machine.model = payload.model;
    if (payload.heads !== undefined) machine.heads = Number(payload.heads);
    if (payload.needlesPerHead !== undefined)
      machine.needlesPerHead = Number(payload.needlesPerHead);
    if (payload.maxSpm !== undefined) machine.maxSpm = Number(payload.maxSpm);
    if (payload.lastMaintenanceDate !== undefined) {
      machine.lastMaintenanceDate = payload.lastMaintenanceDate;
    }

    if (payload.status !== undefined) {
      machine.status = payload.status;
      if (payload.status === 'IDLE' || payload.status === 'MAINTENANCE') {
        machine.currentSpm = 0;
      } else if (payload.status === 'RUNNING' && machine.currentSpm === 0) {
        machine.currentSpm = Math.min(900, machine.maxSpm);
      }
    }
    if (payload.currentSpm !== undefined) {
      machine.currentSpm = Math.max(
        0,
        Math.min(machine.maxSpm, Number(payload.currentSpm)),
      );
    }
    if (payload.activeOrderId !== undefined) {
      machine.activeOrderId = payload.activeOrderId;
      const foundOrder = this.db.orders.find(
        (o) => o.id === payload.activeOrderId,
      );
      machine.activeOrderNumber = foundOrder ? foundOrder.orderNumber : null;
      if (foundOrder) {
        foundOrder.assignedMachineId = machine.id;
      }
    }
    if (payload.progressPercent !== undefined) {
      machine.progressPercent = Math.max(
        0,
        Math.min(100, Number(payload.progressPercent)),
      );
    }
    if (payload.threadBreaksToday !== undefined) {
      machine.threadBreaksToday = Math.max(
        0,
        Number(payload.threadBreaksToday),
      );
    }
    if (payload.totalStitchesToday !== undefined) {
      machine.totalStitchesToday = Math.max(
        0,
        Number(payload.totalStitchesToday),
      );
    }

    this.saveDatabase();
    return machine;
  }

  // Inventory
  getInventory(): InventoryItem[] {
    return this.db.inventory;
  }

  adjustInventoryStock(id: string, delta: number): InventoryItem {
    const item = this.db.inventory.find((i) => i.id === id);
    if (!item) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }
    item.quantity = Math.max(0, item.quantity + Number(delta));
    this.saveDatabase();
    return item;
  }

  restockLowInventory(): InventoryItem[] {
    for (const item of this.db.inventory) {
      if (item.quantity <= item.minThreshold) {
        item.quantity = item.minThreshold + 10;
      }
    }
    this.saveDatabase();
    return this.db.inventory;
  }

  createInventoryItem(payload: Partial<InventoryItem>): InventoryItem {
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku: payload.sku ?? `MAD-${Math.floor(1000 + Math.random() * 9000)}`,
      name: payload.name ?? 'Madeira Polyneon Thread Cone (5000m)',
      category: payload.category ?? 'Thread',
      brand: payload.brand ?? 'Madeira',
      colorCode: payload.colorCode ?? '#1900',
      colorHex: payload.colorHex ?? '#3b82f6',
      material: payload.material ?? '40wt Polyester',
      quantity: Number(payload.quantity ?? 10),
      unit: payload.unit ?? 'cones',
      minThreshold: Number(payload.minThreshold ?? 5),
      unitCost: Math.round(Number(payload.unitCost ?? 95000)),
    };
    this.db.inventory.unshift(newItem);
    this.saveDatabase();
    return newItem;
  }

  updateInventoryItem(
    id: string,
    payload: Partial<InventoryItem>,
  ): InventoryItem {
    const item = this.db.inventory.find((i) => i.id === id);
    if (!item) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }
    if (payload.sku !== undefined) item.sku = payload.sku;
    if (payload.name !== undefined) item.name = payload.name;
    if (payload.category !== undefined) item.category = payload.category;
    if (payload.brand !== undefined) item.brand = payload.brand;
    if (payload.colorCode !== undefined) item.colorCode = payload.colorCode;
    if (payload.colorHex !== undefined) item.colorHex = payload.colorHex;
    if (payload.material !== undefined) item.material = payload.material;
    if (payload.quantity !== undefined)
      item.quantity = Math.max(0, Number(payload.quantity));
    if (payload.unit !== undefined) item.unit = payload.unit;
    if (payload.minThreshold !== undefined)
      item.minThreshold = Math.max(0, Number(payload.minThreshold));
    if (payload.unitCost !== undefined)
      item.unitCost = Math.max(0, Math.round(Number(payload.unitCost)));

    this.saveDatabase();
    return item;
  }

  deleteInventoryItem(id: string): { deleted: boolean; id: string } {
    const idx = this.db.inventory.findIndex((i) => i.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }
    this.db.inventory.splice(idx, 1);
    this.saveDatabase();
    return { deleted: true, id };
  }

  // Customers
  getCustomers(): Customer[] {
    return this.db.customers;
  }

  createCustomer(payload: Partial<Customer>): Customer {
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: payload.name ?? 'New Contact',
      company: payload.company ?? 'Client Company',
      email: payload.email ?? 'contact@example.com',
      phone: payload.phone ?? '0903 555 199',
      totalOrders: Number(payload.totalOrders ?? 0),
      totalSpend: Math.round(Number(payload.totalSpend ?? 0)),
      preferredGarments: payload.preferredGarments ?? 'Polos, Caps',
      notes: payload.notes ?? '',
    };
    this.db.customers.unshift(newCustomer);
    this.saveDatabase();
    return newCustomer;
  }

  updateCustomer(id: string, payload: Partial<Customer>): Customer {
    const customer = this.db.customers.find((c) => c.id === id);
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    if (payload.name !== undefined) customer.name = payload.name;
    if (payload.company !== undefined) customer.company = payload.company;
    if (payload.email !== undefined) customer.email = payload.email;
    if (payload.phone !== undefined) customer.phone = payload.phone;
    if (payload.preferredGarments !== undefined)
      customer.preferredGarments = payload.preferredGarments;
    if (payload.notes !== undefined) customer.notes = payload.notes;

    this.saveDatabase();
    return customer;
  }

  deleteCustomer(id: string): { deleted: boolean; id: string } {
    const idx = this.db.customers.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    this.db.customers.splice(idx, 1);
    this.saveDatabase();
    return { deleted: true, id };
  }

  // Employees & Labor Cost
  getEmployees(): Employee[] {
    return this.db.employees;
  }

  createEmployee(payload: Partial<Employee>): Employee {
    const nextCode = `TV-NV-${String(this.db.employees.length + 1).padStart(2, '0')}`;
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      code: payload.code ?? nextCode,
      name: payload.name ?? 'Nhân Viên Mới',
      role: payload.role ?? 'Machine Operator',
      shift: payload.shift ?? 'Full-Day',
      status: payload.status ?? 'ACTIVE',
      phone: payload.phone ?? '0901 234 567',
      assignedMachineId: payload.assignedMachineId ?? null,
      payType: payload.payType ?? 'Hourly',
      hourlyRate: Math.round(Number(payload.hourlyRate ?? 45000)),
      monthlyBaseSalary: Math.round(
        Number(payload.monthlyBaseSalary ?? 8500000),
      ),
      hoursWorkedMonth: Number(payload.hoursWorkedMonth ?? 160),
      overtimeHoursMonth: Number(payload.overtimeHoursMonth ?? 0),
      stitchBonusPer10k: Math.round(Number(payload.stitchBonusPer10k ?? 2500)),
      stitchesCompletedMonth: Number(payload.stitchesCompletedMonth ?? 0),
      allowanceAndBonus: Math.round(
        Number(payload.allowanceAndBonus ?? 700000),
      ),
      amountPaidMonth: Math.round(Number(payload.amountPaidMonth ?? 0)),
      paymentStatus: payload.paymentStatus ?? 'UNPAID',
      joinedDate:
        payload.joinedDate ?? new Date().toISOString().slice(0, 10),
      notes: payload.notes ?? '',
    };
    this.db.employees.unshift(newEmployee);
    this.saveDatabase();
    return newEmployee;
  }

  updateEmployee(id: string, payload: Partial<Employee>): Employee {
    const employee = this.db.employees.find((e) => e.id === id);
    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    if (payload.code !== undefined) employee.code = payload.code;
    if (payload.name !== undefined) employee.name = payload.name;
    if (payload.role !== undefined) employee.role = payload.role;
    if (payload.shift !== undefined) employee.shift = payload.shift;
    if (payload.status !== undefined) employee.status = payload.status;
    if (payload.phone !== undefined) employee.phone = payload.phone;
    if (payload.assignedMachineId !== undefined) {
      employee.assignedMachineId = payload.assignedMachineId;
    }
    if (payload.payType !== undefined) employee.payType = payload.payType;
    if (payload.hourlyRate !== undefined) {
      employee.hourlyRate = Math.max(0, Math.round(Number(payload.hourlyRate)));
    }
    if (payload.monthlyBaseSalary !== undefined) {
      employee.monthlyBaseSalary = Math.max(
        0,
        Math.round(Number(payload.monthlyBaseSalary)),
      );
    }
    if (payload.hoursWorkedMonth !== undefined) {
      employee.hoursWorkedMonth = Math.max(
        0,
        Number(payload.hoursWorkedMonth),
      );
    }
    if (payload.overtimeHoursMonth !== undefined) {
      employee.overtimeHoursMonth = Math.max(
        0,
        Number(payload.overtimeHoursMonth),
      );
    }
    if (payload.stitchBonusPer10k !== undefined) {
      employee.stitchBonusPer10k = Math.max(
        0,
        Math.round(Number(payload.stitchBonusPer10k)),
      );
    }
    if (payload.stitchesCompletedMonth !== undefined) {
      employee.stitchesCompletedMonth = Math.max(
        0,
        Number(payload.stitchesCompletedMonth),
      );
    }
    if (payload.allowanceAndBonus !== undefined) {
      employee.allowanceAndBonus = Math.max(
        0,
        Math.round(Number(payload.allowanceAndBonus)),
      );
    }
    if (payload.amountPaidMonth !== undefined) {
      employee.amountPaidMonth = Math.max(
        0,
        Math.round(Number(payload.amountPaidMonth)),
      );
    }
    if (payload.paymentStatus !== undefined) {
      employee.paymentStatus = payload.paymentStatus;
    }
    if (payload.joinedDate !== undefined) {
      employee.joinedDate = payload.joinedDate;
    }
    if (payload.notes !== undefined) employee.notes = payload.notes;

    this.saveDatabase();
    return employee;
  }

  deleteEmployee(id: string): { deleted: boolean; id: string } {
    const idx = this.db.employees.findIndex((e) => e.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    this.db.employees.splice(idx, 1);
    this.saveDatabase();
    return { deleted: true, id };
  }

  // Quote & Stitch Pricing Calculator (VND)
  calculateQuote(input: Partial<QuoteInput>): QuoteBreakdown {
    const quantity = Math.max(1, Number(input.quantity ?? 24));
    const stitchCount = Math.max(1000, Number(input.stitchCount ?? 8500));
    const colorCount = Math.max(1, Number(input.colorCount ?? 3));
    const garmentBlankCost = Math.max(
      0,
      Number(input.garmentBlankCost ?? 95000),
    );
    const garmentMarkupPercent = Math.max(
      0,
      Number(input.garmentMarkupPercent ?? 45),
    );
    const needsDigitizing = Boolean(input.needsDigitizing ?? true);
    const is3DPuff = Boolean(input.is3DPuff ?? false);
    const rushOrder = Boolean(input.rushOrder ?? false);

    // Commercial embroidery run charge in VND
    let ratePerThousandStitches = 3200;
    let baseHoopsFee = 15000;
    if (quantity >= 144) {
      ratePerThousandStitches = 1800;
      baseHoopsFee = 8000;
    } else if (quantity >= 72) {
      ratePerThousandStitches = 2200;
      baseHoopsFee = 10000;
    } else if (quantity >= 24) {
      ratePerThousandStitches = 2600;
      baseHoopsFee = 12000;
    }

    const thousandUnits = stitchCount / 1000;
    const colorSetupPerPiece = Math.max(0, colorCount - 4) * 2000;
    const runChargePerPiece = Math.round(
      baseHoopsFee +
        thousandUnits * ratePerThousandStitches +
        colorSetupPerPiece,
    );

    const rawDigitizing = Math.max(250000, Math.round(thousandUnits * 35000));
    const digitizingFee = needsDigitizing
      ? quantity >= 144 && stitchCount <= 15000
        ? 0
        : rawDigitizing
      : 0;

    const garmentPricePerPiece = Math.round(
      garmentBlankCost * (1 + garmentMarkupPercent / 100),
    );

    const puffSurchargePerPiece = is3DPuff ? 15000 : 0;

    const unitPriceBeforeRush = Math.round(
      garmentPricePerPiece + runChargePerPiece + puffSurchargePerPiece,
    );

    const subtotal = Math.round(unitPriceBeforeRush * quantity + digitizingFee);

    const rushFee = rushOrder ? Math.round(subtotal * 0.2) : 0;
    const totalPrice = Math.round(subtotal + rushFee);
    const finalUnitPrice = Math.round(totalPrice / quantity);

    const effectiveStitchesPerHourPerHead = 850 * 60 * 0.72;
    const activeHeads = Math.min(6, quantity);
    const totalStitches = quantity * stitchCount;
    const estimatedProductionHours = Math.max(
      0.5,
      Math.round(
        (totalStitches / (effectiveStitchesPerHourPerHead * activeHeads)) * 10,
      ) / 10,
    );

    return {
      quantity,
      stitchCount,
      digitizingFee,
      runChargePerPiece,
      garmentPricePerPiece,
      puffSurchargePerPiece,
      unitPriceBeforeRush,
      subtotal,
      rushFee,
      totalPrice,
      finalUnitPrice,
      estimatedProductionHours,
    };
  }
}
