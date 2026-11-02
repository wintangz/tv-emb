"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type {
  Customer,
  DashboardPayload,
  EmbroideryDesign,
  EmbroideryMachine,
  EmbroideryOrder,
  Employee,
  EmployeeCostBreakdown,
  EmployeeRole,
  InventoryItem,
  OrderStatus,
  PaymentStatus,
  QuoteInput,
  StudioRole,
} from "@/lib/types";
import type { ParsedDstResult } from "@/lib/dst-parser";
import {
  INITIAL_EMPLOYEES,
  INITIAL_INVENTORY,
  INITIAL_MACHINES,
  INITIAL_ORDERS,
  calculateEmbroideryQuote,
  calculateEmployeeCostBreakdown,
  computeMetricsFromState,
  getInitialDashboardPayload,
} from "@/lib/seed-data";
import { formatVnd } from "@/lib/currency";
import JobTicketModal from "./JobTicketModal";
import PayslipModal from "./PayslipModal";
import ThemeCustomizer, {
  THEME_PRESETS,
  useStudioTheme,
} from "./ThemeCustomizer";
import {
  EMPLOYEE_ROLE_TEXT,
  EMPLOYEE_SHIFT_TEXT,
  EMPLOYEE_STATUS_TEXT,
  MACHINE_STATUS_TEXT,
  ORDER_STATUS_TEXT,
  PAYMENT_STATUS_TEXT,
  PLACEMENT_TEXT,
  SALARY_STATUS_TEXT,
  useStudioLanguage,
} from "@/lib/i18n";
import {
  ORDER_STAGE_FLOW,
  type ActiveTab,
  type CustomerFormState,
  type DesignFormState,
  type EmployeeFormState,
  type InventoryFormState,
  type MachineFormState,
  type OrderFormState,
} from "./tabs/studio-constants";
import OverviewTab from "./tabs/OverviewTab";
import WorkOrdersTab from "./tabs/WorkOrdersTab";
import DesignsTab from "./tabs/DesignsTab";
import MachinesTab from "./tabs/MachinesTab";
import InventoryTab from "./tabs/InventoryTab";
import QuoteEstimatorTab from "./tabs/QuoteEstimatorTab";
import CustomersTab from "./tabs/CustomersTab";
import EmployeesPayrollTab from "./tabs/EmployeesPayrollTab";
import StudioModals from "./tabs/StudioModals";
import ExportCenterModal, {
  type ExportDataset,
  type ExportFormat,
} from "./ExportCenterModal";
import ConfirmActionModal, {
  type PendingConfirmAction,
} from "./ConfirmActionModal";
import ModernSelect from "./ModernSelect";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const STORAGE_KEY = "tuong_vinh_embroidery_erp_v4_pro";

const StudioViewsContext = createContext<Record<ActiveTab, React.ReactNode> | null>(
  null,
);

export function StudioRouteView({ tab }: { tab: ActiveTab }) {
  const views = useContext(StudioViewsContext);
  if (!views) return null;
  return <>{views[tab]}</>;
}

