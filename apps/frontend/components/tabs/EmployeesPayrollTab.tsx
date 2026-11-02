"use client";

import { memo, useState } from "react";
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
import {
  calculateEmployeeCostBreakdown,
  MEAL_ALLOWANCE_PER_DAY,
  STANDARD_HOURS_PER_DAY,
} from "@/lib/seed-data";
import { formatVnd, formatVndCompact } from "@/lib/currency";
import ModernSelect from "../ModernSelect";
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
  const [showPayAllConfirmModal, setShowPayAllConfirmModal] =
    useState<boolean>(false);

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

  const { totalOvertimePay, roleCounts } = employeePayrollSummary;
  const laborRatioPct =
    metrics.monthlyRevenue > 0
      ? Math.round(
          (metrics.monthlyLaborCost / metrics.monthlyRevenue) * 1000,
        ) / 10
      : 0;

  const totalMealAndHousing = employees.reduce((sum, emp) => {
    const b =
      employeePayrollSummary.breakdownById.get(emp.id) ??
      calculateEmployeeCostBreakdown(emp);
    return sum + b.allowance;
  }, 0);

  const unpaidStaffList = employees.filter((emp) => {
    const b =
      employeePayrollSummary.breakdownById.get(emp.id) ??
      calculateEmployeeCostBreakdown(emp);
    return b.balanceDue > 0;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold">
            {vi
              ? "Quản Lý Nhân Sự & Bảng Lương Xưởng — Tổ Đứng Máy, Kiểm Hàng QC & Giao Nhận"
              : "Workshop HR & Payroll Management — Machine Operators, QC & Logistics"}
          </h2>
          <p className="text-xs tv-text-muted">
            {vi
              ? "Ca làm 10.5 tiếng/ngày (07:00 – 18:30, nghỉ trưa 1h) • Tiền cơm 35.000đ/ngày • Tăng ca Chủ Nhật ×200% • Phụ cấp nhà trọ 500k + Chuyên cần 500k/tháng • Điều phối thợ đứng máy linh hoạt theo đơn hàng"
              : "10.5h daily shift (07:00–18:30, 1h lunch) • 35k/day meal allowance • Sunday OT ×200% • 500k housing + 500k attendance • Flexible machine operator dispatch"}
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
              type="button"
              onClick={() => setShowPayAllConfirmModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 cursor-pointer"
              title={
                vi
                  ? "Xem bảng kê và xác nhận quyết toán toàn bộ công nợ lương còn phải trả trong kỳ"
                  : "Review statement and settle all accrued net payable salaries for the current period"
              }
            >
              <span aria-hidden="true">💰</span>
              <span>
                {vi
                  ? `Tất Toán Công Nợ Lương (${formatVndCompact(metrics.unpaidLaborCost, vi)})`
                  : `Settle Accrued Payroll (${formatVndCompact(metrics.unpaidLaborCost, vi)})`}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={onExportPayrollCsv}
            className="tv-surface-2 tv-border inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold tv-text hover:opacity-90 cursor-pointer"
          >
            <span aria-hidden="true">⬇</span>
            <span>{vi ? "Xuất Bảng Lương (CSV / Excel)" : "Export Payroll (CSV)"}</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewEmployeeModal}
            className="tv-accent-bg inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
          >
            <span aria-hidden="true">+</span>
            <span>{vi ? "Thêm Nhân Sự Xưởng" : "Add Workshop Staff"}</span>
          </button>
        </div>
      </div>

      {/* Payroll & Labor Cost KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="tv-card p-4 flex flex-col justify-between">
          <p className="text-xs tv-text-muted">
            {vi ? "Nhân Sự Xưởng (Không Thuê TK/Kế Toán)" : "Workshop Staff"}
          </p>
          <p className="mt-1.5 text-2xl font-black">
            {metrics.activeEmployeesCount} / {metrics.totalEmployeesCount}
          </p>
          <p className="mt-1 text-xs tv-text-muted">
            {vi
              ? `${roleCounts["Machine Operator"] ?? 0} thợ máy • ${roleCounts["Trimming & QC"] ?? 0} kiểm hàng QC • ${roleCounts["Errands & Delivery"] ?? 0} giao nhận & hỗ trợ`
              : `${roleCounts["Machine Operator"] ?? 0} operators • ${roleCounts["Trimming & QC"] ?? 0} QC • ${roleCounts["Errands & Delivery"] ?? 0} logistics`}
          </p>
        </div>

        <div className="tv-card p-4 flex flex-col justify-between">
          <p className="text-xs tv-text-muted">
            {vi ? "Tổng Quỹ Lương Thực Tế Tháng" : "Monthly Total Payroll"}
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

        <div className="tv-card p-4 flex flex-col justify-between">
          <p className="text-xs tv-text-muted">
            {vi
              ? "Tăng Ca CN (×200%) & Cơm + Trọ + Chuyên Cần"
              : "Sunday OT (×200%) & Allowances"}
          </p>
          <p
            className="mt-1.5 text-xl font-black font-mono tv-accent-text truncate"
            title={formatVnd(totalOvertimePay + totalMealAndHousing)}
          >
            {formatVndCompact(totalOvertimePay + totalMealAndHousing, vi)}
          </p>
          <p className="mt-1 text-xs tv-text-muted truncate">
            {vi ? "Tăng ca CN:" : "Sun OT:"}{" "}
            {formatVndCompact(totalOvertimePay, vi)} •{" "}
            {vi ? "Cơm/Trọ/CC:" : "Allowances:"}{" "}
            {formatVndCompact(totalMealAndHousing, vi)}
          </p>
        </div>

        <div className="tv-card p-4 flex flex-col justify-between">
          <p className="text-xs tv-text-muted">
            {vi ? "Lương Đã Chi / Tạm Ứng" : "Salaries Paid / Advanced"}
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
              {vi ? "Còn nợ lương: " : "Remaining payable: "}
              {formatVndCompact(metrics.unpaidLaborCost, vi)}
            </span>
          </p>
        </div>

        <div className="tv-card p-4 flex flex-col justify-between">
          <p className="text-xs tv-text-muted">
            {vi ? "Lợi Nhuận Ròng Thực Tế" : "True Net Workshop Profit"}
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
            {vi
              ? "Đã trừ Chỉ trên, Phụ liệu, Xe ngoài & Lương"
              : "After upper thread, consumables, vehicle & payroll"}
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
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
            employeeRoleFilter === "ALL"
              ? "tv-accent-bg border-transparent font-bold"
              : "tv-surface-2 tv-border tv-text"
          }`}
        >
          {vi
            ? `Tất Cả Nhân Sự Xưởng (${employees.length})`
            : `All Workshop Staff (${employees.length})`}
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
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                employeeRoleFilter === role
                  ? "tv-accent-bg border-transparent font-bold"
                  : "tv-surface-2 tv-border tv-text"
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
          const otDays = +(
            emp.overtimeHoursMonth / STANDARD_HOURS_PER_DAY
          ).toFixed(1);

          return (
            <div
              key={emp.id}
              className="tv-card p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Top Identity & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold tv-accent-text">
                        {emp.code}
                      </span>
                      <span
                        className={`rounded-md border px-2.5 py-1 text-[10px] font-bold ${
                          EMPLOYEE_STATUS_BADGE_STYLES[emp.status]
                        }`}
                      >
                        {EMPLOYEE_STATUS_LABELS[emp.status]}
                      </span>
                      <span
                        className={`rounded-md border px-2.5 py-1 text-[10px] font-bold ${
                          SALARY_BADGE_STYLES[emp.paymentStatus]
                        }`}
                      >
                        {SALARY_STATUS_LABELS[emp.paymentStatus]}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold truncate">{emp.name}</h3>
                    <p className="text-xs tv-text-muted">
                      {EMPLOYEE_ROLE_LABELS[emp.role]} •{" "}
                      {EMPLOYEE_SHIFT_LABELS[emp.shift]} • 📞 {emp.phone}
                    </p>
                  </div>

                  <div className="shrink-0 text-right font-mono">
                    <p className="text-[10px] uppercase tv-text-muted">
                      {vi ? "Tổng Lương Tháng Này" : "Total Monthly Pay"}
                    </p>
                    <p className="text-lg font-black text-amber-400">
                      {formatVnd(breakdown.totalCost)}
                    </p>
                    <p className="text-[11px] tv-text-muted">
                      {vi
                        ? `Lương CB ${formatVnd(emp.monthlyBaseSalary)}/th`
                        : `Base ${formatVnd(emp.monthlyBaseSalary)}/mo`}
                    </p>
                  </div>
                </div>

                {/* Machine Assignment Bar (Flexible Line Dispatch) */}
                <div className="tv-surface-2 tv-border flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border px-3 py-2.5 text-xs">
                  <div className="min-w-0">
                    <span className="font-semibold">
                      {vi
                        ? "Đang đứng máy hôm nay:"
                        : "Running Machine Today:"}
                    </span>
                    <span className="ml-1.5 text-[11px] tv-text-muted">
                      {vi
                        ? "(Luân chuyển linh hoạt)"
                        : "(Rotates flexibly)"}
                    </span>
                  </div>
                  <ModernSelect
                    value={emp.assignedMachineId ?? ""}
                    onChange={(e) =>
                      onQuickUpdateEmployee(
                        emp,
                        {
                          assignedMachineId: e.target.value || null,
                        },
                        vi
                          ? `Đã cập nhật phân công máy hôm nay cho ${emp.name}`
                          : `Updated today's machine assignment for ${emp.name}`,
                      )
                    }
                    className="w-full sm:w-60 px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <option value="">
                      {vi
                        ? "— Không đứng máy (Kiểm hàng QC / Giao nhận) —"
                        : "— Non-machine (QC / Logistics) —"}
                    </option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.heads} {vi ? "đầu" : "heads"})
                      </option>
                    ))}
                  </ModernSelect>
                </div>

                {/* Detailed Workshop Payroll Breakdown */}
                <div className="tv-surface-2 tv-border rounded-xl border p-3.5 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="tv-text-muted">
                      {vi
                        ? `1. Lương căn bản (${breakdown.daysWorked}/26 ngày công • ${emp.hoursWorkedMonth}h):`
                        : `1. Base Salary (${breakdown.daysWorked}/26 days • ${emp.hoursWorkedMonth}h):`}
                    </span>
                    <span className="font-mono font-semibold">
                      {formatVnd(breakdown.basePay)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="tv-text-muted">
                      {vi
                        ? `2. Tiền cơm trưa (${breakdown.daysWorked} ngày × ${formatVnd(MEAL_ALLOWANCE_PER_DAY)}/ngày):`
                        : `2. Meal Allowance (${breakdown.daysWorked} days × ${formatVnd(MEAL_ALLOWANCE_PER_DAY)}/day):`}
                    </span>
                    <span className="font-mono font-semibold text-emerald-400">
                      +{formatVnd(breakdown.mealAllowance)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="tv-text-muted">
                      {vi
                        ? `3. Tăng ca Chủ Nhật ×200% (${emp.overtimeHoursMonth}h ≈ ${otDays} ngày CN):`
                        : `3. Sunday Overtime ×200% (${emp.overtimeHoursMonth}h ≈ ${otDays} Sun):`}
                    </span>
                    <span className="font-mono font-semibold text-sky-400">
                      +{formatVnd(breakdown.overtimePay)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="tv-text-muted">
                      {vi
                        ? "4. Tiền nhà trọ (500k) + Tiền chuyên cần (500k):"
                        : "4. Housing (500k) + Full Attendance (500k):"}
                    </span>
                    <span className="font-mono font-semibold tv-accent-text">
                      +{formatVnd(breakdown.housingAndAttendance)}
                    </span>
                  </div>

                  <div className="tv-border border-t pt-2 mt-1 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-emerald-400 font-semibold">
                        {vi ? "Đã chi / Tạm ứng:" : "Disbursed / Advance:"}{" "}
                        {formatVnd(emp.amountPaidMonth)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] tv-text-muted mr-1.5">
                        {vi ? "Thực lĩnh còn phải trả:" : "Net Payable Balance:"}
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

              {/* Quick Timecard, Sunday OT & Salary Payout Actions */}
              <div className="space-y-2.5 pt-2.5 border-t tv-border">
                <p className="text-[10px] font-bold uppercase tracking-wider tv-text-muted">
                  {vi
                    ? "Chấm công ca 10.5h (7h–18h30), Tăng ca Chủ Nhật (×200%) & Quyết toán lương:"
                    : "Log 10.5h Shift (+35k Meal), Sunday OT (×200%) & Settle Payroll:"}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onQuickUpdateEmployee(
                          emp,
                          {
                            hoursWorkedMonth: +(
                              emp.hoursWorkedMonth + STANDARD_HOURS_PER_DAY
                            ).toFixed(1),
                          },
                          vi
                            ? `Đã chấm +1 ngày công (10.5h + 35.000đ tiền cơm) cho ${emp.name}`
                            : `Logged +1 workday (10.5h + 35k meal allowance) for ${emp.name}`,
                        )
                      }
                      title={
                        vi
                          ? "Chấm thêm 1 ngày công chuẩn (10.5 tiếng từ 7h00–18h30 + 35.000đ tiền cơm)"
                          : "Log 1 full workday (10.5 hours 07:00–18:30 + 35,000 VND meal allowance)"
                      }
                      className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold tv-text hover:opacity-90 cursor-pointer"
                    >
                      +1 {vi ? "Ngày Công (10.5h + 35k Cơm)" : "Day (10.5h + 35k Meal)"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onQuickUpdateEmployee(
                          emp,
                          {
                            overtimeHoursMonth: +(
                              emp.overtimeHoursMonth + STANDARD_HOURS_PER_DAY
                            ).toFixed(1),
                          },
                          vi
                            ? `Đã chấm +1 ngày tăng ca Chủ Nhật (10.5h × 200%) cho ${emp.name}`
                            : `Logged +1 Sunday overtime shift (10.5h × 200%) for ${emp.name}`,
                        )
                      }
                      title={
                        vi
                          ? "Chấm thêm 1 ngày tăng ca Chủ Nhật (10.5 tiếng nhân hệ số 200%)"
                          : "Log 1 full Sunday overtime shift (10.5 hours at 200% rate)"
                      }
                      className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-sky-400 hover:opacity-90 cursor-pointer"
                    >
                      +1 {vi ? "Ngày Tăng Ca CN (×200%)" : "Sunday OT (×200%)"}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {emp.amountPaidMonth === 0 && breakdown.totalCost > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const half = Math.round(breakdown.totalCost * 0.5);
                          onQuickUpdateEmployee(
                            emp,
                            {
                              amountPaidMonth: half,
                              paymentStatus: "PARTIAL_ADVANCE",
                            },
                            vi
                              ? `Đã chi tạm ứng 50% kỳ lương (${formatVnd(half)}) cho ${emp.name}`
                              : `Disbursed 50% payroll advance (${formatVnd(half)}) for ${emp.name}`,
                          );
                        }}
                        title={
                          vi
                            ? "Chi tạm ứng 50% tổng thu nhập tạm tính trong kỳ cho nhân sự"
                            : "Disburse a 50% mid-period payroll advance for this employee"
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-amber-500/25 cursor-pointer"
                      >
                        <span aria-hidden="true">💵</span>
                        <span>{vi ? "Tạm Ứng 50%" : "50% Advance"}</span>
                      </button>
                    )}

                    {breakdown.balanceDue > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          onQuickUpdateEmployee(
                            emp,
                            {
                              amountPaidMonth: breakdown.totalCost,
                              paymentStatus: "PAID",
                            },
                            vi
                              ? `Đã quyết toán 100% thực lĩnh (${formatVnd(breakdown.totalCost)}) cho ${emp.name}`
                              : `Settled 100% net payroll (${formatVnd(breakdown.totalCost)}) for ${emp.name}`,
                          )
                        }
                        title={
                          vi
                            ? `Quyết toán và tất toán toàn bộ số dư thực lĩnh còn phải trả (${formatVnd(breakdown.balanceDue)})`
                            : `Settle the remaining net payable balance (${formatVnd(breakdown.balanceDue)}) in full`
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/25 cursor-pointer"
                      >
                        <span aria-hidden="true">✓</span>
                        <span>{vi ? "Quyết Toán Thực Lĩnh" : "Settle Net Payable"}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenPayslipModal(emp)}
                      className="tv-surface-2 tv-border inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold tv-text hover:opacity-90 cursor-pointer"
                    >
                      <span aria-hidden="true">🖨</span>
                      <span>{vi ? "Phiếu Lương" : "Payslip"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEditEmployeeModal(emp)}
                      className="tv-surface-2 tv-border inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold tv-text hover:opacity-90 cursor-pointer"
                    >
                      <span aria-hidden="true">✎</span>
                      <span>{vi ? "Sửa" : "Edit"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEmployee(emp.id, emp.name)}
                      className="tv-surface-2 tv-border inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/15 cursor-pointer"
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

      {/* ================= CONFIRM PAY ALL UNPAID SALARIES MODAL ================= */}
      {showPayAllConfirmModal && (
        <div
          onClick={() => setShowPayAllConfirmModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="tv-surface tv-border w-full max-w-lg rounded-2xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b tv-border pb-3.5">
              <div>
                <h3 className="text-base font-extrabold">
                  💰{" "}
                  {vi
                    ? "Quyết Toán & Tất Toán Công Nợ Lương Kỳ Này"
                    : "Confirm Accrued Payroll Settlement"}
                </h3>
                <p className="mt-1 text-xs tv-text-muted">
                  {vi
                    ? "Hạch toán chi trả 100% số dư thực lĩnh còn lại cho toàn bộ nhân sự trong kỳ lương hiện tại."
                    : "Disburse and settle 100% of remaining net payable balances for all active staff in the current payroll period."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayAllConfirmModal(false)}
                className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-xs tv-text-muted hover:opacity-85 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-60 space-y-2 overflow-y-auto pr-1 text-xs">
              {unpaidStaffList.map((emp) => {
                const b =
                  employeePayrollSummary.breakdownById.get(emp.id) ??
                  calculateEmployeeCostBreakdown(emp);
                return (
                  <div
                    key={emp.id}
                    className="tv-surface-2 tv-border flex items-center justify-between rounded-xl border px-3.5 py-2.5"
                  >
                    <div>
                      <p className="font-bold">
                        {emp.name}{" "}
                        <span className="font-mono text-[11px] tv-accent-text">
                          ({emp.code})
                        </span>
                      </p>
                      <p className="text-[11px] tv-text-muted">
                        {EMPLOYEE_ROLE_LABELS[emp.role]} •{" "}
                        {vi ? "Đã chi:" : "Disbursed:"}{" "}
                        {formatVnd(emp.amountPaidMonth)} /{" "}
                        {formatVnd(b.totalCost)}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[10px] uppercase tv-text-muted block">
                        {vi ? "Thực lĩnh còn lại" : "Net Payable"}
                      </span>
                      <span className="font-black text-emerald-400">
                        {formatVnd(b.balanceDue)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="tv-surface-2 tv-border mt-4 flex items-center justify-between rounded-xl border px-4 py-3 text-xs">
              <span className="font-bold">
                {vi
                  ? `Tổng quỹ lương quyết toán (${unpaidStaffList.length} nhân sự):`
                  : `Total Payroll Settlement (${unpaidStaffList.length} staff):`}
              </span>
              <span className="font-mono text-base font-black text-emerald-400">
                {formatVnd(metrics.unpaidLaborCost)}
              </span>
            </div>

            <div className="tv-border mt-4 flex items-center justify-end gap-2 border-t pt-4 text-xs">
              <button
                type="button"
                onClick={() => setShowPayAllConfirmModal(false)}
                className="tv-surface-2 tv-border rounded-xl border px-4 py-2 font-semibold tv-text hover:opacity-85 cursor-pointer"
              >
                {vi ? "Hủy Bỏ" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onPayAllUnpaidPayroll();
                  setShowPayAllConfirmModal(false);
                }}
                className="tv-accent-bg rounded-xl px-4 py-2 font-extrabold shadow-md hover:opacity-90 cursor-pointer"
              >
                ✓{" "}
                {vi
                  ? "Xác Nhận Quyết Toán Lương"
                  : "Confirm Payroll Settlement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default EmployeesPayrollTab;
