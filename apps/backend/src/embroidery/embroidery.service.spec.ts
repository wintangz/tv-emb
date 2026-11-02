import { Test, TestingModule } from '@nestjs/testing';
import { EmbroideryService } from './embroidery.service.js';

describe('EmbroideryService', () => {
  let service: EmbroideryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmbroideryService],
    }).compile();

    service = module.get<EmbroideryService>(EmbroideryService);
    service.resetDatabase();
  });

  it('returns seeded dashboard metrics and collections in VND', () => {
    const dashboard = service.getDashboard();
    expect(dashboard.orders.length).toBeGreaterThanOrEqual(5);
    expect(dashboard.machines.length).toBe(4);
    expect(dashboard.designs.length).toBe(5);
    expect(dashboard.inventory.length).toBeGreaterThanOrEqual(9);
    expect(dashboard.metrics.runningMachinesCount).toBe(2);
    expect(dashboard.metrics.monthlyRevenue).toBeGreaterThan(50000000);
    expect(dashboard.metrics.collectedRevenue).toBeGreaterThan(20000000);
    expect(dashboard.metrics.inventoryValue).toBeGreaterThan(5000000);
  });

  it('calculates embroidery quote pricing accurately in VND', () => {
    const quote = service.calculateQuote({
      quantity: 48,
      stitchCount: 10000,
      colorCount: 4,
      garmentBlankCost: 100000,
      garmentMarkupPercent: 50,
      needsDigitizing: true,
      is3DPuff: false,
      rushOrder: true,
    });

    expect(quote.digitizingFee).toBe(350000);
    expect(quote.garmentPricePerPiece).toBe(150000);
    expect(quote.rushFee).toBeGreaterThan(0);
    expect(quote.totalPrice).toBeGreaterThan(quote.subtotal);
  });

  it('creates, updates, advances, and deletes an order in VND', () => {
    const created = service.createOrder({
      customerName: 'Test Shop',
      companyName: 'Tuong Vinh Partner Co.',
      garmentType: 'Richardson 112 Cap',
      quantity: 36,
      stitchCount: 9500,
      unitPrice: 150000,
      paymentStatus: 'DEPOSIT_PAID',
    });

    expect(created.id).toBeDefined();
    expect(created.amountPaid).toBe(2700000);

    const edited = service.updateOrder(created.id, {
      quantity: 50,
      unitPrice: 150000,
      paymentStatus: 'PAID',
      amountPaid: 7500000,
      defectQuantity: 2,
      threadMetersUsed: 640,
    });
    expect(edited.totalPrice).toBe(7500000);
    expect(edited.paymentStatus).toBe('PAID');
    expect(edited.defectQuantity).toBe(2);
    expect(edited.threadMetersUsed).toBe(640);

    const updated = service.updateOrderStatus(created.id, 'COMPLETED');
    expect(updated.status).toBe('COMPLETED');
    expect(updated.completedQuantity).toBe(50);

    const del = service.deleteOrder(created.id);
    expect(del.deleted).toBe(true);
  });

  it('updates designs, inventory, and customers', () => {
    const design = service.createDesign({
      name: 'Dragon Crest',
      stitchCount: 14000,
      jumpCount: 18,
      trimCount: 4,
      stitchPaths: [
        { needle: 1, d: 'M12 12L48 48L24 64', stitchCount: 8200 },
        { needle: 2, d: 'M20 20L60 60', stitchCount: 5800 },
      ],
    });
    expect(design.jumpCount).toBe(18);
    expect(design.trimCount).toBe(4);
    expect(design.stitchPaths?.length).toBe(2);

    const updatedDesign = service.updateDesign(design.id, {
      stitchCount: 15500,
      jumpCount: 22,
    });
    expect(updatedDesign.stitchCount).toBe(15500);
    expect(updatedDesign.jumpCount).toBe(22);
    expect(service.deleteDesign(design.id).deleted).toBe(true);

    const restocked = service.restockLowInventory();
    const lowLeft = restocked.filter((i) => i.quantity <= i.minThreshold);
    expect(lowLeft.length).toBe(0);
  });

  it('manages employees and computes monthly labor costs in VND', () => {
    const initialDash = service.getDashboard();
    expect(initialDash.employees.length).toBeGreaterThanOrEqual(6);
    expect(initialDash.metrics.monthlyLaborCost).toBeGreaterThan(40000000);

    const createdEmp = service.createEmployee({
      name: 'Hoàng Văn Phúc',
      role: 'Machine Operator',
      payType: 'Hourly',
      hourlyRate: 45000,
      hoursWorkedMonth: 160,
      overtimeHoursMonth: 10,
      stitchBonusPer10k: 2500,
      stitchesCompletedMonth: 500000,
      allowanceAndBonus: 700000,
    });
    expect(createdEmp.id).toBeDefined();

    const updatedEmp = service.updateEmployee(createdEmp.id, {
      amountPaidMonth: 4500000,
      paymentStatus: 'PARTIAL_ADVANCE',
    });
    expect(updatedEmp.amountPaidMonth).toBe(4500000);
    expect(updatedEmp.paymentStatus).toBe('PARTIAL_ADVANCE');

    const delEmp = service.deleteEmployee(createdEmp.id);
    expect(delEmp.deleted).toBe(true);
  });
});
