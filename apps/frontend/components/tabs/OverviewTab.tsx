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
import { formatVnd, formatVndCompact } from "@/lib/currency";
import {
  type ActiveTab,
  MACHINE_BADGE_STYLES,
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
  const overviewPageSize = 3;
  const totalOrderPages = Math.max(
    1,
    Math.ceil(orders.length / overviewPageSize),
  );
  const safeOrderPage = Math.min(Math.max(1, orderPage), totalOrderPages);
  const pagedOverviewOrders = orders.slice(
    (safeOrderPage - 1) * overviewPageSize,
    safeOrderPage * overviewPageSize,
  );

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="tv-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tv-text-muted">
              {vi ? "Lệnh Sản Xuất Đang Chạy" : "Active Work Orders"}
            </p>
            <span className="tv-accent-text text-sm font-bold">❖</span>
          </div>
          <p className="mt-2 text-2xl font-black">{metrics.activeOrdersCount}</p>
          <p className="mt-1 text-xs text-sky-400">
            {vi
              ? `${metrics.inProductionCount} đơn đang chạy trên máy`
              : `${metrics.inProductionCount} stitching on shop floor`}
          </p>
        </div>

        <div className="tv-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tv-text-muted">
              {vi ? "Tổng Mũi Thêu Chờ Chạy" : "Queued Stitch Backlog"}
            </p>
            <span className="tv-accent-text text-sm font-bold">◎</span>
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

        <div className="tv-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tv-text-muted">
              {vi ? "Công Suất Dàn Máy" : "Machine Utilization"}
            </p>
            <span className="text-emerald-400 text-sm font-bold">⚙</span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">
            {metrics.runningMachinesCount} / {metrics.totalMachinesCount}{" "}
            <span className="text-xs font-normal tv-text-muted">
              {vi ? "máy" : "lines"}
            </span>
          </p>
          <p className="mt-1 text-xs tv-text-muted">
            {vi
              ? `Tổng ${machines.reduce((acc, m) => acc + m.heads, 0)} đầu thêu công nghiệp`
              : `${machines.reduce((acc, m) => acc + m.heads, 0)} active embroidery heads`}
          </p>
        </div>

        <div className="tv-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tv-text-muted">
              {vi ? "Doanh Thu & Công Nợ" : "Revenue & Receivables"}
            </p>
            <span className="text-emerald-400 text-sm font-bold">₫</span>
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
              {vi ? "nợ" : "due"}
            </span>
          </p>
        </div>

        <div
          onClick={() => onSelectTab("employees")}
          className="tv-card p-4 cursor-pointer transition hover:opacity-90"
          title={
            vi
              ? `Tổng lương: ${formatVnd(metrics.monthlyLaborCost)} • Nhấn để mở Nhân Sự & Bảng Lương`
              : `Total Payroll: ${formatVnd(metrics.monthlyLaborCost)} • Click to open Staff & Payroll`
          }
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tv-text-muted">
              {vi ? "Chi Phí Lương & Lãi Ròng" : "Labor Cost & Net"}
            </p>
            <span className="tv-accent-text text-sm font-bold">♟</span>
          </div>
          <p className="mt-2 text-xl font-black font-mono text-amber-400 truncate">
            {formatVndCompact(metrics.monthlyLaborCost, vi)}
          </p>
          <p className="mt-1 text-xs text-emerald-400 truncate">
            {vi ? "Lãi:" : "Net:"}{" "}
            {formatVndCompact(metrics.estimatedNetProfit, vi)} •{" "}
            <span className="tv-text-muted">
              {metrics.activeEmployeesCount}/{metrics.totalEmployeesCount}{" "}
              {vi ? "NS" : "staff"}
            </span>
          </p>
        </div>

        <div className="tv-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tv-text-muted">
              {vi ? "Vật Tư Chỉ & Keo Lót" : "Thread & Stabilizer"}
            </p>
            <span className="tv-accent-text text-sm font-bold">⌇</span>
          </div>
          <p
            className={`mt-2 text-xl font-black ${
              metrics.lowStockItemsCount > 0
                ? "text-rose-400"
                : "text-emerald-400"
            }`}
          >
            {metrics.lowStockItemsCount > 0
              ? vi
                ? `${metrics.lowStockItemsCount} Mã Sắp Hết`
                : `${metrics.lowStockItemsCount} Low Stock`
              : vi
                ? "Đủ Tồn Kho"
                : "All Stocked"}
          </p>
          <p
            className="mt-1 text-xs tv-text-muted truncate"
            title={formatVnd(metrics.inventoryValue)}
          >
            {vi ? "Giá trị kho:" : "Stock Value:"}{" "}
            {formatVndCompact(metrics.inventoryValue, vi)}
          </p>
        </div>
      </div>

      {/* Financial & Production Health Bar */}
      <div className="tv-card p-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="tv-surface-2 tv-border rounded-xl border p-3.5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold uppercase tracking-wider tv-text-muted">
              {vi
                ? "Tiến Độ Thu Tiền Đơn Hàng (VND)"
                : "Order Revenue Collection (VND)"}
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {metrics.monthlyRevenue > 0
                ? Math.round(
                    (metrics.collectedRevenue / metrics.monthlyRevenue) * 100,
                  )
                : 0}
              % ({formatVnd(metrics.collectedRevenue)} /{" "}
              {formatVnd(metrics.monthlyRevenue)})
            </span>
          </div>
          <div className="tv-surface h-2 w-full overflow-hidden rounded-full">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{
                width: `${
                  metrics.monthlyRevenue > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (metrics.collectedRevenue / metrics.monthlyRevenue) *
                            100,
                        ),
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div className="tv-surface-2 tv-border rounded-xl border p-3.5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold uppercase tracking-wider tv-text-muted">
              {vi
                ? "Cơ Cấu Quỹ Lương / Lợi Nhuận Gộp"
                : "Payroll vs. Gross Profit Margin"}
            </span>
            <span className="font-mono font-bold tv-accent-text">
              {vi ? "Lương:" : "Payroll:"}{" "}
              {formatVnd(metrics.monthlyLaborCost)} •{" "}
              <span className="text-emerald-400">
                {vi ? "Lãi:" : "Net:"} {formatVnd(metrics.estimatedNetProfit)}
              </span>
            </span>
          </div>
          <div className="tv-surface flex h-2 w-full overflow-hidden rounded-full">
            <div
              className="h-full bg-amber-400 transition-all"
              style={{
                width: `${
                  metrics.monthlyRevenue > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (metrics.monthlyLaborCost / metrics.monthlyRevenue) *
                            100,
                        ),
                      )
                    : 0
                }%`,
              }}
            />
            <div className="h-full flex-1 bg-emerald-500/75" />
          </div>
        </div>
      </div>

      {/* Live Embroidery Machine Line Status */}
      <div className="tv-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider">
              {vi
                ? "Xưởng Thêu Tường Vinh — Trạng Thái Dàn Máy Thêu Vi Tính"
                : "Tuong Vinh Shop Floor — Multi-Head Telemetry"}
            </h2>
            <p className="text-xs tv-text-muted">
              {vi
                ? "Theo dõi tốc độ máy (SPM), thợ phụ trách, tiến độ đơn hàng đang chạy và ghi nhận mẻ hàng hoàn thành"
                : "Real-time machine speed (SPM), assigned operator, job progress, and one-click batch completion"}
            </p>
          </div>
          <button
            onClick={() => onSelectTab("machines")}
            className="tv-accent-text text-xs font-bold hover:underline cursor-pointer"
          >
            {vi ? "Mở Bảng Điều Khiển Máy →" : "Open Machine Control →"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {machines.map((m) => {
            const operator = operatorByMachineId.get(m.id);
            return (
              <div
                key={m.id}
                className="tv-surface-2 tv-border rounded-xl border p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate">{m.name}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
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
                      <span>{vi ? "Thợ đứng máy:" : "Operator:"}</span>
                      <span className="font-semibold tv-text truncate max-w-[120px]">
                        {operator
                          ? operator.name
                          : vi
                            ? "Chưa phân công"
                            : "Unassigned"}
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
                      className="mt-2.5 w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                    >
                      +{" "}
                      {vi
                        ? `Cộng Mẻ Vừa Xong (+${m.heads * 2} áo)`
                        : `Log Completed Run (+${m.heads * 2} pcs)`}
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
        <div className="lg:col-span-2 tv-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider">
              {vi
                ? "Lệnh Sản Xuất Ưu Tiên Tại Xưởng"
                : "Priority Production Work Orders"}
            </h2>
            <button
              onClick={() => onSelectTab("orders")}
              className="tv-accent-text text-xs font-bold hover:underline cursor-pointer"
            >
              {vi ? "Xem Tất Cả Đơn Hàng →" : "Manage All Orders →"}
            </button>
          </div>

          <div className="space-y-3">
            {pagedOverviewOrders.map((order) => (
              <div
                key={order.id}
                className="tv-surface-2 tv-border flex flex-wrap items-center justify-between gap-4 rounded-xl border p-3.5"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold tv-accent-text">
                      {order.orderNumber}
                    </span>
                    {order.rushOrder && (
                      <span className="rounded bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">
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
                        PAYMENT_BADGE_STYLES[order.paymentStatus ?? "UNPAID"]
                      }`}
                    >
                      {paymentLabels[order.paymentStatus ?? "UNPAID"]}
                    </span>
                  </div>
                  <p className="text-sm font-bold">
                    {order.companyName} — {order.designName}
                  </p>
                  <p className="text-xs tv-text-muted">
                    {order.completedQuantity}/{order.quantity}{" "}
                    {vi ? "cái" : "pcs"} • {order.garmentType} (
                    {placementLabels[order.placement]}) •{" "}
                    <span className="font-mono">
                      {order.stitchCount.toLocaleString()}{" "}
                      {vi ? "mũi/cái" : "st/pc"}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-emerald-400">
                      {formatVnd(order.totalPrice)}
                    </p>
                    <p className="text-[11px] tv-text-muted">
                      {vi ? "Giao:" : "Due"} {order.dueDate}
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenJobTicket(order)}
                    className="tv-surface tv-border rounded-lg border px-2.5 py-1.5 text-xs font-semibold hover:opacity-80 cursor-pointer"
                  >
                    {vi ? "Phiếu SX" : "Job Sheet"}
                  </button>
                  {order.status !== "DELIVERED" && (
                    <button
                      onClick={() => onAdvanceOrderStatus(order)}
                      className="tv-accent-bg rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer"
                    >
                      {vi ? "Chuyển Bước →" : "Advance →"}
                    </button>
                  )}
                </div>
              </div>
            ))}
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
                className={`tv-surface-2 tv-border rounded-lg border px-2.5 py-1 font-semibold ${
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
                        : "tv-surface-2 tv-text-muted"
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
                className={`tv-surface-2 tv-border rounded-lg border px-2.5 py-1 font-semibold ${
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
                  ? "Cảnh Báo Tồn Kho Chỉ & Keo"
                  : "Supply & Thread Reorder Watch"}
              </h2>
              {metrics.lowStockItemsCount > 0 && (
                <button
                  onClick={onRestockAllLow}
                  className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  + {vi ? "Nhập Thêm Tất Cả Mã Thiếu" : "Restock All Low"}
                </button>
              )}
            </div>
            <p className="text-xs tv-text-muted mb-4">
              {vi
                ? "Các cuộn chỉ thêu và keo lót sắp chạm định mức tối thiểu"
                : "Cones & stabilizers near minimum shop threshold"}
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
                          className="tv-surface tv-border rounded border px-2 py-1 text-[11px] font-bold tv-accent-text cursor-pointer"
                        >
                          +5
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
                ? "Công Cụ Báo Giá Thêu & Số Mũi Nhanh"
                : "Fast Stitch & Garment Quote Estimator"}
            </p>
            <p className="mt-0.5 text-[11px] tv-text-muted">
              {vi
                ? "Tính đơn giá thêu theo số lượng, số mũi thêu, phí thiết kế mẫu (digitizing) và phụ phí thêu nổi 3D."
                : "Price client quotes with volume stitch tiers, digitizing setup, and 3D puff foam surcharges."}
            </p>
            <button
              onClick={() => onSelectTab("quote")}
              className="tv-accent-bg mt-2.5 w-full rounded-lg py-2 text-xs font-bold cursor-pointer"
            >
              {vi
                ? "Mở Bảng Tính Báo Giá Thêu →"
                : "Open Stitch & Quote Calculator →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(OverviewTab);

