"use client";

import React, { memo, useEffect } from "react";
import type {
  Customer,
  EmbroideryDesign,
  EmbroideryMachine,
  EmployeeRole,
  EmployeeShift,
  EmployeeStatus,
  GarmentPlacement,
  PaymentStatus,
  SalaryPaymentStatus,
} from "@/lib/types";
import { parseDstBuffer } from "@/lib/dst-parser";
import DesignHoopPreview from "../DesignHoopPreview";
import ModernSelect from "../ModernSelect";
import {
  EMPLOYEE_ROLES,
  PLACEMENTS,
  type CustomerFormState,
  type DesignFormState,
  type EmployeeFormState,
  type InventoryFormState,
  type MachineFormState,
  type OrderFormState,
} from "./studio-constants";

export interface StudioModalsProps {
  vi: boolean;
  customers: Customer[];
  designs: EmbroideryDesign[];
  machines: EmbroideryMachine[];
  PLACEMENT_LABELS: Record<GarmentPlacement, string>;
  PAYMENT_LABELS: Record<PaymentStatus, string>;
  EMPLOYEE_ROLE_LABELS: Record<EmployeeRole, string>;
  EMPLOYEE_SHIFT_LABELS: Record<EmployeeShift, string>;
  EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string>;
  SALARY_STATUS_LABELS: Record<SalaryPaymentStatus, string>;

  // Order Modal
  showOrderModal: boolean;
  editingOrderId: string | null;
  orderForm: OrderFormState;
  onSetOrderForm: (next: OrderFormState) => void;
  onCloseOrderModal: () => void;
  onSaveOrder: (e: React.SyntheticEvent) => void;

  // Design Modal
  showDesignModal: boolean;
  editingDesignId: string | null;
  designForm: DesignFormState;
  onSetDesignForm: (next: DesignFormState) => void;
  onCloseDesignModal: () => void;
  onSaveDesign: (e: React.SyntheticEvent) => void;

  // Machine Modal
  showMachineModal: boolean;
  machineForm: MachineFormState;
  onSetMachineForm: (next: MachineFormState) => void;
  onCloseMachineModal: () => void;
  onCreateMachine: (e: React.SyntheticEvent) => void;

  // Inventory Modal
  showInventoryModal: boolean;
  editingInventoryId: string | null;
  inventoryForm: InventoryFormState;
  onSetInventoryForm: (next: InventoryFormState) => void;
  onCloseInventoryModal: () => void;
  onSaveInventory: (e: React.SyntheticEvent) => void;

  // Customer Modal
  showCustomerModal: boolean;
  editingCustomerId: string | null;
  customerForm: CustomerFormState;
  onSetCustomerForm: (next: CustomerFormState) => void;
  onCloseCustomerModal: () => void;
  onSaveCustomer: (e: React.SyntheticEvent) => void;

  // Employee Modal
  showEmployeeModal: boolean;
  editingEmployeeId: string | null;
  employeeForm: EmployeeFormState;
  onSetEmployeeForm: (next: EmployeeFormState) => void;
  onCloseEmployeeModal: () => void;
  onSaveEmployee: (e: React.SyntheticEvent) => void;
}