export default function EmbroideryStudio({
  initialTab = "overview",
  children,
}: {
  initialTab?: ActiveTab;
  children?: React.ReactNode;
} = {}) {
  const pathname = usePathname();
  const router = useRouter();

  const [data, setData] = useState<DashboardPayload>(() =>
    getInitialDashboardPayload(),
  );
  const [fallbackTab, setFallbackTab] = useState<ActiveTab>(initialTab);

  const activeTab: ActiveTab = useMemo(() => {
    const validTabs: ActiveTab[] = [
      "overview",
      "orders",
      "designs",
      "machines",
      "inventory",
      "quote",
      "customers",
      "employees",
    ];
    const seg = (pathname ?? "").replace(/^\/+|\/+$/g, "").toLowerCase() as ActiveTab;
    if (seg && validTabs.includes(seg)) {
      return seg;
    }
    if (pathname === "/") {
      return "overview";
    }
    return fallbackTab;
  }, [pathname, fallbackTab]);
  const [studioRole, setStudioRole] = useState<StudioRole>("ADMIN");
  const [ordersViewMode, setOrdersViewMode] = useState<"list" | "kanban">(
    "list",
  );
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Theme & Language State (SSR-safe via useSyncExternalStore)
  const [theme, handleThemeChange] = useStudioTheme();
  const [showThemeDrawer, setShowThemeDrawer] = useState(false);
  const [locale, setLocale] = useStudioLanguage();
  const vi = locale === "vi";
  const STATUS_LABELS = ORDER_STATUS_TEXT[locale];
  const PAYMENT_LABELS = PAYMENT_STATUS_TEXT[locale];
  const MACHINE_LABELS = MACHINE_STATUS_TEXT[locale];
  const PLACEMENT_LABELS = PLACEMENT_TEXT[locale];
  const EMPLOYEE_ROLE_LABELS = EMPLOYEE_ROLE_TEXT[locale];
  const EMPLOYEE_SHIFT_LABELS = EMPLOYEE_SHIFT_TEXT[locale];
  const EMPLOYEE_STATUS_LABELS = EMPLOYEE_STATUS_TEXT[locale];
  const SALARY_STATUS_LABELS = SALARY_STATUS_TEXT[locale];

  // Filters & search
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    OrderStatus | "ALL"
  >("ALL");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] =
    useState<string>("ALL");
  const [inventorySearch, setInventorySearch] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState<
    EmployeeRole | "ALL"
  >("ALL");
  const [employeeSearch, setEmployeeSearch] = useState<string>("");

  // Modals & Active Editing Items
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [activeJobTicketOrder, setActiveJobTicketOrder] =
    useState<EmbroideryOrder | null>(null);

  const [showDesignModal, setShowDesignModal] = useState(false);
  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);

  const [showMachineModal, setShowMachineModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(
    null,
  );

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null,
  );

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
    null,
  );
  const [activePayslipEmployee, setActivePayslipEmployee] =
    useState<Employee | null>(null);
  const [exportModalConfig, setExportModalConfig] = useState<{
    dataset: ExportDataset;
    format: ExportFormat;
  } | null>(null);
  const [pendingConfirmAction, setPendingConfirmAction] =
    useState<PendingConfirmAction | null>(null);

  const canViewFinancials = studioRole === "ADMIN" || studioRole === "SALES";

  function handleSelectTab(nextTab: ActiveTab) {
    setFallbackTab(nextTab);
    const targetPath = nextTab === "overview" ? "/" : `/${nextTab}`;
    router.push(targetPath);
  }

  function handleSelectStudioRole(nextRole: StudioRole) {
    setStudioRole(nextRole);
    if (nextRole === "OPERATOR") {
      if (
        activeTab === "overview" ||
        activeTab === "quote" ||
        activeTab === "customers" ||
        activeTab === "employees"
      ) {
        handleSelectTab("machines");
      }
    } else if (nextRole === "DIGITIZER") {
      if (
        activeTab === "overview" ||
        activeTab === "quote" ||
        activeTab === "customers" ||
        activeTab === "employees"
      ) {
        handleSelectTab("designs");
      }
    } else if (nextRole === "SALES" && activeTab === "employees") {
      handleSelectTab("overview");
    }
  }

  // Order Form State
  const [orderForm, setOrderForm] = useState<OrderFormState>({
    customerId: "cust-1",
    designId: "des-1",
    garmentType: "Port Authority K500 Polo",
    garmentColor: "Navy Blue",
    placement: "Left Chest",
    quantity: 48,
    completedQuantity: 0,
    sizeS: 8,
    sizeM: 16,
    sizeL: 14,
    sizeXL: 6,
    sizeXXL: 4,
    unitPrice: 165000,
    digitizingFee: 0,
    status: "DIGITIZING",
    paymentStatus: "DEPOSIT_PAID",
    amountPaid: 3960000,
    assignedMachineId: "mach-1",
    dueDate: "2026-11-05",
    rushOrder: false,
    notes: "",
  });

  // Design Form State
  const [designForm, setDesignForm] = useState<DesignFormState>({
    name: "",
    clientName: "",
    stitchCount: 9200,
    widthMm: 95,
    heightMm: 65,
    hoopSize: "120x120mm Tubular",
    fileFormat: "DST",
    complexity: "Standard",
    digitizerNotes: "Standard tatami fill + satin border, 2.5oz cutaway.",
    colorSequence: [
      { needle: 1, threadCode: "M-1800", name: "Emerald Black", hex: "#0f172a" },
      { needle: 2, threadCode: "M-1966", name: "Navy Blue", hex: "#1e3a8a" },
      { needle: 3, threadCode: "M-1747", name: "Metallic Gold", hex: "#eab308" },
    ],
  });

  // New Machine Form State
  const [machineForm, setMachineForm] = useState<MachineFormState>({
    name: "Máy 06 — Tajima TFGN2 (#4)",
    brand: "Tajima",
    model: "TFGN2",
    heads: 20,
    needlesPerHead: 9,
    maxSpm: 1000,
  });

  // Inventory Form State
  const [inventoryForm, setInventoryForm] = useState<InventoryFormState>({
    sku: "MAD-1955",
    name: "Madeira Polyneon #1955 Royal Blue (5000m)",
    category: "Thread",
    brand: "Madeira",
    colorCode: "#1955",
    colorHex: "#2563eb",
    material: "40wt Polyester",
    quantity: 12,
    unit: "cones",
    minThreshold: 5,
    unitCost: 95000,
  });

  // Customer Form State
  const [customerForm, setCustomerForm] = useState<CustomerFormState>({
    name: "",
    company: "",
    email: "",
    phone: "",
    preferredGarments: "Richardson 112 Caps, Polos",
    notes: "",
  });

  // Employee Form State
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>({
    name: "",
    role: "Machine Operator",
    shift: "Full-Day",
    status: "ACTIVE",
    phone: "",
    assignedMachineId: "mach-1",
    payType: "Monthly",
    hourlyRate: 32967,
    monthlyBaseSalary: 9000000,
    hoursWorkedMonth: 273,
    overtimeHoursMonth: 10.5,
    stitchesCompletedMonth: 950000,
    stitchBonusPer10k: 0,
    allowanceAndBonus: 1000000,
    salaryPaymentStatus: "UNPAID",
    amountPaidMonth: 0,
    notes: "",
  });

  // Quote Calculator State
  const [quoteInput, setQuoteInput] = useState<QuoteInput>({
    quantity: 120,
    stitchCount: 8500,
    colorCount: 3,
    garmentBlankCost: 0,
    garmentMarkupPercent: 0,
    needsDigitizing: false,
    is3DPuff: false,
    rushOrder: false,
    shippingMode: "LOCAL_2_WAY",
    shippingCost: 300000,
  });
  const [quoteGarmentName, setQuoteGarmentName] = useState(
    "Thân Áo Polo Cắt Bán Thành Phẩm",
  );
  const [quoteCompanyName, setQuoteCompanyName] = useState(
    "Xưởng May Gia Công Thành Công",
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3400);
  };

  // Load from NestJS backend (or localStorage if offline)
  useEffect(() => {
    let active = true;
    async function fetchDashboard() {
      try {
        const res = await fetch(`${API_BASE}/dashboard`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Backend non-200");
        const payload = (await res.json()) as DashboardPayload;
        const isLegacyUsd = (payload.orders?.[0]?.unitPrice ?? 0) < 1000;
        const isLegacyMachines =
          !payload.machines ||
          payload.machines.length < 5 ||
          payload.machines.some((m) => m.brand !== "Tajima");
        const isLegacyEmployees =
          !payload.employees ||
          payload.employees.length === 0 ||
          payload.employees.some(
            (e) =>
              e.role === ("Shop Supervisor" as EmployeeRole) ||
              e.role === ("Digitizer" as EmployeeRole) ||
              e.role === ("Sales & Coordinator" as EmployeeRole) ||
              e.hoursWorkedMonth < 200,
          );
        const normalized: DashboardPayload = isLegacyUsd
          ? getInitialDashboardPayload()
          : {
              ...payload,
              orders: isLegacyEmployees ? INITIAL_ORDERS : payload.orders,
              inventory: isLegacyEmployees
                ? INITIAL_INVENTORY
                : payload.inventory,
              machines: isLegacyMachines ? INITIAL_MACHINES : payload.machines,
              employees: isLegacyEmployees
                ? INITIAL_EMPLOYEES
                : payload.employees,
            };
        if (active) {
          setData(normalized);
          setBackendConnected(true);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          } catch {
            // ignore
          }
        }
      } catch {
        if (active) {
          setBackendConnected(false);
          try {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
              const parsed = JSON.parse(cached) as DashboardPayload;
              const isLegacyUsd = (parsed.orders?.[0]?.unitPrice ?? 0) < 1000;
              if (!isLegacyUsd) {
                setData({
                  ...parsed,
                  employees: parsed.employees?.length
                    ? parsed.employees
                    : INITIAL_EMPLOYEES,
                });
              }
            }
          } catch {
            // ignore
          }
        }
      }
    }
    void fetchDashboard();
    return () => {
      active = false;
    };
  }, []);

  // Debounced localStorage persistence so rapid UI updates never block the main thread
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [data]);

  const metrics = useMemo(
    () =>
      computeMetricsFromState(
        data.orders,
        data.machines,
        data.inventory,
        data.employees ?? INITIAL_EMPLOYEES,
      ),
    [data.orders, data.machines, data.inventory, data.employees],
  );

  // O(1) lookup maps to avoid repeated .find() / .filter() inside list renders
  const designById = useMemo(
    () => new Map(data.designs.map((d) => [d.id, d])),
    [data.designs],
  );

  const machineById = useMemo(
    () => new Map(data.machines.map((m) => [m.id, m])),
    [data.machines],
  );

  const operatorByMachineId = useMemo(() => {
    const map = new Map<string, Employee>();
    const staff = data.employees ?? INITIAL_EMPLOYEES;
    for (let i = 0; i < staff.length; i++) {
      const emp = staff[i];
      if (emp.assignedMachineId && emp.status === "ACTIVE") {
        map.set(emp.assignedMachineId, emp);
      }
    }
    return map;
  }, [data.employees]);

  const ordersCountByCustomerId = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < data.orders.length; i++) {
      const ord = data.orders[i];
      map.set(ord.customerId, (map.get(ord.customerId) ?? 0) + 1);
    }
    return map;
  }, [data.orders]);

  const employeePayrollSummary = useMemo(() => {
    const allStaff = data.employees ?? INITIAL_EMPLOYEES;
    const breakdownById = new Map<string, EmployeeCostBreakdown>();
    const roleCounts: Record<string, number> = {};
    let totalOvertimePay = 0;
    let totalStitchBonus = 0;
    let totalStitchesByStaff = 0;

    for (let i = 0; i < allStaff.length; i++) {
      const emp = allStaff[i];
      const b = calculateEmployeeCostBreakdown(emp);
      breakdownById.set(emp.id, b);
      totalOvertimePay += b.overtimePay;
      totalStitchBonus += b.stitchBonus;
      totalStitchesByStaff += emp.stitchesCompletedMonth;
      roleCounts[emp.role] = (roleCounts[emp.role] ?? 0) + 1;
    }

    return {
      breakdownById,
      roleCounts,
      totalOvertimePay: Math.round(totalOvertimePay),
      totalStitchBonus: Math.round(totalStitchBonus),
      totalStitchesByStaff,
    };
  }, [data.employees]);

  const quoteBreakdown = useMemo(
    () => calculateEmbroideryQuote(quoteInput),
    [quoteInput],
  );

  const filteredOrders = useMemo(() => {
    return data.orders.filter((order) => {
      const matchesStatus =
        orderStatusFilter === "ALL" || order.status === orderStatusFilter;
      const q = orderSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.companyName.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.designName.toLowerCase().includes(q) ||
        order.garmentType.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [data.orders, orderStatusFilter, orderSearch]);

  const filteredInventory = useMemo(() => {
    return data.inventory.filter((item) => {
      const matchesCat =
        inventoryCategoryFilter === "ALL" ||
        (inventoryCategoryFilter === "LOW"
          ? item.quantity <= item.minThreshold
          : item.category === inventoryCategoryFilter);
      const q = inventorySearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [data.inventory, inventoryCategoryFilter, inventorySearch]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return data.customers;
    return data.customers.filter(
      (c) =>
        c.company.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.preferredGarments.toLowerCase().includes(q),
    );
  }, [data.customers, customerSearch]);

  const filteredEmployees = useMemo(() => {
    const list = data.employees ?? INITIAL_EMPLOYEES;
    return list.filter((emp) => {
      const matchesRole =
        employeeRoleFilter === "ALL" || emp.role === employeeRoleFilter;
      const q = employeeSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.code.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.phone.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [data.employees, employeeRoleFilter, employeeSearch]);

  // Modal Open Helpers
  function openNewOrderModal(prefill?: Partial<OrderFormState>) {
    setEditingOrderId(null);
    setOrderForm({
      customerId: prefill?.customerId ?? data.customers[0]?.id ?? "cust-1",
      designId: prefill?.designId ?? data.designs[0]?.id ?? "des-1",
      garmentType: prefill?.garmentType ?? "Port Authority K500 Polo",
      garmentColor: prefill?.garmentColor ?? "Navy Blue",
      placement: prefill?.placement ?? "Left Chest",
      quantity: prefill?.quantity ?? 48,
      completedQuantity: 0,
      sizeS: 8,
      sizeM: 16,
      sizeL: 14,
      sizeXL: 6,
      sizeXXL: 4,
      unitPrice: prefill?.unitPrice ?? 165000,
      digitizingFee: prefill?.digitizingFee ?? 0,
      status: "DIGITIZING",
      paymentStatus: "DEPOSIT_PAID",
      amountPaid: 3960000,
      assignedMachineId: "mach-1",
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      rushOrder: false,
      is3DPuff: prefill?.is3DPuff ?? false,
      shippingMode: prefill?.shippingMode ?? "LOCAL_2_WAY",
      shippingCost: prefill?.shippingCost ?? 300000,
      notes: "",
    });
    setShowOrderModal(true);
  }

  function openEditOrderModal(order: EmbroideryOrder) {
    setEditingOrderId(order.id);
    const sb = order.sizeBreakdown ?? {
      S: 0,
      M: order.quantity,
      L: 0,
      XL: 0,
      XXL: 0,
    };
    setOrderForm({
      customerId: order.customerId,
      designId: order.designId,
      garmentType: order.garmentType,
      garmentColor: order.garmentColor,
      placement: order.placement,
      quantity: order.quantity,
      completedQuantity: order.completedQuantity,
      sizeS: sb.S,
      sizeM: sb.M,
      sizeL: sb.L,
      sizeXL: sb.XL,
      sizeXXL: sb.XXL,
      unitPrice: order.unitPrice,
      digitizingFee: order.digitizingFee,
      status: order.status,
      paymentStatus: order.paymentStatus ?? "UNPAID",
      amountPaid: order.amountPaid ?? 0,
      assignedMachineId: order.assignedMachineId ?? "",
      dueDate: order.dueDate,
      rushOrder: order.rushOrder,
      is3DPuff: Boolean(order.is3DPuff),
      shippingMode: order.shippingMode ?? "LOCAL_2_WAY",
      shippingCost:
        order.shippingCost ??
        (order.shippingMode === "CHANH_XE_PICKUP" ? 150000 : 300000),
      notes: order.notes,
    });
    setShowOrderModal(true);
  }

  function openNewDesignModal(prefill?: Partial<DesignFormState>) {
    setEditingDesignId(null);
    setDesignForm({
      name: prefill?.name ?? "",
      clientName: prefill?.clientName ?? "",
      stitchCount: prefill?.stitchCount ?? 9200,
      widthMm: prefill?.widthMm ?? 95,
      heightMm: prefill?.heightMm ?? 65,
      hoopSize: prefill?.hoopSize ?? "120x120mm Tubular",
      fileFormat: prefill?.fileFormat ?? "DST",
      complexity: prefill?.complexity ?? "Standard",
      digitizerNotes:
        prefill?.digitizerNotes ??
        "Standard tatami fill + satin border, 2.5oz cutaway.",
      colorSequence: prefill?.colorSequence
        ? structuredClone(prefill.colorSequence)
        : [
            {
              needle: 1,
              threadCode: "M-1800",
              name: "Emerald Black",
              hex: "#0f172a",
            },
            {
              needle: 2,
              threadCode: "M-1966",
              name: "Navy Blue",
              hex: "#1e3a8a",
            },
            {
              needle: 3,
              threadCode: "M-1747",
              name: "Metallic Gold",
              hex: "#eab308",
            },
          ],
      stitchPaths: prefill?.stitchPaths,
      jumpCount: prefill?.jumpCount,
      trimCount: prefill?.trimCount,
    });
    setShowDesignModal(true);
  }

  function openEditDesignModal(des: EmbroideryDesign) {
    setEditingDesignId(des.id);
    setDesignForm({
      name: des.name,
      clientName: des.clientName,
      stitchCount: des.stitchCount,
      widthMm: des.widthMm,
      heightMm: des.heightMm,
      hoopSize: des.hoopSize,
      fileFormat: des.fileFormat,
      complexity: des.complexity,
      digitizerNotes: des.digitizerNotes,
      colorSequence: structuredClone(des.colorSequence),
      stitchPaths: des.stitchPaths,
      jumpCount: des.jumpCount,
      trimCount: des.trimCount,
    });
    setShowDesignModal(true);
  }

  function openNewInventoryModal() {
    setEditingInventoryId(null);
    setInventoryForm({
      sku: `MAD-${Math.floor(1800 + Math.random() * 199)}`,
      name: "Madeira Polyneon Thread Cone (5000m)",
      category: "Thread",
      brand: "Madeira",
      colorCode: "#1955",
      colorHex: "#2563eb",
      material: "40wt Polyester",
      quantity: 12,
      unit: "cones",
      minThreshold: 5,
      unitCost: 95000,
    });
    setShowInventoryModal(true);
  }

  function openEditInventoryModal(item: InventoryItem) {
    setEditingInventoryId(item.id);
    setInventoryForm({
      sku: item.sku,
      name: item.name,
      category: item.category,
      brand: item.brand,
      colorCode: item.colorCode ?? "#1800",
      colorHex: item.colorHex ?? "#2563eb",
      material: item.material,
      quantity: item.quantity,
      unit: item.unit,
      minThreshold: item.minThreshold,
      unitCost: item.unitCost,
    });
    setShowInventoryModal(true);
  }

  function openNewCustomerModal() {
    setEditingCustomerId(null);
    setCustomerForm({
      name: "",
      company: "",
      email: "",
      phone: "",
      preferredGarments: "Richardson 112 Caps, Polos",
      notes: "",
    });
    setShowCustomerModal(true);
  }

  function openEditCustomerModal(cust: Customer) {
    setEditingCustomerId(cust.id);
    setCustomerForm({
      name: cust.name,
      company: cust.company,
      email: cust.email,
      phone: cust.phone,
      preferredGarments: cust.preferredGarments,
      notes: cust.notes,
    });
    setShowCustomerModal(true);
  }

  function openNewEmployeeModal() {
    setEditingEmployeeId(null);
    setEmployeeForm({
      name: "",
      role: "Machine Operator",
      shift: "Full-Day",
      status: "ACTIVE",
      phone: "",
      assignedMachineId: "mach-1",
      payType: "Monthly",
      hourlyRate: 32967,
      monthlyBaseSalary: 9000000,
      hoursWorkedMonth: 273,
      overtimeHoursMonth: 10.5,
      stitchesCompletedMonth: 950000,
      stitchBonusPer10k: 0,
      allowanceAndBonus: 1000000,
      salaryPaymentStatus: "UNPAID",
      amountPaidMonth: 0,
      notes: "",
    });
    setShowEmployeeModal(true);
  }

  function openEditEmployeeModal(emp: Employee) {
    setEditingEmployeeId(emp.id);
    setEmployeeForm({
      name: emp.name,
      role: emp.role,
      shift: emp.shift,
      status: emp.status,
      phone: emp.phone,
      assignedMachineId: emp.assignedMachineId ?? "",
      payType: emp.payType,
      hourlyRate: emp.hourlyRate,
      monthlyBaseSalary: emp.monthlyBaseSalary,
      hoursWorkedMonth: emp.hoursWorkedMonth,
      overtimeHoursMonth: emp.overtimeHoursMonth,
      stitchesCompletedMonth: emp.stitchesCompletedMonth,
      stitchBonusPer10k: emp.stitchBonusPer10k,
      allowanceAndBonus: emp.allowanceAndBonus,
      salaryPaymentStatus: emp.paymentStatus,
      amountPaidMonth: emp.amountPaidMonth,
      notes: emp.notes,
    });
    setShowEmployeeModal(true);
  }

  // ================= CRUD HANDLERS =================
  async function handleAdvanceOrderStatus(order: EmbroideryOrder) {
    const idx = ORDER_STAGE_FLOW.indexOf(order.status);
    const nextStatus =
      idx < ORDER_STAGE_FLOW.length - 1
        ? ORDER_STAGE_FLOW[idx + 1]
        : order.status;
    if (nextStatus === order.status) return;

    const nextCompleted =
      nextStatus === "QUALITY_CHECK" ||
      nextStatus === "COMPLETED" ||
      nextStatus === "DELIVERED"
        ? order.quantity
        : order.completedQuantity;

    setData((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === order.id
          ? { ...o, status: nextStatus, completedQuantity: nextCompleted }
          : o,
      ),
    }));
    showToast(`${order.orderNumber} → ${STATUS_LABELS[nextStatus]}`);

    try {
      const res = await fetch(`${API_BASE}/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          completedQuantity: nextCompleted,
        }),
      });
      if (res.ok) setBackendConnected(true);
    } catch {
      // Optimistically updated
    }
  }

  async function handleRecordPayment(orderId: string, amountPaid: number) {
    const order = data.orders.find((o) => o.id === orderId);
    if (!order) return;
    const paymentStatus: PaymentStatus =
      amountPaid >= order.totalPrice
        ? "PAID"
        : amountPaid > 0
          ? "DEPOSIT_PAID"
          : "UNPAID";

    setData((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId ? { ...o, amountPaid, paymentStatus } : o,
      ),
    }));
    if (activeJobTicketOrder?.id === orderId) {
      setActiveJobTicketOrder((prev) =>
        prev ? { ...prev, amountPaid, paymentStatus } : null,
      );
    }
    showToast(
      vi
        ? `Đã ghi nhận thanh toán ${formatVnd(amountPaid)} cho đơn ${order.orderNumber}`
        : `Recorded payment of ${formatVnd(amountPaid)} for ${order.orderNumber}`,
    );

    try {
      await fetch(`${API_BASE}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPaid, paymentStatus }),
      });
    } catch {
      // Optimistically updated
    }
  }

  async function handleApproveProofToProduction(order: EmbroideryOrder) {
    const nextStatus: OrderStatus = "IN_PRODUCTION";
    setData((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === order.id ? { ...o, status: nextStatus } : o,
      ),
    }));
    if (activeJobTicketOrder?.id === order.id) {
      setActiveJobTicketOrder((prev) =>
        prev ? { ...prev, status: nextStatus } : null,
      );
    }
    showToast(
      vi
        ? `Khách đã duyệt mẫu ${order.orderNumber} → Chuyển sang Đang Thêu Sản Xuất!`
        : `Client proof approved for ${order.orderNumber} → Moved to In Production!`,
    );

    try {
      await fetch(`${API_BASE}/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      // Optimistic
    }
  }

  async function handleAdjustDefectCount(order: EmbroideryOrder, delta: number) {
    const nextDefects = Math.max(0, (order.defectQuantity ?? 0) + delta);
    setData((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === order.id ? { ...o, defectQuantity: nextDefects } : o,
      ),
    }));
    if (activeJobTicketOrder?.id === order.id) {
      setActiveJobTicketOrder((prev) =>
        prev ? { ...prev, defectQuantity: nextDefects } : null,
      );
    }
    showToast(
      vi
        ? `Cập nhật hàng lỗi QC đơn ${order.orderNumber}: ${nextDefects} cái`
        : `Updated QC spoilage for ${order.orderNumber}: ${nextDefects} pcs`,
    );

    try {
      await fetch(`${API_BASE}/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defectQuantity: nextDefects }),
      });
    } catch {
      // Optimistic
    }
  }

  async function handleSaveOrder(e: React.SyntheticEvent) {
    e.preventDefault();
    const customer =
      data.customers.find((c) => c.id === orderForm.customerId) ??
      data.customers[0];
    const design =
      data.designs.find((d) => d.id === orderForm.designId) ?? data.designs[0];

    const quantity = Math.max(1, Number(orderForm.quantity) || 24);
    const unitPrice = Number(orderForm.unitPrice) || 165000;
    const digitizingFee = Number(orderForm.digitizingFee) || 0;
    const totalPrice = Math.round(quantity * unitPrice + digitizingFee);

    const amountPaid =
      orderForm.paymentStatus === "PAID"
        ? totalPrice
        : orderForm.paymentStatus === "UNPAID"
          ? 0
          : Number(orderForm.amountPaid) || Math.round(totalPrice * 0.5);

    const payload: Partial<EmbroideryOrder> = {
      customerId: customer?.id ?? "cust-1",
      customerName: customer?.name ?? "Shop Client",
      companyName: customer?.company ?? "Custom Apparel",
      designId: design?.id ?? "des-1",
      designName: design?.name ?? "Custom Embroidery Logo",
      garmentType: orderForm.garmentType,
      garmentColor: orderForm.garmentColor,
      placement: orderForm.placement,
      quantity,
      completedQuantity: Math.min(
        quantity,
        Number(orderForm.completedQuantity) || 0,
      ),
      sizeBreakdown: {
        S: Number(orderForm.sizeS) || 0,
        M: Number(orderForm.sizeM) || 0,
        L: Number(orderForm.sizeL) || 0,
        XL: Number(orderForm.sizeXL) || 0,
        XXL: Number(orderForm.sizeXXL) || 0,
      },
      stitchCount: design?.stitchCount ?? 8500,
      colorCount: design?.colorSequence.length ?? 3,
      threadColors: design?.colorSequence.map((c) => c.hex) ?? [
        "#1e3a8a",
        "#ffffff",
      ],
      status: orderForm.status,
      paymentStatus: orderForm.paymentStatus,
      amountPaid,
      assignedMachineId: orderForm.assignedMachineId || null,
      dueDate: orderForm.dueDate,
      rushOrder: orderForm.rushOrder,
      is3DPuff: Boolean(
        orderForm.is3DPuff ?? design?.complexity === "3D Puff",
      ),
      shippingMode: orderForm.shippingMode ?? "LOCAL_2_WAY",
      shippingCost:
        orderForm.shippingCost !== undefined
          ? Number(orderForm.shippingCost)
          : orderForm.shippingMode === "CHANH_XE_PICKUP"
            ? 150000
            : 300000,
      digitizingFee,
      unitPrice,
      totalPrice,
      notes: orderForm.notes,
    };

    if (editingOrderId) {
      setData((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === editingOrderId ? ({ ...o, ...payload } as EmbroideryOrder) : o,
        ),
      }));
      try {
        await fetch(`${API_BASE}/orders/${editingOrderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // Optimistic
      }
      showToast("Updated work order details");
    } else {
      const orderNumber = `TV-2610-${101 + data.orders.length}`;
      const createPayload = { ...payload, orderNumber };
      try {
        const res = await fetch(`${API_BASE}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        });
        if (res.ok) {
          const created = (await res.json()) as EmbroideryOrder;
          setData((prev) => ({
            ...prev,
            orders: [created, ...prev.orders],
          }));
        } else {
          throw new Error("Fallback");
        }
      } catch {
        const fallbackOrder: EmbroideryOrder = {
          ...(createPayload as EmbroideryOrder),
          id: `ord-${Date.now()}`,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        setData((prev) => ({
          ...prev,
          orders: [fallbackOrder, ...prev.orders],
        }));
      }
      showToast(`Created work order ${orderNumber}`);
    }

    setShowOrderModal(false);
  }

  async function handleDeleteOrder(orderId: string, orderNumber: string) {
    setData((prev) => ({
      ...prev,
      orders: prev.orders.filter((o) => o.id !== orderId),
    }));
    showToast(`Deleted work order ${orderNumber}`);
    try {
      await fetch(`${API_BASE}/orders/${orderId}`, { method: "DELETE" });
    } catch {
      // Optimistic
    }
  }

  async function handleSaveDesign(e: React.SyntheticEvent) {
    e.preventDefault();
    const payload: Partial<EmbroideryDesign> = {
      name: designForm.name || "New Digitized Crest",
      clientName: designForm.clientName || "In-House Catalog",
      stitchCount: Number(designForm.stitchCount) || 8500,
      widthMm: Number(designForm.widthMm) || 95,
      heightMm: Number(designForm.heightMm) || 60,
      hoopSize: designForm.hoopSize,
      fileFormat: designForm.fileFormat,
      complexity: designForm.complexity,
      digitizerNotes: designForm.digitizerNotes,
      colorSequence: designForm.colorSequence.map((c, idx) => ({
        ...c,
        needle: idx + 1,
      })),
      stitchPaths: designForm.stitchPaths,
      jumpCount: designForm.jumpCount,
      trimCount: designForm.trimCount,
    };

    if (editingDesignId) {
      setData((prev) => ({
        ...prev,
        designs: prev.designs.map((d) =>
          d.id === editingDesignId
            ? ({ ...d, ...payload } as EmbroideryDesign)
            : d,
        ),
      }));
      try {
        await fetch(`${API_BASE}/designs/${editingDesignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // Optimistic
      }
      showToast(`Updated design ${payload.name}`);
    } else {
      const code = `TV-DST-0${41 + data.designs.length}`;
      const createPayload = { ...payload, code };
      try {
        const res = await fetch(`${API_BASE}/designs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        });
        if (res.ok) {
          const created = (await res.json()) as EmbroideryDesign;
          setData((prev) => ({
            ...prev,
            designs: [created, ...prev.designs],
          }));
        } else {
          throw new Error("Fallback");
        }
      } catch {
        const fallback: EmbroideryDesign = {
          ...(createPayload as EmbroideryDesign),
          id: `des-${Date.now()}`,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        setData((prev) => ({
          ...prev,
          designs: [fallback, ...prev.designs],
        }));
      }
      showToast(`Added design ${code} to library`);
    }

    setShowDesignModal(false);
  }

  async function handleQuickSaveParsedDst(
    parsed: ParsedDstResult,
    clientName?: string,
  ) {
    const code = `TV-DST-0${41 + data.designs.length}`;
    const createPayload: Partial<EmbroideryDesign> = {
      code,
      name: parsed.name || parsed.headerLabel || "Tajima .DST Design",
      clientName:
        clientName || (vi ? "Xưởng Thêu Tường Vinh" : "Tuong Vinh Studio"),
      stitchCount: parsed.stitchCount,
      widthMm: parsed.widthMm,
      heightMm: parsed.heightMm,
      hoopSize: parsed.hoopSize,
      fileFormat: "DST",
      complexity: parsed.complexity,
      digitizerNotes: vi
        ? `Nhập trực tiếp từ file .DST (${parsed.stitchCount.toLocaleString()} mũi, ${parsed.jumpCount} mũi nhảy, ${parsed.trimCount} lần cắt chỉ, ~${parsed.estimatedThreadMeters}m chỉ).`
        : `Parsed from .DST (${parsed.stitchCount.toLocaleString()} st, ${parsed.jumpCount} jumps, ${parsed.trimCount} trims, ~${parsed.estimatedThreadMeters}m thread).`,
      colorSequence: parsed.colorSequence.map((c, idx) => ({
        ...c,
        needle: idx + 1,
      })),
      stitchPaths: parsed.stitchPaths,
      jumpCount: parsed.jumpCount,
      trimCount: parsed.trimCount,
    };

    try {
      const res = await fetch(`${API_BASE}/designs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });
      if (res.ok) {
        const created = (await res.json()) as EmbroideryDesign;
        setData((prev) => ({
          ...prev,
          designs: [created, ...prev.designs],
        }));
      } else {
        throw new Error("Fallback");
      }
    } catch {
      const fallback: EmbroideryDesign = {
        ...(createPayload as EmbroideryDesign),
        id: `des-${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setData((prev) => ({
        ...prev,
        designs: [fallback, ...prev.designs],
      }));
    }

    showToast(
      vi
        ? `Đã lưu file .DST "${createPayload.name}" (${parsed.stitchCount.toLocaleString()} mũi) vào Thư viện!`
        : `Saved parsed .DST "${createPayload.name}" (${parsed.stitchCount.toLocaleString()} st) to Library!`,
    );
  }

  async function handleDeleteDesign(id: string, code: string) {
    setData((prev) => ({
      ...prev,
      designs: prev.designs.filter((d) => d.id !== id),
    }));
    showToast(`Removed design ${code}`);
    try {
      await fetch(`${API_BASE}/designs/${id}`, { method: "DELETE" });
    } catch {
      // Optimistic
    }
  }

  async function handleCreateMachine(e: React.SyntheticEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/machines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(machineForm),
      });
      if (res.ok) {
        const created = (await res.json()) as EmbroideryMachine;
        setData((prev) => ({
          ...prev,
          machines: [...prev.machines, created],
        }));
      } else {
        throw new Error("Fallback");
      }
    } catch {
      const fallback: EmbroideryMachine = {
        ...machineForm,
        id: `mach-${Date.now()}`,
        currentSpm: 0,
        status: "IDLE",
        activeOrderId: null,
        activeOrderNumber: null,
        progressPercent: 0,
        totalStitchesToday: 0,
        threadBreaksToday: 0,
        lastMaintenanceDate: new Date().toISOString().slice(0, 10),
      };
      setData((prev) => ({
        ...prev,
        machines: [...prev.machines, fallback],
      }));
    }
    setShowMachineModal(false);
    showToast(`Added ${machineForm.name} to shop floor`);
  }

  async function handleMachineUpdate(
    machineId: string,
    patch: Partial<EmbroideryMachine>,
  ) {
    setData((prev) => ({
      ...prev,
      machines: prev.machines.map((m) => {
        if (m.id !== machineId) return m;
        const updated = { ...m, ...patch };
        if (patch.status === "IDLE" || patch.status === "MAINTENANCE") {
          updated.currentSpm = 0;
        } else if (patch.status === "RUNNING" && updated.currentSpm === 0) {
          updated.currentSpm = Math.min(900, updated.maxSpm);
        }
        if (patch.activeOrderId !== undefined) {
          const found = prev.orders.find((o) => o.id === patch.activeOrderId);
          updated.activeOrderNumber = found ? found.orderNumber : null;
        }
        return updated;
      }),
    }));

    try {
      await fetch(`${API_BASE}/machines/${machineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch {
      // Optimistically updated
    }
  }

  async function handleLogMachineBatch(machine: EmbroideryMachine) {
    if (!machine.activeOrderId) {
      showToast("Assign a work order to this machine first");
      return;
    }
    const order = data.orders.find((o) => o.id === machine.activeOrderId);
    if (!order) return;

    const batchSize = Math.max(1, machine.heads * 2);
    const newCompleted = Math.min(
      order.quantity,
      order.completedQuantity + batchSize,
    );
    const newPct = Math.round((newCompleted / order.quantity) * 100);
    const newOrderStatus: OrderStatus =
      newCompleted >= order.quantity ? "QUALITY_CHECK" : "IN_PRODUCTION";
    const addedStitches = batchSize * order.stitchCount;
    const batchThreadMeters = Math.max(
      1,
      Math.round((addedStitches / 1000) * 5.2),
    );
    const prevMeters = order.threadMetersUsed ?? 0;
    const nextMeters = prevMeters + batchThreadMeters;
    const conesCrossed =
      Math.floor(nextMeters / 2500) - Math.floor(prevMeters / 2500);

    setData((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              completedQuantity: newCompleted,
              status: newOrderStatus,
              threadMetersUsed: nextMeters,
            }
          : o,
      ),
      machines: prev.machines.map((m) =>
        m.id === machine.id
          ? {
              ...m,
              progressPercent: newPct,
              totalStitchesToday: m.totalStitchesToday + addedStitches,
            }
          : m,
      ),
      inventory:
        conesCrossed > 0
          ? prev.inventory.map((item, idx) =>
              item.category === "Thread" && idx === 0
                ? { ...item, quantity: Math.max(0, item.quantity - conesCrossed) }
                : item,
            )
          : prev.inventory,
      employees: (prev.employees ?? INITIAL_EMPLOYEES).map((emp) =>
        emp.assignedMachineId === machine.id && emp.status === "ACTIVE"
          ? {
              ...emp,
              stitchesCompletedMonth:
                emp.stitchesCompletedMonth + addedStitches,
            }
          : emp,
      ),
    }));

    showToast(
      vi
        ? `Đã thêu xong +${batchSize} áo trên ${machine.name} (${newCompleted}/${order.quantity} áo • Tiêu hao ~${batchThreadMeters}m chỉ)`
        : `Logged +${batchSize} pcs on ${machine.name} (${newCompleted}/${order.quantity} pcs • ~${batchThreadMeters}m thread used)`,
    );

    const assignedOperators = (data.employees ?? INITIAL_EMPLOYEES).filter(
      (emp) => emp.assignedMachineId === machine.id && emp.status === "ACTIVE",
    );

    try {
      await Promise.all([
        fetch(`${API_BASE}/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newOrderStatus,
            completedQuantity: newCompleted,
            threadMetersUsed: nextMeters,
          }),
        }),
        fetch(`${API_BASE}/machines/${machine.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            progressPercent: newPct,
            totalStitchesToday: machine.totalStitchesToday + addedStitches,
          }),
        }),
        ...assignedOperators.map((op) =>
          fetch(`${API_BASE}/employees/${op.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stitchesCompletedMonth: op.stitchesCompletedMonth + addedStitches,
            }),
          }),
        ),
      ]);
    } catch {
      // Optimistic
    }
  }

  async function handleAdjustStock(itemId: string, delta: number) {
    setData((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item,
      ),
    }));

    try {
      await fetch(`${API_BASE}/inventory/${itemId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
    } catch {
      // Optimistically updated
    }
  }

  async function handleRestockAllLow() {
    setData((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item) =>
        item.quantity <= item.minThreshold
          ? { ...item, quantity: item.minThreshold + 10 }
          : item,
      ),
    }));
    showToast(
      "Restocked all low-stock thread cones & backing rolls (+10 above min)",
    );

    try {
      await fetch(`${API_BASE}/inventory/restock-low`, { method: "POST" });
    } catch {
      // Optimistic
    }
  }

  async function handleSaveInventory(e: React.SyntheticEvent) {
    e.preventDefault();
    if (editingInventoryId) {
      setData((prev) => ({
        ...prev,
        inventory: prev.inventory.map((item) =>
          item.id === editingInventoryId
            ? ({ ...item, ...inventoryForm } as InventoryItem)
            : item,
        ),
      }));
      try {
        await fetch(`${API_BASE}/inventory/${editingInventoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inventoryForm),
        });
      } catch {
        // Optimistic
      }
      showToast(`Updated ${inventoryForm.name}`);
    } else {
      try {
        const res = await fetch(`${API_BASE}/inventory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inventoryForm),
        });
        if (res.ok) {
          const created = (await res.json()) as InventoryItem;
          setData((prev) => ({
            ...prev,
            inventory: [created, ...prev.inventory],
          }));
        } else {
          throw new Error("Fallback");
        }
      } catch {
        const fallback: InventoryItem = {
          ...inventoryForm,
          id: `inv-${Date.now()}`,
        };
        setData((prev) => ({
          ...prev,
          inventory: [fallback, ...prev.inventory],
        }));
      }
      showToast(`Added ${inventoryForm.name} to inventory`);
    }
    setShowInventoryModal(false);
  }

  async function handleDeleteInventory(id: string, name: string) {
    setData((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((i) => i.id !== id),
    }));
    showToast(`Deleted ${name}`);
    try {
      await fetch(`${API_BASE}/inventory/${id}`, { method: "DELETE" });
    } catch {
      // Optimistic
    }
  }

  async function handleSaveCustomer(e: React.SyntheticEvent) {
    e.preventDefault();
    if (editingCustomerId) {
      setData((prev) => ({
        ...prev,
        customers: prev.customers.map((c) =>
          c.id === editingCustomerId ? { ...c, ...customerForm } : c,
        ),
      }));
      try {
        await fetch(`${API_BASE}/customers/${editingCustomerId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerForm),
        });
      } catch {
        // Optimistic
      }
      showToast(`Updated client ${customerForm.company}`);
    } else {
      const payload: Partial<Customer> = {
        ...customerForm,
        totalOrders: 0,
        totalSpend: 0,
      };
      try {
        const res = await fetch(`${API_BASE}/customers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = (await res.json()) as Customer;
          setData((prev) => ({
            ...prev,
            customers: [created, ...prev.customers],
          }));
        } else {
          throw new Error("Fallback");
        }
      } catch {
        const fallback: Customer = {
          ...(payload as Customer),
          id: `cust-${Date.now()}`,
        };
        setData((prev) => ({
          ...prev,
          customers: [fallback, ...prev.customers],
        }));
      }
      showToast(`Added client ${customerForm.company}`);
    }
    setShowCustomerModal(false);
  }

  async function handleDeleteCustomer(id: string, company: string) {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
    showToast(`Removed client ${company}`);
    try {
      await fetch(`${API_BASE}/customers/${id}`, { method: "DELETE" });
    } catch {
      // Optimistic
    }
  }

  async function handleSaveEmployee(e: React.SyntheticEvent) {
    e.preventDefault();
    const payload: Partial<Employee> = {
      name: employeeForm.name || (vi ? "Nhân viên Xưởng Thêu" : "Shop Staff"),
      role: employeeForm.role,
      shift: employeeForm.shift,
      status: employeeForm.status,
      phone: employeeForm.phone || "0903 000 000",
      assignedMachineId: employeeForm.assignedMachineId || null,
      payType: employeeForm.payType,
      hourlyRate: Number(employeeForm.hourlyRate) || 45000,
      monthlyBaseSalary: Number(employeeForm.monthlyBaseSalary) || 9500000,
      hoursWorkedMonth: Math.max(0, Number(employeeForm.hoursWorkedMonth) || 0),
      overtimeHoursMonth: Math.max(
        0,
        Number(employeeForm.overtimeHoursMonth) || 0,
      ),
      stitchesCompletedMonth: Math.max(
        0,
        Number(employeeForm.stitchesCompletedMonth) || 0,
      ),
      stitchBonusPer10k: Math.max(
        0,
        Number(employeeForm.stitchBonusPer10k) || 0,
      ),
      allowanceAndBonus: Math.max(
        0,
        Number(employeeForm.allowanceAndBonus) || 0,
      ),
      paymentStatus: employeeForm.salaryPaymentStatus,
      amountPaidMonth: Math.max(0, Number(employeeForm.amountPaidMonth) || 0),
      notes: employeeForm.notes,
    };

    if (editingEmployeeId) {
      setData((prev) => ({
        ...prev,
        employees: (prev.employees ?? INITIAL_EMPLOYEES).map((emp) =>
          emp.id === editingEmployeeId
            ? ({ ...emp, ...payload } as Employee)
            : emp,
        ),
      }));
      try {
        await fetch(`${API_BASE}/employees/${editingEmployeeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // Optimistic
      }
      showToast(
        vi
          ? `Đã cập nhật nhân sự ${payload.name}`
          : `Updated staff member ${payload.name}`,
      );
    } else {
      const currentList = data.employees ?? INITIAL_EMPLOYEES;
      const code = `TV-NV-${String(currentList.length + 1).padStart(2, "0")}`;
      const createPayload = {
        ...payload,
        code,
        joinedDate: new Date().toISOString().slice(0, 10),
      };
      try {
        const res = await fetch(`${API_BASE}/employees`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        });
        if (res.ok) {
          const created = (await res.json()) as Employee;
          setData((prev) => ({
            ...prev,
            employees: [created, ...(prev.employees ?? INITIAL_EMPLOYEES)],
          }));
        } else {
          throw new Error("Fallback");
        }
      } catch {
        const fallback: Employee = {
          ...(createPayload as Employee),
          id: `emp-${Date.now()}`,
        };
        setData((prev) => ({
          ...prev,
          employees: [fallback, ...(prev.employees ?? INITIAL_EMPLOYEES)],
        }));
      }
      showToast(
        vi
          ? `Đã thêm nhân sự ${code} — ${payload.name}`
          : `Added employee ${code} — ${payload.name}`,
      );
    }

    setShowEmployeeModal(false);
  }

  async function handleDeleteEmployee(id: string, name: string) {
    setData((prev) => ({
      ...prev,
      employees: (prev.employees ?? INITIAL_EMPLOYEES).filter(
        (emp) => emp.id !== id,
      ),
    }));
    showToast(vi ? `Đã xóa nhân sự ${name}` : `Removed staff member ${name}`);
    try {
      await fetch(`${API_BASE}/employees/${id}`, { method: "DELETE" });
    } catch {
      // Optimistic
    }
  }

  async function handleQuickUpdateEmployee(
    emp: Employee,
    patch: Partial<Employee>,
    toastMsg: string,
  ) {
    const merged: Employee = { ...emp, ...patch };
    const breakdown = calculateEmployeeCostBreakdown(merged);
    if (patch.amountPaidMonth !== undefined) {
      merged.paymentStatus =
        merged.amountPaidMonth >= breakdown.totalCost
          ? "PAID"
          : merged.amountPaidMonth > 0
            ? "PARTIAL_ADVANCE"
            : "UNPAID";
    } else if (
      merged.paymentStatus === "PAID" &&
      merged.amountPaidMonth < breakdown.totalCost
    ) {
      merged.paymentStatus =
        merged.amountPaidMonth > 0 ? "PARTIAL_ADVANCE" : "UNPAID";
    }

    const finalPatch: Partial<Employee> = {
      ...patch,
      paymentStatus: merged.paymentStatus,
    };

    setData((prev) => ({
      ...prev,
      employees: (prev.employees ?? INITIAL_EMPLOYEES).map((item) =>
        item.id === emp.id ? { ...item, ...finalPatch } : item,
      ),
    }));
    setActivePayslipEmployee((prev) =>
      prev && prev.id === emp.id ? { ...prev, ...finalPatch } : prev,
    );
    showToast(toastMsg);

    try {
      await fetch(`${API_BASE}/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPatch),
      });
    } catch {
      // Optimistic
    }
  }

  function handleExportPayrollCsv() {
    setExportModalConfig({ dataset: "payroll", format: "csv" });
  }

  async function handlePayAllUnpaidPayroll() {
    const staffList = data.employees ?? INITIAL_EMPLOYEES;
    const updatedStaff = staffList.map((emp) => {
      const b =
        employeePayrollSummary.breakdownById.get(emp.id) ??
        calculateEmployeeCostBreakdown(emp);
      return {
        ...emp,
        amountPaidMonth: b.totalCost,
        paymentStatus: "PAID" as const,
      };
    });

    setData((prev) => ({
      ...prev,
      employees: updatedStaff,
    }));

    showToast(
      vi
        ? "Đã chốt & tất toán đủ 100% bảng lương tháng cho toàn bộ nhân sự!"
        : "Settled 100% of monthly payroll balances for all staff!",
    );

    try {
      await Promise.all(
        updatedStaff.map((emp) =>
          fetch(`${API_BASE}/employees/${emp.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amountPaidMonth: emp.amountPaidMonth,
              paymentStatus: "PAID",
            }),
          }),
        ),
      );
    } catch {
      // Optimistic
    }
  }

  async function handleConvertQuoteToOrder() {
    const orderNumber = `TV-2610-${101 + data.orders.length}`;
    const payload: Partial<EmbroideryOrder> = {
      orderNumber,
      customerId: data.customers[0]?.id ?? "cust-1",
      customerName: data.customers[0]?.name ?? "Sales Client",
      companyName: quoteCompanyName || "Custom Quote Client",
      designId: data.designs[0]?.id ?? "des-1",
      designName: `${quoteCompanyName} Custom Embroidery (${quoteInput.stitchCount.toLocaleString()} st)`,
      garmentType: quoteGarmentName || "Port Authority K500 Polo",
      garmentColor: "Assorted Sizes / Colors",
      placement: quoteInput.is3DPuff ? "Cap Front" : "Left Chest",
      quantity: quoteInput.quantity,
      completedQuantity: 0,
      stitchCount: quoteInput.stitchCount,
      colorCount: quoteInput.colorCount,
      threadColors: ["#1e3a8a", "#f8fafc", "#dc2626", "#eab308"].slice(
        0,
        Math.min(4, quoteInput.colorCount),
      ),
      status: quoteInput.needsDigitizing ? "DIGITIZING" : "APPROVAL_PENDING",
      paymentStatus: "UNPAID",
      amountPaid: 0,
      assignedMachineId: "mach-1",
      dueDate: new Date(
        Date.now() + (quoteInput.rushOrder ? 2 : 6) * 86400000,
      )
        .toISOString()
        .slice(0, 10),
      rushOrder: quoteInput.rushOrder,
      is3DPuff: quoteInput.is3DPuff,
      splitThreadFor20Heads: Boolean(quoteInput.splitThreadFor20Heads),
      shippingMode: quoteInput.shippingMode ?? "LOCAL_2_WAY",
      shippingCost: quoteBreakdown.shippingCost,
      digitizingFee: quoteBreakdown.digitizingFee,
      unitPrice: quoteBreakdown.finalUnitPrice,
      totalPrice: quoteBreakdown.totalPrice,
      notes: quoteInput.splitThreadFor20Heads
        ? `Khách đã duyệt mẫu (0₫). Định mức chỉ trên: ${quoteBreakdown.totalMasterConesToBuy} cuộn nguyên (sang ${quoteBreakdown.totalSubConesFor20Heads} cuộn con lên 20 đầu).`
        : `Khách đã duyệt mẫu (0₫). Định mức chỉ trên: ${quoteBreakdown.totalMasterConesToBuy} cuộn (${quoteInput.colorCount} màu).`,
    };

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = (await res.json()) as EmbroideryOrder;
        setData((prev) => ({
          ...prev,
          orders: [created, ...prev.orders],
        }));
      } else {
        throw new Error("Fallback");
      }
    } catch {
      const fallback: EmbroideryOrder = {
        ...(payload as EmbroideryOrder),
        id: `ord-${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setData((prev) => ({
        ...prev,
        orders: [fallback, ...prev.orders],
      }));
    }

    handleSelectTab("orders");
    showToast(`Quote converted to Work Order ${orderNumber}!`);
  }

  async function handleResetDemo() {
    localStorage.removeItem(STORAGE_KEY);
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: "POST" });
      if (res.ok) {
        const fresh = (await res.json()) as DashboardPayload;
        setData(fresh);
        showToast("Tuong Vinh Embroidery data reset to default seed state");
        return;
      }
    } catch {
      // Fallback
    }
    setData(getInitialDashboardPayload());
    showToast("Tuong Vinh Embroidery data reset to default seed state");
  }

  function handleExportOrdersCsv() {
    const defaultDataset: ExportDataset =
      activeTab === "employees"
        ? "payroll"
        : activeTab === "inventory"
          ? "inventory"
          : activeTab === "customers"
            ? "customers"
            : "orders";
    setExportModalConfig({ dataset: defaultDataset, format: "csv" });
  }

  // ================= CONFIRMATION PROMPT WRAPPERS FOR QUICK ACTIONS =================
  function promptAdvanceOrderStatus(order: EmbroideryOrder) {
    const idx = ORDER_STAGE_FLOW.indexOf(order.status);
    const nextStatus =
      idx < ORDER_STAGE_FLOW.length - 1
        ? ORDER_STAGE_FLOW[idx + 1]
        : order.status;
    if (nextStatus === order.status) return;

    setPendingConfirmAction({
      title: vi
        ? "Xác Nhận Chuyển Công Đoạn Sản Xuất"
        : "Confirm Advancing Work Order Stage",
      description: vi
        ? `Bạn có muốn chuyển lệnh sản xuất ${order.orderNumber} (${order.companyName}) sang công đoạn tiếp theo không?`
        : `Do you want to advance work order ${order.orderNumber} (${order.companyName}) to the next production stage?`,
      targetLabel: `${order.orderNumber} — ${order.companyName}`,
      changePreview: `${STATUS_LABELS[order.status]} → ${STATUS_LABELS[nextStatus]}`,
      variant: "primary",
      onConfirm: () => handleAdvanceOrderStatus(order),
    });
  }

  function promptAdjustDefectCount(order: EmbroideryOrder, delta: number) {
    const currentDefects = order.defectQuantity ?? 0;
    const nextDefects = Math.max(0, currentDefects + delta);
    setPendingConfirmAction({
      title: vi
        ? "Xác Nhận Hạch Toán Phế Phẩm QC"
        : "Confirm QC Defect Adjustment",
      description: vi
        ? `Bạn có chắc muốn ghi nhận ${delta > 0 ? `+${delta}` : delta} sản phẩm lỗi QC cho lệnh sản xuất ${order.orderNumber} không?`
        : `Are you sure you want to record ${delta > 0 ? `+${delta}` : delta} QC defective garment(s) for work order ${order.orderNumber}?`,
      targetLabel: `${order.orderNumber} (${order.garmentType})`,
      changePreview: `${currentDefects} → ${nextDefects} ${vi ? "SP lỗi QC" : "defects"}`,
      variant: delta > 0 ? "danger" : "primary",
      onConfirm: () => handleAdjustDefectCount(order, delta),
    });
  }

  function promptApproveProofToProduction(order: EmbroideryOrder) {
    setPendingConfirmAction({
      title: vi
        ? "Xác Nhận Duyệt Mẫu & Đưa Vào Sản Xuất"
        : "Confirm Sample Approval & Production Release",
      description: vi
        ? `Xác nhận khách hàng (${order.companyName}) đã duyệt mẫu thêu và phát hành lệnh ${order.orderNumber} xuống chuyền máy?`
        : `Confirm client (${order.companyName}) approved the sample proof and release ${order.orderNumber} to machine production?`,
      targetLabel: `${order.orderNumber} — ${order.designName}`,
      changePreview: `${STATUS_LABELS[order.status]} → ${STATUS_LABELS.IN_PRODUCTION}`,
      variant: "emerald",
      onConfirm: () => handleApproveProofToProduction(order),
    });
  }

  function promptRecordPayment(orderId: string, amountPaid: number) {
    const order = data.orders.find((o) => o.id === orderId);
    if (!order) return;
    setPendingConfirmAction({
      title: vi
        ? "Xác Nhận Hạch Toán Thu Tiền Đơn Hàng"
        : "Confirm Order Payment Receipt",
      description: vi
        ? `Ghi nhận đã thu ${formatVnd(amountPaid)} cho lệnh sản xuất ${order.orderNumber} (${order.companyName})?`
        : `Record payment receipt of ${formatVnd(amountPaid)} for work order ${order.orderNumber} (${order.companyName})?`,
      targetLabel: `${order.orderNumber} — ${order.companyName}`,
      changePreview: `${formatVnd(order.amountPaid ?? 0)} → ${formatVnd(amountPaid)}`,
      variant: "emerald",
      onConfirm: () => handleRecordPayment(orderId, amountPaid),
    });
  }

  function promptLogMachineBatch(machine: EmbroideryMachine) {
    if (!machine.activeOrderId) {
      showToast(
        vi
          ? "Vui lòng gán lệnh sản xuất cho máy trước khi nghiệm thu mẻ thêu"
          : "Assign a work order to this machine first",
      );
      return;
    }
    const order = data.orders.find((o) => o.id === machine.activeOrderId);
    const batchSize = Math.max(1, machine.heads * 2);
    const newCompleted = order
      ? Math.min(order.quantity, order.completedQuantity + batchSize)
      : batchSize;

    setPendingConfirmAction({
      title: vi
        ? "Xác Nhận Nghiệm Thu Mẻ Thêu Hoàn Thành"
        : "Confirm Machine Batch Output",
      description: vi
        ? `Xác nhận dàn máy "${machine.name}" vừa hoàn thành 1 mẻ thêu (+${batchSize} sản phẩm) và cập nhật sản lượng vào hệ thống?`
        : `Confirm "${machine.name}" completed 1 batch run (+${batchSize} garments) and log stitch output?`,
      targetLabel: `${machine.name}${order ? ` (${order.orderNumber})` : ""}`,
      changePreview: order
        ? `${order.completedQuantity}/${order.quantity} → ${newCompleted}/${order.quantity} ${vi ? "SP" : "pcs"}`
        : `+${batchSize} ${vi ? "SP" : "pcs"}`,
      variant: "emerald",
      onConfirm: () => handleLogMachineBatch(machine),
    });
  }

  function promptMachineUpdate(
    machineId: string,
    patch: Partial<EmbroideryMachine>,
  ) {
    const machine = data.machines.find((m) => m.id === machineId);
    if (!machine) return;

    let title = vi
      ? "Xác Nhận Cập Nhật Trạng Thái Máy Thêu"
      : "Confirm Machine Configuration Change";
    let description = vi
      ? `Áp dụng thay đổi vận hành cho ${machine.name}?`
      : `Apply operating update to ${machine.name}?`;
    let changePreview = "";
    let variant: PendingConfirmAction["variant"] = "primary";

    if (patch.status && patch.status !== machine.status) {
      title = vi
        ? "Xác Nhận Chuyển Chế Độ Vận Hành Máy"
        : "Confirm Machine Operating Mode Change";
      description = vi
        ? `Bạn có muốn chuyển trạng thái của "${machine.name}" từ ${MACHINE_LABELS[machine.status]} sang ${MACHINE_LABELS[patch.status]} không?`
        : `Switch "${machine.name}" operating mode from ${MACHINE_LABELS[machine.status]} to ${MACHINE_LABELS[patch.status]}?`;
      changePreview = `${MACHINE_LABELS[machine.status]} → ${MACHINE_LABELS[patch.status]}`;
    } else if (patch.currentSpm !== undefined) {
      title = vi
        ? "Xác Nhận Điều Chỉnh Tốc Độ Máy (SPM)"
        : "Confirm Machine Stitch Speed (SPM) Adjustment";
      description = vi
        ? `Điều chỉnh tốc độ thêu của "${machine.name}" từ ${machine.currentSpm} SPM sang ${patch.currentSpm} SPM?`
        : `Adjust stitch speed of "${machine.name}" from ${machine.currentSpm} SPM to ${patch.currentSpm} SPM?`;
      changePreview = `${machine.currentSpm} SPM → ${patch.currentSpm} SPM`;
    } else if (patch.threadBreaksToday !== undefined) {
      title = vi
        ? "Xác Nhận Ghi Nhận Sự Cố Đứt Chỉ"
        : "Confirm Logging Thread Break Event";
      description = vi
        ? `Ghi nhận thêm +1 lần đứt chỉ trong ca hôm nay trên "${machine.name}"?`
        : `Log +1 thread break event today on "${machine.name}"?`;
      changePreview = `${machine.threadBreaksToday} → ${patch.threadBreaksToday} ${vi ? "lần đứt chỉ" : "breaks"}`;
      variant = "danger";
    } else if (patch.activeOrderId !== undefined) {
      const nextOrder = data.orders.find((o) => o.id === patch.activeOrderId);
      title = vi
        ? "Xác Nhận Điều Độ Lệnh Sản Xuất Cho Máy"
        : "Confirm Machine Work Order Assignment";
      description = vi
        ? `Gán lệnh sản xuất ${nextOrder ? `${nextOrder.orderNumber} (${nextOrder.companyName})` : "Trống (Gỡ lệnh)"} cho "${machine.name}"?`
        : `Assign work order ${nextOrder ? `${nextOrder.orderNumber} (${nextOrder.companyName})` : "None (Unassign)"} to "${machine.name}"?`;
      changePreview = `${machine.activeOrderNumber ?? (vi ? "Chưa gán" : "None")} → ${nextOrder?.orderNumber ?? (vi ? "Chưa gán" : "None")}`;
    } else {
      void handleMachineUpdate(machineId, patch);
      return;
    }

    setPendingConfirmAction({
      title,
      description,
      targetLabel: `${machine.name} (${machine.brand} ${machine.model})`,
      changePreview,
      variant,
      onConfirm: () => handleMachineUpdate(machineId, patch),
    });
  }

  function promptQuickSaveParsedDst(
    parsed: ParsedDstResult,
    clientName: string,
  ) {
    setPendingConfirmAction({
      title: vi
        ? "Xác Nhận Lưu Mẫu Thêu .DST Vào Thư Viện"
        : "Confirm Saving Parsed .DST Design to Library",
      description: vi
        ? `Lưu mẫu thêu "${parsed.name}" (${parsed.stitchCount.toLocaleString()} mũi, ${parsed.widthMm}×${parsed.heightMm}mm) của khách hàng "${clientName}" vào Thư Viện Mẫu .DST?`
        : `Save parsed .DST design "${parsed.name}" (${parsed.stitchCount.toLocaleString()} stitches, ${parsed.widthMm}×${parsed.heightMm}mm) for "${clientName}" to the Design Library?`,
      targetLabel: `${parsed.name} (${clientName})`,
      changePreview: `${parsed.stitchCount.toLocaleString()} ${vi ? "mũi" : "st"} • ${parsed.colorCount} ${vi ? "kim" : "needles"}`,
      variant: "emerald",
      onConfirm: () => handleQuickSaveParsedDst(parsed, clientName),
    });
  }

  function promptAdjustStock(itemId: string, delta: number) {
    const item = data.inventory.find((i) => i.id === itemId);
    if (!item) return;
    const nextQty = Math.max(0, item.quantity + delta);
    const isIssue = delta < 0;

    setPendingConfirmAction({
      title: isIssue
        ? vi
          ? "Xác Nhận Xuất Kho Vật Tư"
          : "Confirm Inventory Issue"
        : vi
          ? "Xác Nhận Nhập Kho Vật Tư"
          : "Confirm Inventory Receipt",
      description: isIssue
        ? vi
          ? `Bạn có chắc muốn xuất kho ${Math.abs(delta)} ${item.unit} "${item.name}" cấp cho xưởng sản xuất không?`
          : `Are you sure you want to issue ${Math.abs(delta)} ${item.unit} of "${item.name}" to the shop floor?`
        : vi
          ? `Bạn có chắc muốn nhập kho bổ sung +${delta} ${item.unit} cho vật tư "${item.name}" không?`
          : `Are you sure you want to receive +${delta} ${item.unit} of "${item.name}" into inventory?`,
      targetLabel: `${item.sku} — ${item.name}`,
      changePreview: `${item.quantity} ${item.unit} → ${nextQty} ${item.unit}`,
      variant: isIssue ? "amber" : "emerald",
      onConfirm: () => handleAdjustStock(itemId, delta),
    });
  }

  function promptRestockAllLow() {
    setPendingConfirmAction({
      title: vi
        ? "Xác Nhận Bổ Sung Tồn Kho Định Mức"
        : "Confirm Reorder Stock Replenishment",
      description: vi
        ? `Hạch toán nhập kho bổ sung cho toàn bộ ${metrics.lowStockItemsCount} mã chỉ thêu & phụ liệu đang dưới định mức an toàn?`
        : `Replenish stock for all ${metrics.lowStockItemsCount} thread & backing SKUs currently at or below safety threshold?`,
      targetLabel: vi
        ? `${metrics.lowStockItemsCount} mã vật tư dưới định mức`
        : `${metrics.lowStockItemsCount} low-stock SKUs`,
      changePreview: vi ? "Đưa về định mức +10 đơn vị/mã" : "Restore to min + 10 units/SKU",
      variant: "emerald",
      onConfirm: () => handleRestockAllLow(),
    });
  }

  function promptQuickUpdateEmployee(
    emp: Employee,
    patch: Partial<Employee>,
    toastMsg: string,
  ) {
    const breakdown =
      employeePayrollSummary.breakdownById.get(emp.id) ??
      calculateEmployeeCostBreakdown(emp);

    let title = vi
      ? "Xác Nhận Nghiệp Vụ Chấm Công & Lương"
      : "Confirm Timekeeping & Payroll Action";
    let description = toastMsg;
    let changePreview = "";
    let variant: PendingConfirmAction["variant"] = "primary";

    if (patch.hoursWorkedMonth !== undefined) {
      const diff = +(patch.hoursWorkedMonth - emp.hoursWorkedMonth).toFixed(1);
      title = vi
        ? "Xác Nhận Chấm Công Ngày (Ca 10.5h + 35k Cơm)"
        : "Confirm 10.5h Shift & Meal Allowance";
      description = vi
        ? `Chấm thêm +${diff} giờ công (1 ngày công 07:00–18:30 + 35.000đ tiền cơm trưa) vào bảng lương tháng của ${emp.name}?`
        : `Record +${diff} shift hours (1 workday 07:00–18:30 + 35,000 VND meal allowance) for ${emp.name}?`;
      changePreview = `${emp.hoursWorkedMonth}h → ${patch.hoursWorkedMonth}h (+35.000đ cơm)`;
    } else if (patch.overtimeHoursMonth !== undefined) {
      const diff = +(
        patch.overtimeHoursMonth - emp.overtimeHoursMonth
      ).toFixed(1);
      title = vi
        ? "Xác Nhận Chấm Tăng Ca Chủ Nhật (×200%)"
        : "Confirm Sunday Overtime (×200% Rate)";
      description = vi
        ? `Chấm thêm +${diff} giờ tăng ca Chủ Nhật (nhân hệ số 200%) vào kỳ lương của ${emp.name}?`
        : `Record +${diff} Sunday overtime hours (200% rate) for ${emp.name}?`;
      changePreview = `${emp.overtimeHoursMonth}h CN → ${patch.overtimeHoursMonth}h CN (×200%)`;
    } else if (patch.stitchesCompletedMonth !== undefined) {
      const diff = patch.stitchesCompletedMonth - emp.stitchesCompletedMonth;
      title = vi
        ? "Xác Nhận Nghiệm Thu Sản Lượng Mũi Thêu"
        : "Confirm Stitch Output Bonus Entry";
      description = vi
        ? `Cộng thêm +${diff.toLocaleString()} mũi sản lượng vào định mức thưởng của ${emp.name}?`
        : `Add +${diff.toLocaleString()} completed stitches to ${emp.name}'s output bonus?`;
      changePreview = `${emp.stitchesCompletedMonth.toLocaleString()} → ${patch.stitchesCompletedMonth.toLocaleString()} ${vi ? "mũi" : "st"}`;
    } else if (patch.paymentStatus === "PARTIAL_ADVANCE") {
      title = vi
        ? "Xác Nhận Chi Tạm Ứng 50% Lương"
        : "Confirm 50% Payroll Advance Disbursement";
      description = vi
        ? `Xác nhận chi tạm ứng 50% lương kỳ này (${formatVnd(patch.amountPaidMonth ?? 0)}) cho ${emp.name}?`
        : `Confirm disbursing a 50% payroll advance (${formatVnd(patch.amountPaidMonth ?? 0)}) to ${emp.name}?`;
      changePreview = `${formatVnd(emp.amountPaidMonth)} → ${formatVnd(patch.amountPaidMonth ?? 0)}`;
      variant = "amber";
    } else if (patch.paymentStatus === "PAID") {
      title = vi
        ? "Xác Nhận Quyết Toán 100% Thực Lĩnh"
        : "Confirm Full Net Payable Settlement";
      description = vi
        ? `Xác nhận quyết toán và chi trả toàn bộ số dư thực lĩnh còn lại (${formatVnd(breakdown.balanceDue)}) cho ${emp.name}?`
        : `Confirm settling the remaining net payable balance (${formatVnd(breakdown.balanceDue)}) in full for ${emp.name}?`;
      changePreview = `${vi ? "Thực lĩnh chi trả:" : "Net payout:"} ${formatVnd(breakdown.balanceDue)}`;
      variant = "emerald";
    } else if (patch.assignedMachineId !== undefined) {
      const nextMach = data.machines.find(
        (m) => m.id === patch.assignedMachineId,
      );
      title = vi
        ? "Xác Nhận Phân Công Dàn Máy Phụ Trách"
        : "Confirm Operator Machine Assignment";
      description = vi
        ? `Cập nhật dàn máy phụ trách cho ${emp.name}?`
        : `Update assigned embroidery machine line for ${emp.name}?`;
      changePreview = nextMach
        ? nextMach.name
        : vi
          ? "Không đứng máy cố định"
          : "Unassigned";
    }

    setPendingConfirmAction({
      title,
      description,
      targetLabel: `${emp.name} (${emp.code})`,
      changePreview,
      variant,
      onConfirm: () => handleQuickUpdateEmployee(emp, patch, toastMsg),
    });
  }

  function promptConvertQuoteToOrder() {
    setPendingConfirmAction({
      title: vi
        ? "Xác Nhận Phát Hành Lệnh Sản Xuất Từ Báo Giá"
        : "Confirm Converting Quote to Work Order",
      description: vi
        ? `Khởi tạo lệnh sản xuất mới cho khách hàng "${quoteCompanyName}" (${quoteInput.quantity} SP • ${quoteInput.stitchCount.toLocaleString()} mũi/SP)?`
        : `Create a new production work order for "${quoteCompanyName}" (${quoteInput.quantity} pcs • ${quoteInput.stitchCount.toLocaleString()} st/pc)?`,
      targetLabel: `${quoteCompanyName} — ${quoteGarmentName}`,
      changePreview: `${quoteInput.quantity} ${vi ? "SP" : "pcs"} • ${formatVnd(quoteBreakdown.totalPrice)}`,
      variant: "emerald",
      onConfirm: () => handleConvertQuoteToOrder(),
    });
  }

  function promptDeleteOrder(id: string, orderNumber: string) {
    setPendingConfirmAction({
      title: vi ? "Xác Nhận Xóa Lệnh Sản Xuất" : "Confirm Deleting Work Order",
      description: vi
        ? `Bạn có chắc chắn muốn xóa lệnh sản xuất ${orderNumber} khỏi hệ thống không?`
        : `Are you sure you want to delete work order ${orderNumber}?`,
      targetLabel: orderNumber,
      variant: "danger",
      confirmLabel: vi ? "Xóa Lệnh Sản Xuất" : "Delete Work Order",
      onConfirm: () => handleDeleteOrder(id, orderNumber),
    });
  }

  function promptDeleteDesign(id: string, code: string) {
    setPendingConfirmAction({
      title: vi ? "Xác Nhận Xóa Mẫu Thêu .DST" : "Confirm Deleting Design",
      description: vi
        ? `Bạn có chắc chắn muốn xóa mẫu thêu ${code} khỏi thư viện kỹ thuật không?`
        : `Are you sure you want to remove design ${code} from the digitizing library?`,
      targetLabel: code,
      variant: "danger",
      confirmLabel: vi ? "Xóa Mẫu Thêu" : "Delete Design",
      onConfirm: () => handleDeleteDesign(id, code),
    });
  }

  function promptDeleteInventory(id: string, name: string) {
    setPendingConfirmAction({
      title: vi ? "Xác Nhận Xóa Mã Vật Tư Kho" : "Confirm Deleting Supply SKU",
      description: vi
        ? `Bạn có chắc chắn muốn xóa mặt hàng "${name}" khỏi danh mục tồn kho không?`
        : `Are you sure you want to delete "${name}" from inventory?`,
      targetLabel: name,
      variant: "danger",
      confirmLabel: vi ? "Xóa Vật Tư" : "Delete Item",
      onConfirm: () => handleDeleteInventory(id, name),
    });
  }

  function promptDeleteCustomer(id: string, company: string) {
    setPendingConfirmAction({
      title: vi ? "Xác Nhận Xóa Hồ Sơ Khách Hàng" : "Confirm Deleting Client",
      description: vi
        ? `Bạn có chắc chắn muốn xóa đối tác "${company}" khỏi danh sách khách hàng B2B không?`
        : `Are you sure you want to remove client "${company}"?`,
      targetLabel: company,
      variant: "danger",
      confirmLabel: vi ? "Xóa Khách Hàng" : "Delete Client",
      onConfirm: () => handleDeleteCustomer(id, company),
    });
  }

  function promptDeleteEmployee(id: string, name: string) {
    setPendingConfirmAction({
      title: vi ? "Xác Nhận Xóa Hồ Sơ Nhân Sự" : "Confirm Removing Staff Member",
      description: vi
        ? `Bạn có chắc chắn muốn xóa nhân sự "${name}" khỏi danh sách xưởng không?`
        : `Are you sure you want to remove "${name}" from staff records?`,
      targetLabel: name,
      variant: "danger",
      confirmLabel: vi ? "Xóa Nhân Sự" : "Remove Staff",
      onConfirm: () => handleDeleteEmployee(id, name),
    });
  }

  function promptResetDemo() {
    setPendingConfirmAction({
      title: vi
        ? "Khôi Phục Dữ Liệu Mẫu Ban Đầu"
        : "Reset Studio Data to Initial Seed",
      description: vi
        ? "Bạn có chắc muốn khôi phục toàn bộ đơn hàng, dàn máy Tajima, kho vật tư và bảng lương về trạng thái mặc định ban đầu không?"
        : "Are you sure you want to reset all work orders, Tajima machines, inventory, and payroll back to the initial seed state?",
      targetLabel: "Xưởng Thêu Vi Tính Tường Vinh",
      variant: "danger",
      confirmLabel: vi ? "↺ Khôi Phục Mặc Định" : "↺ Confirm Reset",
      onConfirm: () => handleResetDemo(),
    });
  }

  function renderNavIcon(id: ActiveTab) {
    switch (id) {
      case "overview":
        return (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
        );
      case "orders":
        return (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6" />
            <path d="M9 16h4" />
          </svg>
        );
      case "designs":
        return (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2" />
            <path d="M12 19v2" />
          </svg>
        );
      case "machines":
        return (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M7 20h10" />
            <path d="M9 16v4" />
            <path d="M15 16v4" />
            <path d="M7 10h2l1.5-2.5L13 13l1.5-3H17" />
          </svg>
        );
      case "inventory":
        return (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        );
      case "quote":
        return (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" x2="16" y1="6" y2="6" />
            <line x1="16" x2="16" y1="14" y2="18" />
            <path d="M16 10h.01" />
            <path d="M12 10h.01" />
            <path d="M8 10h.01" />
            <path d="M12 14h.01" />
            <path d="M8 14h.01" />
            <path d="M12 18h.01" />
            <path d="M8 18h.01" />
          </svg>
        );
      case "customers":
        return (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "employees":
        return (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
            <path d="M7 15h.01" />
            <path d="M11 15h4" />
          </svg>
        );
    }
  }

  const allNavItems: {
    id: ActiveTab;
    label: string;
    badge?: string;
    badgeAlert?: boolean;
    group: "production" | "studio" | "management";
  }[] = [
    {
      id: "overview",
      label: vi ? "Tổng Quan Xưởng" : "Studio Overview",
      group: "production",
    },
    {
      id: "orders",
      label: vi ? "Lệnh Sản Xuất" : "Work Orders",
      badge: String(data.orders.length),
      group: "production",
    },
    {
      id: "machines",
      label: vi ? "Dàn Máy Tajima" : "Tajima Fleet",
      badge: `${metrics.runningMachinesCount}/${metrics.totalMachinesCount}`,
      group: "production",
    },
    {
      id: "designs",
      label: vi ? "Thư Viện Mẫu .DST" : "Design Library",
      badge: String(data.designs.length),
      group: "studio",
    },
    {
      id: "inventory",
      label: vi ? "Kho Chỉ & Phụ Liệu" : "Thread & Backing",
      badge:
        metrics.lowStockItemsCount > 0
          ? vi
            ? `${metrics.lowStockItemsCount} Thiếu`
            : `${metrics.lowStockItemsCount} Low`
          : undefined,
      badgeAlert: metrics.lowStockItemsCount > 0,
      group: "studio",
    },
    {
      id: "quote",
      label: vi ? "Báo Giá & Định Mức" : "Quote Estimator",
      group: "studio",
    },
    {
      id: "customers",
      label: vi ? "Khách Hàng B2B" : "Client Accounts",
      badge: String(data.customers.length),
      group: "management",
    },
    {
      id: "employees",
      label: vi ? "Nhân Sự & Quỹ Lương" : "Staff & Payroll",
      badge: String((data.employees ?? INITIAL_EMPLOYEES).length),
      group: "management",
    },
  ];

  const navItems = allNavItems.filter((item) => {
    if (studioRole === "OPERATOR") {
      return (
        item.id === "machines" ||
        item.id === "orders" ||
        item.id === "designs" ||
        item.id === "inventory"
      );
    }
    if (studioRole === "DIGITIZER") {
      return (
        item.id === "designs" ||
        item.id === "orders" ||
        item.id === "machines"
      );
    }
    if (studioRole === "SALES") {
      return item.id !== "employees";
    }
    return true;
  });

  const navGroups: {
    key: "production" | "studio" | "management";
    title: string;
  }[] = [
    {
      key: "production",
      title: vi ? "Sản Xuất & Điều Độ" : "Production & Floor",
    },
    {
      key: "studio",
      title: vi ? "Kỹ Thuật & Vật Tư" : "Studio & Inventory",
    },
    {
      key: "management",
      title: vi ? "Quản Trị & Kế Toán" : "Management & Payroll",
    },
  ];

  const activeNavItem =
    navItems.find((n) => n.id === activeTab) ?? navItems[0];

  return (
    <div className="tv-bg tv-text min-h-screen flex lg:h-dvh lg:overflow-hidden print:h-auto print:overflow-visible">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="tv-surface tv-border fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl print:hidden">
          <span
            className="h-2.5 w-2.5 rounded-full animate-ping"
            style={{ backgroundColor: "var(--tv-accent)" }}
          />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= LEFT STUDIO SIDEBAR (FIXED 248px × 100dvh) ================= */}
      {theme.layout === "sidebar" && (
        <aside className="tv-surface tv-border hidden w-62 min-w-62 max-w-62 shrink-0 flex-col justify-between border-r px-3.5 py-4 lg:flex lg:h-dvh overflow-hidden print:hidden">
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Brand Identity */}
            <Link
              href="/"
              onClick={() => setFallbackTab("overview")}
              className="flex shrink-0 items-center gap-3 px-2 pb-4 border-b tv-border group cursor-pointer"
            >
              <div className="tv-accent-bg flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black tracking-tight shadow-sm transition group-hover:scale-105">
                TV
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-extrabold tracking-tight">
                  {vi ? "Thêu Tường Vinh" : "Tuong Vinh"}
                </h1>
                <p className="tv-text-muted truncate text-[10px] font-semibold">
                  {vi ? "Hệ Thống Quản Trị ERP" : "Embroidery Studio ERP"}
                </p>
              </div>
            </Link>

            {/* Grouped Navigation Links */}
            <nav className="mt-3 flex-1 space-y-4 overflow-y-auto pr-0.5">
              {navGroups.map((grp) => {
                const itemsInGroup = navItems.filter(
                  (i) => i.group === grp.key,
                );
                if (itemsInGroup.length === 0) return null;
                return (
                  <div key={grp.key} className="space-y-0.5">
                    <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider tv-text-muted opacity-80">
                      {grp.title}
                    </p>
                    {itemsInGroup.map((item) => {
                      const isActive = activeTab === item.id;
                      const href = item.id === "overview" ? "/" : `/${item.id}`;
                      return (
                        <Link
                          key={item.id}
                          href={href}
                          onClick={() => setFallbackTab(item.id)}
                          className={`group relative flex h-9.5 w-full items-center justify-between gap-2.5 rounded-xl px-3 text-xs transition cursor-pointer ${
                            isActive
                              ? "tv-surface-2 font-bold tv-text shadow-2xs"
                              : "font-medium tv-text-muted hover:bg-(--tv-surface-2) hover:text-(--tv-text)"
                          }`}
                        >
                          {isActive && (
                            <span
                              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full"
                              style={{ backgroundColor: "var(--tv-accent)" }}
                            />
                          )}
                          <span className="inline-flex min-w-0 items-center gap-2.5 pl-0.5">
                            <span
                              className={`inline-flex h-4 w-4 shrink-0 items-center justify-center ${
                                isActive
                                  ? "tv-accent-text"
                                  : "tv-text-muted group-hover:text-(--tv-text) transition-colors"
                              }`}
                            >
                              {renderNavIcon(item.id)}
                            </span>
                            <span className="truncate leading-snug">{item.label}</span>
                          </span>
                          {item.badge && (
                            <span
                              className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 py-1 text-center font-mono text-[10px] font-bold leading-none ${
                                item.badgeAlert
                                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                  : isActive
                                    ? "tv-accent-bg"
                                    : "tv-surface-2 tv-border border tv-text-muted"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom: Clean System & Fleet Status Card */}
          <div className="shrink-0 space-y-2 border-t tv-border pt-3">
            <div className="tv-surface-2 tv-border rounded-xl border p-2.5 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 font-semibold truncate">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      backendConnected ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  <span className="truncate">
                    {backendConnected
                      ? vi
                        ? "Neon PostgreSQL"
                        : "Neon PostgreSQL"
                      : vi
                        ? "Bộ Nhớ Cục Bộ"
                        : "Offline Cache"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={promptResetDemo}
                  className="tv-surface tv-border inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold tv-accent-text hover:opacity-90 cursor-pointer"
                  title={
                    vi
                      ? "Đặt lại toàn bộ đơn hàng, kho, nhân sự về dữ liệu mẫu ban đầu"
                      : "Reset all orders, stock, and staff back to initial seed data"
                  }
                >
                  <span aria-hidden="true">↺</span>
                  <span>{vi ? "Khôi phục" : "Reset"}</span>
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] tv-text-muted">
                <span>Tajima TFGN2 & TMCP</span>
                <span className="font-mono font-bold text-emerald-400">
                  {metrics.runningMachinesCount}/{metrics.totalMachinesCount}{" "}
                  {vi ? "chạy" : "active"}
                </span>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ================= MAIN WORKSPACE AREA (INDEPENDENT SCROLL) ================= */}
      <div className="flex min-w-0 flex-1 flex-col lg:h-dvh lg:overflow-y-auto print:h-auto print:overflow-visible">
        {/* Sleek Top Application Navbar */}
        <header className="tv-surface tv-border sticky top-0 z-30 border-b px-4 sm:px-6 print:hidden">
          <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-3 py-2">
            {/* Left: Brand (on mobile/top-layout) + Breadcrumb Title + Live Status */}
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                onClick={() => setFallbackTab("overview")}
                className={`tv-accent-bg flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black shadow-xs ${
                  theme.layout === "sidebar" ? "lg:hidden" : ""
                }`}
              >
                TV
              </Link>

              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="hidden sm:inline text-xs font-medium tv-text-muted">
                  {vi ? "Tường Vinh ERP" : "Tuong Vinh ERP"}
                </span>
                <span className="hidden sm:inline text-xs tv-text-muted opacity-40">
                  /
                </span>
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                  {activeNavItem?.label ?? "Tuong Vinh Embroidery"}
                </h2>

                <span className="tv-surface-2 tv-border hidden md:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tv-text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>
                    {vi
                      ? `${metrics.runningMachinesCount}/${metrics.totalMachinesCount} máy chạy`
                      : `${metrics.runningMachinesCount}/${metrics.totalMachinesCount} active`}
                  </span>
                  <span className="opacity-40">•</span>
                  <span className="font-mono">
                    {metrics.totalQueuedStitches.toLocaleString()}{" "}
                    {vi ? "mũi chờ" : "st queued"}
                  </span>
                </span>
              </div>
            </div>

            {/* Right: Unified Control Pill + Primary Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Unified Workspace Preferences Pill */}
              <div className="tv-surface-2 tv-border inline-flex items-center rounded-xl border p-1.5 gap-1.5 text-xs">
                {/* Role Switcher */}
                <ModernSelect
                  variant="ghost"
                  value={studioRole}
                  onChange={(e) =>
                    handleSelectStudioRole(e.target.value as StudioRole)
                  }
                  className="h-8 text-xs font-bold"
                  title={
                    vi
                      ? "Chuyển đổi phân quyền giao diện theo bộ phận"
                      : "Switch workspace view by department role"
                  }
                >
                  <option value="ADMIN">
                    {vi ? "👑 Chủ Xưởng" : "👑 Workshop Owner"}
                  </option>
                  <option value="SALES">
                    {vi
                      ? "📋 Quản Lý Đơn Hàng & Định Mức"
                      : "📋 Orders & Material Norms"}
                  </option>
                  <option value="DIGITIZER">
                    {vi
                      ? "🎨 Kỹ Thuật Mẫu .DST & Điều Độ"
                      : "🎨 .DST Digitizing & Dispatch"}
                  </option>
                  <option value="OPERATOR">
                    {vi ? "⚙ Tổ Đứng Máy & Kiểm Hàng QC" : "⚙ Machine Operators & QC"}
                  </option>
                </ModernSelect>

                {/* Language Toggle */}
                <button
                  type="button"
                  onClick={() => setLocale(vi ? "en" : "vi")}
                  className="tv-surface tv-border inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-[11px] font-bold tv-text transition cursor-pointer"
                  title={vi ? "Switch to English" : "Chuyển sang Tiếng Việt"}
                >
                  {vi ? "VI" : "EN"}
                </button>

                {/* Light / Dark Mode Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const target =
                      theme.mode === "dark"
                        ? THEME_PRESETS.find(
                            (p) => p.presetId === "atelier-daylight",
                          )!
                        : THEME_PRESETS[0];
                    handleThemeChange({
                      ...target,
                      layout: theme.layout,
                      radius: theme.radius,
                    });
                  }}
                  className="tv-surface tv-border inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs tv-text transition cursor-pointer"
                  title={
                    theme.mode === "dark"
                      ? vi
                        ? "Chuyển sang Chế Độ Sáng"
                        : "Switch to Light Mode"
                      : vi
                        ? "Chuyển sang Chế Độ Tối"
                        : "Switch to Dark Mode"
                  }
                >
                  {theme.mode === "dark" ? "☀" : "☾"}
                </button>

                {/* Theme Drawer Toggle */}
                <button
                  type="button"
                  onClick={() => setShowThemeDrawer((prev) => !prev)}
                  className={`inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition cursor-pointer ${
                    showThemeDrawer
                      ? "tv-accent-bg border-transparent font-bold"
                      : "tv-surface tv-border tv-text"
                  }`}
                  title={
                    vi
                      ? "Mở / Đóng bảng tùy chỉnh màu sắc & bố cục"
                      : "Toggle theme & layout customizer"
                  }
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border border-white/40"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <span className="hidden sm:inline">
                    {vi ? "Giao Diện" : "Theme"}
                  </span>
                </button>
              </div>

              {/* Primary Business Actions */}
              {canViewFinancials && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportOrdersCsv}
                    className="tv-surface-2 tv-border inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold tv-text transition cursor-pointer"
                    title={
                      vi
                        ? "Xuất báo cáo Excel (CSV) hoặc sao lưu dữ liệu (.JSON)"
                        : "Export spreadsheets (CSV) or full database backup (.JSON)"
                    }
                  >
                    <span aria-hidden="true" className="leading-none">⬇</span>
                    <span className="hidden sm:inline leading-none">
                      {vi ? "Xuất Dữ Liệu" : "Export"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openNewOrderModal()}
                    className="tv-accent-bg inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold shadow-xs transition cursor-pointer"
                  >
                    <span aria-hidden="true" className="text-sm leading-none">+</span>
                    <span className="leading-none">{vi ? "Tạo Lệnh SX" : "New Order"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Horizontal Tab Bar (Visible on Mobile/Tablet OR when Top Ribbon Layout is active) */}
          <div
            className={`mx-auto max-w-7xl border-t tv-border ${
              theme.layout === "sidebar" ? "lg:hidden" : ""
            }`}
          >
            <nav className="-mb-px flex gap-1 overflow-x-auto pt-1">
              {navItems.map((tab) => {
                const isActive = activeTab === tab.id;
                const href = tab.id === "overview" ? "/" : `/${tab.id}`;
                return (
                  <Link
                    key={tab.id}
                    href={href}
                    onClick={() => setFallbackTab(tab.id)}
                    className={`inline-flex items-center gap-2.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-xs transition cursor-pointer ${
                      isActive
                        ? "border-(--tv-accent) font-bold tv-accent-text"
                        : "border-transparent font-medium tv-text-muted hover:text-(--tv-text)"
                    }`}
                  >
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                      {renderNavIcon(tab.id)}
                    </span>
                    <span className="leading-snug">{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 py-1 text-center font-mono text-[10px] font-bold leading-none ${
                          tab.badgeAlert
                            ? "bg-rose-500/15 text-rose-400"
                            : isActive
                              ? "tv-accent-bg"
                              : "tv-surface-2 tv-text-muted"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6 space-y-6">
          <StudioViewsContext.Provider
            value={{
              overview: (
                <OverviewTab
                  vi={vi}
                  metrics={metrics}
                  machines={data.machines}
                  orders={data.orders}
                  inventory={data.inventory}
                  operatorByMachineId={operatorByMachineId}
                  statusLabels={STATUS_LABELS}
                  paymentLabels={PAYMENT_LABELS}
                  machineLabels={MACHINE_LABELS}
                  placementLabels={PLACEMENT_LABELS}
                  onSelectTab={handleSelectTab}
                  onLogMachineBatch={promptLogMachineBatch}
                  onOpenJobTicket={setActiveJobTicketOrder}
                  onAdvanceOrderStatus={promptAdvanceOrderStatus}
                  onRestockAllLow={promptRestockAllLow}
                  onAdjustStock={promptAdjustStock}
                />
              ),
              orders: (
                <WorkOrdersTab
                  vi={vi}
                  canViewFinancials={canViewFinancials}
                  filteredOrders={filteredOrders}
                  orderStatusFilter={orderStatusFilter}
                  ordersViewMode={ordersViewMode}
                  orderSearch={orderSearch}
                  designById={designById}
                  machineById={machineById}
                  statusLabels={STATUS_LABELS}
                  paymentLabels={PAYMENT_LABELS}
                  placementLabels={PLACEMENT_LABELS}
                  onChangeStatusFilter={setOrderStatusFilter}
                  onChangeViewMode={setOrdersViewMode}
                  onChangeSearch={setOrderSearch}
                  onOpenJobTicket={setActiveJobTicketOrder}
                  onEditOrder={openEditOrderModal}
                  onAdvanceOrderStatus={promptAdvanceOrderStatus}
                  onAdjustDefectCount={promptAdjustDefectCount}
                  onDeleteOrder={promptDeleteOrder}
                />
              ),
              designs: (
                <DesignsTab
                  vi={vi}
                  designs={data.designs}
                  onOpenNewDesignModal={openNewDesignModal}
                  onEditDesignModal={openEditDesignModal}
                  onDeleteDesign={promptDeleteDesign}
                  onOpenNewOrderModal={openNewOrderModal}
                  onQuickSaveParsedDst={promptQuickSaveParsedDst}
                  onShowToast={showToast}
                />
              ),
              machines: (
                <MachinesTab
                  vi={vi}
                  machines={data.machines}
                  orders={data.orders}
                  operatorByMachineId={operatorByMachineId}
                  machineLabels={MACHINE_LABELS}
                  onOpenAddMachineModal={() => setShowMachineModal(true)}
                  onMachineUpdate={promptMachineUpdate}
                  onLogMachineBatch={promptLogMachineBatch}
                  onOpenJobTicket={setActiveJobTicketOrder}
                />
              ),
              inventory: (
                <InventoryTab
                  vi={vi}
                  filteredInventory={filteredInventory}
                  inventoryCategoryFilter={inventoryCategoryFilter}
                  inventorySearch={inventorySearch}
                  lowStockItemsCount={metrics.lowStockItemsCount}
                  onSetInventoryCategoryFilter={setInventoryCategoryFilter}
                  onSetInventorySearch={setInventorySearch}
                  onRestockAllLow={() => void handleRestockAllLow()}
                  onOpenNewInventoryModal={openNewInventoryModal}
                  onOpenEditInventoryModal={openEditInventoryModal}
                  onDeleteInventory={promptDeleteInventory}
                  onAdjustStock={promptAdjustStock}
                />
              ),
              quote: (
                <QuoteEstimatorTab
                  vi={vi}
                  designs={data.designs}
                  quoteInput={quoteInput}
                  quoteBreakdown={quoteBreakdown}
                  quoteCompanyName={quoteCompanyName}
                  quoteGarmentName={quoteGarmentName}
                  onSetQuoteInput={setQuoteInput}
                  onSetQuoteCompanyName={setQuoteCompanyName}
                  onSetQuoteGarmentName={setQuoteGarmentName}
                  onConvertQuoteToOrder={promptConvertQuoteToOrder}
                />
              ),
              customers: (
                <CustomersTab
                  vi={vi}
                  filteredCustomers={filteredCustomers}
                  ordersCountByCustomerId={ordersCountByCustomerId}
                  customerSearch={customerSearch}
                  onSetCustomerSearch={setCustomerSearch}
                  onOpenNewCustomerModal={openNewCustomerModal}
                  onOpenEditCustomerModal={openEditCustomerModal}
                  onDeleteCustomer={promptDeleteCustomer}
                  onOpenNewOrderModal={openNewOrderModal}
                />
              ),
              employees: (
                <EmployeesPayrollTab
                  vi={vi}
                  employees={data.employees ?? INITIAL_EMPLOYEES}
                  filteredEmployees={filteredEmployees}
                  machines={data.machines}
                  machineById={machineById}
                  metrics={metrics}
                  employeePayrollSummary={employeePayrollSummary}
                  employeeRoleFilter={employeeRoleFilter}
                  employeeSearch={employeeSearch}
                  EMPLOYEE_ROLE_LABELS={EMPLOYEE_ROLE_LABELS}
                  EMPLOYEE_SHIFT_LABELS={EMPLOYEE_SHIFT_LABELS}
                  EMPLOYEE_STATUS_LABELS={EMPLOYEE_STATUS_LABELS}
                  SALARY_STATUS_LABELS={SALARY_STATUS_LABELS}
                  onSetEmployeeRoleFilter={setEmployeeRoleFilter}
                  onSetEmployeeSearch={setEmployeeSearch}
                  onExportPayrollCsv={handleExportPayrollCsv}
                  onOpenNewEmployeeModal={openNewEmployeeModal}
                  onOpenEditEmployeeModal={openEditEmployeeModal}
                  onDeleteEmployee={promptDeleteEmployee}
                  onQuickUpdateEmployee={promptQuickUpdateEmployee}
                  onOpenPayslipModal={setActivePayslipEmployee}
                  onPayAllUnpaidPayroll={() => void handlePayAllUnpaidPayroll()}
                />
              ),
            }}
          >
            {children ?? <StudioRouteView tab={activeTab} />}
          </StudioViewsContext.Provider>
        </main>
      </div>

      {/* ================= THEME CUSTOMIZER DRAWER ================= */}
      {showThemeDrawer && (
        <ThemeCustomizer
          theme={theme}
          locale={locale}
          onChange={handleThemeChange}
          onClose={() => setShowThemeDrawer(false)}
        />
      )}

      {/* ================= PRINTABLE JOB SHEET, PROOF & VAT INVOICE MODAL ================= */}
      {activeJobTicketOrder && (
        <JobTicketModal
          order={activeJobTicketOrder}
          locale={locale}
          canViewFinancials={canViewFinancials}
          design={designById.get(activeJobTicketOrder.designId)}
          machine={
            activeJobTicketOrder.assignedMachineId
              ? machineById.get(activeJobTicketOrder.assignedMachineId)
              : undefined
          }
          onClose={() => setActiveJobTicketOrder(null)}
          onRecordPayment={promptRecordPayment}
          onApproveProofToProduction={promptApproveProofToProduction}
          onAdjustDefectCount={promptAdjustDefectCount}
        />
      )}

      {/* ================= PRINTABLE INDIVIDUAL STAFF PAYSLIP MODAL ================= */}
      {activePayslipEmployee && (
        <PayslipModal
          vi={vi}
          employee={activePayslipEmployee}
          breakdown={
            employeePayrollSummary.breakdownById.get(activePayslipEmployee.id) ??
            calculateEmployeeCostBreakdown(activePayslipEmployee)
          }
          assignedMachine={
            activePayslipEmployee.assignedMachineId
              ? machineById.get(activePayslipEmployee.assignedMachineId)
              : undefined
          }
          roleLabels={EMPLOYEE_ROLE_LABELS}
          shiftLabels={EMPLOYEE_SHIFT_LABELS}
          salaryStatusLabels={SALARY_STATUS_LABELS}
          onClose={() => setActivePayslipEmployee(null)}
          onPayFullBalance={(emp, totalCost) => {
            promptQuickUpdateEmployee(
              emp,
              {
                amountPaidMonth: totalCost,
                paymentStatus: "PAID",
              },
              vi
                ? `Đã quyết toán thực lĩnh cho ${emp.name}`
                : `Settled net payable salary for ${emp.name}`,
            );
          }}
        />
      )}

      {/* ================= GLOBAL YES/NO CONFIRMATION MODAL FOR QUICK ACTIONS ================= */}
      {pendingConfirmAction && (
        <ConfirmActionModal
          vi={vi}
          action={pendingConfirmAction}
          onCancel={() => setPendingConfirmAction(null)}
        />
      )}

      {/* ================= EXPORT / DOWNLOAD OPTIONS MODAL ================= */}
      {exportModalConfig && (
        <ExportCenterModal
          vi={vi}
          initialDataset={exportModalConfig.dataset}
          initialFormat={exportModalConfig.format}
          data={data}
          filteredOrders={filteredOrders}
          filteredInventory={filteredInventory}
          filteredCustomers={filteredCustomers}
          filteredEmployees={filteredEmployees}
          breakdownById={employeePayrollSummary.breakdownById}
          ordersCountByCustomerId={ordersCountByCustomerId}
          onClose={() => setExportModalConfig(null)}
          onShowToast={showToast}
        />
      )}

      {/* ================= CRUD MODALS ================= */}
      <StudioModals
        vi={vi}
        customers={data.customers}
        designs={data.designs}
        machines={data.machines}
        PLACEMENT_LABELS={PLACEMENT_LABELS}
        PAYMENT_LABELS={PAYMENT_LABELS}
        EMPLOYEE_ROLE_LABELS={EMPLOYEE_ROLE_LABELS}
        EMPLOYEE_SHIFT_LABELS={EMPLOYEE_SHIFT_LABELS}
        EMPLOYEE_STATUS_LABELS={EMPLOYEE_STATUS_LABELS}
        SALARY_STATUS_LABELS={SALARY_STATUS_LABELS}
        showOrderModal={showOrderModal}
        editingOrderId={editingOrderId}
        orderForm={orderForm}
        onSetOrderForm={setOrderForm}
        onCloseOrderModal={() => setShowOrderModal(false)}
        onSaveOrder={(e) => void handleSaveOrder(e)}
        showDesignModal={showDesignModal}
        editingDesignId={editingDesignId}
        designForm={designForm}
        onSetDesignForm={setDesignForm}
        onCloseDesignModal={() => setShowDesignModal(false)}
        onSaveDesign={(e) => void handleSaveDesign(e)}
        showMachineModal={showMachineModal}
        machineForm={machineForm}
        onSetMachineForm={setMachineForm}
        onCloseMachineModal={() => setShowMachineModal(false)}
        onCreateMachine={(e) => void handleCreateMachine(e)}
        showInventoryModal={showInventoryModal}
        editingInventoryId={editingInventoryId}
        inventoryForm={inventoryForm}
        onSetInventoryForm={setInventoryForm}
        onCloseInventoryModal={() => setShowInventoryModal(false)}
        onSaveInventory={(e) => void handleSaveInventory(e)}
        showCustomerModal={showCustomerModal}
        editingCustomerId={editingCustomerId}
        customerForm={customerForm}
        onSetCustomerForm={setCustomerForm}
        onCloseCustomerModal={() => setShowCustomerModal(false)}
        onSaveCustomer={(e) => void handleSaveCustomer(e)}
        showEmployeeModal={showEmployeeModal}
        editingEmployeeId={editingEmployeeId}
        employeeForm={employeeForm}
        onSetEmployeeForm={setEmployeeForm}
        onCloseEmployeeModal={() => setShowEmployeeModal(false)}
        onSaveEmployee={(e) => void handleSaveEmployee(e)}
      />
    </div>
  );
}
