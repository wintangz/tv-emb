"use client";

import React, { useState } from "react";
import type {
  DashboardMetrics,
  EmbroideryMachine,
  EmbroideryOrder,
  Employee,
  GarmentPlacement,
  InventoryItem,
  MachineStatus,
  OrderStatus,
  PaymentStatus,
} from "@/lib/types";
import { calculateOrderMaterialAndProfit } from "@/lib/seed-data";
import { formatVnd, formatVndCompact } from "@/lib/currency";
import {
  type ActiveTab,
  MACHINE_BADGE_STYLES,
  ORDER_STAGE_FLOW,
  PAYMENT_BADGE_STYLES,
  STATUS_BADGE_STYLES,
} from "./studio-constants";

interface OverviewTabProps {
  vi: boolean;
  metrics: DashboardMetrics;
  machines: EmbroideryMachine[];
  orders: EmbroideryOrder[];
  inventory: InventoryItem[];
  operatorByMachineId: Map<string, Employee>;
  statusLabels: Record<OrderStatus, string>;
  paymentLabels: Record<PaymentStatus, string>;
  machineLabels: Record<MachineStatus, string>;
  placementLabels: Record<GarmentPlacement, string>;
  onSelectTab: (tab: ActiveTab) => void;
  onLogMachineBatch: (machine: EmbroideryMachine) => void;
  onOpenJobTicket: (order: EmbroideryOrder) => void;
  onAdvanceOrderStatus: (order: EmbroideryOrder) => void;
  onRestockAllLow: () => void;
  onAdjustStock: (itemId: string, delta: number) => void;
}

