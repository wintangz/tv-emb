"use client";

import { memo, useState } from "react";
import type { InventoryItem } from "@/lib/types";
import { formatVnd } from "@/lib/currency";
import PaginationBar from "../PaginationBar";

export interface InventoryTabProps {
  vi: boolean;
  filteredInventory: InventoryItem[];
  inventoryCategoryFilter: string;
  inventorySearch: string;
  lowStockItemsCount: number;
  onSetInventoryCategoryFilter: (cat: string) => void;
  onSetInventorySearch: (q: string) => void;
  onRestockAllLow: () => void;
  onOpenNewInventoryModal: () => void;
  onOpenEditInventoryModal: (item: InventoryItem) => void;
  onDeleteInventory: (id: string, name: string) => void;
  onAdjustStock: (itemId: string, delta: number) => void;
}

const InventoryTab = memo(function InventoryTab({
  vi,
  filteredInventory,
  inventoryCategoryFilter,
  inventorySearch,
  lowStockItemsCount,
  onSetInventoryCategoryFilter,
  onSetInventorySearch,
  onRestockAllLow,
  onOpenNewInventoryModal,
  onOpenEditInventoryModal,
  onDeleteInventory,
  onAdjustStock,
}: InventoryTabProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);
  const [showRestockConfirmModal, setShowRestockConfirmModal] =
    useState<boolean>(false);

  const effectiveSize =
    pageSize <= 0 ? Math.max(1, filteredInventory.length) : pageSize;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredInventory.length / effectiveSize),
  );
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedInventory = filteredInventory.slice(
    (safePage - 1) * effectiveSize,
    safePage * effectiveSize,
  );

  const lowStockList = filteredInventory.filter(
    (i) => i.quantity <= i.minThreshold,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {[
            {
              id: "ALL",
              label: vi ? "Tất Cả Vật Tư" : "All Supplies",
            },
            {
              id: "Thread",
              label: vi ? "Chỉ Trên (Theo Đơn)" : "Upper Thread",
            },
            {
              id: "Bobbin",
              label: vi ? "Chỉ Dưới (Chỉ Suốt)" : "Bobbin Thread",
            },
            {
              id: "Needle",
              label: vi ? "Kim Thêu (DB×K5)" : "Needles",
            },
            {
              id: "Backing",
              label: vi ? "Giấy Dựng & Băng Keo" : "Backing & Tape",
            },
            {
              id: "Topping",
              label: vi ? "Mút EVA 3D (Mouse)" : "3D EVA Foam",
            },
            {
              id: "LOW",
              label: vi
                ? `Sắp Hết Hàng (${lowStockItemsCount})`
                : `Low Stock (${lowStockItemsCount})`,
            },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onSetInventoryCategoryFilter(cat.id);
                setCurrentPage(1);
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                inventoryCategoryFilter === cat.id
                  ? "tv-accent-bg border-transparent font-bold"
                  : "tv-surface tv-border tv-text"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={inventorySearch}
            onChange={(e) => {
              onSetInventorySearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              vi
                ? "Tìm mã chỉ Madeira, màu sắc..."
                : "Search Madeira SKU, color..."
            }
            className="tv-input px-3 py-1.5 text-xs"
          />
          {lowStockItemsCount > 0 && (
            <button
              type="button"
              onClick={() => setShowRestockConfirmModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 cursor-pointer"
              title={
                vi
                  ? "Bổ sung định mức (+12 đơn vị) cho toàn bộ các mã chỉ/keo đang dưới ngưỡng an toàn"
                  : "Replenish reorder stock (+12 units) for all SKUs at or below safety threshold"
              }
            >
              <span aria-hidden="true">📦</span>
              <span>
                {vi
                  ? `Bổ Sung Tồn Kho Định Mức (${lowStockItemsCount})`
                  : `Replenish Reorder Stock (${lowStockItemsCount})`}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenNewInventoryModal}
            className="tv-accent-bg inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
          >
            <span aria-hidden="true">+</span>
            <span>{vi ? "Thêm Chỉ / Vật Tư Mới" : "Add Thread / Supply"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {pagedInventory.map((item) => {
          const isLow = item.quantity <= item.minThreshold;
          return (
            <div
              key={item.id}
              className={`tv-card p-4 flex flex-col justify-between ${
                isLow ? "ring-1 ring-rose-500/50" : ""
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {item.colorHex ? (
                      <div
                        className="h-9 w-9 shrink-0 rounded-xl border border-slate-500 shadow-inner"
                        style={{ backgroundColor: item.colorHex }}
                      />
                    ) : (
                      <div className="tv-surface-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold tv-accent-text">
                        {item.category.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[11px] font-bold tv-accent-text">
                        {item.sku}
                      </span>
                      <h3 className="text-sm font-bold leading-snug">{item.name}</h3>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => onOpenEditInventoryModal(item)}
                      className="tv-surface-2 tv-border rounded border px-2 py-0.5 text-[11px] font-semibold tv-text cursor-pointer"
                    >
                      {vi ? "Sửa" : "Edit"}
                    </button>
                    <button
                      onClick={() => onDeleteInventory(item.id, item.name)}
                      className="tv-surface-2 tv-border rounded border px-2 py-0.5 text-[11px] font-semibold text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                    >
                      {vi ? "Xóa" : "Delete"}
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-xs tv-text-muted">
                  {item.brand} • {item.material} • {formatVnd(item.unitCost)}/
                  {item.unit.slice(0, -1)}
                </p>
              </div>

              <div className="tv-border mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <div>
                  <span
                    className={`font-mono text-lg font-bold ${
                      isLow ? "text-rose-400" : ""
                    }`}
                  >
                    {item.quantity} {item.unit}
                  </span>
                  {isLow && (
                    <span className="ml-2 inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-1 text-center text-[10px] font-bold leading-none text-rose-400">
                      {vi ? "CẦN NHẬP" : "LOW STOCK"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onAdjustStock(item.id, -1)}
                    title={
                      vi
                        ? "Xuất kho 1 đơn vị cấp phát cho chuyền máy thêu"
                        : "Issue 1 unit from inventory to shop floor"
                    }
                    className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-xs font-bold tv-text hover:opacity-90 cursor-pointer"
                  >
                    -1 {vi ? "Xuất Kho" : "Issue"}
                  </button>
                  <button
                    onClick={() => onAdjustStock(item.id, 1)}
                    title={
                      vi ? "Nhập lẻ +1 đơn vị vào tồn kho" : "Receive +1 unit into inventory"
                    }
                    className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-xs font-bold tv-text hover:opacity-90 cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => onAdjustStock(item.id, 10)}
                    title={
                      vi
                        ? "Nhập kho lô 10 đơn vị vật tư mới"
                        : "Receive batch of +10 units into inventory"
                    }
                    className="tv-accent-bg rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer"
                  >
                    +10 {vi ? "Nhập Kho" : "Receive"}
                  </button>
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
        totalItems={filteredInventory.length}
        pageSizeOptions={[6, 9, 12, 24]}
        unitLabel={vi ? "mã chỉ & vật tư" : "supplies"}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* ================= CONFIRM RESTOCK ALL LOW SUPPLIES MODAL ================= */}
      {showRestockConfirmModal && (
        <div
          onClick={() => setShowRestockConfirmModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="tv-surface tv-border w-full max-w-md rounded-2xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b tv-border pb-3">
              <div>
                <h3 className="text-base font-extrabold">
                  📦{" "}
                  {vi
                    ? "Xác Nhận Bổ Sung Tồn Kho Định Mức"
                    : "Confirm Reorder Stock Replenishment"}
                </h3>
                <p className="mt-1 text-xs tv-text-muted">
                  {vi
                    ? "Hạch toán nhập kho bổ sung đưa toàn bộ vật tư đang thiếu về ngưỡng an toàn (Định mức tối thiểu + 10 đơn vị/mã)."
                    : "Record stock receipt restoring all low-stock SKUs above safety threshold (Min Threshold + 10 units/SKU)."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRestockConfirmModal(false)}
                className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-xs tv-text-muted cursor-pointer"
              >
                ✕
              </button>
            </div>

            {lowStockList.length > 0 && (
              <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto text-xs">
                {lowStockList.map((i) => (
                  <div
                    key={i.id}
                    className="tv-surface-2 tv-border flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <span className="font-semibold truncate pr-2">
                      {i.name}
                    </span>
                    <span className="font-mono font-bold text-emerald-400 shrink-0">
                      {i.quantity} → {i.minThreshold + 10} {i.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="tv-border mt-4 flex items-center justify-end gap-2 border-t pt-4 text-xs">
              <button
                type="button"
                onClick={() => setShowRestockConfirmModal(false)}
                className="tv-surface-2 tv-border rounded-xl border px-4 py-2 font-semibold tv-text cursor-pointer"
              >
                {vi ? "Hủy" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onRestockAllLow();
                  setShowRestockConfirmModal(false);
                }}
                className="tv-accent-bg rounded-xl px-4 py-2 font-extrabold shadow-md cursor-pointer"
              >
                ✓{" "}
                {vi
                  ? "Xác Nhận Nhập Kho (Định Mức +10)"
                  : "Confirm Stock Receipt (Min +10)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default InventoryTab;
