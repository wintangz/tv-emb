"use client";

import { useSyncExternalStore } from "react";
import type {
  EmployeeRole,
  EmployeeShift,
  EmployeeStatus,
  GarmentPlacement,
  MachineStatus,
  OrderStatus,
  PaymentStatus,
  SalaryPaymentStatus,
} from "./types";

export type StudioLocale = "vi" | "en";

const LANG_STORAGE_KEY = "tuong_vinh_lang_v1";
let currentLocaleSnapshot: StudioLocale = "vi";
let initializedLang = false;
const langListeners = new Set<() => void>();

function getLangSnapshot(): StudioLocale {
  if (typeof window !== "undefined" && !initializedLang) {
    initializedLang = true;
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === "vi" || saved === "en") {
        currentLocaleSnapshot = saved;
      }
    } catch {
      // ignore
    }
  }
  return currentLocaleSnapshot;
}

function getServerLangSnapshot(): StudioLocale {
  return "vi";
}

function subscribeLang(listener: () => void): () => void {
  langListeners.add(listener);
  return () => {
    langListeners.delete(listener);
  };
}

export function setStudioLocale(next: StudioLocale): void {
  currentLocaleSnapshot = next;
  initializedLang = true;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }
  for (const listener of langListeners) {
    listener();
  }
}

export function useStudioLanguage(): [
  StudioLocale,
  (next: StudioLocale) => void,
] {
  const locale = useSyncExternalStore(
    subscribeLang,
    getLangSnapshot,
    getServerLangSnapshot,
  );
  return [locale, setStudioLocale];
}

export const ORDER_STATUS_TEXT: Record<
  StudioLocale,
  Record<OrderStatus, string>
> = {
  vi: {
    QUOTE: "Báo Giá",
    DIGITIZING: "Thiết Kế Mẫu",
    APPROVAL_PENDING: "Chờ Duyệt Mẫu",
    IN_PRODUCTION: "Đang Chạy Máy",
    QUALITY_CHECK: "Cắt Chỉ & QC",
    COMPLETED: "Chờ Giao Hàng",
    DELIVERED: "Đã Giao",
  },
  en: {
    QUOTE: "Quote",
    DIGITIZING: "Digitizing",
    APPROVAL_PENDING: "Sample Approval",
    IN_PRODUCTION: "On Machine",
    QUALITY_CHECK: "Trim & QC",
    COMPLETED: "Ready for Pickup",
    DELIVERED: "Delivered",
  },
};

export const PAYMENT_STATUS_TEXT: Record<
  StudioLocale,
  Record<PaymentStatus, string>
> = {
  vi: {
    UNPAID: "Chưa Thanh Toán",
    DEPOSIT_PAID: "Đã Cọc 50%",
    PAID: "Đã Thanh Toán Đủ",
  },
  en: {
    UNPAID: "Unpaid",
    DEPOSIT_PAID: "50% Deposit Paid",
    PAID: "Paid in Full",
  },
};

export const MACHINE_STATUS_TEXT: Record<
  StudioLocale,
  Record<MachineStatus, string>
> = {
  vi: {
    RUNNING: "ĐANG CHẠY",
    SETUP: "LÊN KHUNG / CÀI MẪU",
    IDLE: "CHỜ LỆNH",
    MAINTENANCE: "BẢO TRÌ",
  },
  en: {
    RUNNING: "RUNNING",
    SETUP: "SETUP",
    IDLE: "IDLE",
    MAINTENANCE: "MAINTENANCE",
  },
};

export const PLACEMENT_TEXT: Record<
  StudioLocale,
  Record<GarmentPlacement, string>
> = {
  vi: {
    "Left Chest": "Ngực Trái",
    "Right Chest": "Ngực Phải",
    "Cap Front": "Mặt Trước Nón",
    "Cap Side": "Hông Nón",
    "Full Back": "Lưng Áo",
    "Jacket Back": "Sau Lưng Áo Khoác",
    "Left Sleeve": "Tay Áo Trái",
    "Right Sleeve": "Tay Áo Phải",
    "Custom Patch": "Logo Rời / Con Giống",
  },
  en: {
    "Left Chest": "Left Chest",
    "Right Chest": "Right Chest",
    "Cap Front": "Cap Front",
    "Cap Side": "Cap Side",
    "Full Back": "Full Back",
    "Jacket Back": "Jacket Back",
    "Left Sleeve": "Left Sleeve",
    "Right Sleeve": "Right Sleeve",
    "Custom Patch": "Custom Patch",
  },
};

export const EMPLOYEE_ROLE_TEXT: Record<
  StudioLocale,
  Record<EmployeeRole, string>
> = {
  vi: {
    "Machine Operator": "Thợ Vận Hành Máy Thêu",
    Digitizer: "Kỹ Thuật Thiết Kế Mẫu (Digitizer)",
    "Trimming & QC": "Cắt Chỉ, Ủi & Kiểm Hàng QC",
    "Shop Supervisor": "Quản Đốc Xưởng",
    "Sales & Coordinator": "Điều Đơn & Kinh Doanh",
  },
  en: {
    "Machine Operator": "Machine Operator",
    Digitizer: "Digitizer",
    "Trimming & QC": "Trimming & QC",
    "Shop Supervisor": "Shop Supervisor",
    "Sales & Coordinator": "Sales & Coordinator",
  },
};

export const EMPLOYEE_SHIFT_TEXT: Record<
  StudioLocale,
  Record<EmployeeShift, string>
> = {
  vi: {
    Morning: "Ca Sáng (06:00–14:00)",
    Afternoon: "Ca Chiều (14:00–22:00)",
    "Full-Day": "Hành Chính (08:00–17:30)",
  },
  en: {
    Morning: "Morning Shift",
    Afternoon: "Afternoon Shift",
    "Full-Day": "Full-Day Shift",
  },
};

export const EMPLOYEE_STATUS_TEXT: Record<
  StudioLocale,
  Record<EmployeeStatus, string>
> = {
  vi: {
    ACTIVE: "Đang Làm Việc",
    ON_LEAVE: "Nghỉ Phép",
    OFF_SHIFT: "Hết Ca",
  },
  en: {
    ACTIVE: "Active on Floor",
    ON_LEAVE: "On Leave",
    OFF_SHIFT: "Off Shift",
  },
};

export const SALARY_STATUS_TEXT: Record<
  StudioLocale,
  Record<SalaryPaymentStatus, string>
> = {
  vi: {
    UNPAID: "Chưa Chi Lương",
    PARTIAL_ADVANCE: "Đã Ứng Lương",
    PAID: "Đã Tất Toán",
  },
  en: {
    UNPAID: "Unpaid",
    PARTIAL_ADVANCE: "Advance Paid",
    PAID: "Paid in Full",
  },
};

