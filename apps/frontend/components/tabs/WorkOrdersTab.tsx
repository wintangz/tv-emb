"use client";

import React, { useState } from "react";
import type {
  EmbroideryDesign,
  EmbroideryMachine,
  EmbroideryOrder,
  GarmentPlacement,
  OrderStatus,
  PaymentStatus,
} from "@/lib/types";
import { calculateOrderMaterialAndProfit } from "@/lib/seed-data";
import { formatVnd, formatVndCompact } from "@/lib/currency";
import PaginationBar from "../PaginationBar";
import {
  ORDER_STAGE_FLOW,
  PAYMENT_BADGE_STYLES,
  STATUS_BADGE_STYLES,
} from "./studio-constants";

interface WorkOrdersTabProps {
  vi: boolean;
  filteredOrders: EmbroideryOrder[];
  orderStatusFilter: OrderStatus | "ALL";
  ordersViewMode: "list" | "kanban";
  orderSearch: string;
  designById: Map<string, EmbroideryDesign>;
  machineById: Map<string, EmbroideryMachine>;
  statusLabels: Record<OrderStatus, string>;
  paymentLabels: Record<PaymentStatus, string>;
  placementLabels: Record<GarmentPlacement, string>;
  canViewFinancials?: boolean;
  onChangeStatusFilter: (status: OrderStatus | "ALL") => void;
  onChangeViewMode: (mode: "list" | "kanban") => void;
  onChangeSearch: (q: string) => void;
  onOpenJobTicket: (order: EmbroideryOrder) => void;
  onEditOrder: (order: EmbroideryOrder) => void;
  onAdvanceOrderStatus: (order: EmbroideryOrder) => void;
  onDeleteOrder: (orderId: string, orderNumber: string) => void;
  onAdjustDefectCount?: (order: EmbroideryOrder, delta: number) => void;
}

const KANBAN_STAGES: OrderStatus[] = [
  "DIGITIZING",
  "APPROVAL_PENDING",
  "IN_PRODUCTION",
  "QUALITY_CHECK",
  "COMPLETED",
];

