"use client";

import React, { useEffect, useMemo, useState } from "react";
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const STORAGE_KEY = "tuong_vinh_embroidery_erp_v2_vnd";

function downloadCsv(filename: string, rows: string[][]) {
  const csvContent = rows
    .map((r) =>
      r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EmbroideryStudio() {
  const [data, setData] = useState<DashboardPayload>(() =>
    getInitialDashboardPayload(),
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
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

  const canViewFinancials = studioRole === "ADMIN" || studioRole === "SALES";

  function handleSelectTab(nextTab: ActiveTab) {
    setActiveTab(nextTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", nextTab);
      window.history.pushState({ tab: nextTab }, "", url.toString());
    }
  }

  // Sync initial tab from URL (?tab=...) and support browser Back/Forward buttons
  useEffect(() => {
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
    const readTabFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab") as ActiveTab | null;
      if (t && validTabs.includes(t)) {
        setActiveTab(t);
      }
    };
    readTabFromUrl();
    window.addEventListener("popstate", readTabFromUrl);
    return () => window.removeEventListener("popstate", readTabFromUrl);
  }, []);

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
    name: "Line 5 — Tajima 4-Head",
    brand: "Tajima",
    model: "TMBP-S1504C",
    heads: 4,
    needlesPerHead: 15,
    maxSpm: 1100,
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
    shift: "Morning",
    status: "ACTIVE",
    phone: "",
    assignedMachineId: "mach-1",
    payType: "Hourly",
    hourlyRate: 45000,
    monthlyBaseSalary: 9500000,
    hoursWorkedMonth: 160,
    overtimeHoursMonth: 8,
    stitchesCompletedMonth: 850000,
    stitchBonusPer10k: 2500,
    allowanceAndBonus: 700000,
    salaryPaymentStatus: "UNPAID",
    amountPaidMonth: 0,
    notes: "",
  });

  // Quote Calculator State
  const [quoteInput, setQuoteInput] = useState<QuoteInput>({
    quantity: 48,
    stitchCount: 8500,
    colorCount: 4,
    garmentBlankCost: 95000,
    garmentMarkupPercent: 45,
    needsDigitizing: true,
    is3DPuff: false,
    rushOrder: false,
  });
  const [quoteGarmentName, setQuoteGarmentName] = useState(
    "Port Authority K500 Silk Touch Polo",
  );
  const [quoteCompanyName, setQuoteCompanyName] = useState(
    "Saigon Heritage Hospitality Group",
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
        const normalized: DashboardPayload = isLegacyUsd
          ? getInitialDashboardPayload()
          : {
              ...payload,
              employees: payload.employees?.length
                ? payload.employees
                : INITIAL_EMPLOYEES,
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
      shift: "Morning",
      status: "ACTIVE",
      phone: "",
      assignedMachineId: "mach-1",
      payType: "Hourly",
      hourlyRate: 45000,
      monthlyBaseSalary: 9500000,
      hoursWorkedMonth: 160,
      overtimeHoursMonth: 8,
      stitchesCompletedMonth: 850000,
      stitchBonusPer10k: 2500,
      allowanceAndBonus: 700000,
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

  async function handleSaveOrder(e: React.FormEvent) {
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

  async function handleSaveDesign(e: React.FormEvent) {
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

  async function handleCreateMachine(e: React.FormEvent) {
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

  async function handleSaveInventory(e: React.FormEvent) {
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

  async function handleSaveCustomer(e: React.FormEvent) {
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

  async function handleSaveEmployee(e: React.FormEvent) {
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
    const list = data.employees ?? INITIAL_EMPLOYEES;
    const rows: string[][] = [
      [
        "Staff Code",
        "Full Name",
        "Role",
        "Shift",
        "Status",
        "Pay Type",
        "Hourly Rate (VND)",
        "Base Salary (VND)",
        "Hours Worked",
        "Overtime Hours",
        "Stitches Completed",
        "Base Pay (VND)",
        "Overtime Pay (VND)",
        "Stitch Bonus (VND)",
        "Allowance (VND)",
        "Total Monthly Cost (VND)",
        "Amount Paid (VND)",
        "Balance Due (VND)",
        "Payment Status",
      ],
      ...list.map((emp) => {
        const b =
          employeePayrollSummary.breakdownById.get(emp.id) ??
          calculateEmployeeCostBreakdown(emp);
        return [
          emp.code,
          emp.name,
          emp.role,
          emp.shift,
          emp.status,
          emp.payType,
          String(emp.hourlyRate),
          String(emp.monthlyBaseSalary),
          String(emp.hoursWorkedMonth),
          String(emp.overtimeHoursMonth),
          String(emp.stitchesCompletedMonth),
          String(b.basePay),
          String(b.overtimePay),
          String(b.stitchBonus),
          String(b.allowance),
          String(b.totalCost),
          String(emp.amountPaidMonth),
          String(b.balanceDue),
          emp.paymentStatus,
        ];
      }),
    ];
    downloadCsv("tuong-vinh-embroidery-payroll.csv", rows);
    showToast(
      vi
        ? "Đã xuất Bảng Lương & Chi Phí Nhân Công (CSV)"
        : "Exported Staff Payroll & Labor Costs CSV",
    );
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

  function handleExportDatabaseJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tuong-vinh-embroidery-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(
      vi
        ? "Đã tải file Sao Lưu Dữ Liệu Xưởng (.JSON)"
        : "Downloaded Full Studio Database Backup (.JSON)",
    );
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
      digitizingFee: quoteBreakdown.digitizingFee,
      unitPrice: quoteBreakdown.finalUnitPrice,
      totalPrice: quoteBreakdown.totalPrice,
      notes: `Generated from Quote Estimator (${quoteBreakdown.estimatedProductionHours}h est. runtime).`,
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
    const rows: string[][] = [
      [
        "Order Number",
        "Company",
        "Contact",
        "Garment",
        "Color",
        "Placement",
        "Quantity",
        "Completed",
        "Stitches/pc",
        "Status",
        "Payment Status",
        "Amount Paid",
        "Total Price",
        "Due Date",
      ],
      ...data.orders.map((o) => [
        o.orderNumber,
        o.companyName,
        o.customerName,
        o.garmentType,
        o.garmentColor,
        o.placement,
        String(o.quantity),
        String(o.completedQuantity),
        String(o.stitchCount),
        o.status,
        o.paymentStatus ?? "UNPAID",
        String(o.amountPaid ?? 0),
        String(o.totalPrice),
        o.dueDate,
      ]),
    ];
    downloadCsv("tuong-vinh-embroidery-orders.csv", rows);
    showToast(
      vi ? "Đã xuất file CSV Lệnh Sản Xuất" : "Exported Work Orders CSV",
    );
  }

  const allNavItems: {
    id: ActiveTab;
    label: string;
    badge?: string;
    icon: string;
  }[] = [
    {
      id: "overview",
      label: vi ? "Tổng Quan Xưởng" : "Studio Overview",
      icon: "◈",
    },
    {
      id: "orders",
      label: vi ? "Lệnh Sản Xuất" : "Work Orders",
      badge: String(data.orders.length),
      icon: "❖",
    },
    {
      id: "designs",
      label: vi ? "Thư Viện Mẫu Thêu" : "Digitizing Library",
      badge: String(data.designs.length),
      icon: "◎",
    },
    {
      id: "machines",
      label: vi ? "Dàn Máy Thêu" : "Machine Telemetry",
      badge: `${metrics.runningMachinesCount}/${metrics.totalMachinesCount}`,
      icon: "⚙",
    },
    {
      id: "inventory",
      label: vi ? "Kho Chỉ & Keo Lót" : "Thread & Backing",
      badge:
        metrics.lowStockItemsCount > 0
          ? vi
            ? `${metrics.lowStockItemsCount} Sắp Hết`
            : `${metrics.lowStockItemsCount} Low`
          : "OK",
      icon: "⌇",
    },
    {
      id: "quote",
      label: vi ? "Tính Giá Thêu" : "Quote Estimator",
      icon: "∑",
    },
    {
      id: "customers",
      label: vi ? "Khách Hàng & Đối Tác" : "Client Accounts",
      badge: String(data.customers.length),
      icon: "✦",
    },
    {
      id: "employees",
      label: vi ? "Nhân Sự & Lương" : "Staff & Payroll",
      badge: String((data.employees ?? INITIAL_EMPLOYEES).length),
      icon: "♟",
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

  const activeTabIndex = Math.max(
    0,
    navItems.findIndex((n) => n.id === activeTab),
  );

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

      {/* ================= LEFT STUDIO SIDEBAR (FIXED 256px × 100dvh) ================= */}
      {theme.layout === "sidebar" && (
        <aside className="tv-surface tv-border hidden w-64 min-w-[16rem] max-w-[16rem] shrink-0 flex-col justify-between border-r p-4 lg:flex lg:h-dvh overflow-hidden print:hidden">
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Brand Identity (Fixed Height) */}
            <div className="flex shrink-0 items-center gap-3 px-2 pt-1 pb-5 border-b tv-border">
              <div className="tv-accent-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black shadow-md">
                TV
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-extrabold tracking-tight">
                  {vi ? "Thêu Tường Vinh" : "Tuong Vinh"}
                </h1>
                <p className="tv-accent-text truncate text-[10px] font-bold uppercase tracking-widest">
                  {vi ? "Quản Lý Xưởng Thêu" : "Embroidery ERP"}
                </p>
              </div>
            </div>

            {/* Navigation Links (Independent Scroll if needed, Fixed Button Size) */}
            <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-0.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex h-10 w-full items-center justify-between gap-2 rounded-xl px-3 text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? "tv-accent-bg font-bold shadow-sm"
                        : "tv-text-muted hover:opacity-100 hover:bg-white/5"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="w-4 shrink-0 text-center text-sm leading-none">
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge && (
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                          isActive
                            ? "bg-black/20 text-inherit"
                            : "tv-surface-2 tv-text-muted"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom: Language, Theme Quick Switcher & Connection (Pinned Bottom) */}
          <div className="shrink-0 space-y-2.5 border-t tv-border pt-3.5">
            <div className="tv-surface-2 tv-border grid grid-cols-2 gap-1 rounded-xl border p-1 text-xs font-bold">
              <button
                onClick={() => setLocale("vi")}
                className={`rounded-lg py-1.5 transition cursor-pointer ${
                  vi ? "tv-accent-bg shadow-xs" : "tv-text-muted"
                }`}
              >
                🇻🇳 Tiếng Việt
              </button>
              <button
                onClick={() => setLocale("en")}
                className={`rounded-lg py-1.5 transition cursor-pointer ${
                  !vi ? "tv-accent-bg shadow-xs" : "tv-text-muted"
                }`}
              >
                🇺🇸 English
              </button>
            </div>

            <button
              onClick={() => setShowThemeDrawer(true)}
              className="tv-surface-2 tv-border flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:opacity-90 cursor-pointer"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/30"
                  style={{ backgroundColor: theme.accent }}
                />
                <span className="truncate">
                  {vi ? "Giao diện:" : "Theme:"} {theme.name}
                </span>
              </span>
              <span className="tv-accent-text shrink-0 text-[10px] font-bold">
                {vi ? "Tùy chỉnh" : "Customize"}
              </span>
            </button>

            <div className="tv-surface-2 tv-border flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[11px]">
              <span className="flex min-w-0 items-center gap-2 tv-text-muted truncate">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    backendConnected ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span className="truncate">
                  {backendConnected
                    ? vi
                      ? "Đã kết nối API (:3001)"
                      : "API Synced (:3001)"
                    : vi
                      ? "Chế độ Lưu Cục Bộ"
                      : "Local Sync Active"}
                </span>
              </span>
              <button
                onClick={handleResetDemo}
                className="tv-text-muted shrink-0 hover:underline cursor-pointer"
                title={vi ? "Khôi phục dữ liệu mẫu" : "Reset demo data"}
              >
                {vi ? "Khôi phục" : "Reset"}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ================= MAIN WORKSPACE AREA (INDEPENDENT SCROLL) ================= */}
      <div className="flex min-w-0 flex-1 flex-col lg:h-dvh lg:overflow-y-auto print:h-auto print:overflow-visible">
        {/* Top Command Header */}
        <header className="tv-surface tv-border sticky top-0 z-30 border-b px-6 py-3 print:hidden">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight truncate">
                  {navItems.find((n) => n.id === activeTab)?.label ??
                    "Tuong Vinh Embroidery"}
                </h2>
                <span className="tv-surface-2 tv-border tv-accent-text rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold">
                  {vi ? "Trang" : "Page"} {activeTabIndex + 1}/{navItems.length}{" "}
                  • /?tab={activeTab}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={activeTabIndex <= 0}
                    onClick={() => {
                      const prev = navItems[activeTabIndex - 1];
                      if (prev) handleSelectTab(prev.id);
                    }}
                    className={`tv-surface-2 tv-border rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${
                      activeTabIndex <= 0
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:opacity-85 cursor-pointer"
                    }`}
                    title={vi ? "Trang phân hệ trước" : "Previous module page"}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    disabled={activeTabIndex >= navItems.length - 1}
                    onClick={() => {
                      const next = navItems[activeTabIndex + 1];
                      if (next) handleSelectTab(next.id);
                    }}
                    className={`tv-surface-2 tv-border rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${
                      activeTabIndex >= navItems.length - 1
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:opacity-85 cursor-pointer"
                    }`}
                    title={vi ? "Trang phân hệ tiếp theo" : "Next module page"}
                  >
                    ›
                  </button>
                </div>
              </div>
              <p className="tv-text-muted text-xs truncate">
                {vi
                  ? `${metrics.runningMachinesCount}/${metrics.totalMachinesCount} dàn máy đang chạy • ${metrics.totalQueuedStitches.toLocaleString()} mũi thêu đang chờ sản xuất`
                  : `${metrics.runningMachinesCount} of ${metrics.totalMachinesCount} embroidery lines running • ${metrics.totalQueuedStitches.toLocaleString()} stitches queued`}
              </p>
            </div>

            {/* Right Quick Actions, Role Switcher & Theme Button */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="tv-surface-2 tv-border flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs">
                <span className="tv-text-muted text-[10px] font-bold uppercase">
                  {vi ? "Vai trò:" : "Role:"}
                </span>
                <select
                  value={studioRole}
                  onChange={(e) =>
                    handleSelectStudioRole(e.target.value as StudioRole)
                  }
                  className="bg-transparent font-extrabold tv-accent-text outline-hidden cursor-pointer"
                  title={
                    vi
                      ? "Chuyển đổi phân quyền giao diện xưởng"
                      : "Switch workshop role & permissions"
                  }
                >
                  <option value="ADMIN" className="bg-slate-900 text-white">
                    {vi ? "👑 Chủ Xưởng (Full)" : "👑 Owner / Admin"}
                  </option>
                  <option value="SALES" className="bg-slate-900 text-white">
                    {vi ? "💼 Kinh Doanh & Báo Giá" : "💼 Sales & Quotes"}
                  </option>
                  <option value="DIGITIZER" className="bg-slate-900 text-white">
                    {vi ? "🎨 Kỹ Thuật Mẫu .DST" : "🎨 Digitizer (.DST)"}
                  </option>
                  <option value="OPERATOR" className="bg-slate-900 text-white">
                    {vi ? "⚙ Thợ Đứng Máy (Kiosk)" : "⚙ Shop-Floor Kiosk"}
                  </option>
                </select>
              </div>

              <button
                onClick={() => setLocale(vi ? "en" : "vi")}
                className="tv-input flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold cursor-pointer hover:opacity-85"
                title={vi ? "Switch to English" : "Chuyển sang Tiếng Việt"}
              >
                <span>{vi ? "🇻🇳 VI" : "🇺🇸 EN"}</span>
              </button>

              <button
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
                className="tv-input px-2.5 py-1.5 text-xs font-semibold cursor-pointer hover:opacity-85"
                title={
                  vi ? "Đổi chế độ Sáng / Tối" : "Toggle Light / Dark Mode"
                }
              >
                {theme.mode === "dark"
                  ? vi
                    ? "☀ Sáng"
                    : "☀ Light"
                  : vi
                    ? "☾ Tối"
                    : "☾ Dark"}
              </button>

              <button
                onClick={() => setShowThemeDrawer(true)}
                className="tv-input flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold cursor-pointer hover:opacity-85"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: theme.accent }}
                />
                <span>🎨 {vi ? "Giao Diện" : "Theme"}</span>
              </button>

              {canViewFinancials && (
                <>
                  <button
                    onClick={handleExportOrdersCsv}
                    className="tv-input px-2.5 py-1.5 text-xs font-semibold cursor-pointer hover:opacity-85"
                  >
                    ⬇ CSV
                  </button>

                  <button
                    onClick={handleExportDatabaseJson}
                    className="tv-input px-2.5 py-1.5 text-xs font-semibold cursor-pointer hover:opacity-85"
                    title={
                      vi
                        ? "Sao lưu toàn bộ dữ liệu xưởng ra file .JSON"
                        : "Download full studio database backup (.JSON)"
                    }
                  >
                    💾 JSON
                  </button>

                  <button
                    onClick={() => openNewOrderModal()}
                    className="tv-accent-bg rounded-xl px-3.5 py-1.5 text-xs font-extrabold shadow-md transition hover:opacity-90 cursor-pointer"
                  >
                    + {vi ? "Tạo Lệnh SX" : "New Order"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile / Top Ribbon Navigation Bar */}
          <div
            className={`mx-auto max-w-7xl pt-3 ${
              theme.layout === "sidebar" ? "lg:hidden" : ""
            }`}
          >
            <nav className="flex gap-1.5 overflow-x-auto pb-1">
              {navItems.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectTab(tab.id)}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? "tv-accent-bg font-bold"
                        : "tv-surface-2 tv-text-muted"
                    }`}
                  >
                    {tab.icon} {tab.label} {tab.badge ? `(${tab.badge})` : ""}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6 space-y-6">
          {activeTab === "overview" && (
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
              onLogMachineBatch={(machine) =>
                void handleLogMachineBatch(machine)
              }
              onOpenJobTicket={setActiveJobTicketOrder}
              onAdvanceOrderStatus={(order) =>
                void handleAdvanceOrderStatus(order)
              }
              onRestockAllLow={() => void handleRestockAllLow()}
              onAdjustStock={(itemId, delta) =>
                void handleAdjustStock(itemId, delta)
              }
            />
          )}

          {activeTab === "orders" && (
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
              onAdvanceOrderStatus={(order) =>
                void handleAdvanceOrderStatus(order)
              }
              onAdjustDefectCount={(order, delta) =>
                void handleAdjustDefectCount(order, delta)
              }
              onDeleteOrder={(id, orderNumber) =>
                void handleDeleteOrder(id, orderNumber)
              }
            />
          )}

          {activeTab === "designs" && (
            <DesignsTab
              vi={vi}
              designs={data.designs}
              onOpenNewDesignModal={openNewDesignModal}
              onEditDesignModal={openEditDesignModal}
              onDeleteDesign={(id, code) => void handleDeleteDesign(id, code)}
              onOpenNewOrderModal={openNewOrderModal}
              onQuickSaveParsedDst={handleQuickSaveParsedDst}
              onShowToast={showToast}
            />
          )}

          {activeTab === "machines" && (
            <MachinesTab
              vi={vi}
              machines={data.machines}
              orders={data.orders}
              operatorByMachineId={operatorByMachineId}
              machineLabels={MACHINE_LABELS}
              onOpenAddMachineModal={() => setShowMachineModal(true)}
              onMachineUpdate={(machineId, patch) =>
                void handleMachineUpdate(machineId, patch)
              }
              onLogMachineBatch={(machine) =>
                void handleLogMachineBatch(machine)
              }
              onOpenJobTicket={setActiveJobTicketOrder}
            />
          )}

          {activeTab === "inventory" && (
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
              onDeleteInventory={(id, name) =>
                void handleDeleteInventory(id, name)
              }
              onAdjustStock={(itemId, delta) =>
                void handleAdjustStock(itemId, delta)
              }
            />
          )}

          {activeTab === "quote" && (
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
              onConvertQuoteToOrder={() => void handleConvertQuoteToOrder()}
            />
          )}

          {activeTab === "customers" && (
            <CustomersTab
              vi={vi}
              filteredCustomers={filteredCustomers}
              ordersCountByCustomerId={ordersCountByCustomerId}
              customerSearch={customerSearch}
              onSetCustomerSearch={setCustomerSearch}
              onOpenNewCustomerModal={openNewCustomerModal}
              onOpenEditCustomerModal={openEditCustomerModal}
              onDeleteCustomer={(id, company) =>
                void handleDeleteCustomer(id, company)
              }
              onOpenNewOrderModal={openNewOrderModal}
            />
          )}

          {activeTab === "employees" && (
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
              onDeleteEmployee={(id, name) =>
                void handleDeleteEmployee(id, name)
              }
              onQuickUpdateEmployee={(emp, patch, msg) =>
                void handleQuickUpdateEmployee(emp, patch, msg)
              }
              onOpenPayslipModal={setActivePayslipEmployee}
              onPayAllUnpaidPayroll={() => void handlePayAllUnpaidPayroll()}
            />
          )}
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
          onRecordPayment={handleRecordPayment}
          onApproveProofToProduction={(order) =>
            void handleApproveProofToProduction(order)
          }
          onAdjustDefectCount={(order, delta) =>
            void handleAdjustDefectCount(order, delta)
          }
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
            void handleQuickUpdateEmployee(
              emp,
              {
                amountPaidMonth: totalCost,
                paymentStatus: "PAID",
              },
              vi
                ? `Đã tất toán lương cho ${emp.name}`
                : `Settled full salary for ${emp.name}`,
            );
            setActivePayslipEmployee((prev) =>
              prev
                ? {
                    ...prev,
                    amountPaidMonth: totalCost,
                    paymentStatus: "PAID",
                  }
                : null,
            );
          }}
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
