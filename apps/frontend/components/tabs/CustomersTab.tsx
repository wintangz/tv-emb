"use client";

import React, { memo, useState } from "react";
import type { Customer } from "@/lib/types";
import { formatVnd } from "@/lib/currency";
import PaginationBar from "../PaginationBar";
import type { OrderFormState } from "./studio-constants";

export interface CustomersTabProps {
  vi: boolean;
  filteredCustomers: Customer[];
  ordersCountByCustomerId: Map<string, number>;
  customerSearch: string;
  onSetCustomerSearch: (q: string) => void;
  onOpenNewCustomerModal: () => void;
  onOpenEditCustomerModal: (cust: Customer) => void;
  onDeleteCustomer: (id: string, company: string) => void;
  onOpenNewOrderModal: (prefill?: Partial<OrderFormState>) => void;
}

const CustomersTab = memo(function CustomersTab({
  vi,
  filteredCustomers,
  ordersCountByCustomerId,
  customerSearch,
  onSetCustomerSearch,
  onOpenNewCustomerModal,
  onOpenEditCustomerModal,
  onDeleteCustomer,
  onOpenNewOrderModal,
}: CustomersTabProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(4);

  const effectiveSize =
    pageSize <= 0 ? Math.max(1, filteredCustomers.length) : pageSize;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / effectiveSize),
  );
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedCustomers = filteredCustomers.slice(
    (safePage - 1) * effectiveSize,
    safePage * effectiveSize,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold">
            {vi
              ? "Danh Bạ Khách Hàng & Thông Số Chỉ Thương Hiệu"
              : "Embroidery Client Directory & Brand Thread Specs"}
          </h2>
          <p className="text-xs tv-text-muted">
            {vi
              ? "Quản lý khách hàng doanh nghiệp, đơn đặt lại và ghi chú mã chỉ chuẩn theo thương hiệu"
              : "Track corporate accounts, repeat team orders, and Pantone-to-Madeira thread notes"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => {
              onSetCustomerSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              vi
                ? "Tìm tên công ty, khách hàng..."
                : "Search client or brand..."
            }
            className="tv-input px-3 py-1.5 text-xs"
          />
          <button
            onClick={onOpenNewCustomerModal}
            className="tv-accent-bg rounded-xl px-3.5 py-2 text-xs font-bold cursor-pointer"
          >
            + {vi ? "Thêm Khách Hàng" : "Add Client Account"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {pagedCustomers.map((cust) => {
          const activeClientOrdersCount =
            ordersCountByCustomerId.get(cust.id) ?? 0;
          return (
            <div
              key={cust.id}
              className="tv-card p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold">{cust.company}</h3>
                    <p className="text-xs tv-text-muted">
                      {vi ? "Liên hệ:" : "Contact:"} {cust.name} • {cust.email}{" "}
                      • {cust.phone}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-sm font-bold text-emerald-400">
                      {formatVnd(cust.totalSpend)}
                    </p>
                    <p className="text-[11px] tv-text-muted">
                      {vi
                        ? `${cust.totalOrders} đơn tích lũy (${activeClientOrdersCount} đang chạy)`
                        : `${cust.totalOrders} lifetime orders (${activeClientOrdersCount} active)`}
                    </p>
                  </div>
                </div>

                <div className="tv-surface-2 rounded-lg p-3 text-xs space-y-1">
                  <p>
                    <span className="tv-text-muted">
                      {vi ? "Phôi áo thường đặt: " : "Preferred Blanks: "}
                    </span>
                    {cust.preferredGarments}
                  </p>
                  {cust.notes && (
                    <p className="tv-accent-text">
                      <span className="tv-text-muted">
                        {vi
                          ? "Ghi chú mã chỉ / Kỹ thuật: "
                          : "Thread / Setup Spec: "}
                      </span>
                      {cust.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => onOpenNewOrderModal({ customerId: cust.id })}
                  className="tv-accent-bg rounded-lg px-3 py-1 text-xs font-bold cursor-pointer"
                >
                  + {vi ? "Tạo Đơn Cho Khách" : "New Order for Client"}
                </button>
                <button
                  onClick={() => onOpenEditCustomerModal(cust)}
                  className="tv-surface-2 tv-border rounded-lg border px-3 py-1 text-xs cursor-pointer"
                >
                  {vi ? "Sửa" : "Edit"}
                </button>
                <button
                  onClick={() => onDeleteCustomer(cust.id, cust.company)}
                  className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-xs tv-text-muted hover:text-rose-400 cursor-pointer"
                >
                  {vi ? "Xóa" : "Delete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <PaginationBar
        vi={vi}
        currentPage={safePage}
        pageSize={pageSize}
        totalItems={filteredCustomers.length}
        pageSizeOptions={[4, 6, 10, 20]}
        unitLabel={vi ? "khách hàng & đối tác" : "client accounts"}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
});

export default CustomersTab;