function WorkOrdersTab({
  vi,
  filteredOrders,
  orderStatusFilter,
  ordersViewMode,
  orderSearch,
  designById,
  machineById,
  statusLabels,
  paymentLabels,
  placementLabels,
  canViewFinancials = true,
  onChangeStatusFilter,
  onChangeViewMode,
  onChangeSearch,
  onOpenJobTicket,
  onEditOrder,
  onAdvanceOrderStatus,
  onDeleteOrder,
  onAdjustDefectCount,
}: WorkOrdersTabProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(4);

  const effectiveSize =
    pageSize <= 0 ? Math.max(1, filteredOrders.length) : pageSize;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / effectiveSize),
  );
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedOrders = filteredOrders.slice(
    (safePage - 1) * effectiveSize,
    safePage * effectiveSize,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["ALL", ...ORDER_STAGE_FLOW] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                onChangeStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg border px-3 py-1.5 text-center text-xs font-semibold leading-none transition cursor-pointer ${
                orderStatusFilter === st
                  ? "tv-accent-bg border-transparent font-bold"
                  : "tv-surface tv-border tv-text"
              }`}
            >
              {st === "ALL"
                ? vi
                  ? "Tất Cả Công Đoạn"
                  : "All Stages"
                : statusLabels[st]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Switcher: List vs Kanban */}
          <div className="tv-surface-2 tv-border inline-flex items-center gap-1 rounded-xl border p-1">
            <button
              onClick={() => onChangeViewMode("list")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                ordersViewMode === "list"
                  ? "tv-accent-bg font-bold shadow-xs"
                  : "tv-surface tv-border border tv-text hover:opacity-90"
              }`}
            >
              <span aria-hidden="true">☰</span>
              <span>{vi ? "Danh Sách" : "List"}</span>
            </button>
            <button
              onClick={() => onChangeViewMode("kanban")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                ordersViewMode === "kanban"
                  ? "tv-accent-bg font-bold shadow-xs"
                  : "tv-surface tv-border border tv-text hover:opacity-90"
              }`}
            >
              <span aria-hidden="true">⊞</span>
              <span>{vi ? "Bảng chuyền (Kanban)" : "Kanban Board"}</span>
            </button>
          </div>

          <input
            type="text"
            value={orderSearch}
            onChange={(e) => {
              onChangeSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              vi
                ? "Tìm mã TV#, khách hàng, loại áo..."
                : "Search TV#, client, garment..."
            }
            className="tv-input px-3 py-1.5 text-xs"
          />
        </div>
      </div>

      {ordersViewMode === "kanban" ? (
        /* KANBAN PIPELINE VIEW */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {KANBAN_STAGES.map((stage) => {
            const stageOrders = filteredOrders.filter(
              (o) => o.status === stage,
            );
            return (
              <div key={stage} className="tv-card p-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b tv-border pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {statusLabels[stage]}
                  </span>
                  <span className="tv-surface-2 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold">
                    {stageOrders.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {stageOrders.map((order) => {
                    const stageIdx = ORDER_STAGE_FLOW.indexOf(order.status);
                    const nextStage =
                      stageIdx >= 0 && stageIdx < ORDER_STAGE_FLOW.length - 1
                        ? ORDER_STAGE_FLOW[stageIdx + 1]
                        : null;
                    return (
                      <div
                        key={order.id}
                        className="tv-surface-2 tv-border rounded-xl border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold tv-accent-text">
                            {order.orderNumber}
                          </span>
                          {order.rushOrder && (
                            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-400">
                              {vi ? "GẤP" : "RUSH"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold leading-snug">
                          {order.companyName}
                        </p>
                        <p className="text-[11px] tv-text-muted">
                          {order.quantity} {vi ? "cái" : "pcs"} •{" "}
                          {canViewFinancials ? (
                            <span className="font-mono text-emerald-400">
                              {formatVndCompact(order.totalPrice, vi)}
                            </span>
                          ) : (
                            <span className="font-mono tv-accent-text">
                              {order.stitchCount.toLocaleString()}{" "}
                              {vi ? "mũi" : "st"}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            onClick={() => onOpenJobTicket(order)}
                            className="tv-surface tv-border inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold tv-text hover:opacity-90 cursor-pointer"
                          >
                            <span aria-hidden="true">📄</span>
                            <span>{vi ? "Lệnh SX" : "Job Ticket"}</span>
                          </button>
                          {nextStage && (
                            <button
                              onClick={() => onAdvanceOrderStatus(order)}
                              title={
                                vi
                                  ? `Chuyển công đoạn: ${statusLabels[nextStage]}`
                                  : `Advance stage: ${statusLabels[nextStage]}`
                              }
                              className="tv-accent-bg inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold cursor-pointer"
                            >
                              {vi ? "Chuyển Công Đoạn →" : "Advance Stage →"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {stageOrders.length === 0 && (
                    <p className="py-6 text-center text-[11px] tv-text-muted">
                      {vi ? "Không có đơn ở khâu này" : "No orders in stage"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DETAILED LIST VIEW */
        <div className="space-y-3">
          {pagedOrders.map((order) => {
            const pct =
              order.quantity > 0
                ? Math.round((order.completedQuantity / order.quantity) * 100)
                : 0;
            const design = designById.get(order.designId);
            const machine = order.assignedMachineId
              ? machineById.get(order.assignedMachineId)
              : undefined;
            const stageIdx = ORDER_STAGE_FLOW.indexOf(order.status);
            const nextStage =
              stageIdx >= 0 && stageIdx < ORDER_STAGE_FLOW.length - 1
                ? ORDER_STAGE_FLOW[stageIdx + 1]
                : null;
            const mat = calculateOrderMaterialAndProfit(order);

            return (
              <div key={order.id} className="tv-card p-4 space-y-3">
                {/* Top Row: Order Identity & Notes (Left) + 3-Column Metrics Box (Right) */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold tv-accent-text">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                          STATUS_BADGE_STYLES[order.status]
                        }`}
                      >
                        {statusLabels[order.status]}
                      </span>
                      {canViewFinancials && (
                        <span
                          className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                            PAYMENT_BADGE_STYLES[order.paymentStatus ?? "UNPAID"]
                          }`}
                        >
                          {paymentLabels[order.paymentStatus ?? "UNPAID"]} (
                          {formatVnd(order.amountPaid ?? 0)} /{" "}
                          {formatVnd(order.totalPrice)})
                        </span>
                      )}
                      {(order.defectQuantity ?? 0) > 0 && (
                        <span className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-rose-500/15 border border-rose-500/35 px-2.5 py-1 text-center text-[11px] font-bold leading-none text-rose-400">
                          <span aria-hidden="true">⚠</span>
                          <span>
                            {order.defectQuantity}{" "}
                            {vi ? "áo lỗi QC" : "defects"}
                          </span>
                        </span>
                      )}
                      {order.rushOrder && (
                        <span className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 text-center text-[11px] font-bold leading-none text-rose-400">
                          {vi ? "ĐƠN GẤP" : "RUSH ORDER"}
                        </span>
                      )}
                      <span className="tv-surface-2 inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-center text-xs leading-none tv-text-muted">
                        {vi ? "Vị trí:" : "Placement:"}{" "}
                        {placementLabels[order.placement]}
                      </span>
                      {machine && (
                        <span className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-center text-xs leading-none text-emerald-400">
                          {machine.name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold">
                      {order.companyName}{" "}
                      <span className="font-normal tv-text-muted">
                        ({order.customerName})
                      </span>
                    </h3>

                    <p className="text-xs tv-text-muted">
                      <span className="font-semibold tv-text">
                        {order.garmentType}
                      </span>{" "}
                      ({order.garmentColor}) • {vi ? "Mẫu thêu:" : "Design:"}{" "}
                      <span className="underline">{order.designName}</span> (
                      {design?.code ?? "DST"})
                    </p>

                    {order.notes && (
                      <p className="text-xs italic tv-text-muted leading-relaxed">
                        {vi ? "Ghi chú xưởng:" : "Shop Note:"} &ldquo;
                        {order.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Compact Right Metrics Box */}
                  <div className="tv-surface-2 tv-border grid grid-cols-3 gap-4 shrink-0 rounded-xl border px-4 py-2.5 text-right">
                    <div>
                      <p className="text-[11px] tv-text-muted whitespace-nowrap">
                        {vi ? "Số Mũi / SP" : "Stitches / Pc"}
                      </p>
                      <p className="font-mono text-sm font-bold">
                        {order.stitchCount.toLocaleString()}{" "}
                        {vi ? "mũi" : "st"}
                      </p>
                      <div className="mt-1 flex justify-end gap-1">
                        {order.threadColors.map((hex, idx) => (
                          <span
                            key={idx}
                            className="h-3 w-3 rounded-full border border-slate-500"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="border-l tv-border pl-4">
                      <p className="text-[11px] tv-text-muted whitespace-nowrap">
                        {vi ? "Tiến Độ SL" : "Quantity"}
                      </p>
                      <p className="font-mono text-sm font-bold whitespace-nowrap">
                        {order.completedQuantity} / {order.quantity}{" "}
                        {vi ? "cái" : "pcs"}
                      </p>
                      <div className="tv-surface mt-1.5 ml-auto h-1.5 w-20 overflow-hidden rounded-full">
                        <div
                          className="h-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: "var(--tv-accent)",
                          }}
                        />
                      </div>
                    </div>

                    {canViewFinancials ? (
                      <div className="border-l tv-border pl-4">
                        <p className="text-[11px] tv-text-muted whitespace-nowrap">
                          {vi ? "Doanh Thu Đơn" : "Order Revenue"}
                        </p>
                        <p className="font-mono text-sm font-black text-emerald-400 whitespace-nowrap">
                          {formatVnd(order.totalPrice)}
                        </p>
                        <p className="text-[10px] tv-text-muted whitespace-nowrap">
                          {formatVnd(order.unitPrice)}/{vi ? "cái" : "pc"} •{" "}
                          {order.dueDate}
                        </p>
                      </div>
                    ) : (
                      <div className="border-l tv-border pl-4">
                        <p className="text-[11px] tv-text-muted whitespace-nowrap">
                          {vi ? "Hạn Giao & QC" : "Due & QC"}
                        </p>
                        <p className="font-mono text-xs font-bold tv-accent-text whitespace-nowrap">
                          {order.dueDate}
                        </p>
                        <p className="text-[10px] tv-text-muted whitespace-nowrap">
                          🔒 {vi ? "Chế độ xưởng" : "Floor Mode"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Bar: Material Norms (Left) + Action Buttons (Right) */}
                <div className="tv-surface-2 tv-border flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-[11px]">
                  {canViewFinancials ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        🧵{" "}
                        <strong className="tv-text">
                          {vi ? "Định mức chỉ trên:" : "Upper thread:"}
                        </strong>{" "}
                        {order.colorCount} {vi ? "màu" : "colors"} →{" "}
                        {vi ? "Mua" : "Buy"}{" "}
                        <strong className="tv-accent-text">
                          {mat.totalMasterConesToBuy}{" "}
                          {vi ? "cuộn" : "cones"}
                        </strong>
                        {mat.splitThreadFor20Heads
                          ? ` (${vi ? "sang" : "→"} ${mat.totalSubConesFor20Heads} ${vi ? "cuộn con" : "sub"})`
                          : ""}{" "}
                        ={" "}
                        <span className="font-mono font-bold text-amber-400">
                          {formatVnd(mat.upperThreadCost)}
                        </span>
                      </span>

                      {mat.evaFoamCost > 0 && (
                        <span>
                          • 🧊{" "}
                          <strong className="tv-text">
                            {vi ? "Mút EVA 3D:" : "3D EVA:"}
                          </strong>{" "}
                          <span className="font-mono font-bold text-amber-400">
                            {formatVnd(mat.evaFoamCost)}
                          </span>
                        </span>
                      )}

                      <span>
                        • 🚚{" "}
                        <strong className="tv-text">
                          {mat.shippingMode === "CHANH_XE_PICKUP"
                            ? vi
                              ? "Chành xe 1 chiều:"
                              : "1-way Chanh Xe:"
                            : vi
                              ? "Xe vận chuyển 2 chiều:"
                              : "2-way vehicle:"}
                        </strong>{" "}
                        <span className="font-mono font-bold text-sky-400">
                          {formatVnd(mat.shippingCost)}
                        </span>
                      </span>

                      <span className="font-mono font-bold text-emerald-400">
                        • {vi ? "Còn lại:" : "Net:"}{" "}
                        {formatVnd(mat.orderGrossProfit)}
                      </span>
                    </div>
                  ) : (
                    <span className="tv-text-muted">
                      {vi
                        ? "Phiếu lệnh sản xuất & mẫu duyệt kỹ thuật chuyền thêu"
                        : "Production work order & shop-floor technical sheet"}
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    <button
                      onClick={() => onOpenJobTicket(order)}
                      className="tv-surface tv-border inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold tv-text hover:opacity-90 cursor-pointer"
                    >
                      <span aria-hidden="true">📄</span>
                      <span>
                        {canViewFinancials
                          ? vi
                            ? "Lệnh SX & Phiếu Tính Tiền"
                            : "Job Ticket & Statement"
                          : vi
                            ? "Lệnh SX & Mẫu Duyệt"
                            : "Job Ticket & Proof"}
                      </span>
                    </button>
                    {onAdjustDefectCount && (
                      <button
                        onClick={() => onAdjustDefectCount(order, 1)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/45 bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/25 cursor-pointer"
                        title={
                          vi
                            ? "Ghi nhận +1 sản phẩm không đạt tiêu chuẩn QC (phế phẩm / lỗi thêu)"
                            : "Record +1 non-conforming garment during QC inspection"
                        }
                      >
                        <span aria-hidden="true">⚠</span>
                        <span>
                          {vi ? "+1 Phế Phẩm QC" : "+1 QC Defect"}
                        </span>
                      </button>
                    )}
                    {canViewFinancials && (
                      <button
                        onClick={() => onEditOrder(order)}
                        className="tv-surface tv-border inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold tv-text hover:opacity-90 cursor-pointer"
                      >
                        <span aria-hidden="true">✎</span>
                        <span>{vi ? "Sửa" : "Edit"}</span>
                      </button>
                    )}
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
                    {canViewFinancials && (
                      <button
                        onClick={() =>
                          onDeleteOrder(order.id, order.orderNumber)
                        }
                        className="tv-surface tv-border inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                      >
                        {vi ? "Xóa" : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <PaginationBar
            vi={vi}
            currentPage={safePage}
            pageSize={pageSize}
            totalItems={filteredOrders.length}
            pageSizeOptions={[4, 6, 10, 20]}
            unitLabel={vi ? "lệnh sản xuất" : "work orders"}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </div>
  );
}

export default React.memo(WorkOrdersTab);
