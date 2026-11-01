"use client";

import React from "react";
import type {
  EmbroideryMachine,
  EmbroideryOrder,
  Employee,
  MachineStatus,
} from "@/lib/types";
import { MACHINE_BADGE_STYLES } from "./studio-constants";

interface MachinesTabProps {
  vi: boolean;
  machines: EmbroideryMachine[];
  orders: EmbroideryOrder[];
  operatorByMachineId: Map<string, Employee>;
  machineLabels: Record<MachineStatus, string>;
  onOpenAddMachineModal: () => void;
  onMachineUpdate: (
    machineId: string,
    patch: Partial<EmbroideryMachine>,
  ) => void;
  onLogMachineBatch: (machine: EmbroideryMachine) => void;
}

const MACHINE_MODES: MachineStatus[] = [
  "RUNNING",
  "SETUP",
  "IDLE",
  "MAINTENANCE",
];

function MachinesTab({
  vi,
  machines,
  orders,
  operatorByMachineId,
  machineLabels,
  onOpenAddMachineModal,
  onMachineUpdate,
  onLogMachineBatch,
}: MachinesTabProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold">
            {vi
              ? "Quản Lý Dàn Máy Thêu Vi Tính Nhiều Đầu"
              : "Shop Floor Embroidery Machines & Multi-Head Control"}
          </h2>
          <p className="text-xs tv-text-muted">
            {vi
              ? "Chuyển trạng thái vận hành, điều chỉnh tốc độ (SPM), gán lệnh sản xuất và ghi nhận sản lượng mẻ thêu"
              : "Toggle machine operating states, adjust stitch speed (SPM), assign work orders, and log completed batches"}
          </p>
        </div>
        <button
          onClick={onOpenAddMachineModal}
          className="tv-accent-bg rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
        >
          + {vi ? "Thêm Máy Thêu Mới" : "Add Embroidery Machine"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {machines.map((machine) => {
          const operator = operatorByMachineId.get(machine.id);
          return (
            <div key={machine.id} className="tv-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold">{machine.name}</h3>
                  <p className="text-xs tv-text-muted">
                    {machine.brand} {machine.model} • {machine.heads}{" "}
                    {vi
                      ? "Đầu thêu"
                      : machine.heads > 1
                        ? "Heads"
                        : "Head"}{" "}
                    • {machine.needlesPerHead}{" "}
                    {vi ? "Kim/Đầu" : "Needles/Head"}
                  </p>
                  <p className="mt-1 text-xs tv-accent-text">
                    {vi ? "Thợ phụ trách:" : "Operator:"}{" "}
                    <span className="font-semibold">
                      {operator
                        ? `${operator.name} (${operator.code})`
                        : vi
                          ? "Chưa phân công"
                          : "Unassigned"}
                    </span>
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    MACHINE_BADGE_STYLES[machine.status]
                  }`}
                >
                  {machineLabels[machine.status]}
                </span>
              </div>

              {/* Status Controls */}
              <div>
                <p className="text-[11px] font-semibold uppercase tv-text-muted mb-1.5">
                  {vi ? "Chế Độ Vận Hành Máy" : "Set Operating Mode"}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {MACHINE_MODES.map((st) => (
                    <button
                      key={st}
                      onClick={() => onMachineUpdate(machine.id, { status: st })}
                      className={`rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
                        machine.status === st
                          ? "tv-accent-bg"
                          : "tv-surface-2 tv-border border tv-text-muted"
                      }`}
                    >
                      {machineLabels[st]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign Active Work Order & Speed */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tv-text-muted mb-1">
                    {vi ? "Lệnh Sản Xuất Đang Gán" : "Assigned Work Order"}
                  </label>
                  <select
                    value={machine.activeOrderId ?? ""}
                    onChange={(e) =>
                      onMachineUpdate(machine.id, {
                        activeOrderId: e.target.value || null,
                      })
                    }
                    className="tv-input w-full px-3 py-2 text-xs"
                  >
                    <option value="">
                      {vi
                        ? "— Chưa gán lệnh sản xuất —"
                        : "— No Active Order —"}
                    </option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} — {o.companyName} (
                        {o.completedQuantity}/{o.quantity}{" "}
                        {vi ? "cái" : "pcs"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tv-text-muted mb-1">
                    {vi ? "Tốc Độ Máy:" : "Stitch Speed:"} {machine.currentSpm}{" "}
                    SPM ({vi ? "Tối đa" : "Max"} {machine.maxSpm})
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={machine.maxSpm}
                    step={50}
                    value={machine.currentSpm}
                    onChange={(e) =>
                      onMachineUpdate(machine.id, {
                        currentSpm: Number(e.target.value),
                      })
                    }
                    className="w-full cursor-pointer"
                    style={{ accentColor: "var(--tv-accent)" }}
                  />
                </div>
              </div>

              {/* Telemetry Footer */}
              <div className="tv-surface-2 grid grid-cols-3 gap-2 rounded-lg p-3 text-center text-xs">
                <div>
                  <p className="tv-text-muted">
                    {vi ? "Số Mũi Hôm Nay" : "Stitches Today"}
                  </p>
                  <p className="font-mono font-bold">
                    {machine.totalStitchesToday.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="tv-text-muted">
                    {vi ? "Lần Đứt Chỉ" : "Thread Breaks"}
                  </p>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-mono font-bold text-rose-400">
                      {machine.threadBreaksToday}
                    </span>
                    <button
                      onClick={() =>
                        onMachineUpdate(machine.id, {
                          threadBreaksToday: machine.threadBreaksToday + 1,
                        })
                      }
                      className="tv-surface tv-border rounded border px-1.5 text-[10px] cursor-pointer"
                    >
                      +1
                    </button>
                  </div>
                </div>
                <div>
                  <p className="tv-text-muted">
                    {vi ? "Tiến Độ Mẻ" : "Run Progress"}
                  </p>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-mono font-bold text-emerald-400">
                      {machine.progressPercent}%
                    </span>
                    <button
                      onClick={() => onLogMachineBatch(machine)}
                      className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 text-[10px] font-bold text-emerald-400 cursor-pointer"
                    >
                      +{machine.heads * 2} {vi ? "cái" : "pcs"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(MachinesTab);