function OverviewTab({
  vi,
  metrics,
  machines,
  orders,
  inventory,
  operatorByMachineId,
  statusLabels,
  paymentLabels,
  machineLabels,
  placementLabels,
  onSelectTab,
  onLogMachineBatch,
  onOpenJobTicket,
  onAdvanceOrderStatus,
  onRestockAllLow,
  onAdjustStock,
}: OverviewTabProps) {
  const [orderPage, setOrderPage] = useState<number>(1);
  const overviewPageSize = 4;
  const totalOrderPages = Math.max(
    1,
    Math.ceil(orders.length / overviewPageSize),
  );
  const safeOrderPage = Math.min(Math.max(1, orderPage), totalOrderPages);
  const pagedOverviewOrders = orders.slice(
    (safeOrderPage - 1) * overviewPageSize,
    safeOrderPage * overviewPageSize,
  );

  const nonCancelledOrders = orders;
  let monthlyMaterialCost = 0;
  let monthlyConsumablesCost = 0;
  let monthlyShippingCost = 0;
  for (let i = 0; i < nonCancelledOrders.length; i++) {
    const m = calculateOrderMaterialAndProfit(nonCancelledOrders[i]);
    monthlyMaterialCost += m.upperThreadCost + m.evaFoamCost;
    monthlyConsumablesCost += m.consumablesCost;
    monthlyShippingCost += m.shippingCost;
  }
  const totalExpenses =
    monthlyMaterialCost +
    monthlyConsumablesCost +
    monthlyShippingCost +
    metrics.monthlyLaborCost;

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <div className="tv-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium tv-text-muted">
              {vi ? "Đơn Hàng Đang Làm" : "Active Work Orders"}
            </p>
            <span className="tv-accent-text text-sm font-bold shrink-0">❖</span>
          </div>
          <p className="mt-2 text-2xl font-black">{metrics.activeOrdersCount}</p>
          <p className="mt-1 text-xs text-sky-400">
            {vi
              ? `${metrics.inProductionCount} đơn đang chạy trên dàn 20 đầu`
              : `${metrics.inProductionCount} running on 20-head lines`}
          </p>
        </div>

        <div className="tv-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium tv-text-muted">
              {vi ? "Tổng Mũi Thêu Chờ Chạy" : "Queued Stitch Backlog"}
            </p>
            <span className="tv-accent-text text-sm font-bold shrink-0">◎</span>
          </div>
          <p className="mt-2 text-2xl font-black tv-accent-text font-mono">
            {(metrics.totalQueuedStitches / 1000).toFixed(1)}k
          </p>
          <p className="mt-1 text-xs tv-text-muted">
            {vi
              ? `Còn ${metrics.totalQueuedStitches.toLocaleString()} mũi thêu`
              : `${metrics.totalQueuedStitches.toLocaleString()} stitches left`}
          </p>
        </div>

        <div className="tv-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium tv-text-muted">
              {vi ? "5 Máy Tajima (20 Đầu/Máy)" : "5 Tajima Lines (20 Heads)"}
            </p>
            <span className="text-emerald-400 text-sm font-bold shrink-0">⚙</span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">
            {metrics.runningMachinesCount} / {metrics.totalMachinesCount}{" "}
            <span className="text-xs font-normal tv-text-muted">
              {vi ? "máy" : "lines"}
            </span>
          </p>
          <p className="mt-1 text-xs tv-text-muted">
            {vi
              ? `3 TFGN2 + 2 TMCP (${machines.reduce((acc, m) => acc + m.heads, 0)} đầu thêu)`
              : `3 TFGN2 + 2 TMCP (${machines.reduce((acc, m) => acc + m.heads, 0)} heads)`}
          </p>
        </div>

        <div className="tv-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium tv-text-muted">
              {vi ? "Doanh Thu Gia Công" : "Embroidery Revenue"}
            </p>
            <span className="text-emerald-400 text-sm font-bold shrink-0">₫</span>
          </div>
          <p
            className="mt-2 text-xl font-black font-mono truncate"
            title={formatVnd(metrics.monthlyRevenue)}
          >
            {formatVndCompact(metrics.monthlyRevenue, vi)}
          </p>
          <p className="mt-1 text-xs text-emerald-400 truncate">
            {formatVndCompact(metrics.collectedRevenue, vi)}{" "}
            {vi ? "đã thu" : "paid"} •{" "}
            <span className="tv-accent-text">
              {formatVndCompact(metrics.outstandingReceivables, vi)}{" "}
              {vi ? "chờ thu" : "due"}
            </span>
          </p>
        </div>

        <div
          onClick={() => onSelectTab("employees")}
          className="tv-card p-4 flex flex-col justify-between cursor-pointer transition hover:opacity-90"
          title={
            vi
              ? `Tổng lương: ${formatVnd(metrics.monthlyLaborCost)} • Nhấn để mở Bảng Lương Xưởng`
              : `Total Payroll: ${formatVnd(metrics.monthlyLaborCost)} • Click to open Workshop Payroll`
          }
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium tv-text-muted">
              {vi ? "Quỹ Lương & Vật Tư + Xe" : "Payroll & Materials"}
            </p>
            <span className="tv-accent-text text-sm font-bold shrink-0">♟</span>
          </div>
          <p className="mt-2 text-xl font-black font-mono text-amber-400 truncate">
            {formatVndCompact(totalExpenses, vi)}
          </p>
          <p className="mt-1 text-xs tv-text-muted truncate">
            {vi ? "Lương:" : "Pay:"}{" "}
            {formatVndCompact(metrics.monthlyLaborCost, vi)} •{" "}
            {vi ? "Vật tư+Xe:" : "Mat+Ship:"}{" "}
            {formatVndCompact(
              totalExpenses - metrics.monthlyLaborCost,
              vi,
            )}
          </p>
        </div>

        <div className="tv-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium tv-text-muted">
              {vi ? "Lợi Nhuận Ròng Còn Lại" : "True Net Profit"}
            </p>
            <span className="text-emerald-400 text-sm font-bold shrink-0">★</span>
          </div>
          <p
            className={`mt-2 text-xl font-black font-mono truncate ${
              metrics.estimatedNetProfit >= 0
                ? "text-emerald-400"
                : "text-rose-400"
            }`}
            title={formatVnd(metrics.estimatedNetProfit)}
          >
            {formatVndCompact(metrics.estimatedNetProfit, vi)}
          </p>
          <p className="mt-1 text-xs tv-text-muted truncate">
            {vi
              ? "Sau khi trừ Chỉ trên, Phụ liệu, Xe & Lương"
              : "After upper thread, consumables, vehicle & payroll"}
          </p>
        </div>
      </div>

      {/* ================= BẢNG HẠCH TOÁN DOANH THU – CHI PHÍ – VẬT TƯ – LỢI NHUẬN ================= */}
      <div className="tv-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tv-accent-bg inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-2.5 py-1 text-center text-[11px] font-black leading-none">
                {vi ? "BÁO CÁO HẠCH TOÁN ĐƠN HÀNG" : "WORKSHOP P&L LEDGER"}
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider">
                {vi
                  ? "Bảng Tổng Hợp Doanh Thu – Chi Phí – Vật Tư (Chỉ Trên & Mút EVA) – Lợi Nhuận Ròng"
                  : "Automated Revenue – Cost – Material (Upper Thread & EVA) – Net Profit Ledger"}
              </h2>
            </div>
            <p className="mt-1 text-xs tv-text-muted">
              {vi
                ? "Tự động tính định mức chỉ trên cho từng đơn (tính theo số mũi thêu hoặc tùy chọn 5 cuộn/màu trong trường hợp cần sang chỉ mới lên 20 đầu), mút EVA thêu 3D, phụ liệu (chỉ dưới, kim, băng keo, dựng), chi phí thuê xe vận chuyển (2 chiều / 1 chiều chành xe về xưởng) và quỹ lương thực tế."
                : "Automatically calculates per-order upper thread (by stitch count or optional 5 cones/color when 20-head splitting is needed), 3D EVA foam, consumables, external transport fee (2-way local vs 1-way Chanh Xe pickup), and actual workshop payroll."}
            </p>
          </div>
          <button
            onClick={() => onSelectTab("quote")}
            className="tv-surface-2 tv-border inline-flex shrink-0 self-start items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold tv-accent-text hover:opacity-90 cursor-pointer"
          >
            <span aria-hidden="true">🧮</span>
            <span>{vi ? "Tính Định Mức Đơn Mới →" : "Calculate New Order Norm →"}</span>
          </button>
        </div>

        <div className="tv-border overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-xs">
            <thead className="tv-surface-2 text-[11px] uppercase tv-text-muted">
              <tr>
                <th className="px-3.5 py-2.5">
                  {vi ? "Đơn Hàng & Khách Hàng" : "Order & Client"}
                </th>
                <th className="px-3.5 py-2.5 text-right">
                  {vi ? "Doanh Thu Đơn" : "Order Revenue"}
                </th>
                <th className="px-3.5 py-2.5">
                  {vi
                    ? "Định Mức Chỉ Trên"
                    : "Upper Thread Norm"}
                </th>
                <th className="px-3.5 py-2.5 text-right">
                  {vi ? "Mút EVA 3D & Phụ Liệu" : "3D EVA & Consumables"}
                </th>
                <th className="px-3.5 py-2.5 text-right">
                  {vi ? "Chi Phí Vận Chuyển" : "External Transport"}
                </th>
                <th className="px-3.5 py-2.5 text-right">
                  {vi ? "Còn Lại (Trước Lương)" : "Net Before Payroll"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y tv-border">
              {nonCancelledOrders.map((order) => {
                const mat = calculateOrderMaterialAndProfit(order);
                return (
                  <tr key={order.id} className="hover:opacity-95">
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold tv-accent-text">
                          {order.orderNumber}
                        </span>
                        <span className="font-bold">{order.companyName}</span>
                        {mat.evaFoamCost > 0 && (
                          <span className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-center text-[10px] font-bold leading-none text-amber-400">
                            3D EVA
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] tv-text-muted">
                        {order.quantity} {vi ? "cái" : "pcs"} •{" "}
                        {order.stitchCount.toLocaleString()}{" "}
                        {vi ? "mũi/cái" : "st/pc"} • {order.designName}
                      </p>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-400">
                      {formatVnd(order.totalPrice)}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="tv-text-muted">
                          {order.colorCount} {vi ? "màu" : "colors"} →{" "}
                          <strong className="tv-text">
                            {mat.totalMasterConesToBuy}{" "}
                            {vi ? "cuộn" : "cones"}
                          </strong>
                          {mat.splitThreadFor20Heads
                            ? ` (${vi ? "sang" : "→"} ${mat.totalSubConesFor20Heads} ${vi ? "cuộn con" : "sub"})`
                            : ""}
                        </span>
                        <span className="font-mono font-semibold text-amber-400">
                          -{formatVnd(mat.upperThreadCost)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono">
                      <span className="font-semibold text-amber-400">
                        -{formatVnd(mat.evaFoamCost + mat.consumablesCost)}
                      </span>
                      <p className="text-[10px] tv-text-muted">
                        {mat.evaFoamCost > 0
                          ? vi
                            ? `EVA ${formatVndCompact(mat.evaFoamCost, vi)} + Phụ liệu ${formatVndCompact(mat.consumablesCost, vi)}`
                            : `EVA ${formatVndCompact(mat.evaFoamCost, vi)} + Cons ${formatVndCompact(mat.consumablesCost, vi)}`
                          : vi
                            ? "Chỉ dưới, kim, keo, dựng"
                            : "Bobbin, needles, tape, backing"}
                      </p>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono">
                      <span className="font-semibold text-sky-400">
                        -{formatVnd(mat.shippingCost)}
                      </span>
                      <p className="text-[10px] tv-text-muted">
                        {mat.shippingMode === "CHANH_XE_PICKUP"
                          ? vi
                            ? "1 chiều Chành xe → Xưởng"
                            : "1-way Chanh Xe → Shop"
                          : vi
                            ? "Xe ngoài 2 chiều (Lấy + Giao)"
                            : "2-way Local Vehicle"}
                      </p>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-400">
                      {formatVnd(mat.orderGrossProfit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="tv-surface-2 border-t-2 tv-border font-mono text-xs">
              <tr>
                <td className="px-3.5 py-3 font-bold">
                  {vi
                    ? `TỔNG CỘNG ĐƠN HÀNG (${nonCancelledOrders.length} đơn):`
                    : `TOTAL WORK ORDERS (${nonCancelledOrders.length} orders):`}
                </td>
                <td className="px-3.5 py-3 text-right font-black text-emerald-400">
                  {formatVnd(metrics.monthlyRevenue)}
                </td>
                <td className="px-3.5 py-3 text-right font-bold text-amber-400">
                  {vi ? "Chỉ trên + EVA: " : "Thread + EVA: "}-
                  {formatVnd(monthlyMaterialCost)}
                </td>
                <td className="px-3.5 py-3 text-right font-bold text-amber-400">
                  {vi ? "Phụ liệu: " : "Consumables: "}-
                  {formatVnd(monthlyConsumablesCost)}
                </td>
                <td className="px-3.5 py-3 text-right font-bold text-sky-400">
                  {vi ? "Xe ngoài: " : "Vehicle: "}-
                  {formatVnd(monthlyShippingCost)}
                </td>
                <td className="px-3.5 py-3 text-right font-black text-emerald-400">
                  {formatVnd(
                    metrics.monthlyRevenue -
                      monthlyMaterialCost -
                      monthlyConsumablesCost -
                      monthlyShippingCost,
                  )}
                </td>
              </tr>
              <tr className="border-t tv-border">
                <td colSpan={4} className="px-3.5 py-3 font-sans">
                  <span className="font-bold">
                    {vi
                      ? "TRỪ QUỸ LƯƠNG XƯỞNG THÁNG NÀY "
                      : "LESS MONTHLY WORKSHOP PAYROLL "}
                  </span>
                  <span className="tv-text-muted">
                    {vi
                      ? "(Thợ máy 9tr, Kiểm hàng QC 8–8.5tr, Giao nhận & Hỗ trợ 7.5tr, Cơm 35k/ngày, Tăng ca CN ×200%, Trọ 500k + Chuyên cần 500k):"
                      : "(Operators 9M, QC 8–8.5M, Logistics & Support 7.5M, Meal 35k/day, Sun OT ×200%, Housing 500k + Attendance 500k):"}
                  </span>
                </td>
                <td className="px-3.5 py-3 text-right font-bold text-rose-400">
                  -{formatVnd(metrics.monthlyLaborCost)}
                </td>
                <td className="px-3.5 py-3 text-right text-sm font-black text-emerald-400">
                  {vi ? "LÃI RÒNG: " : "NET PROFIT: "}
                  {formatVnd(metrics.estimatedNetProfit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Live Embroidery Machine Line Status */}
      <div className="tv-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider">
              {vi
                ? "Xưởng Thêu Tường Vinh — 5 Dàn Máy Thêu Tajima 20 Đầu (Điều Độ Chuyền Linh Hoạt)"
                : "Tuong Vinh Shop Floor — 5 × 20-Head Tajima Lines (Flexible Line Dispatch)"}
            </h2>
            <p className="text-xs tv-text-muted">
              {vi
                ? "Thợ không đứng cố định 1 máy — điều phối thợ đứng máy linh hoạt theo mặt hàng sản xuất thực tế"
                : "Operators are not fixed to a single machine — dynamically assigned based on active garment production"}
            </p>
          </div>
          <button
            onClick={() => onSelectTab("machines")}
            className="tv-surface-2 tv-border inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold tv-accent-text hover:opacity-90 cursor-pointer"
          >
            {vi ? "Mở Bảng Điều Khiển Máy →" : "Open Machine Control →"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {machines.map((m) => {
            const operator = operatorByMachineId.get(m.id);
            return (
              <div
                key={m.id}
                className="tv-surface-2 tv-border rounded-xl border p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="min-w-0 flex-1 text-xs font-bold truncate"
                      title={m.name}
                    >
                      {m.name}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-center text-[10px] font-bold uppercase leading-none ${
                        MACHINE_BADGE_STYLES[m.status]
                      }`}
                    >
                      {machineLabels[m.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] tv-text-muted">
                    {m.brand} {m.model} • {m.heads}{" "}
                    {vi ? "Đầu" : m.heads > 1 ? "Heads" : "Head"} /{" "}
                    {m.needlesPerHead} {vi ? "Kim" : "Needles"}
                  </p>

                  <div className="tv-surface tv-border mt-3 rounded-lg border p-2.5 text-xs space-y-1">
                    <div className="flex justify-between tv-text-muted">
                      <span>{vi ? "Đơn đang chạy:" : "Active Job:"}</span>
                      <span className="font-mono font-bold tv-accent-text">
                        {m.activeOrderNumber ??
                          (vi ? "Chưa gán đơn" : "Unassigned")}
                      </span>
                    </div>
                    <div className="flex justify-between tv-text-muted">
                      <span>{vi ? "Tốc độ:" : "Speed:"}</span>
                      <span className="font-mono tv-text">
                        {m.currentSpm} / {m.maxSpm} SPM
                      </span>
                    </div>
                    <div className="flex justify-between tv-text-muted">
                      <span>
                        {vi ? "Thợ chạy hôm nay:" : "Operator today:"}
                      </span>
                      <span className="font-semibold tv-text truncate max-w-30">
                        {operator
                          ? operator.name
                          : vi
                            ? "Đang điều phối"
                            : "Rotating"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[11px] tv-text-muted mb-1">
                    <span>{vi ? "Tiến độ mẻ thêu" : "Run Progress"}</span>
                    <span className="font-mono font-bold tv-text">
                      {m.progressPercent}%
                    </span>
                  </div>
                  <div className="tv-surface h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${m.progressPercent}%`,
                        backgroundColor:
                          m.status === "RUNNING"
                            ? "#10b981"
                            : "var(--tv-accent)",
                      }}
                    />
                  </div>
                  {m.activeOrderId && (
                    <button
                      onClick={() => onLogMachineBatch(m)}
                      className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/45 bg-emerald-500/15 px-3 py-2 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/25 cursor-pointer"
                    >
                      <span aria-hidden="true">✓</span>
                      <span>
                        {vi
                          ? `Nghiệm Thu Mẻ Thêu (+${m.heads * 2} SP)`
                          : `Log Batch Output (+${m.heads * 2} pcs)`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Production Queue & Low Stock Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Work Orders */}
        <div className="lg:col-span-2 tv-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {vi
                    ? "Lệnh Sản Xuất Đang Triển Khai Tại Xưởng"
                    : "Priority Production Work Orders"}
                </h2>
                <p className="mt-0.5 text-xs tv-text-muted">
                  {vi
                    ? "Theo dõi tiến độ chuyền thêu, định mức chỉ trên và chuyển nhanh công đoạn sản xuất"
                    : "Track active embroidery progress, upper-thread norms, and advance production stages"}
                </p>
              </div>
              <button
                onClick={() => onSelectTab("orders")}
                className="tv-surface-2 tv-border inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold tv-accent-text hover:opacity-90 cursor-pointer"
              >
                {vi ? "Xem Tất Cả Đơn Hàng →" : "Manage All Orders →"}
              </button>
            </div>

            <div className="space-y-3">
              {pagedOverviewOrders.map((order) => {
                const stageIdx = ORDER_STAGE_FLOW.indexOf(order.status);
                const nextStage =
                  stageIdx >= 0 && stageIdx < ORDER_STAGE_FLOW.length - 1
                    ? ORDER_STAGE_FLOW[stageIdx + 1]
                    : null;
                const mat = calculateOrderMaterialAndProfit(order);
                const pct =
                  order.quantity > 0
                    ? Math.round(
                        (order.completedQuantity / order.quantity) * 100,
                      )
                    : 0;
                return (
                  <div
                    key={order.id}
                    className="tv-surface-2 tv-border rounded-xl border p-3.5 space-y-2.5"
                  >
                    {/* Top Row: Order Identity & Specs (Left) + Revenue & Due Date (Right) */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs font-bold tv-accent-text">
                            {order.orderNumber}
                          </span>
                          {order.rushOrder && (
                            <span className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-center text-[10px] font-bold leading-none text-rose-400">
                              {vi ? "HÀNG GẤP" : "RUSH"}
                            </span>
                          )}
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                              STATUS_BADGE_STYLES[order.status]
                            }`}
                          >
                            {statusLabels[order.status]}
                          </span>
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                              PAYMENT_BADGE_STYLES[
                                order.paymentStatus ?? "UNPAID"
                              ]
                            }`}
                          >
                            {paymentLabels[order.paymentStatus ?? "UNPAID"]}
                          </span>
                        </div>
                        <p className="text-sm font-bold truncate" title={`${order.companyName} — ${order.designName}`}>
                          {order.companyName} — {order.designName}
                        </p>
                        <p className="text-xs tv-text-muted truncate">
                          {order.garmentType} ({placementLabels[order.placement]}) •{" "}
                          <span className="font-mono">
                            {order.stitchCount.toLocaleString()}{" "}
                            {vi ? "mũi/cái" : "st/pc"}
                          </span>
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-mono text-sm font-black text-emerald-400">
                          {formatVnd(order.totalPrice)}
                        </p>
                        <p className="mt-0.5 text-[11px] tv-text-muted">
                          {vi ? "Giao:" : "Due:"} {order.dueDate}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Progress & Thread Norm (Left) + Action Buttons (Right) */}
                    <div className="tv-border flex flex-wrap items-center justify-between gap-2 border-t pt-2.5">
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-2 font-mono text-[11px]">
                          <span className="font-bold">
                            {order.completedQuantity}/{order.quantity}{" "}
                            {vi ? "cái" : "pcs"}
                          </span>
                          <span className="tv-surface h-1.5 w-16 overflow-hidden rounded-full inline-block">
                            <span
                              className="block h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: "var(--tv-accent)",
                              }}
                            />
                          </span>
                          <span className="tv-text-muted">{pct}%</span>
                        </span>
                        <span className="text-[11px] text-amber-400 font-semibold">
                          🧵{" "}
                          {vi
                            ? `Mua ${mat.totalMasterConesToBuy} cuộn chỉ (${order.colorCount} màu)`
                            : `Buy ${mat.totalMasterConesToBuy} cones (${order.colorCount} colors)`}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 ml-auto">
                        <button
                          onClick={() => onOpenJobTicket(order)}
                          className="tv-surface tv-border inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold tv-text hover:opacity-90 cursor-pointer"
                        >
                          <span aria-hidden="true">📄</span>
                          <span>{vi ? "Lệnh SX" : "Job Ticket"}</span>
                        </button>
                        {nextStage && (
                          <button
                            onClick={() => onAdvanceOrderStatus(order)}
                            title={
                              vi
                                ? `Chuyển lệnh sản xuất sang công đoạn: ${statusLabels[nextStage]}`
                                : `Advance work order to stage: ${statusLabels[nextStage]}`
                            }
                            className="tv-accent-bg inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer"
                          >
                            {vi
                              ? `Chuyển: ${statusLabels[nextStage]} →`
                              : `Advance: ${statusLabels[nextStage]} →`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overview Work Orders Paging Footer */}
          <div className="tv-border mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
            <span className="tv-text-muted">
              {vi
                ? `Trang ${safeOrderPage}/${totalOrderPages} • Tổng ${orders.length} lệnh sản xuất`
                : `Page ${safeOrderPage} of ${totalOrderPages} • ${orders.length} total work orders`}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safeOrderPage <= 1}
                onClick={() => setOrderPage(safeOrderPage - 1)}
                className={`tv-surface-2 tv-border rounded-lg border px-2.5 py-1 font-semibold tv-text ${
                  safeOrderPage <= 1
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:opacity-85 cursor-pointer"
                }`}
              >
                ← {vi ? "Trước" : "Prev"}
              </button>
              {Array.from({ length: totalOrderPages }, (_, idx) => idx + 1).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setOrderPage(p)}
                    className={`h-6 min-w-6 rounded-md px-1.5 font-mono text-xs font-bold cursor-pointer ${
                      p === safeOrderPage
                        ? "tv-accent-bg"
                        : "tv-surface-2 tv-text"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={safeOrderPage >= totalOrderPages}
                onClick={() => setOrderPage(safeOrderPage + 1)}
                className={`tv-surface-2 tv-border rounded-lg border px-2.5 py-1 font-semibold tv-text ${
                  safeOrderPage >= totalOrderPages
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:opacity-85 cursor-pointer"
                }`}
              >
                {vi ? "Sau" : "Next"} →
              </button>
            </div>
          </div>
        </div>

        {/* Low-Stock Thread & Consumables */}
        <div className="tv-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold uppercase tracking-wider">
                {vi
                  ? "Phụ Liệu Xưởng & Chỉ Đặt Theo Đơn"
                  : "Shop Consumables & Order Thread"}
              </h2>
              {metrics.lowStockItemsCount > 0 && (
                <button
                  onClick={onRestockAllLow}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/45 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/25 cursor-pointer"
                >
                  <span aria-hidden="true">📦</span>
                  <span>{vi ? "Mua Bổ Sung Phụ Liệu" : "Replenish Consumables"}</span>
                </button>
              )}
            </div>
            <p className="text-xs tv-text-muted mb-4">
              {vi
                ? "Chỉ thêu để lâu sẽ giảm độ bền — bộ phận vật tư chỉ đặt mua chỉ trên theo định mức sau khi khách duyệt mẫu. Chỉ dưới, kim, băng keo, giấy dựng và mút EVA 3D cấp phát theo thực tế sản xuất."
                : "Upper thread is ordered per approved work order norm to prevent aging. Bobbin, needles, tape, backing & 3D EVA are replenished as consumed."}
            </p>

            <div className="space-y-2.5">
              {inventory
                .filter((i) => i.quantity <= i.minThreshold + 3)
                .slice(0, 5)
                .map((item) => {
                  const isLow = item.quantity <= item.minThreshold;
                  return (
                    <div
                      key={item.id}
                      className="tv-surface-2 tv-border flex items-center justify-between gap-3 rounded-xl border p-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.colorHex ? (
                          <span
                            className="h-6 w-6 shrink-0 rounded-lg border border-slate-500"
                            style={{ backgroundColor: item.colorHex }}
                          />
                        ) : (
                          <span className="tv-surface flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold">
                            {item.category.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">
                            {item.name}
                          </p>
                          <p className="text-[11px] tv-text-muted">
                            SKU: {item.sku} • {vi ? "Tối thiểu:" : "Min:"}{" "}
                            {item.minThreshold} {item.unit}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono text-xs font-bold ${
                            isLow ? "text-rose-400" : "tv-accent-text"
                          }`}
                        >
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          onClick={() => onAdjustStock(item.id, 5)}
                          title={
                            vi
                              ? `Nhập kho bổ sung +5 ${item.unit}`
                              : `Receive +5 ${item.unit} into stock`
                          }
                          className="tv-surface tv-border inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold tv-accent-text cursor-pointer"
                        >
                          +5 {vi ? "Nhập Kho" : "Receive"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="tv-surface-2 tv-border mt-6 rounded-xl border p-3.5">
            <p className="text-xs font-bold tv-accent-text">
              {vi
                ? "Tính Định Mức Chỉ Trên, Mút EVA & Báo Giá"
                : "Upper Thread Norm, EVA Foam & Quote Calculator"}
            </p>
            <p className="mt-0.5 text-[11px] tv-text-muted">
              {vi
                ? "Làm mẫu miễn phí (0đ), tự tính định mức chỉ trên theo đơn (kèm tùy chọn sang chỉ 20 đầu khi cần), mút EVA 3D và chi phí vận chuyển."
                : "Free sampling (0 VND), auto-calculate upper thread norm (with optional 20-head splitting), 3D EVA foam, and external transport fee."}
            </p>
            <button
              onClick={() => onSelectTab("quote")}
              className="tv-accent-bg mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold cursor-pointer"
            >
              {vi
                ? "Mở Bảng Tính Định Mức & Báo Giá →"
                : "Open Norm & Quote Calculator →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(OverviewTab);
