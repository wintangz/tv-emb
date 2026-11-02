import { PrismaClient } from '@prisma/client';
import { createSeedDatabase } from '../dist/embroidery/embroidery.seed.js';

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  const data = createSeedDatabase();

  await prisma.$transaction([
    prisma.customer.deleteMany(),
    prisma.customer.createMany({
      data: data.customers.map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company,
        email: c.email,
        phone: c.phone,
        totalOrders: c.totalOrders,
        totalSpend: c.totalSpend,
        preferredGarments: c.preferredGarments,
        notes: c.notes ?? '',
      })),
    }),
    prisma.embroideryDesign.deleteMany(),
    prisma.embroideryDesign.createMany({
      data: data.designs.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        clientName: d.clientName,
        stitchCount: d.stitchCount,
        widthMm: d.widthMm,
        heightMm: d.heightMm,
        colorSequence: JSON.parse(JSON.stringify(d.colorSequence ?? [])),
        hoopSize: d.hoopSize,
        fileFormat: d.fileFormat,
        complexity: d.complexity,
        digitizerNotes: d.digitizerNotes ?? '',
        createdAt: d.createdAt,
        jumpCount: d.jumpCount ?? null,
        trimCount: d.trimCount ?? null,
        stitchPaths: d.stitchPaths
          ? JSON.parse(JSON.stringify(d.stitchPaths))
          : undefined,
      })),
    }),
    prisma.embroideryMachine.deleteMany(),
    prisma.embroideryMachine.createMany({
      data: data.machines.map((m) => ({
        id: m.id,
        name: m.name,
        brand: m.brand,
        model: m.model,
        heads: m.heads,
        needlesPerHead: m.needlesPerHead,
        status: m.status,
        currentSpm: m.currentSpm,
        maxSpm: m.maxSpm,
        activeOrderId: m.activeOrderId ?? null,
        activeOrderNumber: m.activeOrderNumber ?? null,
        progressPercent: m.progressPercent,
        totalStitchesToday: m.totalStitchesToday,
        threadBreaksToday: m.threadBreaksToday,
        lastMaintenanceDate: m.lastMaintenanceDate ?? '2026-10-15',
      })),
    }),
    prisma.embroideryOrder.deleteMany(),
    prisma.embroideryOrder.createMany({
      data: data.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerId: o.customerId,
        customerName: o.customerName,
        companyName: o.companyName,
        designId: o.designId,
        designName: o.designName,
        garmentType: o.garmentType,
        garmentColor: o.garmentColor,
        placement: o.placement,
        quantity: o.quantity,
        completedQuantity: o.completedQuantity,
        defectQuantity: o.defectQuantity ?? 0,
        threadMetersUsed: o.threadMetersUsed ?? 0,
        sizeBreakdown: o.sizeBreakdown
          ? JSON.parse(JSON.stringify(o.sizeBreakdown))
          : undefined,
        stitchCount: o.stitchCount,
        colorCount: o.colorCount,
        threadColors: JSON.parse(JSON.stringify(o.threadColors ?? [])),
        status: o.status,
        paymentStatus: o.paymentStatus ?? 'UNPAID',
        amountPaid: o.amountPaid ?? 0,
        assignedMachineId: o.assignedMachineId ?? null,
        dueDate: o.dueDate,
        rushOrder: Boolean(o.rushOrder),
        digitizingFee: o.digitizingFee,
        unitPrice: o.unitPrice,
        totalPrice: o.totalPrice,
        notes: o.notes ?? '',
        createdAt: o.createdAt,
      })),
    }),
    prisma.inventoryItem.deleteMany(),
    prisma.inventoryItem.createMany({
      data: data.inventory.map((i) => ({
        id: i.id,
        sku: i.sku,
        name: i.name,
        category: i.category,
        brand: i.brand,
        colorCode: i.colorCode ?? null,
        colorHex: i.colorHex ?? null,
        material: i.material,
        quantity: i.quantity,
        unit: i.unit,
        minThreshold: i.minThreshold,
        unitCost: i.unitCost,
      })),
    }),
    prisma.employee.deleteMany(),
    prisma.employee.createMany({
      data: (data.employees ?? []).map((e) => ({
        id: e.id,
        code: e.code,
        name: e.name,
        role: e.role,
        shift: e.shift,
        status: e.status,
        phone: e.phone,
        assignedMachineId: e.assignedMachineId ?? null,
        payType: e.payType,
        hourlyRate: e.hourlyRate,
        monthlyBaseSalary: e.monthlyBaseSalary,
        hoursWorkedMonth: e.hoursWorkedMonth,
        overtimeHoursMonth: e.overtimeHoursMonth,
        stitchesCompletedMonth: e.stitchesCompletedMonth,
        stitchBonusPer10k: e.stitchBonusPer10k,
        allowanceAndBonus: e.allowanceAndBonus,
        paymentStatus: e.paymentStatus,
        amountPaidMonth: e.amountPaidMonth,
        joinedDate: e.joinedDate,
        notes: e.notes ?? '',
      })),
    }),
  ]);

  const counts = {
    Customer: await prisma.customer.count(),
    EmbroideryDesign: await prisma.embroideryDesign.count(),
    EmbroideryMachine: await prisma.embroideryMachine.count(),
    EmbroideryOrder: await prisma.embroideryOrder.count(),
    InventoryItem: await prisma.inventoryItem.count(),
    Employee: await prisma.employee.count(),
  };

  console.log('Successfully pushed & verified live rows in Neon PostgreSQL:', counts);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

