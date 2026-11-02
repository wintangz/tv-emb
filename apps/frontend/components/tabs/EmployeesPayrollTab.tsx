"use client";

import React, { memo, useState } from "react";
import type {
  DashboardMetrics,
  EmbroideryMachine,
  Employee,
  EmployeeCostBreakdown,
  EmployeeRole,
  EmployeeShift,
  EmployeeStatus,
  SalaryPaymentStatus,
} from "@/lib/types";
import { calculateEmployeeCostBreakdown } from "@/lib/seed-data";
import { formatVnd, formatVndCompact } from "@/lib/currency";
import PaginationBar from "../PaginationBar";
import {
  EMPLOYEE_ROLES,
  EMPLOYEE_STATUS_BADGE_STYLES,
  SALARY_BADGE_STYLES,
} from "./studio-constants";

export interface EmployeePayrollSummary {
  breakdownById: Map<string, EmployeeCostBreakdown>;
  roleCounts: Record<string, number>;
  totalOvertimePay: number;
  totalStitchBonus: number;
  totalStitchesByStaff: number;
}

export interface EmployeesPayrollTabProps {
  vi: boolean;
  employees: Employee[];
  filteredEmployees: Employee[];
  machines: EmbroideryMachine[];
  machineById: Map<string, EmbroideryMachine>;
  metrics: DashboardMetrics;
  employeePayrollSummary: EmployeePayrollSummary;
  employeeRoleFilter: EmployeeRole | "ALL";
  employeeSearch: string;
  EMPLOYEE_ROLE_LABELS: Record<EmployeeRole, string>;
  EMPLOYEE_SHIFT_LABELS: Record<EmployeeShift, string>;
  EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string>;
  SALARY_STATUS_LABELS: Record<SalaryPaymentStatus, string>;
  onSetEmployeeRoleFilter: (role: EmployeeRole | "ALL") => void;
  onSetEmployeeSearch: (q: string) => void;
  onExportPayrollCsv: () => void;
  onOpenNewEmployeeModal: () => void;
  onOpenEditEmployeeModal: (emp: Employee) => void;
  onOpenPayslipModal: (emp: Employee) => void;
  onPayAllUnpaidPayroll: () => void;
  onDeleteEmployee: (id: string, name: string) => void;
  onQuickUpdateEmployee: (
    emp: Employee,
    patch: Partial<Employee>,
    toastMsg: string,
  ) => void;
}

