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
    QUOTE: "Báo Giá & Nhận Mẫu",
    DIGITIZING: "Thiết Kế Mẫu .DST & Thêu Mẫu Thử (0₫)",
    APPROVAL_PENDING: "Duyệt Mẫu • Đặt Chỉ & Chờ Hàng Cắt",
    IN_PRODUCTION: "Đang Lên Hàng & Chạy Máy",
    QUALITY_CHECK: "Kiểm Hàng (QC) & Cắt Chỉ",
    COMPLETED: "Hoàn Thành • Chờ Điều Phối Xe Giao",
    DELIVERED: "Đã Giao Hàng",
  },
  en: {
    QUOTE: "Quote & Intake",
    DIGITIZING: "Digitizing .DST & Free Sample",
    APPROVAL_PENDING: "Approved • Order Thread & Await Cut Panels",
    IN_PRODUCTION: "Running on 20-Head Tajima",
    QUALITY_CHECK: "QC Inspection & Trimming",
    COMPLETED: "Completed • Ready for Dispatch",
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
    "Machine Operator": "Thợ Đứng Máy (Lương CB 9tr/tháng)",
    "Trimming & QC": "Kiểm Hàng QC (Lương CB 8–8.5tr/tháng)",
    "Errands & Delivery": "Nhân Viên Giao Nhận & Hỗ Trợ Xưởng",
    Digitizer: "Kỹ Thuật Viên Thiết Kế Mẫu (.DST)",
    "Shop Supervisor": "Tổ Trưởng Điều Độ Sản Xuất",
    "Sales & Coordinator": "Quản Lý Đơn Hàng & Định Mức Vật Tư",
  },
  en: {
    "Machine Operator": "Machine Operator (9M VND/mo base)",
    "Trimming & QC": "Quality Control / QC (8–8.5M VND/mo base)",
    "Errands & Delivery": "Logistics & Workshop Support",
    Digitizer: ".DST Embroidery Digitizer",
    "Shop Supervisor": "Production Floor Supervisor",
    "Sales & Coordinator": "Order & Material Norm Coordinator",
  },
};

export const EMPLOYEE_SHIFT_TEXT: Record<
  StudioLocale,
  Record<EmployeeShift, string>
> = {
  vi: {
    Morning: "Ca Ngày 10.5h (07:00–18:30, nghỉ trưa 1h)",
    Afternoon: "Ca Ngày 10.5h (07:00–18:30, nghỉ trưa 1h)",
    "Full-Day": "Ca Ngày 10.5h (07:00–18:30, nghỉ trưa 1h)",
  },
  en: {
    Morning: "10.5h Day Shift (07:00–18:30, 1h lunch)",
    Afternoon: "10.5h Day Shift (07:00–18:30, 1h lunch)",
    "Full-Day": "10.5h Day Shift (07:00–18:30, 1h lunch)",
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
    UNPAID: "Chưa Quyết Toán",
    PARTIAL_ADVANCE: "Đã Tạm Ứng",
    PAID: "Đã Tất Toán",
  },
  en: {
    UNPAID: "Accrued / Unpaid",
    PARTIAL_ADVANCE: "Partial Advance",
    PAID: "Settled in Full",
  },
};

