export type OrderStatus =
  | 'QUOTE'
  | 'DIGITIZING'
  | 'APPROVAL_PENDING'
  | 'IN_PRODUCTION'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'DELIVERED';

export type PaymentStatus = 'UNPAID' | 'DEPOSIT_PAID' | 'PAID';

export type GarmentPlacement =
  | 'Left Chest'
  | 'Right Chest'
  | 'Full Back'
  | 'Cap Front'
  | 'Cap Side'
  | 'Left Sleeve'
  | 'Right Sleeve'
  | 'Jacket Back'
  | 'Custom Patch';

export type MachineStatus = 'RUNNING' | 'IDLE' | 'SETUP' | 'MAINTENANCE';

export interface SizeBreakdown {
  S: number;
  M: number;
  L: number;
  XL: number;
  XXL: number;
}

export interface EmbroideryOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  companyName: string;
  designId: string;
  designName: string;
  garmentType: string;
  garmentColor: string;
  placement: GarmentPlacement;
  quantity: number;
  completedQuantity: number;
  sizeBreakdown?: SizeBreakdown;
  stitchCount: number;
  colorCount: number;
  threadColors: string[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  assignedMachineId: string | null;
  dueDate: string;
  createdAt: string;
  rushOrder: boolean;
  digitizingFee: number;
  unitPrice: number;
  totalPrice: number;
  notes: string;
  defectQuantity?: number;
  threadMetersUsed?: number;
}

export interface ColorStop {
  needle: number;
  threadCode: string;
  name: string;
  hex: string;
}

export interface StitchPathSegment {
  needle: number;
  d: string;
  stitchCount: number;
}

export interface EmbroideryDesign {
  id: string;
  code: string;
  name: string;
  clientName: string;
  stitchCount: number;
  widthMm: number;
  heightMm: number;
  hoopSize: string;
  fileFormat: 'DST' | 'EMB' | 'PES' | 'EXP';
  colorSequence: ColorStop[];
  complexity: 'Standard' | 'Detailed' | '3D Puff' | 'Jacket Back';
  digitizerNotes: string;
  createdAt: string;
  stitchPaths?: StitchPathSegment[];
  jumpCount?: number;
  trimCount?: number;
}

export interface EmbroideryMachine {
  id: string;
  name: string;
  brand: 'Tajima' | 'Barudan' | 'Ricoma' | 'Brother' | 'HappyJapan';
  model: string;
  heads: number;
  needlesPerHead: number;
  maxSpm: number;
  currentSpm: number;
  status: MachineStatus;
  activeOrderId: string | null;
  activeOrderNumber: string | null;
  progressPercent: number;
  totalStitchesToday: number;
  threadBreaksToday: number;
  lastMaintenanceDate: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'Thread' | 'Backing' | 'Bobbin' | 'Needle' | 'Topping';
  brand: string;
  colorCode?: string;
  colorHex?: string;
  material: string;
  quantity: number;
  unit: 'cones' | 'rolls' | 'boxes' | 'packs';
  minThreshold: number;
  unitCost: number;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpend: number;
  preferredGarments: string;
  notes: string;
}

export type EmployeeRole =
  | 'Machine Operator'
  | 'Digitizer'
  | 'Trimming & QC'
  | 'Shop Supervisor'
  | 'Sales & Coordinator';

export type EmployeeShift = 'Morning' | 'Afternoon' | 'Full-Day';

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'OFF_SHIFT';

export type EmployeePayType = 'Hourly' | 'Monthly';

export type SalaryPaymentStatus = 'UNPAID' | 'PARTIAL_ADVANCE' | 'PAID';

export interface Employee {
  id: string;
  code: string;
  name: string;
  role: EmployeeRole;
  shift: EmployeeShift;
  status: EmployeeStatus;
  phone: string;
  assignedMachineId: string | null;
  payType: EmployeePayType;
  hourlyRate: number;
  monthlyBaseSalary: number;
  hoursWorkedMonth: number;
  overtimeHoursMonth: number;
  stitchBonusPer10k: number;
  stitchesCompletedMonth: number;
  allowanceAndBonus: number;
  amountPaidMonth: number;
  paymentStatus: SalaryPaymentStatus;
  joinedDate: string;
  notes: string;
}

export interface QuoteInput {
  quantity: number;
  stitchCount: number;
  colorCount: number;
  garmentBlankCost: number;
  garmentMarkupPercent: number;
  needsDigitizing: boolean;
  is3DPuff: boolean;
  rushOrder: boolean;
}

export interface QuoteBreakdown {
  quantity: number;
  stitchCount: number;
  digitizingFee: number;
  runChargePerPiece: number;
  garmentPricePerPiece: number;
  puffSurchargePerPiece: number;
  unitPriceBeforeRush: number;
  subtotal: number;
  rushFee: number;
  totalPrice: number;
  finalUnitPrice: number;
  estimatedProductionHours: number;
}

export interface DashboardMetrics {
  activeOrdersCount: number;
  inProductionCount: number;
  pendingApprovalCount: number;
  totalQueuedStitches: number;
  monthlyRevenue: number;
  collectedRevenue: number;
  outstandingReceivables: number;
  runningMachinesCount: number;
  totalMachinesCount: number;
  lowStockItemsCount: number;
  inventoryValue: number;
  activeEmployeesCount: number;
  totalEmployeesCount: number;
  monthlyLaborCost: number;
  paidLaborCost: number;
  unpaidLaborCost: number;
  estimatedNetProfit: number;
}

export interface EmbroideryDatabase {
  orders: EmbroideryOrder[];
  designs: EmbroideryDesign[];
  machines: EmbroideryMachine[];
  inventory: InventoryItem[];
  customers: Customer[];
  employees: Employee[];
}

export interface DashboardPayload extends EmbroideryDatabase {
  metrics: DashboardMetrics;
}