const EmployeesPayrollTab = memo(function EmployeesPayrollTab({
  vi,
  employees,
  filteredEmployees,
  machines,
  machineById,
  metrics,
  employeePayrollSummary,
  employeeRoleFilter,
  employeeSearch,
  EMPLOYEE_ROLE_LABELS,
  EMPLOYEE_SHIFT_LABELS,
  EMPLOYEE_STATUS_LABELS,
  SALARY_STATUS_LABELS,
  onSetEmployeeRoleFilter,
  onSetEmployeeSearch,
  onExportPayrollCsv,
  onOpenNewEmployeeModal,
  onOpenEditEmployeeModal,
  onOpenPayslipModal,
  onPayAllUnpaidPayroll,
  onDeleteEmployee,
  onQuickUpdateEmployee,
}: EmployeesPayrollTabProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(4);

  const effectiveSize =
    pageSize <= 0 ? Math.max(1, filteredEmployees.length) : pageSize;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / effectiveSize),
  );
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedEmployees = filteredEmployees.slice(
    (safePage - 1) * effectiveSize,
    safePage * effectiveSize,
  );

  const {
    totalOvertimePay,
    totalStitchBonus,
    totalStitchesByStaff,
    roleCounts,
  } = employeePayrollSummary;
  const laborRatioPct =
    metrics.monthlyRevenue > 0
      ? Math.round(
          (metrics.monthlyLaborCost / metrics.monthlyRevenue) * 1000,
        ) / 10
      : 0;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold">
            {vi
              ? "Quản Lý Nhân Sự, Ca Máy & Chi Phí Tiền Lương Xưởng Thêu (VND)"
              : "Shop Staff, Machine Operators & Monthly Labor Cost / Payroll (VND)"}
          </h2>
          <p className="text-xs tv-text-muted">
            {vi
              ? "Theo dõi thợ đứng máy thêu, kỹ thuật vẽ mẫu (Digitizer), QC cắt chỉ, lương giờ / lương tháng, tăng ca (1.5x) và thưởng sản lượng mũi thêu"
              : "Manage embroidery machine operators, digitizers, QC trimmers, hourly/monthly pay, overtime (1.5x), and stitch-output bonuses"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={employeeSearch}
            onChange={(e) => {
              onSetEmployeeSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              vi
                ? "Tìm tên, mã NV, bộ phận..."
                : "Search name, code, role..."
            }
            className="tv-input px-3 py-1.5 text-xs"
          />
          {metrics.unpaidLaborCost > 0 && (
            <button
              onClick={onPayAllUnpaidPayroll}
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
            >
              ✓{" "}
              {vi
                ? `Chốt & Tất Toán Lương (${formatVndCompact(metrics.unpaidLaborCost, vi)})`
                : `Settle All Payroll (${formatVndCompact(metrics.unpaidLaborCost, vi)})`}
            </button>
          )}
          <button
            onClick={onExportPayrollCsv}
            className="tv-surface-2 tv-border rounded-xl border px-3 py-2 text-xs font-semibold hover:opacity-85 cursor-pointer"
          >
            ⬇ {vi ? "Xuất Bảng Lương CSV" : "Export Payroll CSV"}
          </button>
          <button
            onClick={onOpenNewEmployeeModal}
            className="tv-accent-bg rounded-xl px-3.5 py-2 text-xs font-bold cursor-pointer"
          >
            + {vi ? "Thêm Nhân Sự Mới" : "Add Staff Member"}
          </button>
        </div>
      </div>

      {/* Payroll & Labor Cost KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="tv-card p-4">
          <p className="text-xs tv-text-muted">
            {vi ? "Nhân Sự Xưởng Thêu" : "Active Shop Staff"}
          </p>
          <p className="mt-1.5 text-2xl font-black">
            {metrics.activeEmployeesCount} / {metrics.totalEmployeesCount}
          </p>
          <p className="mt-1 text-xs tv-text-muted">
            {vi
              ? `${roleCounts["Machine Operator"] ?? 0} thợ đứng máy • ${roleCounts["Digitizer"] ?? 0} thiết kế mẫu`
              : `${roleCounts["Machine Operator"] ?? 0} operators • ${roleCounts["Digitizer"] ?? 0} digitizers`}
          </p>
        </div>

        <div className="tv-card p-4">
          <p className="text-xs tv-text-muted">
            {vi ? "Tổng Chi Phí Lương Tháng" : "Monthly Labor Cost"}
          </p>
          <p
            className="mt-1.5 text-xl font-black font-mono text-amber-400 truncate"
            title={formatVnd(metrics.monthlyLaborCost)}
          >
            {formatVndCompact(metrics.monthlyLaborCost, vi)}
          </p>
          <p className="mt-1 text-xs tv-text-muted">
            {vi
              ? `Chiếm ${laborRatioPct}% tổng doanh thu đơn hàng`
              : `${laborRatioPct}% of total work order revenue`}
          </p>
        </div>

        <div className="tv-card p-4">
          <p className="text-xs tv-text-muted">
            {vi ? "Tăng Ca (1.5x) & Thưởng Mũi" : "Overtime & Stitch Bonus"}
          </p>
          <p
            className="mt-1.5 text-xl font-black font-mono tv-accent-text truncate"
            title={formatVnd(totalOvertimePay + totalStitchBonus)}
          >
            {formatVndCompact(totalOvertimePay + totalStitchBonus, vi)}
          </p>
          <p className="mt-1 text-xs tv-text-muted truncate">
            OT: {formatVndCompact(totalOvertimePay, vi)} •{" "}
            {vi ? "Thưởng mũi:" : "Stitch:"}{" "}
            {formatVndCompact(totalStitchBonus, vi)} (
            {(totalStitchesByStaff / 1000000).toFixed(2)}M{" "}
            {vi ? "mũi" : "st"})
          </p>
        </div>

        <div className="tv-card p-4">
          <p className="text-xs tv-text-muted">
            {vi ? "Tình Trạng Chi Trả Lương" : "Payroll Disbursement"}
          </p>
          <p
            className="mt-1.5 text-xl font-black font-mono text-emerald-400 truncate"
            title={formatVnd(metrics.paidLaborCost)}
          >
            {formatVndCompact(metrics.paidLaborCost, vi)}
          </p>
          <p className="mt-1 text-xs truncate">
            <span
              className="text-rose-400 font-semibold"
              title={formatVnd(metrics.unpaidLaborCost)}
            >
              {formatVndCompact(metrics.unpaidLaborCost, vi)}{" "}
              {vi ? "chưa thanh toán" : "unpaid balance"}
            </span>
          </p>
        </div>

        <div className="tv-card p-4">
          <p className="text-xs tv-text-muted">
            {vi ? "Lợi Nhuận Gộp (Sau Lương)" : "Net Margin After Labor"}
          </p>
          <p
            className={`mt-1.5 text-xl font-black font-mono truncate ${
              metrics.estimatedNetProfit >= 0
                ? "text-emerald-400"
                : "text-rose-400"
            }`}
            title={formatVnd(metrics.estimatedNetProfit)}
          >
            {formatVndCompact(metrics.estimatedNetProfit, vi)}
          </p>
          <p className="mt-1 text-xs tv-text-muted truncate">
            {vi ? "Doanh thu" : "Rev"}{" "}
            {formatVndCompact(metrics.monthlyRevenue, vi)} −{" "}
            {vi ? "Lương" : "Labor"}{" "}
            {formatVndCompact(metrics.monthlyLaborCost, vi)}
          </p>
        </div>
      </div>

      {/* Role Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => {
            onSetEmployeeRoleFilter("ALL");
            setCurrentPage(1);
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
            employeeRoleFilter === "ALL"
              ? "tv-accent-bg font-bold"
              : "tv-surface-2 tv-text-muted"
          }`}
        >
          {vi
            ? `Tất Cả Bộ Phận (${employees.length})`
            : `All Roles (${employees.length})`}
        </button>
        {EMPLOYEE_ROLES.map((role) => {
          const count = employeePayrollSummary.roleCounts[role] ?? 0;
          return (
            <button
              key={role}
              onClick={() => {
                onSetEmployeeRoleFilter(role);
                setCurrentPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                employeeRoleFilter === role
                  ? "tv-accent-bg font-bold"
                  : "tv-surface-2 tv-text-muted"
              }`}
            >
              {EMPLOYEE_ROLE_LABELS[role]} ({count})
            </button>
          );
        })}
      </div>

      {/* Staff & Payroll Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {pagedEmployees.map((emp) => {
          const breakdown =
            employeePayrollSummary.breakdownById.get(emp.id) ??
            calculateEmployeeCostBreakdown(emp);
          const assignedMachine = emp.assignedMachineId
            ? machineById.get(emp.assignedMachineId)
            : undefined;

          return (
            <div
              key={emp.id}
              className="tv-card p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Top Identity & Badges */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold tv-accent-text">
                        {emp.code}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                          EMPLOYEE_STATUS_BADGE_STYLES[emp.status]
                        }`}
                      >
                        {EMPLOYEE_STATUS_LABELS[emp.status]}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                          SALARY_BADGE_STYLES[emp.paymentStatus]
                        }`}
                      >
                        {SALARY_STATUS_LABELS[emp.paymentStatus]}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold">{emp.name}</h3>
                    <p className="text-xs tv-text-muted">
                      {EMPLOYEE_ROLE_LABELS[emp.role]} •{" "}
                      {EMPLOYEE_SHIFT_LABELS[emp.shift]} • 📞 {emp.phone}
                    </p>
                  </div>

                  <div className="text-right font-mono">
                    <p className="text-[10px] uppercase tv-text-muted">
                      {vi ? "Tổng Chi Phí Tháng" : "Monthly Total Cost"}
                    </p>
                    <p className="text-lg font-black text-amber-400">
                      {formatVnd(breakdown.totalCost)}
                    </p>
                    <p className="text-[11px] tv-text-muted">
                      {emp.payType === "Monthly"
                        ? vi
                          ? `Lương cứng ${formatVnd(emp.monthlyBaseSalary)}/tháng`
                          : `Fixed ${formatVnd(emp.monthlyBaseSalary)}/mo`
                        : vi
                          ? `Lương giờ ${formatVnd(emp.hourlyRate)}/giờ`
                          : `Hourly ${formatVnd(emp.hourlyRate)}/hr`}
                    </p>
                  </div>
                </div>

                {/* Machine Assignment Bar */}
                <div className="tv-surface-2 tv-border flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs">
                  <span className="tv-text-muted">
                    {vi
                      ? "Phụ trách Dàn Máy Thêu:"
                      : "Assigned Machine Line:"}
                  </span>
                  <select
                    value={emp.assignedMachineId ?? ""}
                    onChange={(e) =>
                      onQuickUpdateEmployee(
                        emp,
                        {
                          assignedMachineId: e.target.value || null,
                        },
                        vi
                          ? `Đã cập nhật máy phụ trách cho ${emp.name}`
                          : `Updated machine assignment for ${emp.name}`,
                      )
                    }
                    className="tv-input px-2.5 py-1 text-xs font-semibold"
                  >
                    <option value="">
                      {vi
                        ? "— Không đứng máy cố định —"
                        : "— Unassigned / Non-machine —"}
                    </option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.heads} {vi ? "đầu" : "heads"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Detailed Cost & Output Breakdown */}
                <div className="tv-surface-2 tv-border rounded-xl border p-3.5 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="tv-text-muted">
                      {emp.payType === "Monthly"
                        ? vi
                          ? `Lương cơ bản tháng (${emp.hoursWorkedMonth}h công):`
                          : `Monthly Base Salary (${emp.hoursWorkedMonth}h logged):`
                        : vi
                          ? `Lương giờ công (${emp.hoursWorkedMonth}h × ${formatVnd(emp.hourlyRate)}/h):`
                          : `Regular Hours (${emp.hoursWorkedMonth}h × ${formatVnd(emp.hourlyRate)}/h):`}
                    </span>
                    <span className="font-mono font-semibold">
                      {formatVnd(breakdown.basePay)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="tv-text-muted">
                      {vi
                        ? `Lương tăng ca 1.5x (${emp.overtimeHoursMonth} giờ OT):`
                        : `Overtime Pay 1.5x (${emp.overtimeHoursMonth}h OT):`}
                    </span>
                    <span className="font-mono font-semibold text-sky-400">
                      +{formatVnd(breakdown.overtimePay)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="tv-text-muted">
                      {vi
                        ? `Thưởng sản lượng mũi (${emp.stitchesCompletedMonth.toLocaleString()} mũi × ${formatVnd(emp.stitchBonusPer10k)}/10k):`
                        : `Stitch Output Bonus (${emp.stitchesCompletedMonth.toLocaleString()} st × ${formatVnd(emp.stitchBonusPer10k)}/10k):`}
                    </span>
                    <span className="font-mono font-semibold tv-accent-text">
                      +{formatVnd(breakdown.stitchBonus)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="tv-text-muted">
                      {vi
                        ? "Phụ cấp trách nhiệm / Chuyên cần:"
                        : "Shift & Attendance Allowance:"}
                    </span>
                    <span className="font-mono font-semibold">
                      +{formatVnd(breakdown.allowance)}
                    </span>
                  </div>

                  <div className="tv-border border-t pt-2 mt-1 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-emerald-400 font-semibold">
                        {vi ? "Đã chi / Tạm ứng:" : "Paid / Advance:"}{" "}
                        {formatVnd(emp.amountPaidMonth)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] tv-text-muted mr-1.5">
                        {vi ? "Còn phải trả:" : "Balance Due:"}
                      </span>
                      <span
                        className={`font-mono text-sm font-black ${
                          breakdown.balanceDue > 0
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {formatVnd(breakdown.balanceDue)}
                      </span>
                    </div>
                  </div>
                </div>

                {emp.notes && (
                  <p className="text-[11px] tv-text-muted italic">
                    {vi ? "Ghi chú:" : "Note:"} {emp.notes}
                    {assignedMachine ? ` • ${assignedMachine.name}` : ""}
                  </p>
                )}
              </div>

              {/* Quick Timecard, Stitch & Salary Payout Actions */}
              <div className="space-y-2 pt-2 border-t tv-border">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() =>
                        onQuickUpdateEmployee(
                          emp,
                          {
                            hoursWorkedMonth: emp.hoursWorkedMonth + 8,
                          },
                          vi
                            ? `Đã chấm công +8h ca làm cho ${emp.name}`
                            : `Logged +8h shift for ${emp.name}`,
                        )
                      }
                      className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-[11px] font-semibold hover:opacity-85 cursor-pointer"
                    >
                      +8h {vi ? "Ca Làm" : "Shift"}
                    </button>

                    <button
                      onClick={() =>
                        onQuickUpdateEmployee(
                          emp,
                          {
                            overtimeHoursMonth: emp.overtimeHoursMonth + 2,
                          },
                          vi
                            ? `Đã cộng +2h tăng ca (OT) cho ${emp.name}`
                            : `Logged +2h overtime for ${emp.name}`,
                        )
                      }
                      className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-[11px] font-semibold text-sky-400 hover:opacity-85 cursor-pointer"
                    >
                      +2h {vi ? "Tăng Ca" : "OT"}
                    </button>

                    {emp.stitchBonusPer10k > 0 && (
                      <button
                        onClick={() =>
                          onQuickUpdateEmployee(
                            emp,
                            {
                              stitchesCompletedMonth:
                                emp.stitchesCompletedMonth + 50000,
                            },
                            vi
                              ? `Đã cộng +50,000 mũi thêu cho ${emp.name}`
                              : `Credited +50,000 stitches to ${emp.name}`,
                          )
                        }
                        className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-[11px] font-semibold tv-accent-text hover:opacity-85 cursor-pointer"
                      >
                        +50k {vi ? "Mũi" : "Stitches"}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {emp.amountPaidMonth === 0 && breakdown.totalCost > 0 && (
                      <button
                        onClick={() => {
                          const half = Math.round(breakdown.totalCost * 0.5);
                          void onQuickUpdateEmployee(
                            emp,
                            {
                              amountPaidMonth: half,
                              paymentStatus: "PARTIAL_ADVANCE",
                            },
                            vi
                              ? `Đã tạm ứng 50% lương (${formatVnd(half)}) cho ${emp.name}`
                              : `Recorded 50% salary advance (${formatVnd(half)}) for ${emp.name}`,
                          );
                        }}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/25 cursor-pointer"
                      >
                        {vi ? "Ứng 50%" : "50% Advance"}
                      </button>
                    )}

                    {breakdown.balanceDue > 0 && (
                      <button
                        onClick={() =>
                          onQuickUpdateEmployee(
                            emp,
                            {
                              amountPaidMonth: breakdown.totalCost,
                              paymentStatus: "PAID",
                            },
                            vi
                              ? `Đã tất toán đủ lương ${formatVnd(breakdown.totalCost)} cho ${emp.name}`
                              : `Paid full monthly salary (${formatVnd(breakdown.totalCost)}) to ${emp.name}`,
                          )
                        }
                        className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
                      >
                        ✓ {vi ? "Tất Toán Lương" : "Pay Full Salary"}
                      </button>
                    )}

                    <button
                      onClick={() => onOpenPayslipModal(emp)}
                      className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-[11px] font-semibold hover:opacity-85 cursor-pointer"
                    >
                      🖨 {vi ? "Phiếu Lương" : "Payslip"}
                    </button>
                    <button
                      onClick={() => onOpenEditEmployeeModal(emp)}
                      className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-[11px] cursor-pointer"
                    >
                      {vi ? "Sửa" : "Edit"}
                    </button>
                    <button
                      onClick={() => onDeleteEmployee(emp.id, emp.name)}
                      className="tv-surface-2 tv-border rounded-lg border px-2 py-1 text-[11px] tv-text-muted hover:text-rose-400 cursor-pointer"
                    >
                      {vi ? "Xóa" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PaginationBar
        vi={vi}
        currentPage={safePage}
        pageSize={pageSize}
        totalItems={filteredEmployees.length}
        pageSizeOptions={[4, 6, 10, 20]}
        unitLabel={vi ? "nhân sự xưởng" : "staff members"}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
});

export default EmployeesPayrollTab;
