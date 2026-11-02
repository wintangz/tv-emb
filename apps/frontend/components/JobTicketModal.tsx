"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  EmbroideryDesign,
  EmbroideryMachine,
  EmbroideryOrder,
} from "@/lib/types";
import { PLACEMENT_TEXT, type StudioLocale } from "@/lib/i18n";
import { formatVnd } from "@/lib/currency";
import { calculateOrderMaterialAndProfit } from "@/lib/seed-data";
import DesignHoopPreview from "./DesignHoopPreview";
import ModernSelect from "./ModernSelect";

interface JobTicketModalProps {
  order: EmbroideryOrder;
  design?: EmbroideryDesign;
  machine?: EmbroideryMachine;
  locale: StudioLocale;
  canViewFinancials?: boolean;
  onClose: () => void;
  onRecordPayment: (orderId: string, amountPaid: number) => void;
  onApproveProofToProduction?: (order: EmbroideryOrder) => void;
  onAdjustDefectCount?: (order: EmbroideryOrder, delta: number) => void;
}

/**
 * Generates a deterministic 21x21 QR-style matrix from a string seed
 * so the printable Job Ticket & offline VietQR fallback always render a crisp SVG QR code.
 */
function generateDeterministicQrMatrix(seedStr: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft || r === 6 || c === 6) {
        continue;
      }
      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (Math.abs(hash) & 3) !== 0;
    }
  }

  return grid;
}

