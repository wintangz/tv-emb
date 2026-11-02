"use client";

import { memo } from "react";
import type {
  EmbroideryDesign,
  QuoteBreakdown,
  QuoteInput,
  ShippingMode,
} from "@/lib/types";
import { formatVnd } from "@/lib/currency";
import ModernSelect from "../ModernSelect";

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
  const shippingMode: ShippingMode = quoteInput.shippingMode ?? "LOCAL_2_WAY";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7 tv-card p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold">
            {vi
              ? "Xưởng Thêu Tường Vinh — Bảng Tính Báo Giá, Định Mức Chỉ & Chi Phí Vận Chuyển"
              : "Tuong Vinh Embroidery — Quote, Thread Norm & Transport Calculator"}
          </h2>
          <p className="text-xs tv-text-muted">
            {vi
              ? "Thiết kế chương trình .DST & thêu mẫu duyệt miễn phí (0₫) • Khách duyệt mẫu xuống đơn → Tính định mức chỉ trên (theo số mũi hoặc tùy chọn sang chỉ 20 đầu), mút EVA 3D và chi phí vận chuyển"
              : "Free .DST digitizing & sample sew-out (0₫) • Upon approval, calculates upper thread norm (by stitch count or optional 20-head splitting), 3D EVA foam, and transport fees"}
          </p>
        </div>

        {/* Optional Quick-Fill from Digitizing Library / .DST */}
        <div className="tv-surface-2 tv-border rounded-xl border p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="tv-text-muted font-medium">
            {vi
              ? "Chọn chương trình thêu (.DST) trong thư viện để nạp nhanh số mũi & số màu chỉ:"
              : "Load stitch & needle count from the .DST design library:"}
          </span>
          <ModernSelect
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
            className="px-3 py-1.5 text-xs font-semibold"
          >
            <option value="">
              {vi
                ? "— Chọn mẫu thêu có sẵn để điền số mũi —"
                : "— Select a saved design to load stitch count —"}
            </option>
            {designs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} — {d.name} ({d.stitchCount.toLocaleString()}{" "}
                {vi ? "mũi" : "st"} • {d.colorSequence.length}{" "}
                {vi ? "màu" : "colors"})
              </option>
            ))}
          </ModernSelect>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium tv-text-muted mb-1">
              {vi ? "Tên Khách Hàng / Xưởng May" : "Client / Garment Factory"}
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
              {vi
                ? "Mặt Hàng Cắt Bán Thành Phẩm / Nón"
                : "Cut Garment Panels / Cap Style"}
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
              {vi ? "Số Lượng Đơn Hàng:" : "Order Quantity (Pieces):"}{" "}
              <span className="font-mono font-bold tv-accent-text">
                {quoteInput.quantity} {vi ? "cái" : "pcs"}
              </span>
            </label>
            <input
              type="range"
              min={20}
              max={500}
              step={10}
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
                ? "Số Màu Chỉ Trên (Tối đa 9 kim/đầu):"
                : "Upper Thread Colors (Max 9 needles):"}{" "}
              <span className="font-mono font-bold tv-accent-text">
                {quoteInput.colorCount} {vi ? "màu" : "colors"}
                {quoteInput.splitThreadFor20Heads
                  ? ` (= ${quoteInput.colorCount * 20} ${vi ? "cuộn sang lên 20 đầu" : "sub-cones on 20 heads"})`
                  : ""}
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={9}
              step={1}
              value={quoteInput.colorCount}
              onChange={(e) =>
                onSetQuoteInput({
                  ...quoteInput,
                  colorCount: Number(e.target.value),
                })
              }
              className="w-full cursor-pointer"
              style={{ accentColor: "var(--tv-accent)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium tv-text-muted mb-1">
              {vi
                ? "Giá Phôi Áo (Để 0 ₫ nếu khách giao hàng cắt bán thành phẩm)"
                : "Blank Garment Cost (Set 0 ₫ if client supplies cut panels)"}
            </label>
            <input
              type="number"
              step="5000"
              min={0}
              value={quoteInput.garmentBlankCost}
              onChange={(e) =>
                onSetQuoteInput({
                  ...quoteInput,
                  garmentBlankCost: Math.max(0, Number(e.target.value)),
                })
              }
              className="tv-input w-full px-3 py-2 text-xs font-mono"
            />
          </div>
        </div>

        {/* External Vehicle / Chành Xe Shipping Rule */}
        <div className="tv-surface-2 tv-border rounded-xl border p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider tv-accent-text">
              🚚{" "}
              {vi
                ? "Phương Thức Vận Chuyển & Giao Nhận Hàng (Thuê Xe Ngoài)"
                : "External Vehicle Transport Rules"}
            </label>
            <span className="font-mono text-xs font-bold text-amber-400">
              {vi ? "Phí xưởng chịu:" : "Workshop pays:"}{" "}
              {formatVnd(quoteBreakdown.shippingCost)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
            <button
              type="button"
              onClick={() =>
                onSetQuoteInput({
                  ...quoteInput,
                  shippingMode: "LOCAL_2_WAY",
                  shippingCost: 300000,
                })
              }
              className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                shippingMode === "LOCAL_2_WAY"
                  ? "tv-accent-bg border-transparent font-bold"
                  : "tv-surface tv-border tv-text"
              }`}
            >
              <div>
                {vi
                  ? "Khách Nội Thành / Lân Cận (Chịu Phí Xe Ngoài 2 Chiều)"
                  : "Local Client (Workshop Pays 2-Way External Vehicle)"}
              </div>
              <div className="text-[10px] opacity-80 mt-0.5">
                {vi
                  ? "Điều phối xe vận chuyển nhận bán thành phẩm về xưởng + giao thành phẩm hoàn thiện"
                  : "Pickup cut fabric panels + deliver finished embroidery"}
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onSetQuoteInput({
                  ...quoteInput,
                  shippingMode: "CHANH_XE_PICKUP",
                  shippingCost: 150000,
                })
              }
              className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                shippingMode === "CHANH_XE_PICKUP"
                  ? "tv-accent-bg border-transparent font-bold"
                  : "tv-surface tv-border tv-text"
              }`}
            >
              <div>
                {vi
                  ? "Khách Ở Tỉnh (Chỉ Chịu 1 Chiều Chành Xe Về Xưởng)"
                  : "Provincial Client (Only 1-Way Chành Xe Pickup to Shop)"}
              </div>
              <div className="text-[10px] opacity-80 mt-0.5">
                {vi
                  ? "Không chịu phí gửi ra chành xe; chỉ chịu phí từ chành xe chở về xưởng"
                  : "Client pays inter-province & outbound depot fee; we only pay depot-to-shop"}
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1 text-xs">
            <span className="tv-text-muted">
              {vi
                ? "Chi phí vận chuyển xưởng chịu (₫):"
                : "External transport fee paid by workshop (VND):"}
            </span>
            <input
              type="number"
              step="10000"
              min={0}
              value={quoteBreakdown.shippingCost}
              onChange={(e) =>
                onSetQuoteInput({
                  ...quoteInput,
                  shippingCost: Math.max(0, Number(e.target.value)),
                })
              }
              className="tv-input w-36 px-2.5 py-1 font-mono text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <span className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
            ✓{" "}
            {vi
              ? "Thêu Mẫu Duyệt & Thiết Kế Chương Trình .DST: 0 ₫ (Miễn Phí)"
              : "Sample Sew-Out & .DST Digitizing: 0 ₫ (Free)"}
          </span>

          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(quoteInput.splitThreadFor20Heads)}
              onChange={(e) =>
                onSetQuoteInput({
                  ...quoteInput,
                  splitThreadFor20Heads: e.target.checked,
                })
              }
            />
            {vi
              ? "Trường hợp màu chỉ mới cần mua & sang ra 20 cuộn lắp đủ 20 đầu máy (Tối thiểu 5 cuộn nguyên/màu)"
              : "Optional circumstance: New thread color requires 20-head cone splitting (Min 5 master cones/color)"}
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
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
              ? "Hàng Thêu Nổi 3D (Tính thêm định mức mua Mút EVA / Mouse +15.000 ₫/cái)"
              : "3D Puff Embroidery (Add EVA Foam / Mouse norm +15,000 ₫/pc)"}
          </label>

          <label className="flex items-center gap-2 text-xs text-rose-400 font-semibold cursor-pointer">
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
              ? "Đơn Hàng Gấp Ưu Tiên (+20%)"
              : "Priority Rush Order (+20%)"}
          </label>
        </div>
      </div>

      {/* Quote Breakdown & Thread Norm Card */}
      <div className="lg:col-span-5 tv-card p-6 flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          <div className="tv-border flex items-center justify-between border-b pb-3">
            <span className="text-xs font-bold uppercase tracking-wider tv-accent-text">
              {vi
                ? "Báo Giá & Định Mức Vật Tư Đơn Hàng"
                : "Quote & Order Material Norm"}
            </span>
            <span className="font-mono text-xs tv-text-muted">
              {vi ? "TG chạy máy:" : "Est. Runtime:"}{" "}
              {quoteBreakdown.estimatedProductionHours}{" "}
              {vi ? "giờ (Tajima 20 Đầu)" : "hrs (20-Head Tajima)"}
            </span>
          </div>

          {/* Upper Thread Norm Box */}
          <div className="tv-surface-2 tv-border rounded-xl border p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold tv-accent-text">
                🧵{" "}
                {quoteInput.splitThreadFor20Heads
                  ? vi
                    ? "Định Mức Chỉ Trên (Trường Hợp Sang Chỉ 20 Đầu)"
                    : "Upper-Thread Norm (20-Head Cone-Splitting Case)"
                  : vi
                    ? "Định Mức Chỉ Trên (Theo Số Mũi Thêu)"
                    : "Upper-Thread Norm (By Stitch Consumption)"}
              </span>
              <span className="font-mono font-bold">
                {quoteInput.colorCount} {vi ? "màu chỉ" : "colors"}
              </span>
            </div>
            <p className="text-[11px] tv-text-muted leading-relaxed">
              {quoteInput.splitThreadFor20Heads
                ? vi
                  ? `Mỗi màu theo số mũi chỉ hao ~${quoteBreakdown.theoreticalConesPerColor} cuộn, nhưng trong trường hợp màu chỉ mới cần sang đủ 20 đầu máy thì đặt tối thiểu ${quoteBreakdown.masterConesPerColor} cuộn nguyên/màu để sang ra 20 cuộn con.`
                  : `Stitch length uses ~${quoteBreakdown.theoreticalConesPerColor} cones/color; with 20-head splitting enabled, orders at least ${quoteBreakdown.masterConesPerColor} master cones/color to rewind into 20 sub-cones.`
                : vi
                  ? `Tính theo tổng số mũi thêu của đơn hàng (~${quoteBreakdown.theoreticalConesPerColor} cuộn/màu). Nếu gặp trường hợp màu chỉ mới cần sang đủ 20 đầu máy, bật tùy chọn sang chỉ ở bên trái.`
                  : `Calculated directly from total stitch length (~${quoteBreakdown.theoreticalConesPerColor} cones/color). Toggle the 20-head cone splitting option on the left only when needed.`}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="tv-surface tv-border rounded-lg border p-2">
                <span className="text-[10px] uppercase tv-text-muted block">
                  {vi ? "Số Cuộn Chỉ Cần Đặt" : "Thread Cones to Buy"}
                </span>
                <span className="font-mono text-sm font-black text-amber-400">
                  {quoteBreakdown.totalMasterConesToBuy}{" "}
                  {vi
                    ? `cuộn (${quoteInput.colorCount} màu × ${quoteBreakdown.masterConesPerColor}c)`
                    : "cones"}
                </span>
              </div>
              <div className="tv-surface tv-border rounded-lg border p-2">
                <span className="text-[10px] uppercase tv-text-muted block">
                  {quoteInput.splitThreadFor20Heads
                    ? vi
                      ? "Sang Ra Lên 20 Đầu Máy"
                      : "Rewound for 20 Heads"
                    : vi
                      ? "Chế Độ Tính Định Mức"
                      : "Norm Mode"}
                </span>
                <span className="font-mono text-sm font-black text-emerald-400">
                  {quoteInput.splitThreadFor20Heads
                    ? `${quoteBreakdown.totalSubConesFor20Heads} ${vi ? "cuộn con (20 đầu)" : "sub-cones"}`
                    : vi
                      ? "Theo số mũi thực tế"
                      : "By actual stitches"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="tv-text-muted">
                {vi
                  ? `Đơn giá gia công thêu (${quoteInput.stitchCount.toLocaleString()} mũi):`
                  : `Embroidery Run Charge (${quoteInput.stitchCount.toLocaleString()} st):`}
              </span>
              <span className="font-mono font-semibold">
                {formatVnd(quoteBreakdown.runChargePerPiece)} /{" "}
                {vi ? "cái" : "pc"}
              </span>
            </div>
            {quoteBreakdown.garmentPricePerPiece > 0 && (
              <div className="flex justify-between">
                <span className="tv-text-muted">
                  {vi ? "Giá phôi áo:" : "Garment Blank Price:"}
                </span>
                <span className="font-mono font-semibold">
                  {formatVnd(quoteBreakdown.garmentPricePerPiece)} /{" "}
                  {vi ? "cái" : "pc"}
                </span>
              </div>
            )}
            {quoteBreakdown.puffSurchargePerPiece > 0 && (
              <div className="flex justify-between tv-accent-text">
                <span>
                  {vi
                    ? "Phụ phí thêu nổi 3D (Mút EVA / Mouse):"
                    : "3D Puff EVA Foam Surcharge:"}
                </span>
                <span className="font-mono font-semibold">
                  +{formatVnd(quoteBreakdown.puffSurchargePerPiece)} /{" "}
                  {vi ? "cái" : "pc"}
                </span>
              </div>
            )}
            <div className="flex justify-between text-emerald-400">
              <span>
                {vi
                  ? "Chi phí làm mẫu thử & vẽ chương trình .DST:"
                  : "Sample & .DST Digitizing Fee:"}
              </span>
              <span className="font-mono font-bold">
                0 ₫ ({vi ? "Miễn phí" : "Free"})
              </span>
            </div>
            {quoteBreakdown.rushFee > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>
                  {vi ? "Phụ phí hàng gấp (+20%):" : "Rush Order Fee (+20%):"}
                </span>
                <span className="font-mono font-semibold">
                  +{formatVnd(quoteBreakdown.rushFee)}
                </span>
              </div>
            )}
          </div>

          {/* Revenue - Direct Cost = Order Net Profit Box */}
          <div className="tv-surface-2 tv-border rounded-xl border p-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs tv-text-muted">
                {vi ? "Đơn Giá Báo Khách / Cái" : "Client Unit Price"}
              </span>
              <span className="font-mono text-lg font-bold">
                {formatVnd(quoteBreakdown.finalUnitPrice)}{" "}
                <span className="text-xs font-normal tv-text-muted">
                  / {vi ? "cái" : "pc"}
                </span>
              </span>
            </div>
            <div className="tv-border flex items-baseline justify-between border-t pt-2">
              <span className="text-xs font-semibold tv-accent-text">
                {vi
                  ? `Tổng Doanh Thu Đơn (${quoteBreakdown.quantity} cái)`
                  : `Total Order Revenue (${quoteBreakdown.quantity} pcs)`}
              </span>
              <span className="font-mono text-xl font-black text-emerald-400">
                {formatVnd(quoteBreakdown.totalPrice)}
              </span>
            </div>

            <div className="tv-border border-t pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between tv-text-muted">
                <span>
                  {vi
                    ? `− Tiền mua chỉ trên (${quoteBreakdown.totalMasterConesToBuy} cuộn nguyên):`
                    : `− Upper thread cost (${quoteBreakdown.totalMasterConesToBuy} cones):`}
                </span>
                <span className="font-mono text-amber-400">
                  -{formatVnd(quoteBreakdown.estimatedThreadCost)}
                </span>
              </div>
              {quoteBreakdown.estimatedEvaFoamCost > 0 && (
                <div className="flex justify-between tv-text-muted">
                  <span>
                    {vi
                      ? "− Tiền mua Mút EVA (Mouse 3D):"
                      : "− 3D Puff EVA Foam cost:"}
                  </span>
                  <span className="font-mono text-amber-400">
                    -{formatVnd(quoteBreakdown.estimatedEvaFoamCost)}
                  </span>
                </div>
              )}
              <div className="flex justify-between tv-text-muted">
                <span>
                  {vi
                    ? "− Phụ liệu (Chỉ dưới, kim, băng keo, dựng):"
                    : "− Consumables (Bobbin, needles, tape, backing):"}
                </span>
                <span className="font-mono text-amber-400">
                  -{formatVnd(quoteBreakdown.estimatedConsumablesCost)}
                </span>
              </div>
              <div className="flex justify-between tv-text-muted">
                <span>
                  {shippingMode === "CHANH_XE_PICKUP"
                    ? vi
                      ? "− Phí vận chuyển 1 chiều (Chành xe → Xưởng):"
                      : "− 1-way Chành Xe pickup fee:"
                    : vi
                      ? "− Phí thuê xe vận chuyển 2 chiều (Nhận & Giao):"
                      : "− 2-way external vehicle fee:"}
                </span>
                <span className="font-mono text-amber-400">
                  -{formatVnd(quoteBreakdown.shippingCost)}
                </span>
              </div>
              <div className="tv-border flex justify-between border-t pt-1.5 text-xs font-extrabold">
                <span>
                  {vi
                    ? "= Lợi Nhuận Đơn Hàng (Đã Trừ Vật Tư & Xe):"
                    : "= Net Order Profit (After Materials & Transport):"}
                </span>
                <span className="font-mono text-emerald-400">
                  {formatVnd(quoteBreakdown.estimatedOrderNetProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onConvertQuoteToOrder}
          className="tv-accent-bg w-full rounded-xl py-3 text-xs font-black uppercase tracking-wider shadow-lg transition hover:opacity-90 cursor-pointer"
        >
          {vi
            ? "Khách Duyệt Mẫu OK → Xuống Đơn & Đặt Chỉ →"
            : "Sample Approved → Create Work Order →"}
        </button>
      </div>
    </div>
  );
});

export default QuoteEstimatorTab;
