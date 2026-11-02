"use client";

import React, { useState } from "react";
import type {
  Customer,
  DashboardPayload,
  EmbroideryOrder,
  Employee,
  EmployeeCostBreakdown,
  InventoryItem,
} from "@/lib/types";
import {
  calculateEmployeeCostBreakdown,
  calculateOrderMaterialAndProfit,
} from "@/lib/seed-data";

export type ExportDataset =
  | "orders"
  | "payroll"
  | "inventory"
  | "customers"
  | "full_backup";

export type ExportFormat = "csv" | "json";

interface ExportCenterModalProps {
  vi: boolean;
  initialDataset: ExportDataset;
  initialFormat: ExportFormat;
  data: DashboardPayload;
  filteredOrders: EmbroideryOrder[];
  filteredInventory: InventoryItem[];
  filteredCustomers: Customer[];
  filteredEmployees: Employee[];
  breakdownById: Map<string, EmployeeCostBreakdown>;
  ordersCountByCustomerId: Map<string, number>;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

function triggerDownloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildCsvString(rows: string[][], includeBom: boolean): string {
  const csvBody = rows
    .map((r) =>
      r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  return includeBom ? `\uFEFF${csvBody}` : csvBody;
}

export default function ExportCenterModal({
  vi,
  initialDataset,
  initialFormat,
  data,
  filteredOrders,
  filteredInventory,
  filteredCustomers,
  filteredEmployees,
  breakdownById,
  ordersCountByCustomerId,
  onClose,
  onShowToast,
}: ExportCenterModalProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [dataset, setDataset] = useState<ExportDataset>(initialDataset);
  const [format, setFormat] = useState<ExportFormat>(
    initialDataset === "full_backup" ? "json" : initialFormat,
  );
  const [scope, setScope] = useState<"all" | "filtered" | "highlight">("all");
  const [includeUtf8Bom, setIncludeUtf8Bom] = useState<boolean>(true);
  const [customFilename, setCustomFilename] = useState<string>(
    `tuong-vinh-${initialDataset.replace("_", "-")}-${today}`,
  );

  function handleSelectDataset(nextDataset: ExportDataset) {
    setDataset(nextDataset);
    setScope("all");
    const nextFormat: ExportFormat =
      nextDataset === "full_backup" ? "json" : format;
    setFormat(nextFormat);
    setCustomFilename(`tuong-vinh-${nextDataset.replace("_", "-")}-${today}`);
  }

  function handleSelectFormat(nextFormat: ExportFormat) {
    setFormat(nextFormat);
  }

  // Compute target records based on dataset & scope
  const targetOrders =
    scope === "filtered"
      ? filteredOrders
      : scope === "highlight"
        ? data.orders.filter((o) => (o.paymentStatus ?? "UNPAID") !== "PAID")
        : data.orders;

  const allEmployees = data.employees ?? [];
  const targetEmployees =
    scope === "filtered"
      ? filteredEmployees
      : scope === "highlight"
        ? allEmployees.filter((e) => e.paymentStatus !== "PAID")
        : allEmployees;

  const targetInventory =
    scope === "filtered"
      ? filteredInventory
      : scope === "highlight"
        ? data.inventory.filter((i) => i.quantity <= i.minThreshold)
        : data.inventory;

  const targetCustomers =
    scope === "filtered" ? filteredCustomers : data.customers;

  const recordCount =
    dataset === "orders"
      ? targetOrders.length
      : dataset === "payroll"
        ? targetEmployees.length
        : dataset === "inventory"
          ? targetInventory.length
          : dataset === "customers"
            ? targetCustomers.length
            : data.orders.length +
              data.designs.length +
              data.machines.length +
              data.inventory.length +
              data.customers.length +
              allEmployees.length;

  const sanitizedBaseName =
    customFilename.trim().replace(/\.(csv|json)$/i, "") ||
    `tuong-vinh-export-${today}`;
  const finalFilename = `${sanitizedBaseName}.${format}`;

  function handleConfirmExport(e: React.SyntheticEvent) {
    e.preventDefault();

    if (format === "json" || dataset === "full_backup") {
      const payloadToExport =
        dataset === "orders"
          ? targetOrders
          : dataset === "payroll"
            ? targetEmployees
            : dataset === "inventory"
              ? targetInventory
              : dataset === "customers"
                ? targetCustomers
                : data;

      const blob = new Blob([JSON.stringify(payloadToExport, null, 2)], {
        type: "application/json;charset=utf-8;",
      });
      triggerDownloadBlob(`${sanitizedBaseName}.json`, blob);
      onShowToast(
        vi
          ? `Đã tải file dữ liệu ${sanitizedBaseName}.json`
          : `Downloaded ${sanitizedBaseName}.json`,
      );
      onClose();
      return;
    }

    // CSV Export by dataset
    let rows: string[][] = [];

    if (dataset === "orders") {
      rows = [
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
          "Colors",
          "Upper Thread Cones",
          "Upper Thread Cost (VND)",
          "3D EVA Cost (VND)",
          "Consumables Cost (VND)",
          "Shipping Mode",
          "Shipping Cost (VND)",
          "Status",
          "Payment Status",
          "Amount Paid (VND)",
          "Total Revenue (VND)",
          "Net Before Payroll (VND)",
          "Due Date",
        ],
        ...targetOrders.map((o) => {
          const mat = calculateOrderMaterialAndProfit(o);
          return [
            o.orderNumber,
            o.companyName,
            o.customerName,
            o.garmentType,
            o.garmentColor,
            o.placement,
            String(o.quantity),
            String(o.completedQuantity),
            String(o.stitchCount),
            String(o.colorCount),
            String(mat.totalMasterConesToBuy),
            String(mat.upperThreadCost),
            String(mat.evaFoamCost),
            String(mat.consumablesCost),
            mat.shippingMode,
            String(mat.shippingCost),
            o.status,
            o.paymentStatus ?? "UNPAID",
            String(o.amountPaid ?? 0),
            String(o.totalPrice),
            String(mat.orderGrossProfit),
            o.dueDate,
          ];
        }),
      ];
    } else if (dataset === "payroll") {
      rows = [
        [
          "Staff Code",
          "Full Name",
          "Role",
          "Shift (10.5h/day)",
          "Status",
          "Monthly Base Salary (VND)",
          "Hours Worked",
          "Days Worked (10.5h/day)",
          "Sunday OT Hours (x200%)",
          "Base Pay (VND)",
          "Meal Allowance 35k/day (VND)",
          "Sunday OT Pay x200% (VND)",
          "Housing 500k + Attendance 500k (VND)",
          "Total Monthly Pay (VND)",
          "Amount Paid (VND)",
          "Balance Due (VND)",
          "Payment Status",
        ],
        ...targetEmployees.map((emp) => {
          const b =
            breakdownById.get(emp.id) ?? calculateEmployeeCostBreakdown(emp);
          return [
            emp.code,
            emp.name,
            emp.role,
            emp.shift,
            emp.status,
            String(emp.monthlyBaseSalary),
            String(emp.hoursWorkedMonth),
            String(b.daysWorked),
            String(emp.overtimeHoursMonth),
            String(b.basePay),
            String(b.mealAllowance),
            String(b.overtimePay),
            String(b.housingAndAttendance),
            String(b.totalCost),
            String(emp.amountPaidMonth),
            String(b.balanceDue),
            emp.paymentStatus,
          ];
        }),
      ];
    } else if (dataset === "inventory") {
      rows = [
        [
          "SKU",
          "Item Name",
          "Category",
          "Brand",
          "Color Code",
          "Material",
          "Quantity",
          "Unit",
          "Min Threshold",
          "Unit Cost (VND)",
          "Stock Status",
        ],
        ...targetInventory.map((item) => [
          item.sku,
          item.name,
          item.category,
          item.brand,
          item.colorCode ?? "",
          item.material,
          String(item.quantity),
          item.unit,
          String(item.minThreshold),
          String(item.unitCost),
          item.quantity <= item.minThreshold ? "LOW_STOCK" : "OK",
        ]),
      ];
    } else if (dataset === "customers") {
      rows = [
        [
          "Customer ID",
          "Company Name",
          "Contact Person",
          "Phone",
          "Email",
          "Preferred Garments",
          "Total Orders",
          "Total Spend (VND)",
          "Notes",
        ],
        ...targetCustomers.map((c) => [
          c.id,
          c.company,
          c.name,
          c.phone,
          c.email,
          c.preferredGarments,
          String(ordersCountByCustomerId.get(c.id) ?? c.totalOrders ?? 0),
          String(c.totalSpend),
          c.notes,
        ]),
      ];
    }

    const csvString = buildCsvString(rows, includeUtf8Bom);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    triggerDownloadBlob(finalFilename, blob);
    onShowToast(
      vi
        ? `Đã xuất file ${finalFilename} (${recordCount} bản ghi)`
        : `Exported ${finalFilename} (${recordCount} records)`,
    );
    onClose();
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="tv-surface tv-border w-full max-w-xl rounded-2xl border p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b tv-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="tv-accent-bg flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black">
                ⬇
              </span>
              <h3 className="text-base font-extrabold">
                {vi
                  ? "Tùy Chọn Xuất Dữ Liệu & Sao Lưu Xưởng"
                  : "Export & Download Options"}
              </h3>
            </div>
            <p className="mt-1 text-xs tv-text-muted">
              {vi
                ? "Chọn loại dữ liệu, phạm vi lọc và định dạng file trước khi tải về máy tính"
                : "Choose which dataset, filter scope, and file format you want to download"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-xs tv-text-muted hover:opacity-85 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleConfirmExport} className="mt-4 space-y-4 text-xs">
          {/* Step 1: Choose Dataset */}
          <div>
            <label className="mb-1.5 block font-bold uppercase tracking-wider tv-text-muted text-[11px]">
              1. {vi ? "Chọn Dữ Liệu Cần Tải Về" : "Select Data to Download"}
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  {
                    id: "orders" as const,
                    icon: "❖",
                    title: vi ? "Lệnh Sản Xuất (Orders)" : "Work Orders",
                    desc: vi
                      ? `${data.orders.length} đơn hàng & tiến độ thêu`
                      : `${data.orders.length} production orders & status`,
                  },
                  {
                    id: "payroll" as const,
                    icon: "♟",
                    title: vi
                      ? "Bảng Lương & Nhân Sự"
                      : "Staff & Monthly Payroll",
                    desc: vi
                      ? `${allEmployees.length} nhân sự, lương & thưởng mũi`
                      : `${allEmployees.length} staff salaries & stitch bonuses`,
                  },
                  {
                    id: "inventory" as const,
                    icon: "⌇",
                    title: vi ? "Kho Chỉ & Phụ Liệu" : "Thread & Backing Stock",
                    desc: vi
                      ? `${data.inventory.length} mã vật tư & định mức tồn`
                      : `${data.inventory.length} SKUs & reorder thresholds`,
                  },
                  {
                    id: "customers" as const,
                    icon: "✦",
                    title: vi ? "Khách Hàng & Đối Tác" : "Client Accounts",
                    desc: vi
                      ? `${data.customers.length} khách hàng & doanh số`
                      : `${data.customers.length} client records & spend`,
                  },
                  {
                    id: "full_backup" as const,
                    icon: "💾",
                    title: vi
                      ? "Sao Lưu Toàn Bộ Xưởng (.JSON)"
                      : "Full Studio Backup (.JSON)",
                    desc: vi
                      ? "Tất cả đơn, mẫu .DST, máy, kho, nhân sự"
                      : "Complete snapshot of all 6 studio tables",
                  },
                ] as const
              ).map((opt) => {
                const active = dataset === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectDataset(opt.id)}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer ${
                      opt.id === "full_backup" ? "sm:col-span-2" : ""
                    } ${
                      active
                        ? "border-amber-400/80 bg-amber-500/10 shadow-xs"
                        : "tv-surface-2 tv-border hover:opacity-90"
                    }`}
                  >
                    <span className="mt-0.5 text-sm">{opt.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{opt.title}</p>
                      <p className="text-[11px] tv-text-muted truncate">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Filter Scope */}
          {dataset !== "full_backup" && (
            <div>
              <label className="mb-1.5 block font-bold uppercase tracking-wider tv-text-muted text-[11px]">
                2. {vi ? "Phạm Vi Bản Ghi" : "Record Scope"}
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setScope("all")}
                  className={`rounded-xl border px-3 py-2 text-left font-semibold transition cursor-pointer ${
                    scope === "all"
                      ? "tv-accent-bg font-bold"
                      : "tv-surface-2 tv-border"
                  }`}
                >
                  {vi ? "Tất cả bản ghi" : "All Records"}
                </button>
                <button
                  type="button"
                  onClick={() => setScope("filtered")}
                  className={`rounded-xl border px-3 py-2 text-left font-semibold transition cursor-pointer ${
                    scope === "filtered"
                      ? "tv-accent-bg font-bold"
                      : "tv-surface-2 tv-border"
                  }`}
                >
                  {vi ? "Theo bộ lọc hiện tại" : "Current Filtered View"}
                </button>
                {dataset !== "customers" && (
                  <button
                    type="button"
                    onClick={() => setScope("highlight")}
                    className={`rounded-xl border px-3 py-2 text-left font-semibold transition cursor-pointer ${
                      scope === "highlight"
                        ? "tv-accent-bg font-bold"
                        : "tv-surface-2 tv-border"
                    }`}
                  >
                    {dataset === "orders"
                      ? vi
                        ? "Chỉ đơn chưa thu đủ"
                        : "Unpaid Orders Only"
                      : dataset === "payroll"
                        ? vi
                          ? "Chỉ NV chưa tất toán"
                          : "Unpaid Staff Only"
                        : vi
                          ? "Chỉ vật tư sắp hết"
                          : "Low Stock Only"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Format & File Name */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block font-bold uppercase tracking-wider tv-text-muted text-[11px]">
                3. {vi ? "Định Dạng File" : "File Format"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={dataset === "full_backup"}
                  onClick={() => handleSelectFormat("csv")}
                  className={`rounded-xl border px-3 py-2 font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    format === "csv" && dataset !== "full_backup"
                      ? "tv-accent-bg"
                      : "tv-surface-2 tv-border"
                  }`}
                >
                  📊 CSV (Excel)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFormat("json")}
                  className={`rounded-xl border px-3 py-2 font-bold transition cursor-pointer ${
                    format === "json" || dataset === "full_backup"
                      ? "tv-accent-bg"
                      : "tv-surface-2 tv-border"
                  }`}
                >
                  {`{ } JSON`}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-bold uppercase tracking-wider tv-text-muted text-[11px]">
                {vi ? "Tên File Khi Lưu" : "Output Filename"}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  className="tv-input w-full px-3 py-2 font-mono text-xs"
                />
                <span className="tv-surface-2 tv-border rounded-lg border px-2.5 py-2 font-mono text-xs font-bold tv-accent-text">
                  .{dataset === "full_backup" ? "json" : format}
                </span>
              </div>
            </div>
          </div>

          {format === "csv" && dataset !== "full_backup" && (
            <label className="tv-surface-2 tv-border flex items-center gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeUtf8Bom}
                onChange={(e) => setIncludeUtf8Bom(e.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
              <span>
                {vi
                  ? "Nhúng chuẩn UTF-8 BOM (Giúp mở bằng Microsoft Excel không bị lỗi font Tiếng Việt)"
                  : "Include UTF-8 BOM header (Prevents Vietnamese character garbling in Microsoft Excel)"}
              </span>
            </label>
          )}

          {/* Footer Actions */}
          <div className="tv-border flex items-center justify-between gap-3 border-t pt-4">
            <span className="text-xs tv-text-muted">
              {vi
                ? `Sẵn sàng xuất ${recordCount} bản ghi → `
                : `Ready to export ${recordCount} records → `}
              <strong className="font-mono tv-accent-text">
                {finalFilename}
              </strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="tv-surface-2 tv-border rounded-xl border px-4 py-2 font-semibold hover:opacity-85 cursor-pointer"
              >
                {vi ? "Hủy" : "Cancel"}
              </button>
              <button
                type="submit"
                className="tv-accent-bg rounded-xl px-4 py-2 font-extrabold shadow-md hover:opacity-90 cursor-pointer"
              >
                ⬇ {vi ? "Xác Nhận Tải Về" : "Download File"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