export default function JobTicketModal({
  order,
  design,
  machine,
  locale,
  canViewFinancials = true,
  onClose,
  onRecordPayment,
  onApproveProofToProduction,
  onAdjustDefectCount,
}: JobTicketModalProps) {
  const [mode, setMode] = useState<"ticket" | "proof" | "invoice">("ticket");
  const [vatPercent, setVatPercent] = useState<0 | 8 | 10>(8);
  const [bankId, setBankId] = useState<string>("VCB");
  const [accountNo, setAccountNo] = useState<string>("0071001288999");
  const [accountName] = useState<string>(
    "CONG TY TNHH THEU VI TINH TUONG VINH",
  );
  const [qrImgFailed, setQrImgFailed] = useState<boolean>(false);

  const vi = locale === "vi";

  const subtotalPrice = order.totalPrice;
  const vatAmount = Math.round((subtotalPrice * vatPercent) / 100);
  const grandTotalWithVat = subtotalPrice + vatAmount;

  const balanceDue = Math.max(
    0,
    Math.round(grandTotalWithVat - (order.amountPaid ?? 0)),
  );

  const sizes = order.sizeBreakdown ?? {
    S: 0,
    M: order.quantity,
    L: 0,
    XL: 0,
    XXL: 0,
  };

  const estimatedThreadMeters =
    order.threadMetersUsed && order.threadMetersUsed > 0
      ? order.threadMetersUsed
      : Math.round(order.quantity * (order.stitchCount / 1000) * 5.2);

  const matNorm = useMemo(
    () => calculateOrderMaterialAndProfit(order),
    [order],
  );

  const transferMemo = `TT DON ${order.orderNumber}`;
  const vietQrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${balanceDue > 0 ? balanceDue : grandTotalWithVat}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(accountName)}`;

  const qrMatrix = useMemo(
    () =>
      generateDeterministicQrMatrix(
        `${order.orderNumber}|${bankId}|${accountNo}|${balanceDue}`,
      ),
    [order.orderNumber, bankId, accountNo, balanceDue],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="tv-surface tv-border tv-text my-8 w-full max-w-4xl rounded-2xl border p-6 shadow-2xl"
      >
        {/* Top Action Bar */}
        <div className="tv-border flex flex-wrap items-center justify-between gap-3 border-b pb-4 print:hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setMode("ticket")}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                mode === "ticket"
                  ? "tv-accent-bg border-transparent"
                  : "tv-surface-2 tv-border tv-text-muted hover:opacity-90"
              }`}
            >
              <span aria-hidden="true">⚙</span>
              <span>{vi ? "1. Phiếu Lệnh SX (Xưởng)" : "1. Shop Job Ticket"}</span>
            </button>
            <button
              onClick={() => setMode("proof")}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                mode === "proof"
                  ? "tv-accent-bg border-transparent"
                  : "tv-surface-2 tv-border tv-text-muted hover:opacity-90"
              }`}
            >
              <span aria-hidden="true">◎</span>
              <span>{vi ? "2. Phiếu Duyệt Mẫu (Zalo)" : "2. Client Sample Proof"}</span>
            </button>
            {canViewFinancials && (
              <button
                onClick={() => setMode("invoice")}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                  mode === "invoice"
                    ? "tv-accent-bg border-transparent"
                    : "tv-surface-2 tv-border tv-text-muted hover:opacity-90"
                }`}
              >
                <span aria-hidden="true">₫</span>
                <span>
                  {vi
                    ? "3. Hóa Đơn VAT & VietQR"
                    : "3. VAT Invoice & VietQR"}
                </span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canViewFinancials &&
              (order.amountPaid ?? 0) === 0 &&
              order.totalPrice > 0 && (
                <button
                  onClick={() =>
                    onRecordPayment(
                      order.id,
                      Math.round(order.totalPrice * 0.5),
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 cursor-pointer"
                >
                  {vi
                    ? `Thu Cọc 50% (${formatVnd(Math.round(order.totalPrice * 0.5))})`
                    : `Record 50% Deposit (${formatVnd(Math.round(order.totalPrice * 0.5))})`}
                </button>
              )}
            {canViewFinancials && balanceDue > 0 && (
              <button
                onClick={() => onRecordPayment(order.id, grandTotalWithVat)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
              >
                <span aria-hidden="true">✓</span>
                <span>
                  {vi
                    ? `Xác Nhận Thu Đủ (${formatVnd(grandTotalWithVat)})`
                    : `Mark Paid in Full (${formatVnd(grandTotalWithVat)})`}
                </span>
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="tv-accent-bg inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold cursor-pointer"
            >
              <span aria-hidden="true">🖨</span>
              <span>{vi ? "In Phiếu / Xuất PDF" : "Print / Save PDF"}</span>
            </button>
            <button
              onClick={onClose}
              className="tv-input inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold tv-text-muted cursor-pointer"
            >
              <span aria-hidden="true">✕</span>
              <span>{vi ? "Đóng" : "Close"}</span>
            </button>
          </div>
        </div>

        {/* ================= MODE 1: SHOP-FLOOR JOB TICKET ================= */}
        {mode === "ticket" && (
          <div className="mt-5 space-y-5 text-xs">
            {/* Header with QR Traveler Code */}
            <div className="tv-border flex flex-wrap items-start justify-between gap-4 border-b pb-4">
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
                    ? "Kèm phiếu này theo rổ hàng qua các khâu: Lên khung → Chạy máy → Cắt chỉ & Ủi QC (Không hiển thị giá)."
                    : "Attach this traveler sheet to the garment bin through hooping, stitching, and QC (Prices hidden)."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <span className="tv-surface-2 tv-border tv-accent-text inline-block rounded-lg border px-3 py-1 text-base font-black">
                    {order.orderNumber}
                  </span>
                  <p className="mt-1 tv-text-muted">
                    {vi ? "Hạn giao:" : "Due:"} {order.dueDate}
                  </p>
                  {order.rushOrder && (
                    <p className="mt-0.5 font-bold text-rose-500">
                      ★ {vi ? "ĐƠN GẤP ƯU TIÊN" : "PRIORITY RUSH"} ★
                    </p>
                  )}
                </div>

                {/* Deterministic SVG QR Code for Shop Floor Scanner */}
                <div
                  className="rounded-lg bg-white p-1.5 shadow-sm border border-slate-300"
                  title={`QR: ${order.orderNumber}`}
                >
                  <svg
                    viewBox="0 0 21 21"
                    className="h-14 w-14"
                    shapeRendering="crispEdges"
                  >
                    {qrMatrix.map((row, rIdx) =>
                      row.map((cell, cIdx) =>
                        cell ? (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={cIdx}
                            y={rIdx}
                            width={1}
                            height={1}
                            fill="#0f172a"
                          />
                        ) : null,
                      ),
                    )}
                  </svg>
                </div>
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

            {/* Garment Size Breakdown & Spoilage / Thread Telemetry */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-8">
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

              <div className="md:col-span-4">
                <h4 className="mb-2 font-bold uppercase tracking-wider tv-text-muted">
                  {vi
                    ? "Định Mức Chỉ & Hàng Lỗi QC"
                    : "Thread Usage & QC Spoilage"}
                </h4>
                <div className="tv-surface-2 tv-border rounded-xl border p-3 flex items-center justify-between">
                  <div>
                    <p className="tv-text-muted text-[11px]">
                      {vi
                        ? "Định mức chỉ trên:"
                        : "Upper Thread Norm:"}
                    </p>
                    <p className="font-mono text-sm font-bold tv-accent-text">
                      {matNorm.totalMasterConesToBuy} {vi ? "cuộn" : "cones"}
                      {matNorm.splitThreadFor20Heads
                        ? ` → ${matNorm.totalSubConesFor20Heads} ${vi ? "c/20 đầu" : "sub-cones"}`
                        : ` (${order.colorCount} ${vi ? "màu" : "colors"})`}
                    </p>
                    <p className="font-mono text-[10px] tv-text-muted">
                      ~{estimatedThreadMeters.toLocaleString()}m{" "}
                      {matNorm.is3dPuff ? "• +Mút EVA 3D" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tv-text-muted text-[11px]">
                      {vi ? "Hàng lỗi / Đền phôi:" : "Defects / Spoilage:"}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span
                        className={`font-mono text-sm font-bold ${
                          (order.defectQuantity ?? 0) > 0
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {order.defectQuantity ?? 0} {vi ? "cái" : "pcs"}
                      </span>
                      {onAdjustDefectCount && (
                        <div className="flex gap-1 print:hidden">
                          <button
                            onClick={() => onAdjustDefectCount(order, -1)}
                            className="tv-surface tv-border rounded border px-1.5 py-0.5 text-[10px] cursor-pointer"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => onAdjustDefectCount(order, 1)}
                            className="rounded border border-rose-500/40 bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 cursor-pointer"
                          >
                            +1 {vi ? "Lỗi" : "Err"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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
        )}

        {/* ================= MODE 2: CLIENT SAMPLE APPROVAL PROOF (ZALO) ================= */}
        {mode === "proof" && (
          <div className="mt-5 space-y-5 text-xs">
            <div className="tv-border flex flex-wrap items-start justify-between gap-4 border-b pb-4">
              <div>
                <p className="tv-accent-text text-[11px] font-bold uppercase tracking-widest">
                  XƯỞNG THÊU VI TÍNH TƯỜNG VINH • PHIẾU DUYỆT MẪU THÊU (ZALO /
                  EMAIL)
                </p>
                <h2 className="mt-1 text-xl font-black">
                  {vi
                    ? "PHIẾU XÁC NHẬN MẪU THÊU TRƯỚC SẢN XUẤT HÀNG LOẠT"
                    : "CLIENT EMBROIDERY PROOF & SEW-OUT SIGN-OFF"}
                </h2>
                <p className="tv-text-muted">
                  {vi
                    ? "Quý khách vui lòng kiểm tra kỹ kích thước (mm), vị trí thêu và mã màu chỉ trước khi xưởng tiến hành chạy hàng loạt."
                    : "Please verify exact millimeter dimensions, placement, and thread colors before bulk production."}
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="tv-surface-2 tv-border tv-accent-text inline-block rounded-lg border px-3 py-1 text-sm font-black">
                  {order.orderNumber}
                </span>
                <p className="mt-1 tv-text-muted">
                  {vi ? "Mã mẫu:" : "Design Code:"}{" "}
                  <strong>{design?.code ?? "TV-DST"}</strong>
                </p>
              </div>
            </div>

            {/* Large Visual Hoop Preview + Exact Technical Spec */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-12 items-center">
              <div className="md:col-span-5 flex flex-col items-center justify-center tv-surface-2 tv-border rounded-2xl border p-5">
                {design ? (
                  <DesignHoopPreview design={design} size="lg" />
                ) : (
                  <div className="h-48 w-48 flex items-center justify-center rounded-full border tv-border tv-text-muted">
                    {order.designName}
                  </div>
                )}
                <p className="mt-3 font-mono text-xs font-bold tv-accent-text">
                  {design
                    ? `${design.widthMm} mm (W) × ${design.heightMm} mm (H)`
                    : "95 mm × 60 mm"}
                </p>
                <p className="text-[11px] tv-text-muted">
                  {vi
                    ? `Mô phỏng tỉ lệ khung ${design?.hoopSize ?? "120x120mm"}`
                    : `Simulated in ${design?.hoopSize ?? "120x120mm"} hoop`}
                </p>
              </div>

              <div className="md:col-span-7 space-y-3">
                <div className="tv-surface-2 tv-border grid grid-cols-2 gap-3 rounded-xl border p-4">
                  <div>
                    <span className="tv-text-muted block text-[11px]">
                      {vi ? "Khách Hàng / Thương Hiệu:" : "Client / Brand:"}
                    </span>
                    <span className="font-bold text-sm">
                      {order.companyName}
                    </span>
                  </div>
                  <div>
                    <span className="tv-text-muted block text-[11px]">
                      {vi ? "Tên Mẫu Thêu:" : "Design Title:"}
                    </span>
                    <span className="font-bold text-sm tv-accent-text">
                      {order.designName}
                    </span>
                  </div>
                  <div>
                    <span className="tv-text-muted block text-[11px]">
                      {vi ? "Sản Phẩm & Màu Vải:" : "Garment & Color:"}
                    </span>
                    <span className="font-semibold">
                      {order.garmentType} ({order.garmentColor})
                    </span>
                  </div>
                  <div>
                    <span className="tv-text-muted block text-[11px]">
                      {vi ? "Vị Trí Thêu Trên Áo/Nón:" : "Garment Placement:"}
                    </span>
                    <span className="font-bold">
                      {PLACEMENT_TEXT[locale][order.placement]}
                    </span>
                  </div>
                  <div>
                    <span className="tv-text-muted block text-[11px]">
                      {vi
                        ? "Kích Thước Thực Tế (Rộng × Cao):"
                        : "Physical Dimensions:"}
                    </span>
                    <span className="font-mono font-bold">
                      {design?.widthMm ?? 95}mm × {design?.heightMm ?? 60}mm
                    </span>
                  </div>
                  <div>
                    <span className="tv-text-muted block text-[11px]">
                      {vi ? "Mật Độ Mũi & Số Lượng:" : "Stitch Count & Qty:"}
                    </span>
                    <span className="font-mono font-bold">
                      {order.stitchCount.toLocaleString()} {vi ? "mũi" : "st"} ×{" "}
                      {order.quantity} {vi ? "sản phẩm" : "pcs"}
                    </span>
                  </div>
                </div>

                {/* Colorway Table */}
                <div className="tv-surface-2 tv-border rounded-xl border p-3.5">
                  <p className="font-bold uppercase tracking-wider tv-text-muted text-[10px] mb-2">
                    {vi
                      ? "Bảng Màu Chỉ Thêu Chuẩn Madeira / Pantone"
                      : "Approved Thread Colorway Sequence"}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(design?.colorSequence ?? []).map((stop) => (
                      <div
                        key={stop.needle}
                        className="tv-surface tv-border flex items-center justify-between rounded-lg border px-2.5 py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full border border-slate-500"
                            style={{ backgroundColor: stop.hex }}
                          />
                          <span className="font-mono text-[11px] font-bold">
                            N{stop.needle}:
                          </span>
                          <span className="font-semibold">{stop.name}</span>
                        </div>
                        <span className="font-mono text-[11px] tv-accent-text">
                          {stop.threadCode}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Sign-off & Quick Action */}
            <div className="tv-surface-2 tv-border rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <p className="font-bold text-emerald-400">
                  ✓{" "}
                  {vi
                    ? "Cam Kết Chất Lượng Xưởng Thêu Tường Vinh:"
                    : "Tuong Vinh Studio Production Guarantee:"}
                </p>
                <p className="tv-text-muted text-[11px]">
                  {vi
                    ? "Sau khi khách hàng xác nhận duyệt mẫu (qua chữ ký hoặc tin nhắn Zalo), xưởng sẽ tiến hành thêu hàng loạt đúng 100% thông số trên phiếu này."
                    : "Once signed off via Zalo or signature below, bulk production will match the exact specifications on this sheet."}
                </p>
              </div>

              {onApproveProofToProduction &&
                (order.status === "QUOTE" ||
                  order.status === "DIGITIZING" ||
                  order.status === "APPROVAL_PENDING") && (
                  <button
                    onClick={() => onApproveProofToProduction(order)}
                    className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg hover:bg-emerald-400 cursor-pointer print:hidden"
                  >
                    ✓{" "}
                    {vi
                      ? "Khách Đã Duyệt Mẫu → Chuyển Chạy Máy Ngay"
                      : "Client Approved Proof → Start Production"}
                  </button>
                )}
            </div>

            {/* Signature Blocks for Print/PDF */}
            <div className="grid grid-cols-2 gap-6 pt-4 text-center">
              <div className="tv-surface-2 tv-border rounded-xl border p-4 h-28 flex flex-col justify-between">
                <p className="font-bold uppercase text-[11px]">
                  {vi
                    ? "Kỹ Thuật Mẫu — Xưởng Thêu Tường Vinh"
                    : "Digitizer / Studio Representative"}
                </p>
                <p className="text-[10px] tv-text-muted">
                  {vi
                    ? "(Ký tên & xác nhận thông số máy)"
                    : "(Signature & Date)"}
                </p>
              </div>
              <div className="tv-surface-2 tv-border rounded-xl border p-4 h-28 flex flex-col justify-between">
                <p className="font-bold uppercase text-[11px]">
                  {vi
                    ? `Khách Hàng Duyệt Mẫu (${order.companyName})`
                    : `Client Approval (${order.companyName})`}
                </p>
                <p className="text-[10px] tv-text-muted">
                  {vi
                    ? "(Ký duyệt hoặc xác nhận 'Đồng ý thêu' qua Zalo)"
                    : "(Signature or Zalo confirmation)"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODE 3: COMMERCIAL VAT INVOICE & VIETQR ================= */}
        {mode === "invoice" && canViewFinancials && (
          <div className="mt-5 space-y-5 text-xs">
            <div className="tv-border flex flex-wrap items-start justify-between gap-4 border-b pb-4">
              <div>
                <p className="tv-accent-text text-[11px] font-bold uppercase tracking-widest">
                  CÔNG TY TNHH THÊU VI TÍNH TƯỜNG VINH • TP. HỒ CHÍ MINH
                </p>
                <h2 className="mt-1 text-xl font-black">
                  {vi
                    ? "HÓA ĐƠN BÁN HÀNG & BIÊN BẢN GIAO NHẬN HÀNG"
                    : "COMMERCIAL VAT INVOICE & DELIVERY RECEIPT"}
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

            {/* Client & VAT Controls */}
            <div className="tv-surface-2 tv-border grid grid-cols-1 gap-4 rounded-xl border p-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tv-text-muted">
                  {vi ? "Khách Hàng / Đơn Vị Nhận" : "Bill To"}
                </p>
                <p className="mt-1 text-sm font-bold">{order.companyName}</p>
                <p className="tv-text-muted">
                  {vi ? "Người liên hệ:" : "Attn:"} {order.customerName}
                </p>
              </div>

              <div className="print:hidden">
                <p className="text-[10px] font-bold uppercase tv-text-muted mb-1">
                  {vi
                    ? "Mức Thuế GTGT (VAT) & Ngân Hàng VietQR"
                    : "VAT Tax Rate & VietQR Bank"}
                </p>
                <div className="flex items-center gap-1.5">
                  {([0, 8, 10] as const).map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setVatPercent(rate)}
                      className={`rounded px-2.5 py-1 text-xs font-mono font-bold cursor-pointer ${
                        vatPercent === rate
                          ? "tv-accent-bg"
                          : "tv-surface tv-border border tv-text-muted"
                      }`}
                    >
                      VAT {rate}%
                    </button>
                  ))}
                  <ModernSelect
                    value={bankId}
                    onChange={(e) => {
                      setBankId(e.target.value);
                      setQrImgFailed(false);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold"
                  >
                    <option value="VCB">Vietcombank</option>
                    <option value="MB">MBBank</option>
                    <option value="ACB">ACB</option>
                    <option value="TCB">Techcombank</option>
                    <option value="BIDV">BIDV</option>
                  </ModernSelect>
                </div>
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

            {/* VietQR Payment Box + Invoice Totals */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-stretch">
              {/* VietQR Bank Transfer Card */}
              <div className="md:col-span-7 tv-surface-2 tv-border rounded-xl border p-4 flex items-center gap-4">
                <div className="shrink-0 rounded-xl bg-white p-2 border border-slate-300 shadow-sm flex flex-col items-center">
                  {!qrImgFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={vietQrUrl}
                      alt="VietQR Napas 247"
                      className="h-28 w-28 object-contain"
                      onError={() => setQrImgFailed(true)}
                    />
                  ) : (
                    <svg
                      viewBox="0 0 21 21"
                      className="h-24 w-24"
                      shapeRendering="crispEdges"
                    >
                      {qrMatrix.map((row, rIdx) =>
                        row.map((cell, cIdx) =>
                          cell ? (
                            <rect
                              key={`${rIdx}-${cIdx}`}
                              x={cIdx}
                              y={rIdx}
                              width={1}
                              height={1}
                              fill="#0f172a"
                            />
                          ) : null,
                        ),
                      )}
                    </svg>
                  )}
                  <span className="mt-1 font-mono text-[9px] font-bold text-slate-900">
                    VIETQR • NAPAS 247
                  </span>
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    {vi
                      ? "Thanh Toán Chuyển Khoản Nhanh 24/7"
                      : "Instant VietQR Bank Transfer"}
                  </span>
                  <p className="font-bold text-sm truncate pt-1">
                    {accountName}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className="tv-text-muted">
                      {vi ? "Ngân hàng:" : "Bank:"}
                    </span>
                    <span className="font-bold tv-accent-text">{bankId}</span>
                    <span className="tv-text-muted">• STK:</span>
                    <input
                      type="text"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      className="tv-input px-2 py-0.5 font-mono text-xs font-bold w-36 print:border-none print:p-0"
                    />
                  </div>
                  <p className="text-[11px] tv-text-muted">
                    {vi ? "Nội dung CK:" : "Transfer Memo:"}{" "}
                    <strong className="font-mono tv-text">
                      {transferMemo}
                    </strong>
                  </p>
                  <p className="text-[11px] tv-text-muted">
                    {vi ? "Số tiền quét QR:" : "QR Amount:"}{" "}
                    <strong className="font-mono text-emerald-400">
                      {formatVnd(
                        balanceDue > 0 ? balanceDue : grandTotalWithVat,
                      )}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="md:col-span-5 tv-surface-2 tv-border space-y-2 rounded-xl border p-4 font-mono flex flex-col justify-center">
                <div className="flex justify-between tv-text-muted">
                  <span>{vi ? "Cộng tiền hàng:" : "Subtotal:"}</span>
                  <span className="font-bold tv-text">
                    {formatVnd(subtotalPrice)}
                  </span>
                </div>
                <div className="flex justify-between tv-text-muted">
                  <span>
                    {vi
                      ? `Thuế GTGT (VAT ${vatPercent}%):`
                      : `VAT Tax (${vatPercent}%):`}
                  </span>
                  <span className="font-semibold tv-text">
                    +{formatVnd(vatAmount)}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>
                    {vi ? "Tổng thanh toán (gồm VAT):" : "Total (incl. VAT):"}
                  </span>
                  <span>{formatVnd(grandTotalWithVat)}</span>
                </div>
                <div className="flex justify-between text-emerald-500">
                  <span>{vi ? "Đã thanh toán / Cọc:" : "Amount Paid:"}</span>
                  <span>-{formatVnd(order.amountPaid ?? 0)}</span>
                </div>
                <div className="tv-border flex justify-between border-t pt-2 text-sm font-black tv-accent-text">
                  <span>{vi ? "Còn lại phải thu:" : "Balance Due:"}</span>
                  <span>{formatVnd(balanceDue)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Handover Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-3 text-center">
              <div className="tv-surface-2 tv-border rounded-xl border p-3 h-24 flex flex-col justify-between">
                <p className="font-bold uppercase text-[10px]">
                  {vi
                    ? "Người Giao Hàng / QC Xưởng"
                    : "Delivered By / QC"}
                </p>
                <p className="text-[10px] tv-text-muted">
                  {vi ? "(Ký, ghi rõ họ tên)" : "(Signature)"}
                </p>
              </div>
              <div className="tv-surface-2 tv-border rounded-xl border p-3 h-24 flex flex-col justify-between">
                <p className="font-bold uppercase text-[10px]">
                  {vi
                    ? "Khách Hàng Kiểm & Nhận Hàng"
                    : "Received By Client"}
                </p>
                <p className="text-[10px] tv-text-muted">
                  {vi
                    ? `(Đã nhận đủ ${order.quantity} sản phẩm)`
                    : `(Verified ${order.quantity} pcs)`}
                </p>
              </div>
              <div className="tv-surface-2 tv-border rounded-xl border p-3 h-24 flex flex-col justify-between">
                <p className="font-bold uppercase text-[10px]">
                  {vi
                    ? "Đại Diện Thêu Vi Tính Tường Vinh"
                    : "Tuong Vinh Embroidery"}
                </p>
                <p className="text-[10px] tv-text-muted">
                  {vi ? "(Ký tên & đóng dấu)" : "(Authorized Stamp)"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
