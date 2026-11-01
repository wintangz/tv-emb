"use client";

import React, { memo } from "react";
import type {
  EmbroideryDesign,
  QuoteBreakdown,
  QuoteInput,
} from "@/lib/types";
import { formatVnd } from "@/lib/currency";

export interface QuoteEstimatorTabProps {
  vi: boolean;
  designs: EmbroideryDesign[];
  quoteInput: QuoteInput;
  quoteBreakdown: QuoteBreakdown;
  quoteCompanyName: string;
  quoteGarmentName: string;
  onSetQuoteInput: (next: QuoteInput) => void;
  onSetQuoteCompanyName: (val: string) => void;
  onSetQuoteGarmentName: (val: string) => void;
  onConvertQuoteToOrder: () => void;
}

const QuoteEstimatorTab = memo(function QuoteEstimatorTab({
  vi,
  designs,
  quoteInput,
  quoteBreakdown,
  quoteCompanyName,
  quoteGarmentName,
  onSetQuoteInput,
  onSetQuoteCompanyName,
  onSetQuoteGarmentName,
  onConvertQuoteToOrder,
}: QuoteEstimatorTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7 tv-card p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold">
            {vi
              ? "Thêu Vi Tính Tường Vinh — Bảng Tính Báo Giá Gia Công Thêu (VND)"
              : "Tuong Vinh Embroidery — Stitch & Pricing Estimator (VND)"}
          </h2>
          <p className="text-xs tv-text-muted">
            {vi
              ? "Tính tự động đơn giá thêu theo bậc số lượng, phí thiết kế mẫu (digitizing), giá phôi áo và thời gian chạy máy"
              : "Calculate tiered stitch run charges, digitizing setup, blank garment markup, and machine hours"}
          </p>
        </div>

        {/* Optional Quick-Fill from Digitizing Library / .DST */}
        <div className="tv-surface-2 tv-border rounded-xl border p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="tv-text-muted font-medium">
            {vi
              ? "Lấy nhanh số mũi từ Thư Viện Mẫu (.DST):"
              : "Auto-fill stitches from Digitized Library (.DST):"}
          </span>
          <select
            defaultValue=""
            onChange={(e) => {
              const found = designs.find((d) => d.id === e.target.value);
              if (found) {
                onSetQuoteInput({
                  ...quoteInput,
                  stitchCount: found.stitchCount,
                  colorCount: found.colorSequence.length,
                  is3DPuff: found.complexity === "3D Puff",
                });
                if (found.clientName) {
                  onSetQuoteCompanyName(found.clientName);
                }
              }
            }}
            className="tv-input px-3 py-1.5 text-xs font-semibold"
          >
            <option value="">
              {vi
                ? "— Chọn mẫu thêu có sẵn để điền số mũi —"
                : "— Select a saved design to load stitch count —"}
            </option>
            {designs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} — {d.name} ({d.stitchCount.toLocaleString()}{" "}
                {vi ? "mũi" : "st"})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium tv-text-muted mb-1">
              {vi ? "Tên Khách Hàng / Công Ty" : "Client / Company Name"}
            </label>
            <input
              type="text"
              value={quoteCompanyName}
              onChange={(e) => onSetQuoteCompanyName(e.target.value)}
              className="tv-input w-full px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium tv-text-muted mb-1">
              {vi ? "Loại Phôi Áo / Nón" : "Blank Garment Item"}
            </label>
            <input
              type="text"
              value={quoteGarmentName}
              onChange={(e) => onSetQuoteGarmentName(e.target.value)}
              className="tv-input w-full px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium tv-text-muted mb-1">
              {vi ? "Số Lượng Đặt Hàng:" : "Order Quantity (Pieces):"}{" "}
              <span className="font-mono font-bold tv-accent-text">
                {quoteInput.quantity} {vi ? "cái" : "pcs"}
              </span>
            </label>
            <input
              type="range"
              min={6}
              max={300}
              step={6}
              value={quoteInput.quantity}
              onChange={(e) =>
                onSetQuoteInput({
                  ...quoteInput,
                  quantity: Number(e.target.value),
                })
              }
              className="w-full cursor-pointer"
              style={{ accentColor: "var(--tv-accent)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium tv-text-muted mb-1">
              {vi ? "Số Mũi Thêu Của Mẫu:" : "Design Stitch Count:"}{" "}
              <span className="font-mono font-bold tv-accent-text">
                {quoteInput.stitchCount.toLocaleString()} {vi ? "mũi" : "st"}
              </span>
            </label>
            <input
              type="range"
              min={2000}
              max={50000}
              step={500}
              value={quoteInput.stitchCount}
              onChange={(e) =>
                onSetQuoteInput({
                  ...quoteInput,
                  stitchCount: Number(e.target.value),
                })
              }
              className="w-full cursor-pointer"
              style={{ accentColor: "var(--tv-accent)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium tv-text-muted mb-1">
              {vi
                ? "Giá Vốn Phôi Áo (₫/cái)"
                : "Wholesale Blank Cost (VND/pc)"}
            </label>
            <input
              type="number"
              step="5000"
              value={quoteInput.garmentBlankCost}
              onChange={(e) =>
                onSetQuoteInput({
                  ...quoteInput,
                  garmentBlankCost: Number(e.target.value),
                })
              }
              className="tv-input w-full px-3 py-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium tv-text-muted mb-1">
              {vi ? "Biên Lợi Nhuận Phôi Áo (%)" : "Garment Markup (%)"}
            </label>
            <input
              type="number"
              value={quoteInput.garmentMarkupPercent}
              onChange={(e) =>
                onSetQuoteInput({
                  ...quoteInput,
                  garmentMarkupPercent: Number(e.target.value),
                })
              }
              className="tv-input w-full px-3 py-2 text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={quoteInput.needsDigitizing}
              onChange={(e) =>
                onSetQuoteInput({
                  ...quoteInput,
                  needsDigitizing: e.target.checked,
                })
              }
            />
            {vi
              ? "Tính Phí Thiết Kế Mẫu (35.000 ₫ / 1.000 mũi, tối thiểu 250.000 ₫)"
              : "Include Digitizing Setup (35,000 ₫ / 1k st, min 250,000 ₫)"}
          </label>

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={quoteInput.is3DPuff}
              onChange={(e) =>
                onSetQuoteInput({
                  ...quoteInput,
                  is3DPuff: e.target.checked,
                })
              }
            />
            {vi
              ? "Thêu Nổi 3D Mút Xốp (+15.000 ₫/cái)"
              : "3D Puff Foam Embroidery (+15,000 ₫/pc)"}
          </label>

          <label className="flex items-center gap-2 text-xs text-rose-400 cursor-pointer">
            <input
              type="checkbox"
              checked={quoteInput.rushOrder}
              onChange={(e) =>
                onSetQuoteInput({
                  ...quoteInput,
                  rushOrder: e.target.checked,
                })
              }
            />
            {vi
              ? "Đơn Gấp Lấy Nhanh 48h (+20%)"
              : "48-Hour Rush Turnaround (+20%)"}
          </label>
        </div>
      </div>

      {/* Quote Breakdown Summary Card */}
      <div className="lg:col-span-5 tv-card p-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="tv-border flex items-center justify-between border-b pb-3">
            <span className="text-xs font-bold uppercase tracking-wider tv-accent-text">
              {vi ? "Chi Tiết Báo Giá (VND)" : "Itemized Quote Summary"}
            </span>
            <span className="font-mono text-xs tv-text-muted">
              {vi ? "TG chạy máy ước tính:" : "Est. Runtime:"}{" "}
              {quoteBreakdown.estimatedProductionHours}{" "}
              {vi ? "giờ (Máy 6 Đầu)" : "hrs (6-Head)"}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="tv-text-muted">
                {vi
                  ? `Giá phôi áo (+${quoteInput.garmentMarkupPercent}% lợi nhuận):`
                  : `Garment Price (with ${quoteInput.garmentMarkupPercent}% markup):`}
              </span>
              <span className="font-mono font-semibold">
                {formatVnd(quoteBreakdown.garmentPricePerPiece)} /{" "}
                {vi ? "cái" : "pc"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="tv-text-muted">
                {vi
                  ? `Công thêu máy (${quoteInput.stitchCount.toLocaleString()} mũi):`
                  : `Embroidery Run Charge (${quoteInput.stitchCount.toLocaleString()} st):`}
              </span>
              <span className="font-mono font-semibold">
                {formatVnd(quoteBreakdown.runChargePerPiece)} /{" "}
                {vi ? "cái" : "pc"}
              </span>
            </div>
            {quoteBreakdown.puffSurchargePerPiece > 0 && (
              <div className="flex justify-between tv-accent-text">
                <span>
                  {vi ? "Phụ phí thêu nổi 3D:" : "3D Puff Foam Surcharge:"}
                </span>
                <span className="font-mono font-semibold">
                  +{formatVnd(quoteBreakdown.puffSurchargePerPiece)} /{" "}
                  {vi ? "cái" : "pc"}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="tv-text-muted">
                {vi
                  ? "Phí thiết kế mẫu (Digitizing):"
                  : "Digitizing Setup Fee:"}
              </span>
              <span className="font-mono font-semibold">
                {formatVnd(quoteBreakdown.digitizingFee)}
                {quoteInput.needsDigitizing &&
                  quoteBreakdown.digitizingFee === 0 &&
                  (vi ? " (Miễn phí đơn ≥144 cái!)" : " (Waived 144+ pcs!)")}
              </span>
            </div>
            {quoteBreakdown.rushFee > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>
                  {vi
                    ? "Phụ phí hàng gấp (20%):"
                    : "Rush Turnaround Fee (20%):"}
                </span>
                <span className="font-mono font-semibold">
                  +{formatVnd(quoteBreakdown.rushFee)}
                </span>
              </div>
            )}
          </div>

          <div className="tv-surface-2 tv-border rounded-xl border p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs tv-text-muted">
                {vi
                  ? "Đơn Giá Trọn Gói / Sản Phẩm"
                  : "Final Unit Price (All-In)"}
              </span>
              <span className="font-mono text-xl font-bold">
                {formatVnd(quoteBreakdown.finalUnitPrice)}{" "}
                <span className="text-xs font-normal tv-text-muted">
                  / {vi ? "áo" : "garment"}
                </span>
              </span>
            </div>
            <div className="tv-border mt-2 flex items-baseline justify-between border-t pt-2">
              <span className="text-xs font-semibold tv-accent-text">
                {vi
                  ? `Tổng Báo Giá (${quoteBreakdown.quantity} cái)`
                  : `Total Client Quote (${quoteBreakdown.quantity} pcs)`}
              </span>
              <span className="font-mono text-2xl font-black text-emerald-400">
                {formatVnd(quoteBreakdown.totalPrice)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onConvertQuoteToOrder}
          className="tv-accent-bg mt-6 w-full rounded-xl py-3 text-xs font-black uppercase tracking-wider shadow-lg transition hover:opacity-90 cursor-pointer"
        >
          {vi
            ? "Chuyển Báo Giá Thành Lệnh Sản Xuất →"
            : "Convert Quote to Live Work Order →"}
        </button>
      </div>
    </div>
  );
});

export default QuoteEstimatorTab;

