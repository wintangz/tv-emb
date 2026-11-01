import type {
  ColorStop,
  EmployeePayType,
  EmployeeRole,
  EmployeeShift,
  EmployeeStatus,
  GarmentPlacement,
  MachineStatus,
  OrderStatus,
  PaymentStatus,
  SalaryPaymentStatus,
  StitchPathSegment,
} from "@/lib/types";

export type ActiveTab =
  | "overview"
  | "orders"
  | "designs"
  | "machines"
  | "inventory"
  | "employees"
  | "quote"
  | "customers";

export const ORDER_STAGE_FLOW: OrderStatus[] = [
  "QUOTE",
  "DIGITIZING",
  "APPROVAL_PENDING",
  "IN_PRODUCTION",
  "QUALITY_CHECK",
  "COMPLETED",
  "DELIVERED",
];

export const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  QUOTE: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  DIGITIZING: "bg-purple-500/15 text-purple-400 border-purple-500/35",
  APPROVAL_PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/35",
  IN_PRODUCTION: "bg-sky-500/15 text-sky-400 border-sky-500/35",
  QUALITY_CHECK: "bg-indigo-500/15 text-indigo-400 border-indigo-500/35",
  COMPLETED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/35",
  DELIVERED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export const PAYMENT_BADGE_STYLES: Record<PaymentStatus, string> = {
  PAID: "bg-emerald-500/15 text-emerald-400 border-emerald-500/35",
  DEPOSIT_PAID: "bg-amber-500/15 text-amber-400 border-amber-500/35",
  UNPAID: "bg-rose-500/15 text-rose-400 border-rose-500/35",
};

export const MACHINE_BADGE_STYLES: Record<MachineStatus, string> = {
  RUNNING: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  IDLE: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  SETUP: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  MAINTENANCE: "bg-rose-500/15 text-rose-400 border-rose-500/40",
};

export const EMPLOYEE_STATUS_BADGE_STYLES: Record<EmployeeStatus, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  ON_LEAVE: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  OFF_SHIFT: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export const SALARY_BADGE_STYLES: Record<SalaryPaymentStatus, string> = {
  PAID: "bg-emerald-500/15 text-emerald-400 border-emerald-500/35",
  PARTIAL_ADVANCE: "bg-amber-500/15 text-amber-400 border-amber-500/35",
  UNPAID: "bg-rose-500/15 text-rose-400 border-rose-500/35",
};

export const EMPLOYEE_ROLES: EmployeeRole[] = [
  "Machine Operator",
  "Digitizer",
  "Trimming & QC",
  "Shop Supervisor",
  "Sales & Coordinator",
];

export const PLACEMENTS: GarmentPlacement[] = [
  "Left Chest",
  "Right Chest",
  "Cap Front",
  "Cap Side",
  "Full Back",
  "Jacket Back",
  "Left Sleeve",
  "Right Sleeve",
  "Custom Patch",
];

export interface OrderFormState {
  customerId: string;
  designId: string;
  garmentType: string;
  garmentColor: string;
  placement: GarmentPlacement;
  quantity: number;
  completedQuantity: number;
  sizeS: number;
  sizeM: number;
  sizeL: number;
  sizeXL: number;
  sizeXXL: number;
  unitPrice: number;
  digitizingFee: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  assignedMachineId: string;
  dueDate: string;
  rushOrder: boolean;
  notes: string;
}

export interface DesignFormState {
  name: string;
  clientName: string;
  stitchCount: number;
  widthMm: number;
  heightMm: number;
  hoopSize: string;
  fileFormat: "DST" | "EMB" | "PES" | "EXP";
  complexity: "Standard" | "Detailed" | "3D Puff" | "Jacket Back";
  digitizerNotes: string;
  colorSequence: ColorStop[];
  stitchPaths?: StitchPathSegment[];
  jumpCount?: number;
  trimCount?: number;
}

export interface MachineFormState {
  name: string;
  brand: "Tajima" | "Barudan" | "Ricoma" | "Brother" | "HappyJapan";
  model: string;
  heads: number;
  needlesPerHead: number;
  maxSpm: number;
}

export interface InventoryFormState {
  sku: string;
  name: string;
  category: "Thread" | "Backing" | "Bobbin" | "Needle" | "Topping";
  brand: string;
  colorCode: string;
  colorHex: string;
  material: string;
  quantity: number;
  unit: "cones" | "rolls" | "boxes" | "packs";
  minThreshold: number;
  unitCost: number;
}

export interface CustomerFormState {
  name: string;
  company: string;
  email: string;
  phone: string;
  preferredGarments: string;
  notes: string;
}

export interface EmployeeFormState {
  name: string;
  role: EmployeeRole;
  shift: EmployeeShift;
  status: EmployeeStatus;
  phone: string;
  assignedMachineId: string;
  payType: EmployeePayType;
  hourlyRate: number;
  monthlyBaseSalary: number;
  hoursWorkedMonth: number;
  overtimeHoursMonth: number;
  stitchesCompletedMonth: number;
  stitchBonusPer10k: number;
  allowanceAndBonus: number;
  salaryPaymentStatus: SalaryPaymentStatus;
  amountPaidMonth: number;
  notes: string;
}