const StudioModals = memo(function StudioModals({
  vi,
  customers,
  designs,
  machines,
  PLACEMENT_LABELS,
  PAYMENT_LABELS,
  EMPLOYEE_ROLE_LABELS,
  EMPLOYEE_SHIFT_LABELS,
  EMPLOYEE_STATUS_LABELS,
  SALARY_STATUS_LABELS,
  showOrderModal,
  editingOrderId,
  orderForm,
  onSetOrderForm,
  onCloseOrderModal,
  onSaveOrder,
  showDesignModal,
  editingDesignId,
  designForm,
  onSetDesignForm,
  onCloseDesignModal,
  onSaveDesign,
  showMachineModal,
  machineForm,
  onSetMachineForm,
  onCloseMachineModal,
  onCreateMachine,
  showInventoryModal,
  editingInventoryId,
  inventoryForm,
  onSetInventoryForm,
  onCloseInventoryModal,
  onSaveInventory,
  showCustomerModal,
  editingCustomerId,
  customerForm,
  onSetCustomerForm,
  onCloseCustomerModal,
  onSaveCustomer,
  showEmployeeModal,
  editingEmployeeId,
  employeeForm,
  onSetEmployeeForm,
  onCloseEmployeeModal,
  onSaveEmployee,
}: StudioModalsProps) {
  useEffect(() => {
    const anyOpen =
      showOrderModal ||
      showDesignModal ||
      showMachineModal ||
      showInventoryModal ||
      showCustomerModal ||
      showEmployeeModal;
    if (!anyOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showOrderModal) onCloseOrderModal();
        if (showDesignModal) onCloseDesignModal();
        if (showMachineModal) onCloseMachineModal();
        if (showInventoryModal) onCloseInventoryModal();
        if (showCustomerModal) onCloseCustomerModal();
        if (showEmployeeModal) onCloseEmployeeModal();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showOrderModal,
    showDesignModal,
    showMachineModal,
    showInventoryModal,
    showCustomerModal,
    showEmployeeModal,
    onCloseOrderModal,
    onCloseDesignModal,
    onCloseMachineModal,
    onCloseInventoryModal,
    onCloseCustomerModal,
    onCloseEmployeeModal,
  ]);

  return (
    <>
      {/* ================= MODAL: CREATE / EDIT WORK ORDER ================= */}
      {showOrderModal && (
        <div
          onClick={onCloseOrderModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="tv-surface tv-border tv-text my-8 w-full max-w-xl rounded-2xl border p-6 shadow-2xl"
          >
            <div className="tv-border flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold">
                {editingOrderId
                  ? vi
                    ? "Chỉnh Sửa Lệnh Sản Xuất Thêu"
                    : "Edit Embroidery Work Order"
                  : vi
                    ? "Tạo Lệnh Sản Xuất Thêu Mới"
                    : "Create Embroidery Work Order"}
              </h3>
              <button
                onClick={onCloseOrderModal}
                className="text-xs tv-text-muted cursor-pointer"
              >
                ✕ {vi ? "Đóng" : "Close"}
              </button>
            </div>

            <form onSubmit={onSaveOrder} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Khách Hàng / Đối Tác" : "Client Account"}
                  </label>
                  <ModernSelect
                    value={orderForm.customerId}
                    onChange={(e) =>
                      onSetOrderForm({
                        ...orderForm,
                        customerId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company} ({c.name})
                      </option>
                    ))}
                  </ModernSelect>
                </div>

                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Mẫu Thêu Vi Tính" : "Digitized Design"}
                  </label>
                  <ModernSelect
                    value={orderForm.designId}
                    onChange={(e) =>
                      onSetOrderForm({
                        ...orderForm,
                        designId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2"
                  >
                    {designs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.stitchCount.toLocaleString()}{" "}
                        {vi ? "mũi" : "st"})
                      </option>
                    ))}
                  </ModernSelect>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Loại Phôi Áo / Nón" : "Garment Blank Style"}
                  </label>
                  <input
                    type="text"
                    required
                    value={orderForm.garmentType}
                    onChange={(e) =>
                      onSetOrderForm({
                        ...orderForm,
                        garmentType: e.target.value,
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Màu Vải / Màu Áo" : "Garment Color"}
                  </label>
                  <input
                    type="text"
                    required
                    value={orderForm.garmentColor}
                    onChange={(e) =>
                      onSetOrderForm({
                        ...orderForm,
                        garmentColor: e.target.value,
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Vị Trí Thêu" : "Placement"}
                  </label>
                  <ModernSelect
                    value={orderForm.placement}
                    onChange={(e) =>
                      onSetOrderForm({
                        ...orderForm,
                        placement: e.target.value as GarmentPlacement,
                      })
                    }
                    className="w-full px-3 py-2"
                  >
                    {PLACEMENTS.map((p) => (
                      <option key={p} value={p}>
                        {PLACEMENT_LABELS[p]}
                      </option>
                    ))}
                  </ModernSelect>
                </div>

                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Tổng Số Lượng (cái)" : "Total Quantity (pcs)"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={orderForm.quantity}
                    onChange={(e) =>
                      onSetOrderForm({
                        ...orderForm,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Đã Thêu Xong (cái)" : "Completed Qty (pcs)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={orderForm.completedQuantity}
                    onChange={(e) =>
                      onSetOrderForm({
                        ...orderForm,
                        completedQuantity: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
              </div>

              {/* Size Breakdown Row */}
              <div>
                <label className="block tv-text-muted mb-1">
                  {vi
                    ? "Cơ Cấu Size Áo (S / M / L / XL / 2XL)"
                    : "Garment Size Breakdown (S / M / L / XL / 2XL)"}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(
                    [
                      ["S", "sizeS"],
                      ["M", "sizeM"],
                      ["L", "sizeL"],
                      ["XL", "sizeXL"],
                      ["2XL", "sizeXXL"],
                    ] as const
                  ).map(([label, key]) => (
                    <div key={key}>
                      <span className="block text-[10px] tv-text-muted">
                        {label}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={orderForm[key]}
                        onChange={(e) =>
                          onSetOrderForm({
                            ...orderForm,
                            [key]: Number(e.target.value),
                          })
                        }
                        className="tv-input w-full px-2 py-1.5 font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Đơn Giá (₫/cái)" : "Unit Price (VND/pc)"}
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={orderForm.unitPrice}
                    onChange={(e) =>
                      onSetOrderForm({
                        ...orderForm,
                        unitPrice: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Trạng Thái Thanh Toán" : "Payment Status"}
                  </label>
                  <ModernSelect
                    value={orderForm.paymentStatus}
                    onChange={(e) =>
                      onSetOrderForm({
                        ...orderForm,
                        paymentStatus: e.target.value as PaymentStatus,
                      })
                    }
                    className="w-full px-3 py-2"
                  >
                    <option value="UNPAID">{PAYMENT_LABELS.UNPAID}</option>
                    <option value="DEPOSIT_PAID">
                      {PAYMENT_LABELS.DEPOSIT_PAID}
                    </option>
                    <option value="PAID">{PAYMENT_LABELS.PAID}</option>
                  </ModernSelect>
                </div>

                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Phân Công Máy Thêu" : "Assigned Machine"}
                  </label>
                  <ModernSelect
                    value={orderForm.assignedMachineId}
                    onChange={(e) =>
                      onSetOrderForm({
                        ...orderForm,
                        assignedMachineId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2"
                  >
                    <option value="">
                      {vi ? "— Chưa gán máy —" : "— Unassigned —"}
                    </option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </ModernSelect>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Hạn Giao Hàng" : "Due Date"}
                  </label>
                  <input
                    type="date"
                    value={orderForm.dueDate}
                    onChange={(e) =>
                      onSetOrderForm({
                        ...orderForm,
                        dueDate: e.target.value,
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
                <div className="flex flex-col justify-end gap-1.5 pb-1">
                  <label className="flex items-center gap-2 text-amber-400 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(orderForm.is3DPuff)}
                      onChange={(e) =>
                        onSetOrderForm({
                          ...orderForm,
                          is3DPuff: e.target.checked,
                        })
                      }
                    />
                    {vi
                      ? "Hàng Thêu Nổi 3D (Mua Mút EVA / Mouse)"
                      : "3D Puff Embroidery (EVA Foam Norm)"}
                  </label>
                  <label className="flex items-center gap-2 text-rose-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orderForm.rushOrder}
                      onChange={(e) =>
                        onSetOrderForm({
                          ...orderForm,
                          rushOrder: e.target.checked,
                        })
                      }
                    />
                    {vi
                      ? "Đánh dấu Đơn Hàng Gấp Ưu Tiên"
                      : "Mark as Priority Rush Order"}
                  </label>
                </div>
              </div>

              <div className="tv-surface-2 tv-border grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi
                      ? "Phương Thức Vận Chuyển Giao Nhận"
                      : "External Vehicle Transport Rule"}
                  </label>
                  <ModernSelect
                    value={orderForm.shippingMode ?? "LOCAL_2_WAY"}
                    onChange={(e) => {
                      const nextMode = e.target.value as
                        | "LOCAL_2_WAY"
                        | "CHANH_XE_PICKUP";
                      onSetOrderForm({
                        ...orderForm,
                        shippingMode: nextMode,
                        shippingCost:
                          nextMode === "CHANH_XE_PICKUP" ? 150000 : 300000,
                      });
                    }}
                    className="w-full px-2.5 py-2"
                  >
                    <option value="LOCAL_2_WAY">
                      {vi
                        ? "Khách nội thành — Chịu phí xe vận chuyển 2 chiều"
                        : "Local — Workshop pays 2-way vehicle"}
                    </option>
                    <option value="CHANH_XE_PICKUP">
                      {vi
                        ? "Khách tỉnh — Chỉ chịu 1 chiều Chành xe về xưởng"
                        : "Provincial — Only 1-way Chành Xe pickup"}
                    </option>
                  </ModernSelect>
                </div>
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi
                      ? "Chi Phí Vận Chuyển Xưởng Chịu (₫)"
                      : "Transport Cost Paid by Shop (VND)"}
                  </label>
                  <input
                    type="number"
                    step="10000"
                    min={0}
                    value={orderForm.shippingCost ?? 300000}
                    onChange={(e) =>
                      onSetOrderForm({
                        ...orderForm,
                        shippingCost: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="tv-input w-full px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block tv-text-muted mb-1">
                  {vi
                    ? "Ghi Chú Kỹ Thuật / Keo Lót"
                    : "Production / Backing Notes"}
                </label>
                <input
                  type="text"
                  value={orderForm.notes}
                  onChange={(e) =>
                    onSetOrderForm({ ...orderForm, notes: e.target.value })
                  }
                  placeholder={
                    vi
                      ? "VD: Lót 2 lớp keo cắt (cutaway), đóng gói từng áo"
                      : "e.g., 2 layers cutaway backing, polybag individually"
                  }
                  className="tv-input w-full px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onCloseOrderModal}
                  className="tv-surface-2 tv-border rounded-lg border px-4 py-2 cursor-pointer"
                >
                  {vi ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="tv-accent-bg rounded-lg px-4 py-2 font-bold cursor-pointer"
                >
                  {editingOrderId
                    ? vi
                      ? "Lưu Thay Đổi"
                      : "Save Changes"
                    : vi
                      ? "Tạo Lệnh Sản Xuất"
                      : "Create Work Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT DESIGN ================= */}
      {showDesignModal && (
        <div
          onClick={onCloseDesignModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="tv-surface tv-border tv-text my-8 w-full max-w-lg rounded-2xl border p-6 shadow-2xl"
          >
            <div className="tv-border mb-3 flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold">
                {editingDesignId
                  ? vi
                    ? "Chỉnh Sửa Mẫu Thêu & Thứ Tự Kim Chỉ"
                    : "Edit Digitized Design & Needle Sequence"
                  : vi
                    ? "Thêm Mẫu Thêu Vi Tính Mới"
                    : "Add Digitized Embroidery Design"}
              </h3>
              <button
                type="button"
                onClick={onCloseDesignModal}
                className="text-xs tv-text-muted cursor-pointer"
              >
                ✕ {vi ? "Đóng" : "Close"}
              </button>
            </div>

            {/* Live Hoop Preview + .DST Upload Bar */}
            <div className="tv-surface-2 tv-border mb-4 flex items-center gap-3 rounded-xl border p-3">
              <DesignHoopPreview
                design={{
                  id: "preview",
                  code: "DST",
                  name: designForm.name || "Preview",
                  clientName: designForm.clientName || "Studio",
                  stitchCount: designForm.stitchCount,
                  widthMm: designForm.widthMm,
                  heightMm: designForm.heightMm,
                  hoopSize: designForm.hoopSize,
                  fileFormat: designForm.fileFormat,
                  complexity: designForm.complexity,
                  colorSequence: designForm.colorSequence,
                  digitizerNotes: designForm.digitizerNotes,
                  createdAt: "",
                  stitchPaths: designForm.stitchPaths,
                  jumpCount: designForm.jumpCount,
                  trimCount: designForm.trimCount,
                }}
                size="md"
              />
              <div className="flex-1 text-xs space-y-1.5">
                <p className="font-semibold">
                  {vi
                    ? "Tải file .DST Tajima để điền tự động"
                    : "Upload Tajima .DST to auto-populate"}
                </p>
                <p className="text-[11px] tv-text-muted">
                  {vi
                    ? "Đọc header 512-byte + tọa độ mũi thêu thực tế ngay trên trình duyệt."
                    : "Reads 512-byte header + stitch vectors directly in the browser."}
                </p>
                <label className="tv-accent-bg inline-block rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer">
                  📂 {vi ? "Chọn File .DST..." : "Choose .DST File..."}
                  <input
                    type="file"
                    accept=".dst,.DST"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void file.arrayBuffer().then((buf) => {
                        const parsed = parseDstBuffer(buf, file.name);
                        onSetDesignForm({
                          ...designForm,
                          name: parsed.name || designForm.name,
                          stitchCount: parsed.stitchCount,
                          widthMm: parsed.widthMm,
                          heightMm: parsed.heightMm,
                          hoopSize: parsed.hoopSize,
                          fileFormat: "DST",
                          complexity: parsed.complexity,
                          colorSequence: parsed.colorSequence,
                          stitchPaths: parsed.stitchPaths,
                          jumpCount: parsed.jumpCount,
                          trimCount: parsed.trimCount,
                          digitizerNotes: `Imported from ${file.name} (${parsed.stitchCount.toLocaleString()} st, ${parsed.jumpCount} jumps).`,
                        });
                      });
                    }}
                  />
                </label>
              </div>
            </div>

            <form onSubmit={onSaveDesign} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Tên Mẫu Thêu" : "Design Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={designForm.name}
                    onChange={(e) =>
                      onSetDesignForm({ ...designForm, name: e.target.value })
                    }
                    placeholder="e.g., Saigon Bistro Crest"
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Tên Khách Hàng" : "Client Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={designForm.clientName}
                    onChange={(e) =>
                      onSetDesignForm({
                        ...designForm,
                        clientName: e.target.value,
                      })
                    }
                    placeholder="e.g., Saigon Heritage Group"
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Số Mũi Thêu" : "Stitches"}
                  </label>
                  <input
                    type="number"
                    value={designForm.stitchCount}
                    onChange={(e) =>
                      onSetDesignForm({
                        ...designForm,
                        stitchCount: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Rộng (mm)" : "Width (mm)"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={designForm.widthMm}
                    onChange={(e) =>
                      onSetDesignForm({
                        ...designForm,
                        widthMm: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Cao (mm)" : "Height (mm)"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={designForm.heightMm}
                    onChange={(e) =>
                      onSetDesignForm({
                        ...designForm,
                        heightMm: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
              </div>

              {/* Dynamic Needle Colorway Sequence Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="tv-text-muted font-semibold">
                    {vi ? "Thứ Tự Kim Chỉ Màu" : "Needle Color Sequence"}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      onSetDesignForm({
                        ...designForm,
                        colorSequence: [
                          ...designForm.colorSequence,
                          {
                            needle: designForm.colorSequence.length + 1,
                            threadCode: "M-1801",
                            name: "Super White",
                            hex: "#ffffff",
                          },
                        ],
                      })
                    }
                    className="tv-accent-text font-bold hover:underline cursor-pointer"
                  >
                    + {vi ? "Thêm Kim Chỉ" : "Add Needle Stop"}
                  </button>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {designForm.colorSequence.map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-mono tv-text-muted w-6">
                        N{idx + 1}
                      </span>
                      <input
                        type="color"
                        value={stop.hex}
                        onChange={(e) => {
                          const next = [...designForm.colorSequence];
                          next[idx] = { ...stop, hex: e.target.value };
                          onSetDesignForm({
                            ...designForm,
                            colorSequence: next,
                          });
                        }}
                        className="h-7 w-9 rounded border tv-border bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={stop.threadCode}
                        onChange={(e) => {
                          const next = [...designForm.colorSequence];
                          next[idx] = { ...stop, threadCode: e.target.value };
                          onSetDesignForm({
                            ...designForm,
                            colorSequence: next,
                          });
                        }}
                        placeholder="M-1800"
                        className="tv-input w-20 px-2 py-1 font-mono"
                      />
                      <input
                        type="text"
                        value={stop.name}
                        onChange={(e) => {
                          const next = [...designForm.colorSequence];
                          next[idx] = { ...stop, name: e.target.value };
                          onSetDesignForm({
                            ...designForm,
                            colorSequence: next,
                          });
                        }}
                        placeholder={vi ? "Tên màu chỉ" : "Color Name"}
                        className="tv-input flex-1 px-2 py-1"
                      />
                      {designForm.colorSequence.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            onSetDesignForm({
                              ...designForm,
                              colorSequence: designForm.colorSequence.filter(
                                (_, i) => i !== idx,
                              ),
                            })
                          }
                          className="tv-text-muted hover:text-rose-400 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block tv-text-muted mb-1">
                  {vi
                    ? "Ghi Chú Kỹ Thuật Thiết Kế Mẫu"
                    : "Digitizer Technical Notes"}
                </label>
                <input
                  type="text"
                  value={designForm.digitizerNotes}
                  onChange={(e) =>
                    onSetDesignForm({
                      ...designForm,
                      digitizerNotes: e.target.value,
                    })
                  }
                  className="tv-input w-full px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onCloseDesignModal}
                  className="tv-surface-2 tv-border rounded-lg border px-4 py-2 cursor-pointer"
                >
                  {vi ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="tv-accent-bg rounded-lg px-4 py-2 font-bold cursor-pointer"
                >
                  {vi ? "Lưu Mẫu Thêu" : "Save Design File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD MACHINE ================= */}
      {showMachineModal && (
        <div
          onClick={onCloseMachineModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="tv-surface tv-border tv-text w-full max-w-md rounded-2xl border p-6 shadow-2xl"
          >
            <div className="tv-border mb-3 flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold">
                {vi
                  ? "Thêm Máy Thêu Công Nghiệp Mới"
                  : "Add Embroidery Machine Line"}
              </h3>
              <button
                type="button"
                onClick={onCloseMachineModal}
                className="text-xs tv-text-muted cursor-pointer"
              >
                ✕ {vi ? "Đóng" : "Close"}
              </button>
            </div>
            <div className="mb-3">
              <p className="text-[11px] font-semibold tv-text-muted mb-1.5">
                {vi
                  ? "Chọn nhanh 2 dòng máy đang dùng tại xưởng:"
                  : "Quick-select factory machine model:"}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    onSetMachineForm({
                      ...machineForm,
                      brand: "Tajima",
                      model: "TFGN2",
                      heads: 20,
                      needlesPerHead: 9,
                      maxSpm: 1000,
                    })
                  }
                  className={`rounded-lg border px-3 py-2 text-left transition cursor-pointer ${
                    machineForm.model === "TFGN2"
                      ? "tv-accent-bg border-transparent font-bold"
                      : "tv-surface-2 tv-border tv-text"
                  }`}
                >
                  <div>Tajima TFGN2</div>
                  <div className="text-[10px] opacity-80">
                    20 {vi ? "đầu" : "heads"} • 9 {vi ? "kim" : "needles"} • 1000 SPM
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSetMachineForm({
                      ...machineForm,
                      brand: "Tajima",
                      model: "TMCP",
                      heads: 20,
                      needlesPerHead: 9,
                      maxSpm: 1000,
                    })
                  }
                  className={`rounded-lg border px-3 py-2 text-left transition cursor-pointer ${
                    machineForm.model === "TMCP"
                      ? "tv-accent-bg border-transparent font-bold"
                      : "tv-surface-2 tv-border tv-text"
                  }`}
                >
                  <div>Tajima TMCP</div>
                  <div className="text-[10px] opacity-80">
                    20 {vi ? "đầu" : "heads"} • 9 {vi ? "kim" : "needles"} • 1000 SPM
                  </div>
                </button>
              </div>
            </div>
            <form onSubmit={onCreateMachine} className="space-y-3 text-xs">
              <div>
                <label className="block tv-text-muted mb-1">
                  {vi ? "Tên Chuyền / Máy Thêu" : "Line Name"}
                </label>
                <input
                  type="text"
                  required
                  value={machineForm.name}
                  onChange={(e) =>
                    onSetMachineForm({ ...machineForm, name: e.target.value })
                  }
                  className="tv-input w-full px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Hãng Máy" : "Brand"}
                  </label>
                  <ModernSelect
                    value={machineForm.brand}
                    onChange={(e) =>
                      onSetMachineForm({
                        ...machineForm,
                        brand: e.target.value as typeof machineForm.brand,
                      })
                    }
                    className="w-full px-3 py-2"
                  >
                    <option value="Tajima">Tajima</option>
                    <option value="Barudan">Barudan</option>
                    <option value="Ricoma">Ricoma</option>
                    <option value="Brother">Brother</option>
                    <option value="HappyJapan">HappyJapan</option>
                  </ModernSelect>
                </div>
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Đời Máy (Model)" : "Model"}
                  </label>
                  <input
                    type="text"
                    required
                    value={machineForm.model}
                    onChange={(e) =>
                      onSetMachineForm({
                        ...machineForm,
                        model: e.target.value,
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Số Đầu Thêu" : "Heads"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={machineForm.heads}
                    onChange={(e) =>
                      onSetMachineForm({
                        ...machineForm,
                        heads: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Số Kim / Đầu" : "Needles/Head"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={machineForm.needlesPerHead}
                    onChange={(e) =>
                      onSetMachineForm({
                        ...machineForm,
                        needlesPerHead: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Tốc Độ Tối Đa (SPM)" : "Max SPM"}
                  </label>
                  <input
                    type="number"
                    min={500}
                    value={machineForm.maxSpm}
                    onChange={(e) =>
                      onSetMachineForm({
                        ...machineForm,
                        maxSpm: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onCloseMachineModal}
                  className="tv-surface-2 tv-border rounded-lg border px-4 py-2 cursor-pointer"
                >
                  {vi ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="tv-accent-bg rounded-lg px-4 py-2 font-bold cursor-pointer"
                >
                  {vi ? "Thêm Máy Thêu" : "Add Machine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT INVENTORY ================= */}
      {showInventoryModal && (
        <div
          onClick={onCloseInventoryModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="tv-surface tv-border tv-text w-full max-w-md rounded-2xl border p-6 shadow-2xl"
          >
            <div className="tv-border mb-4 flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold">
                {editingInventoryId
                  ? vi
                    ? "Chỉnh Sửa Mã Chỉ / Vật Tư Phụ Liệu"
                    : "Edit Thread / Supply Item"
                  : vi
                    ? "Thêm Cuộn Chỉ Thêu Hoặc Keo Lót"
                    : "Add Thread Cone or Backing Supply"}
              </h3>
              <button
                type="button"
                onClick={onCloseInventoryModal}
                className="text-xs tv-text-muted cursor-pointer"
              >
                ✕ {vi ? "Đóng" : "Close"}
              </button>
            </div>
            <form onSubmit={onSaveInventory} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Mã Vật Tư (SKU)" : "SKU / Code"}
                  </label>
                  <input
                    type="text"
                    required
                    value={inventoryForm.sku}
                    onChange={(e) =>
                      onSetInventoryForm({
                        ...inventoryForm,
                        sku: e.target.value,
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Màu Hiển Thị" : "Swatch Hex"}
                  </label>
                  <input
                    type="color"
                    value={inventoryForm.colorHex}
                    onChange={(e) =>
                      onSetInventoryForm({
                        ...inventoryForm,
                        colorHex: e.target.value,
                      })
                    }
                    className="tv-input h-9 w-full p-1 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block tv-text-muted mb-1">
                  {vi ? "Tên Chỉ / Phụ Liệu" : "Supply Name"}
                </label>
                <input
                  type="text"
                  required
                  value={inventoryForm.name}
                  onChange={(e) =>
                    onSetInventoryForm({
                      ...inventoryForm,
                      name: e.target.value,
                    })
                  }
                  className="tv-input w-full px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Số Lượng Tồn" : "Stock Qty"}
                  </label>
                  <input
                    type="number"
                    value={inventoryForm.quantity}
                    onChange={(e) =>
                      onSetInventoryForm({
                        ...inventoryForm,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Mức Cảnh Báo" : "Min Alert"}
                  </label>
                  <input
                    type="number"
                    value={inventoryForm.minThreshold}
                    onChange={(e) =>
                      onSetInventoryForm({
                        ...inventoryForm,
                        minThreshold: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Giá Nhập (₫)" : "Unit Cost (VND)"}
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={inventoryForm.unitCost}
                    onChange={(e) =>
                      onSetInventoryForm({
                        ...inventoryForm,
                        unitCost: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onCloseInventoryModal}
                  className="tv-surface-2 tv-border rounded-lg border px-4 py-2 cursor-pointer"
                >
                  {vi ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="tv-accent-bg rounded-lg px-4 py-2 font-bold cursor-pointer"
                >
                  {vi ? "Lưu Vật Tư" : "Save Supply Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT CUSTOMER ================= */}
      {showCustomerModal && (
        <div
          onClick={onCloseCustomerModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="tv-surface tv-border tv-text w-full max-w-md rounded-2xl border p-6 shadow-2xl"
          >
            <div className="tv-border mb-4 flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold">
                {editingCustomerId
                  ? vi
                    ? "Chỉnh Sửa Thông Tin Khách Hàng"
                    : "Edit Client Account"
                  : vi
                    ? "Thêm Khách Hàng / Đối Tác Mới"
                    : "Add Client Account"}
              </h3>
              <button
                type="button"
                onClick={onCloseCustomerModal}
                className="text-xs tv-text-muted cursor-pointer"
              >
                ✕ {vi ? "Đóng" : "Close"}
              </button>
            </div>
            <form onSubmit={onSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block tv-text-muted mb-1">
                  {vi ? "Tên Công Ty / Thương Hiệu" : "Company / Brand"}
                </label>
                <input
                  type="text"
                  required
                  value={customerForm.company}
                  onChange={(e) =>
                    onSetCustomerForm({
                      ...customerForm,
                      company: e.target.value,
                    })
                  }
                  className="tv-input w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="block tv-text-muted mb-1">
                  {vi ? "Người Liên Hệ" : "Contact Name"}
                </label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) =>
                    onSetCustomerForm({
                      ...customerForm,
                      name: e.target.value,
                    })
                  }
                  className="tv-input w-full px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block tv-text-muted mb-1">Email</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) =>
                      onSetCustomerForm({
                        ...customerForm,
                        email: e.target.value,
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Số Điện Thoại" : "Phone"}
                  </label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={(e) =>
                      onSetCustomerForm({
                        ...customerForm,
                        phone: e.target.value,
                      })
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block tv-text-muted mb-1">
                  {vi ? "Phôi Áo / Nón Thường Đặt" : "Preferred Blank Garments"}
                </label>
                <input
                  type="text"
                  value={customerForm.preferredGarments}
                  onChange={(e) =>
                    onSetCustomerForm({
                      ...customerForm,
                      preferredGarments: e.target.value,
                    })
                  }
                  className="tv-input w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="block tv-text-muted mb-1">
                  {vi
                    ? "Ghi Chú Mã Chỉ / Yêu Cầu Kỹ Thuật"
                    : "Thread Match / Notes"}
                </label>
                <input
                  type="text"
                  value={customerForm.notes}
                  onChange={(e) =>
                    onSetCustomerForm({
                      ...customerForm,
                      notes: e.target.value,
                    })
                  }
                  placeholder={
                    vi
                      ? "VD: Dùng chỉ đỏ Madeira #1838 trên nón Richardson 112"
                      : "e.g., Uses Madeira #1838 Red on Richardson 112 caps"
                  }
                  className="tv-input w-full px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onCloseCustomerModal}
                  className="tv-surface-2 tv-border rounded-lg border px-4 py-2 cursor-pointer"
                >
                  {vi ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="tv-accent-bg rounded-lg px-4 py-2 font-bold cursor-pointer"
                >
                  {vi ? "Lưu Khách Hàng" : "Save Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT EMPLOYEE & PAYROLL ================= */}
      {showEmployeeModal && (
        <div
          onClick={onCloseEmployeeModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="tv-surface tv-border tv-text my-8 w-full max-w-xl rounded-2xl border p-6 shadow-2xl"
          >
            <div className="tv-border flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold">
                  {editingEmployeeId
                    ? vi
                      ? "Chỉnh Sửa Hồ Sơ Nhân Sự & Định Mức Lương"
                      : "Edit Workshop Staff & Payroll Structure"
                    : vi
                      ? "Thêm Thợ Đứng Máy / Kiểm Hàng QC / Giao Nhận"
                      : "Add Workshop Operator / QC / Logistics Staff"}
                </h3>
                <p className="text-[11px] tv-text-muted">
                  {vi
                    ? "Ca 10.5h/ngày (07:00–18:30, nghỉ trưa 1h) • Tiền cơm 35k/ngày tự động cộng • Tăng ca CN ×200% • Trọ 500k + Chuyên cần 500k"
                    : "10.5h/day shift (07:00–18:30, 1h lunch) • Auto +35k/day meal • Sunday OT ×200% • 500k housing + 500k attendance"}
                </p>
              </div>
              <button
                onClick={onCloseEmployeeModal}
                className="text-xs tv-text-muted cursor-pointer"
              >
                ✕ {vi ? "Đóng" : "Close"}
              </button>
            </div>

            {/* Quick Role Salary Preset Buttons */}
            <div className="mt-3">
              <p className="text-[11px] font-semibold tv-text-muted mb-1.5">
                {vi
                  ? "Chọn nhanh mức lương chuẩn theo vị trí công việc:"
                  : "Quick-select standard workshop salary preset:"}
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    onSetEmployeeForm({
                      ...employeeForm,
                      role: "Machine Operator",
                      shift: "Full-Day",
                      payType: "Monthly",
                      monthlyBaseSalary: 9000000,
                      hourlyRate: 32967,
                      hoursWorkedMonth: 273,
                      allowanceAndBonus: 1000000,
                    })
                  }
                  className={`rounded-lg border px-2.5 py-2 text-left transition cursor-pointer ${
                    employeeForm.role === "Machine Operator"
                      ? "tv-accent-bg border-transparent font-bold"
                      : "tv-surface-2 tv-border tv-text"
                  }`}
                >
                  <div>{vi ? "Thợ Đứng Máy" : "Machine Operator"}</div>
                  <div className="font-mono text-[10px] opacity-85">
                    9.000.000 ₫ / {vi ? "tháng" : "mo"}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onSetEmployeeForm({
                      ...employeeForm,
                      role: "Trimming & QC",
                      shift: "Full-Day",
                      payType: "Monthly",
                      monthlyBaseSalary: 8500000,
                      hourlyRate: 31136,
                      hoursWorkedMonth: 273,
                      assignedMachineId: "",
                      allowanceAndBonus: 1000000,
                    })
                  }
                  className={`rounded-lg border px-2.5 py-2 text-left transition cursor-pointer ${
                    employeeForm.role === "Trimming & QC"
                      ? "tv-accent-bg border-transparent font-bold"
                      : "tv-surface-2 tv-border tv-text"
                  }`}
                >
                  <div>{vi ? "Kiểm Hàng (QC)" : "QC Inspector"}</div>
                  <div className="font-mono text-[10px] opacity-85">
                    8tr – 8.500.000 ₫ / {vi ? "tháng" : "mo"}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onSetEmployeeForm({
                      ...employeeForm,
                      role: "Errands & Delivery",
                      shift: "Full-Day",
                      payType: "Monthly",
                      monthlyBaseSalary: 7500000,
                      hourlyRate: 27473,
                      hoursWorkedMonth: 273,
                      assignedMachineId: "",
                      allowanceAndBonus: 1000000,
                    })
                  }
                  className={`rounded-lg border px-2.5 py-2 text-left transition cursor-pointer ${
                    employeeForm.role === "Errands & Delivery"
                      ? "tv-accent-bg border-transparent font-bold"
                      : "tv-surface-2 tv-border tv-text"
                  }`}
                >
                  <div>{vi ? "Giao Nhận & Hỗ Trợ Xưởng" : "Logistics & Workshop Support"}</div>
                  <div className="font-mono text-[10px] opacity-85">
                    7.500.000 ₫ / {vi ? "tháng" : "mo"}
                  </div>
                </button>
              </div>
            </div>

            <form
              onSubmit={onSaveEmployee}
              className="mt-3.5 space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Họ và Tên Nhân Sự" : "Full Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeForm.name}
                    onChange={(e) =>
                      onSetEmployeeForm({
                        ...employeeForm,
                        name: e.target.value,
                      })
                    }
                    placeholder={
                      vi ? "VD: Nguyễn Văn Hùng" : "e.g., Nguyen Van Hung"
                    }
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Số Điện Thoại" : "Phone Number"}
                  </label>
                  <input
                    type="text"
                    value={employeeForm.phone}
                    onChange={(e) =>
                      onSetEmployeeForm({
                        ...employeeForm,
                        phone: e.target.value,
                      })
                    }
                    placeholder="0908 112 334"
                    className="tv-input w-full px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Công Việc Tại Xưởng" : "Workshop Role"}
                  </label>
                  <ModernSelect
                    value={employeeForm.role}
                    onChange={(e) =>
                      onSetEmployeeForm({
                        ...employeeForm,
                        role: e.target.value as EmployeeRole,
                      })
                    }
                    className="w-full px-3 py-2"
                  >
                    {EMPLOYEE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {EMPLOYEE_ROLE_LABELS[r]}
                      </option>
                    ))}
                  </ModernSelect>
                </div>

                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Ca Làm (10.5 tiếng/ngày)" : "Work Shift (10.5h/day)"}
                  </label>
                  <ModernSelect
                    value={employeeForm.shift}
                    onChange={(e) =>
                      onSetEmployeeForm({
                        ...employeeForm,
                        shift: e.target.value as EmployeeShift,
                      })
                    }
                    className="w-full px-3 py-2"
                  >
                    {(
                      ["Full-Day", "Morning", "Afternoon"] as EmployeeShift[]
                    ).map((s) => (
                      <option key={s} value={s}>
                        {EMPLOYEE_SHIFT_LABELS[s]}
                      </option>
                    ))}
                  </ModernSelect>
                </div>

                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Trạng Thái Làm Việc" : "Employment Status"}
                  </label>
                  <ModernSelect
                    value={employeeForm.status}
                    onChange={(e) =>
                      onSetEmployeeForm({
                        ...employeeForm,
                        status: e.target.value as EmployeeStatus,
                      })
                    }
                    className="w-full px-3 py-2"
                  >
                    {(
                      ["ACTIVE", "ON_LEAVE", "OFF_SHIFT"] as EmployeeStatus[]
                    ).map((st) => (
                      <option key={st} value={st}>
                        {EMPLOYEE_STATUS_LABELS[st]}
                      </option>
                    ))}
                  </ModernSelect>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi
                      ? "Phân Công Đứng Máy Hôm Nay (Luân Chuyển Linh Hoạt)"
                      : "Running Machine Today (Flexible Dispatch)"}
                  </label>
                  <ModernSelect
                    value={employeeForm.assignedMachineId}
                    onChange={(e) =>
                      onSetEmployeeForm({
                        ...employeeForm,
                        assignedMachineId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2"
                  >
                    <option value="">
                      {vi
                        ? "— Không đứng máy (Kiểm hàng QC / Giao nhận) —"
                        : "— Non-machine (QC / Logistics) —"}
                    </option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.heads} {vi ? "đầu" : "heads"})
                      </option>
                    ))}
                  </ModernSelect>
                </div>

                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi
                      ? "Lương Căn Bản Tháng (₫/tháng)"
                      : "Monthly Base Salary (VND/mo)"}
                  </label>
                  <input
                    type="number"
                    step="100000"
                    min={0}
                    value={employeeForm.monthlyBaseSalary}
                    onChange={(e) => {
                      const monthly = Number(e.target.value);
                      onSetEmployeeForm({
                        ...employeeForm,
                        payType: "Monthly",
                        monthlyBaseSalary: monthly,
                        hourlyRate: Math.round(monthly / 273),
                      });
                    }}
                    className="tv-input w-full px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi
                      ? "Giờ Công Tháng (10.5h/ngày)"
                      : "Hours Worked (10.5h/day)"}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={employeeForm.hoursWorkedMonth}
                    onChange={(e) =>
                      onSetEmployeeForm({
                        ...employeeForm,
                        hoursWorkedMonth: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2 font-mono"
                  />
                  <span className="mt-0.5 block text-[10px] text-emerald-400">
                    ≈ {(employeeForm.hoursWorkedMonth / 10.5).toFixed(1)}{" "}
                    {vi ? "ngày công (+35k cơm/ngày)" : "days (+35k meal/day)"}
                  </span>
                </div>

                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi
                      ? "Giờ Tăng Ca Chủ Nhật (×200%)"
                      : "Sunday OT Hours (×200%)"}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={employeeForm.overtimeHoursMonth}
                    onChange={(e) =>
                      onSetEmployeeForm({
                        ...employeeForm,
                        overtimeHoursMonth: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2 font-mono"
                  />
                  <span className="mt-0.5 block text-[10px] text-sky-400">
                    ≈ {(employeeForm.overtimeHoursMonth / 10.5).toFixed(1)}{" "}
                    {vi ? "ngày CN (nhân 200%)" : "Sundays (×200%)"}
                  </span>
                </div>

                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi
                      ? "Nhà Trọ (500k) + Chuyên Cần (500k)"
                      : "Housing (500k) + Attendance (500k)"}
                  </label>
                  <input
                    type="number"
                    step="100000"
                    min={0}
                    value={employeeForm.allowanceAndBonus}
                    onChange={(e) =>
                      onSetEmployeeForm({
                        ...employeeForm,
                        allowanceAndBonus: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2 font-mono"
                  />
                  <span className="mt-0.5 block text-[10px] tv-text-muted">
                    {vi ? "Chuẩn xưởng: 1.000.000đ/tháng" : "Standard: 1,000,000 VND/mo"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi ? "Trạng Thái Chi Lương" : "Payroll Payment Status"}
                  </label>
                  <ModernSelect
                    value={employeeForm.salaryPaymentStatus}
                    onChange={(e) =>
                      onSetEmployeeForm({
                        ...employeeForm,
                        salaryPaymentStatus: e.target
                          .value as SalaryPaymentStatus,
                      })
                    }
                    className="w-full px-3 py-2"
                  >
                    <option value="UNPAID">
                      {SALARY_STATUS_LABELS.UNPAID}
                    </option>
                    <option value="PARTIAL_ADVANCE">
                      {SALARY_STATUS_LABELS.PARTIAL_ADVANCE}
                    </option>
                    <option value="PAID">{SALARY_STATUS_LABELS.PAID}</option>
                  </ModernSelect>
                </div>

                <div>
                  <label className="block tv-text-muted mb-1">
                    {vi
                      ? "Số Tiền Đã Chi / Tạm Ứng (₫)"
                      : "Amount Paid / Advance (VND)"}
                  </label>
                  <input
                    type="number"
                    step="100000"
                    min={0}
                    value={employeeForm.amountPaidMonth}
                    onChange={(e) =>
                      onSetEmployeeForm({
                        ...employeeForm,
                        amountPaidMonth: Number(e.target.value),
                      })
                    }
                    className="tv-input w-full px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block tv-text-muted mb-1">
                  {vi
                    ? "Ghi Chú Tay Nghề / Công Việc Hằng Ngày"
                    : "Skill & Daily Duty Notes"}
                </label>
                <input
                  type="text"
                  value={employeeForm.notes}
                  onChange={(e) =>
                    onSetEmployeeForm({
                      ...employeeForm,
                      notes: e.target.value,
                    })
                  }
                  placeholder={
                    vi
                      ? "VD: Thành thạo tự lên khung áo thun & nón 3D; vận hành linh hoạt 5 máy Tajima 20 đầu"
                      : "e.g., Skilled in garment & 3D cap hooping; rotates across all 5 × 20-head Tajima machines"
                  }
                  className="tv-input w-full px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onCloseEmployeeModal}
                  className="tv-surface-2 tv-border rounded-lg border px-4 py-2 cursor-pointer"
                >
                  {vi ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="tv-accent-bg rounded-lg px-4 py-2 font-bold cursor-pointer"
                >
                  {editingEmployeeId
                    ? vi
                      ? "Lưu Thay Đổi"
                      : "Save Changes"
                    : vi
                      ? "Thêm Nhân Sự"
                      : "Add Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
});

export default StudioModals;
