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

const BADGE_BASE =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap text-center leading-none";

export const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  QUOTE: `${BADGE_BASE} bg-slate-500/15 text-slate-400 border-slate-500/30`,
  DIGITIZING: `${BADGE_BASE} bg-purple-500/15 text-purple-400 border-purple-500/35`,
  APPROVAL_PENDING: `${BADGE_BASE} bg-amber-500/15 text-amber-400 border-amber-500/35`,
  IN_PRODUCTION: `${BADGE_BASE} bg-sky-500/15 text-sky-400 border-sky-500/35`,
  QUALITY_CHECK: `${BADGE_BASE} bg-indigo-500/15 text-indigo-400 border-indigo-500/35`,
  COMPLETED: `${BADGE_BASE} bg-emerald-500/15 text-emerald-400 border-emerald-500/35`,
  DELIVERED: `${BADGE_BASE} bg-zinc-500/15 text-zinc-400 border-zinc-500/30`,
};

export const PAYMENT_BADGE_STYLES: Record<PaymentStatus, string> = {
  PAID: `${BADGE_BASE} bg-emerald-500/15 text-emerald-400 border-emerald-500/35`,
  DEPOSIT_PAID: `${BADGE_BASE} bg-amber-500/15 text-amber-400 border-amber-500/35`,
  UNPAID: `${BADGE_BASE} bg-rose-500/15 text-rose-400 border-rose-500/35`,
};

export const MACHINE_BADGE_STYLES: Record<MachineStatus, string> = {
  RUNNING: `${BADGE_BASE} bg-emerald-500/15 text-emerald-400 border-emerald-500/40`,
  IDLE: `${BADGE_BASE} bg-slate-500/15 text-slate-400 border-slate-500/30`,
  SETUP: `${BADGE_BASE} bg-amber-500/15 text-amber-400 border-amber-500/40`,
  MAINTENANCE: `${BADGE_BASE} bg-rose-500/15 text-rose-400 border-rose-500/40`,
};

export const EMPLOYEE_STATUS_BADGE_STYLES: Record<EmployeeStatus, string> = {
  ACTIVE: `${BADGE_BASE} bg-emerald-500/15 text-emerald-400 border-emerald-500/40`,
  ON_LEAVE: `${BADGE_BASE} bg-amber-500/15 text-amber-400 border-amber-500/40`,
  OFF_SHIFT: `${BADGE_BASE} bg-slate-500/15 text-slate-400 border-slate-500/30`,
};

export const SALARY_BADGE_STYLES: Record<SalaryPaymentStatus, string> = {
  PAID: `${BADGE_BASE} bg-emerald-500/15 text-emerald-400 border-emerald-500/35`,
  PARTIAL_ADVANCE: `${BADGE_BASE} bg-amber-500/15 text-amber-400 border-amber-500/35`,
  UNPAID: `${BADGE_BASE} bg-rose-500/15 text-rose-400 border-rose-500/35`,
};

export const EMPLOYEE_ROLES: EmployeeRole[] = [
  "Machine Operator",
  "Trimming & QC",
  "Errands & Delivery",
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
  is3DPuff?: boolean;
  shippingMode?: "LOCAL_2_WAY" | "CHANH_XE_PICKUP";
  shippingCost?: number;
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

