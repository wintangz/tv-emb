"use client";

import React from "react";
import type {
  EmbroideryMachine,
  Employee,
  EmployeeCostBreakdown,
  EmployeeRole,
  EmployeeShift,
  SalaryPaymentStatus,
} from "@/lib/types";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="tv-surface tv-border tv-text my-8 w-full max-w-2xl rounded-2xl border p-6 shadow-2xl">
        {/* Top Action Bar */}
        <div className="tv-border flex flex-wrap items-center justify-between gap-3 border-b pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="tv-accent-bg rounded-lg px-2.5 py-1 text-xs font-black">
              {employee.code}
            </span>
            <h3 className="text-sm font-bold">
              {vi
                ? `Phiếu Lương & Sản Lượng Tháng — ${employee.name}`
                : `Monthly Payroll & Stitch Output Slip — ${employee.name}`}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {breakdown.balanceDue > 0 && (
              <button
                onClick={() => onPayFullBalance(employee, breakdown.totalCost)}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
              >
                ✓{" "}
                {vi
                  ? `Tất Toán Thực Lĩnh (${formatVnd(breakdown.balanceDue)})`
                  : `Pay Remaining (${formatVnd(breakdown.balanceDue)})`}
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="tv-accent-bg rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer"
            >
              🖨 {vi ? "In Phiếu Lương / PDF" : "Print Payslip / PDF"}
            </button>
            <button
              onClick={onClose}
              className="tv-input px-3 py-1.5 text-xs tv-text-muted cursor-pointer"
            >
              ✕ {vi ? "Đóng" : "Close"}
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div className="mt-5 space-y-5 text-xs">
          <div className="tv-border flex items-start justify-between border-b pb-4">
            <div>
              <p className="tv-accent-text text-[11px] font-bold uppercase tracking-widest">
                CÔNG TY TNHH THÊU VI TÍNH TƯỜNG VINH • PHÒNG NHÂN SỰ & KẾ TOÁN
              </p>
              <h2 className="mt-1 text-xl font-black">
                {vi
                  ? `PHIẾU BẢNG LƯƠNG & THƯỞNG SẢN LƯỢNG (${currentMonthStr})`
                  : `EMPLOYEE PAYROLL & STITCH BONUS STATEMENT (${currentMonthStr})`}
              </h2>
              <p className="tv-text-muted">
                {vi
                  ? "Chi tiết giờ công hành chính, tăng ca (1.5x), thưởng sản lượng mũi thêu và phụ cấp"
                  : "Itemized regular hours, 1.5x overtime, stitch output bonus, and allowances"}
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
                {vi ? "Bộ Phận & Ca Làm" : "Role & Shift"}
              </p>
              <p className="font-bold tv-accent-text">
                {roleLabels[employee.role]}
              </p>
              <p className="tv-text-muted">{shiftLabels[employee.shift]}</p>
            </div>
            <div>
              <p className="tv-text-muted">
                {vi ? "Chuyền Máy Phụ Trách" : "Assigned Line"}
              </p>
              <p className="font-bold">
                {assignedMachine
                  ? assignedMachine.name
                  : vi
                    ? "Văn phòng / QC chung"
                    : "General Floor / Office"}
              </p>
              <p className="tv-text-muted">
                {vi ? "Ngày vào làm:" : "Joined:"} {employee.joinedDate}
              </p>
            </div>
            <div>
              <p className="tv-text-muted">
                {vi ? "Sản Lượng Mũi Tháng" : "Monthly Stitch Output"}
              </p>
              <p className="font-mono text-sm font-bold text-emerald-400">
                {employee.stitchesCompletedMonth.toLocaleString()}{" "}
                {vi ? "mũi" : "st"}
              </p>
              <p className="font-mono tv-text-muted">
                {employee.hoursWorkedMonth}h + {employee.overtimeHoursMonth}h OT
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
                    {vi ? "Diễn Giải Cách Tính" : "Calculation Basis"}
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
                      ? "1. Lương cơ bản / Giờ công chuẩn"
                      : "1. Base Salary / Regular Hours"}
                  </td>
                  <td className="px-4 py-2.5 font-mono tv-text-muted">
                    {employee.payType === "Monthly"
                      ? vi
                        ? `Lương cứng tháng (${employee.hoursWorkedMonth} giờ công)`
                        : `Fixed monthly salary (${employee.hoursWorkedMonth}h logged)`
                      : `${employee.hoursWorkedMonth}h × ${formatVnd(employee.hourlyRate)}/h`}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">
                    {formatVnd(breakdown.basePay)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-sky-400">
                    {vi
                      ? "2. Lương tăng ca ngoài giờ (Hệ số 1.5x)"
                      : "2. Overtime Pay (1.5x Rate)"}
                  </td>
                  <td className="px-4 py-2.5 font-mono tv-text-muted">
                    {employee.overtimeHoursMonth}{" "}
                    {vi ? "giờ OT × 1.5x đơn giá giờ" : "OT hrs × 1.5x rate"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-sky-400">
                    +{formatVnd(breakdown.overtimePay)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold tv-accent-text">
                    {vi
                      ? "3. Thưởng năng suất mũi thêu"
                      : "3. Stitch Production Bonus"}
                  </td>
                  <td className="px-4 py-2.5 font-mono tv-text-muted">
                    {employee.stitchesCompletedMonth.toLocaleString()}{" "}
                    {vi ? "mũi" : "st"} ×{" "}
                    {formatVnd(employee.stitchBonusPer10k)} / 10,000{" "}
                    {vi ? "mũi" : "st"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold tv-accent-text">
                    +{formatVnd(breakdown.stitchBonus)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold">
                    {vi
                      ? "4. Phụ cấp chuyên cần, cơm trưa & trách nhiệm"
                      : "4. Shift, Meal & Attendance Allowance"}
                  </td>
                  <td className="px-4 py-2.5 font-mono tv-text-muted">
                    {vi ? "Phụ cấp cố định tháng" : "Monthly standard allowance"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">
                    +{formatVnd(breakdown.allowance)}
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
                    : "Less Advances / Paid:"}
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
                  ? "(Ký xác nhận đã kiểm tra giờ công & sản lượng)"
                  : "(Verified hours & stitch output)"}
              </p>
            </div>
            <div className="tv-surface-2 tv-border rounded-xl border p-3.5 h-24 flex flex-col justify-between">
              <p className="font-bold uppercase text-[11px]">
                {vi
                  ? "Ban Giám Đốc — Thêu Vi Tính Tường Vinh"
                  : "Approved By — Tuong Vinh Embroidery"}
              </p>
              <p className="text-[10px] tv-text-muted">
                {vi ? "(Ký tên & đóng dấu)" : "(Authorized Signature)"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

