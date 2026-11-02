"use client";

import type {
  EmbroideryMachine,
  Employee,
  EmployeeCostBreakdown,
  EmployeeRole,
  EmployeeShift,
  SalaryPaymentStatus,
} from "@/lib/types";
import { MEAL_ALLOWANCE_PER_DAY, STANDARD_HOURS_PER_DAY } from "@/lib/seed-data";
import { formatVnd } from "@/lib/currency";

export interface PayslipModalProps {
  vi: boolean;
  employee: Employee;
  breakdown: EmployeeCostBreakdown;
  assignedMachine?: EmbroideryMachine;
  roleLabels: Record<EmployeeRole, string>;
  shiftLabels: Record<EmployeeShift, string>;
  salaryStatusLabels: Record<SalaryPaymentStatus, string>;
  onClose: () => void;
  onPayFullBalance: (emp: Employee, totalCost: number) => void;
}

export default function PayslipModal({
  vi,
  employee,
  breakdown,
  assignedMachine,
  roleLabels,
  shiftLabels,
  salaryStatusLabels,
  onClose,
  onPayFullBalance,
}: PayslipModalProps) {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const otDays = +(
    employee.overtimeHoursMonth / STANDARD_HOURS_PER_DAY
  ).toFixed(1);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="tv-surface tv-border tv-text my-8 w-full max-w-2xl rounded-2xl border p-6 shadow-2xl"
      >
        {/* Top Action Bar */}
        <div className="tv-border flex flex-wrap items-center justify-between gap-3 border-b pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="tv-accent-bg rounded-lg px-2.5 py-1 text-xs font-black">
              {employee.code}
            </span>
            <h3 className="text-sm font-bold">
              {vi
                ? `Phiếu Lương Xưởng Thêu Tường Vinh — ${employee.name}`
                : `Tuong Vinh Workshop Payslip — ${employee.name}`}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {breakdown.balanceDue > 0 && (
              <button
                onClick={() => onPayFullBalance(employee, breakdown.totalCost)}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
              >
                <span aria-hidden="true">✓</span>
                <span>
                  {vi
                    ? `Quyết Toán Thực Lĩnh (${formatVnd(breakdown.balanceDue)})`
                    : `Settle Net Payable (${formatVnd(breakdown.balanceDue)})`}
                </span>
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="tv-accent-bg inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold cursor-pointer"
            >
              <span aria-hidden="true">🖨</span>
              <span>{vi ? "In Phiếu Lương / PDF" : "Print Payslip / PDF"}</span>
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

        {/* Printable Payslip Body */}
        <div className="mt-5 space-y-5 text-xs">
          <div className="tv-border flex items-start justify-between border-b pb-4">
            <div>
              <p className="tv-accent-text text-[11px] font-bold uppercase tracking-widest">
                XƯỞNG THÊU VI TÍNH TƯỜNG VINH • CHỦ XƯỞNG
              </p>
              <h2 className="mt-1 text-xl font-black">
                {vi
                  ? `PHIẾU BẢNG LƯƠNG & PHỤ CẤP THÁNG (${currentMonthStr})`
                  : `MONTHLY WORKSHOP PAYROLL STATEMENT (${currentMonthStr})`}
              </h2>
              <p className="tv-text-muted">
                {vi
                  ? "Ca ngày 10.5 tiếng (07:00–18:30, nghỉ trưa 1h) • Tiền cơm 35.000đ/ngày • Tăng ca Chủ Nhật ×200% • Tiền nhà trọ 500k + Chuyên cần 500k"
                  : "10.5h daily shift (07:00–18:30, 1h lunch) • 35k/day meal • Sunday OT ×200% • 500k housing + 500k attendance"}
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="tv-surface-2 tv-border inline-block rounded-lg border px-3 py-1 text-sm font-black tv-accent-text">
                {employee.code}
              </span>
              <p className="mt-1 font-bold text-emerald-400">
                {salaryStatusLabels[employee.paymentStatus]}
              </p>
            </div>
          </div>

          {/* Employee Identity Card */}
          <div className="tv-surface-2 tv-border grid grid-cols-2 gap-4 rounded-xl border p-4 sm:grid-cols-4">
            <div>
              <p className="tv-text-muted">
                {vi ? "Họ và Tên Nhân Sự" : "Employee Name"}
              </p>
              <p className="text-sm font-bold">{employee.name}</p>
              <p className="tv-text-muted">📞 {employee.phone}</p>
            </div>
            <div>
              <p className="tv-text-muted">
                {vi ? "Công Việc & Ca Làm" : "Role & Shift"}
              </p>
              <p className="font-bold tv-accent-text">
                {roleLabels[employee.role]}
              </p>
              <p className="tv-text-muted">{shiftLabels[employee.shift]}</p>
            </div>
            <div>
              <p className="tv-text-muted">
                {vi ? "Đứng Máy (Linh Hoạt)" : "Machine Assignment"}
              </p>
              <p className="font-bold">
                {assignedMachine
                  ? assignedMachine.name
                  : vi
                    ? "Kiểm hàng QC / Phụ việc"
                    : "QC / Errands"}
              </p>
              <p className="tv-text-muted">
                {vi ? "Ngày vào làm:" : "Joined:"} {employee.joinedDate}
              </p>
            </div>
            <div>
              <p className="tv-text-muted">
                {vi ? "Ngày Công & Tăng Ca CN" : "Workdays & Sunday OT"}
              </p>
              <p className="font-mono text-sm font-bold text-emerald-400">
                {breakdown.daysWorked} / 26 {vi ? "ngày công" : "days"}
              </p>
              <p className="font-mono tv-text-muted">
                {employee.hoursWorkedMonth}h + {employee.overtimeHoursMonth}h CN
                ({otDays} {vi ? "ngày CN" : "Sun"})
              </p>
            </div>
          </div>

          {/* Itemized Earnings Table */}
          <div className="tv-border overflow-hidden rounded-xl border">
            <table className="w-full text-left">
              <thead className="tv-surface-2 text-[11px] uppercase tv-text-muted">
                <tr>
                  <th className="px-4 py-2.5">
                    {vi ? "Khoản Mục Thu Nhập" : "Compensation Component"}
                  </th>
                  <th className="px-4 py-2.5">
                    {vi ? "Diễn Giải Định Mức Tính Lương" : "Calculation Basis"}
                  </th>
                  <th className="px-4 py-2.5 text-right">
                    {vi ? "Thành Tiền (VNĐ)" : "Amount (VND)"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y tv-border">
                <tr>
                  <td className="px-4 py-2.5 font-bold">
                    {vi
                      ? "1. Lương căn bản tháng (Ca 10.5 tiếng/ngày)"
                      : "1. Monthly Base Salary (10.5h/day shift)"}
                  </td>
                  <td className="px-4 py-2.5 font-mono tv-text-muted">
                    {vi
                      ? `Mức chuẩn ${formatVnd(employee.monthlyBaseSalary)}/tháng × (${breakdown.daysWorked}/26 ngày công)`
                      : `Base ${formatVnd(employee.monthlyBaseSalary)}/mo × (${breakdown.daysWorked}/26 days)`}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">
                    {formatVnd(breakdown.basePay)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-emerald-400">
                    {vi
                      ? "2. Tiền cơm trưa (35.000đ / ngày công)"
                      : "2. Daily Meal Allowance (35,000 VND / day)"}
                  </td>
                  <td className="px-4 py-2.5 font-mono tv-text-muted">
                    {breakdown.daysWorked} {vi ? "ngày công" : "days"} ×{" "}
                    {formatVnd(MEAL_ALLOWANCE_PER_DAY)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-400">
                    +{formatVnd(breakdown.mealAllowance)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-sky-400">
                    {vi
                      ? "3. Tăng ca Chủ Nhật (Nhân hệ số ×200%)"
                      : "3. Sunday Overtime Pay (×200% Rate)"}
                  </td>
                  <td className="px-4 py-2.5 font-mono tv-text-muted">
                    {employee.overtimeHoursMonth}h ({otDays}{" "}
                    {vi ? "ngày CN" : "Sun"}) × 200%{" "}
                    {vi ? "đơn giá giờ" : "hourly rate"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-sky-400">
                    +{formatVnd(breakdown.overtimePay)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold tv-accent-text">
                    {vi
                      ? "4. Tiền nhà trọ (500k) + Tiền chuyên cần (500k)"
                      : "4. Housing Allowance (500k) + Full Attendance (500k)"}
                  </td>
                  <td className="px-4 py-2.5 font-mono tv-text-muted">
                    {vi
                      ? "Hỗ trợ tiền nhà trọ 500.000đ + thưởng chuyên cần 500.000đ/tháng"
                      : "500k housing support + 500k full attendance bonus"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold tv-accent-text">
                    +{formatVnd(breakdown.housingAndAttendance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Box */}
          <div className="flex justify-end">
            <div className="tv-surface-2 tv-border w-full sm:w-96 space-y-2 rounded-xl border p-4 font-mono">
              <div className="flex justify-between">
                <span className="tv-text-muted">
                  {vi ? "Tổng Thu Nhập Tháng:" : "Gross Monthly Earnings:"}
                </span>
                <span className="font-bold text-amber-400">
                  {formatVnd(breakdown.totalCost)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>
                  {vi
                    ? "Đã Tạm Ứng / Đã Chi Trả:"
                    : "Less Advances / Disbursed:"}
                </span>
                <span>-{formatVnd(employee.amountPaidMonth)}</span>
              </div>
              <div className="tv-border flex justify-between border-t pt-2 text-base font-black tv-accent-text">
                <span>
                  {vi ? "Thực Lĩnh Còn Lại:" : "Net Balance Payable:"}
                </span>
                <span>{formatVnd(breakdown.balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-3 text-center">
            <div className="tv-surface-2 tv-border rounded-xl border p-3.5 h-24 flex flex-col justify-between">
              <p className="font-bold uppercase text-[11px]">
                {vi
                  ? `Người Nhận Lương (${employee.name})`
                  : `Employee Signature (${employee.name})`}
              </p>
              <p className="text-[10px] tv-text-muted">
                {vi
                  ? "(Ký xác nhận đã kiểm tra ngày công, tiền cơm & tăng ca CN)"
                  : "(Verified workdays, meal allowance & Sunday OT)"}
              </p>
            </div>
            <div className="tv-surface-2 tv-border rounded-xl border p-3.5 h-24 flex flex-col justify-between">
              <p className="font-bold uppercase text-[11px]">
                {vi
                  ? "Chủ Xưởng Duyệt Chi"
                  : "Approved By Workshop Owner"}
              </p>
              <p className="text-[10px] tv-text-muted">
                {vi
                  ? "(Xưởng Thêu Vi Tính Tường Vinh)"
                  : "(Tuong Vinh Embroidery Workshop)"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
