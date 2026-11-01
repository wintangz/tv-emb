"use client";

import React, { useState } from "react";
import type {
  EmbroideryDesign,
  EmbroideryMachine,
  EmbroideryOrder,
} from "@/lib/types";
import { PLACEMENT_TEXT, type StudioLocale } from "@/lib/i18n";
import { formatVnd } from "@/lib/currency";

interface JobTicketModalProps {
  order: EmbroideryOrder;
  design?: EmbroideryDesign;
  machine?: EmbroideryMachine;
  locale: StudioLocale;
  onClose: () => void;
  onRecordPayment: (orderId: string, amountPaid: number) => void;
}

export default function JobTicketModal({
  order,
  design,
  machine,
  locale,
  onClose,
  onRecordPayment,
}: JobTicketModalProps) {
  const [mode, setMode] = useState<"ticket" | "invoice">("ticket");
  const vi = locale === "vi";

  const balanceDue = Math.max(
    0,
    Math.round(order.totalPrice - (order.amountPaid ?? 0)),
  );

  const sizes = order.sizeBreakdown ?? {
    S: 0,
    M: order.quantity,
    L: 0,
    XL: 0,
    XXL: 0,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="tv-surface tv-border tv-text my-8 w-full max-w-3xl rounded-2xl border p-6 shadow-2xl">
        {/* Top Action Bar */}
        <div className="tv-border flex flex-wrap items-center justify-between gap-3 border-b pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("ticket")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                mode === "ticket"
                  ? "tv-accent-bg"
                  : "tv-surface-2 tv-text-muted hover:opacity-90"
              }`}
            >
              {vi
                ? "Phiếu Lệnh Sản Xuất (Xưởng Thêu)"
                : "Production Job Sheet"}
            </button>
            <button
              onClick={() => setMode("invoice")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                mode === "invoice"
                  ? "tv-accent-bg"
                  : "tv-surface-2 tv-text-muted hover:opacity-90"
              }`}
            >
              {vi
                ? "Hóa Đơn & Phiếu Giao Hàng"
                : "Client Invoice & Receipt"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(order.amountPaid ?? 0) === 0 && order.totalPrice > 0 && (
              <button
                onClick={() =>
                  onRecordPayment(order.id, Math.round(order.totalPrice * 0.5))
                }
                className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 cursor-pointer"
              >
                {vi
                  ? `Thu Cọc 50% (${formatVnd(Math.round(order.totalPrice * 0.5))})`
                  : `Record 50% Deposit (${formatVnd(Math.round(order.totalPrice * 0.5))})`}
              </button>
            )}
            {balanceDue > 0 && (
              <button
                onClick={() => onRecordPayment(order.id, order.totalPrice)}
                className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
              >
                ✓{" "}
                {vi
                  ? `Xác Nhận Đã Thu Đủ (${formatVnd(order.totalPrice)})`
                  : `Mark Paid in Full (${formatVnd(order.totalPrice)})`}
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="tv-accent-bg rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer"
            >
              🖨 {vi ? "In Phiếu / Xuất PDF" : "Print / Save PDF"}
            </button>
            <button
              onClick={onClose}
              className="tv-input px-3 py-1.5 text-xs tv-text-muted cursor-pointer"
            >
              ✕ {vi ? "Đóng" : "Close"}
            </button>
          </div>
        </div>

        {/* Document Body */}
        {mode === "ticket" ? (
          <div className="mt-5 space-y-5 text-xs">
            {/* Header */}
            <div className="tv-border flex items-start justify-between border-b pb-4">
              <div>
                <p className="tv-accent-text text-[11px] font-bold uppercase tracking-widest">
                  XƯỞNG THÊU VI TÍNH TƯỜNG VINH • TUONG VINH EMBROIDERY
                </p>
                <h2 className="mt-1 text-xl font-black">
                  {vi
                    ? "PHIẾU LỆNH SẢN XUẤT & KỸ THUẬT THÊU"
                    : "SHOP FLOOR PRODUCTION WORKSHEET"}
                </h2>
                <p className="tv-text-muted">
                  {vi
                    ? "Kèm phiếu này theo rổ hàng qua các khâu: Lên khung → Chạy máy → Cắt chỉ & Ủi QC."
                    : "Attach this traveler sheet to the garment bin through hooping, stitching, and QC."}
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="tv-surface-2 tv-border tv-accent-text inline-block rounded-lg border px-3 py-1 text-base font-black">
                  {order.orderNumber}
                </span>
                <p className="mt-1 tv-text-muted">
                  {vi ? "Hạn giao:" : "Due:"} {order.dueDate}
                </p>
                {order.rushOrder && (
                  <p className="mt-0.5 font-bold text-rose-500">
                    ★ {vi ? "ĐƠN GẤP ƯU TIÊN" : "PRIORITY RUSH ORDER"} ★
                  </p>
                )}
              </div>
            </div>

            {/* Order & Garment Specs */}
            <div className="tv-surface-2 tv-border grid grid-cols-2 gap-4 rounded-xl border p-4 sm:grid-cols-4">
              <div>
                <p className="tv-text-muted">
                  {vi ? "Khách Hàng / Công Ty" : "Client / Brand"}
                </p>
                <p className="font-bold">{order.companyName}</p>
                <p className="tv-text-muted">{order.customerName}</p>
              </div>
              <div>
                <p className="tv-text-muted">
                  {vi ? "Loại Phôi Áo / Nón" : "Garment Blank"}
                </p>
                <p className="font-bold tv-accent-text">{order.garmentType}</p>
                <p className="tv-text-muted">
                  {vi ? "Màu:" : "Color:"} {order.garmentColor}
                </p>
              </div>
              <div>
                <p className="tv-text-muted">
                  {vi ? "Vị Trí Thêu & Khung" : "Placement & Hoop"}
                </p>
                <p className="font-bold">
                  {PLACEMENT_TEXT[locale][order.placement]}
                </p>
                <p className="tv-text-muted">
                  {design?.hoopSize ?? "120x120mm Tubular"}
                </p>
              </div>
              <div>
                <p className="tv-text-muted">
                  {vi ? "Chuyền Máy Phụ Trách" : "Assigned Machine"}
                </p>
                <p className="font-bold text-emerald-500">
                  {machine?.name ?? (vi ? "Chưa phân máy" : "Unassigned Line")}
                </p>
                <p className="font-mono tv-text-muted">
                  {order.stitchCount.toLocaleString()}{" "}
                  {vi ? "mũi/áo" : "stitches/pc"}
                </p>
              </div>
            </div>

            {/* Garment Size Breakdown Table */}
            <div>
              <h4 className="mb-2 font-bold uppercase tracking-wider tv-text-muted">
                {vi
                  ? `Bảng Chia Size Hàng (Tổng: ${order.quantity} cái | Đã xong: ${order.completedQuantity} cái)`
                  : `Garment Size Breakdown (Total: ${order.quantity} pcs | Completed: ${order.completedQuantity} pcs)`}
              </h4>
              <div className="tv-surface-2 tv-border grid grid-cols-6 gap-2 rounded-xl border p-3 text-center font-mono">
                <div>
                  <p className="tv-text-muted">S</p>
                  <p className="text-sm font-bold">{sizes.S}</p>
                </div>
                <div>
                  <p className="tv-text-muted">M</p>
                  <p className="text-sm font-bold">{sizes.M}</p>
                </div>
                <div>
                  <p className="tv-text-muted">L</p>
                  <p className="text-sm font-bold">{sizes.L}</p>
                </div>
                <div>
                  <p className="tv-text-muted">XL</p>
                  <p className="text-sm font-bold">{sizes.XL}</p>
                </div>
                <div>
                  <p className="tv-text-muted">2XL</p>
                  <p className="text-sm font-bold">{sizes.XXL}</p>
                </div>
                <div className="tv-border border-l">
                  <p className="tv-accent-text">{vi ? "TỔNG" : "TOTAL"}</p>
                  <p className="text-sm font-black tv-accent-text">
                    {order.quantity} {vi ? "cái" : "pcs"}
                  </p>
                </div>
              </div>
            </div>

            {/* Needle & Thread Color Sequence */}
            <div>
              <h4 className="mb-2 font-bold uppercase tracking-wider tv-text-muted">
                {vi
                  ? `Sơ Đồ Kim & Mã Chỉ Thêu (${design?.code ?? "File DST"} • ${design?.fileFormat ?? "DST"})`
                  : `Needle & Thread Colorway Setup (${design?.code ?? "Custom File"} • ${design?.fileFormat ?? "DST"})`}
              </h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(design?.colorSequence ?? []).map((stop) => (
                  <div
                    key={stop.needle}
                    className="tv-surface-2 tv-border flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-4 w-4 rounded-full border border-slate-500"
                        style={{ backgroundColor: stop.hex }}
                      />
                      <span className="font-mono font-bold tv-accent-text">
                        {vi ? `Kim #${stop.needle}` : `Needle #${stop.needle}`}
                      </span>
                      <span className="font-semibold">{stop.name}</span>
                    </div>
                    <span className="font-mono tv-text-muted">
                      {stop.threadCode}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical & Backing Notes */}
            <div className="tv-surface-2 tv-border rounded-xl border p-3.5 space-y-1">
              <p>
                <strong className="tv-accent-text">
                  {vi ? "Ghi chú kỹ thuật & keo lót:" : "Digitizer Spec:"}
                </strong>{" "}
                {design?.digitizerNotes ??
                  "2 layers 2.5oz cutaway stabilizer; 75/11 ballpoint needles."}
              </p>
              <p>
                <strong className="tv-accent-text">
                  {vi ? "Ghi chú đơn hàng:" : "Order Notes:"}
                </strong>{" "}
                {order.notes ||
                  (vi
                    ? "Đóng bọc nilon từng áo theo size."
                    : "Standard polybag & box packing.")}
              </p>
            </div>

            {/* Shop Floor QC Sign-off Checklist */}
            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
              {(vi
                ? [
                    "1. Đã kiểm keo lót & lên khung",
                    "2. Đã duyệt mẫu thêu đầu chuyền",
                    "3. Đã cắt chỉ thừa & ủi hơi QC",
                    "4. Đã kiểm đủ số lượng & đóng gói",
                  ]
                : [
                    "1. Hooping & Backing Verified",
                    "2. First-Piece Sew-Out Approved",
                    "3. Jump Stitches Trimmed & Steamed",
                    "4. Final Count & Packed",
                  ]
              ).map((step) => (
                <div
                  key={step}
                  className="tv-surface-2 tv-border flex items-center gap-2 rounded-lg border p-2.5 text-[11px]"
                >
                  <span className="h-4 w-4 rounded border border-slate-500 inline-block shrink-0" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ================= INVOICE VIEW ================= */
          <div className="mt-5 space-y-5 text-xs">
            <div className="tv-border flex items-start justify-between border-b pb-4">
              <div>
                <p className="tv-accent-text text-[11px] font-bold uppercase tracking-widest">
                  XƯỞNG THÊU VI TÍNH TƯỜNG VINH • TUONG VINH EMBROIDERY
                </p>
                <h2 className="mt-1 text-xl font-black">
                  {vi
                    ? "HÓA ĐƠN BÁN HÀNG & PHIẾU GIAO HÀNG"
                    : "COMMERCIAL INVOICE & DELIVERY RECEIPT"}
                </h2>
                <p className="tv-text-muted">
                  {vi
                    ? "Chuyên Thêu Vi Tính Đồng Phục, Nón, Áo Khoác, Logo Rời & Thiết Kế Mẫu Thêu"
                    : "Custom Commercial Embroidery • Digitizing • Team & Corporate Apparel"}
                </p>
              </div>
              <div className="text-right font-mono">
                <p className="text-sm font-bold">
                  {vi ? "Số HĐ:" : "Invoice"} #{order.orderNumber}
                </p>
                <p className="tv-text-muted">
                  {vi ? "Ngày lập:" : "Issued:"} {order.createdAt}
                </p>
                <p className="tv-text-muted">
                  {vi ? "Hạn giao:" : "Due Date:"} {order.dueDate}
                </p>
              </div>
            </div>

            <div className="tv-surface-2 tv-border grid grid-cols-2 gap-4 rounded-xl border p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tv-text-muted">
                  {vi ? "Khách Hàng / Đơn Vị Nhận" : "Bill To"}
                </p>
                <p className="mt-1 text-sm font-bold">{order.companyName}</p>
                <p className="tv-text-muted">
                  {vi ? "Người liên hệ:" : "Attn:"} {order.customerName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tv-text-muted">
                  {vi ? "Trạng Thái Thanh Toán" : "Payment Status"}
                </p>
                <p
                  className={`mt-1 text-sm font-black ${
                    balanceDue <= 0
                      ? "text-emerald-500"
                      : order.amountPaid > 0
                        ? "text-amber-500"
                        : "text-rose-500"
                  }`}
                >
                  {balanceDue <= 0
                    ? vi
                      ? "ĐÃ THANH TOÁN ĐỦ"
                      : "PAID IN FULL"
                    : order.amountPaid > 0
                      ? vi
                        ? "ĐÃ ĐẶT CỌC"
                        : "PARTIAL DEPOSIT PAID"
                      : vi
                        ? "CHƯA THANH TOÁN"
                        : "UNPAID — BALANCE DUE"}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="tv-border overflow-hidden rounded-xl border">
              <table className="w-full text-left">
                <thead className="tv-surface-2 text-[11px] uppercase tv-text-muted">
                  <tr>
                    <th className="px-4 py-2.5">
                      {vi ? "Hạng Mục Hàng Hóa / Gia Công Thêu" : "Description"}
                    </th>
                    <th className="px-4 py-2.5 text-right">
                      {vi ? "Số Lượng" : "Qty"}
                    </th>
                    <th className="px-4 py-2.5 text-right">
                      {vi ? "Đơn Giá (VNĐ)" : "Unit Price (VND)"}
                    </th>
                    <th className="px-4 py-2.5 text-right">
                      {vi ? "Thành Tiền (VNĐ)" : "Line Total (VND)"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y tv-border">
                  <tr>
                    <td className="px-4 py-3">
                      <p className="font-bold">
                        {order.garmentType} ({order.garmentColor})
                      </p>
                      <p className="tv-text-muted">
                        {vi ? "Mẫu thêu:" : "Embroidery:"} {order.designName} •{" "}
                        {PLACEMENT_TEXT[locale][order.placement]} (
                        {order.stitchCount.toLocaleString()}{" "}
                        {vi ? "mũi/cái" : "stitches/pc"})
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {order.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatVnd(order.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {formatVnd(order.quantity * order.unitPrice)}
                    </td>
                  </tr>
                  {order.digitizingFee > 0 && (
                    <tr>
                      <td className="px-4 py-3">
                        <p className="font-bold">
                          {vi
                            ? "Phí Thiết Kế Mẫu Thêu Vi Tính (Digitizing) & Thêu Mẫu Thử"
                            : "Embroidery Digitizing & Sample Sew-Out Setup"}
                        </p>
                        <p className="tv-text-muted">
                          {vi ? "Mã file:" : "Production file:"} (
                          {design?.code ?? "DST"})
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">1</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatVnd(order.digitizingFee)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {formatVnd(order.digitizingFee)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end">
              <div className="tv-surface-2 tv-border w-80 space-y-2 rounded-xl border p-4 font-mono">
                <div className="flex justify-between tv-text-muted">
                  <span>{vi ? "Tổng Cộng Hóa Đơn:" : "Invoice Total:"}</span>
                  <span className="font-bold tv-text">
                    {formatVnd(order.totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-500">
                  <span>{vi ? "Đã Thanh Toán / Cọc:" : "Amount Paid:"}</span>
                  <span>-{formatVnd(order.amountPaid ?? 0)}</span>
                </div>
                <div className="tv-border flex justify-between border-t pt-2 text-sm font-black tv-accent-text">
                  <span>{vi ? "Còn Lại Phải Thu:" : "Balance Due:"}</span>
                  <span>{formatVnd(balanceDue)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
