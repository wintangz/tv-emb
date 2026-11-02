"use client";

import React, { memo, useState } from "react";
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
              label: vi ? "Chỉ Thêu (Cuộn)" : "Thread Cones",
            },
            {
              id: "Backing",
              label: vi ? "Keo Lót & Giấy Lót" : "Backing & Stabilizer",
            },
            {
              id: "Bobbin",
              label: vi ? "Chỉ Suốt (Bobbin)" : "Bobbins",
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
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                inventoryCategoryFilter === cat.id
                  ? "tv-accent-bg font-bold"
                  : "tv-surface tv-border border tv-text-muted"
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
              onClick={onRestockAllLow}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400 cursor-pointer"
            >
              ✓ {vi ? "Nhập Bổ Sung Mã Sắp Hết" : "Restock All Low"}
            </button>
          )}
          <button
            onClick={onOpenNewInventoryModal}
            className="tv-accent-bg rounded-xl px-3.5 py-1.5 text-xs font-bold cursor-pointer"
          >
            + {vi ? "Thêm Chỉ / Vật Tư" : "Add Thread / Supply"}
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
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
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
                    <div>
                      <span className="font-mono text-[11px] tv-accent-text">
                        {item.sku}
                      </span>
                      <h3 className="text-sm font-bold">{item.name}</h3>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => onOpenEditInventoryModal(item)}
                      className="tv-surface-2 rounded px-1.5 py-0.5 text-[11px] tv-text-muted cursor-pointer"
                    >
                      {vi ? "Sửa" : "Edit"}
                    </button>
                    <button
                      onClick={() => onDeleteInventory(item.id, item.name)}
                      className="rounded px-1.5 py-0.5 text-[11px] tv-text-muted hover:text-rose-400 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-xs tv-text-muted">
                  {item.brand} • {item.material} • {formatVnd(item.unitCost)}/
                  {item.unit.slice(0, -1)}
                </p>
              </div>

              <div className="tv-border mt-4 flex items-center justify-between border-t pt-3">
                <div>
                  <span
                    className={`font-mono text-lg font-bold ${
                      isLow ? "text-rose-400" : ""
                    }`}
                  >
                    {item.quantity} {item.unit}
                  </span>
                  {isLow && (
                    <span className="ml-2 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">
                      {vi ? "CẦN NHẬP" : "REORDER"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onAdjustStock(item.id, -1)}
                    className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-xs font-bold cursor-pointer"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => onAdjustStock(item.id, 1)}
                    className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-xs font-bold cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => onAdjustStock(item.id, 10)}
                    className="tv-accent-bg rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer"
                  >
                    +10
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
    </div>
  );
});

export default InventoryTab;

