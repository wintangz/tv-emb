"use client";

import { useEffect } from "react";

export interface PendingConfirmAction {
  title: string;
  description: string;
  targetLabel?: string;
  changePreview?: string;
  confirmLabel?: string;
  variant?: "primary" | "danger" | "emerald" | "amber";
  onConfirm: () => void | Promise<void>;
}

interface ConfirmActionModalProps {
  vi: boolean;
  action: PendingConfirmAction;
  onCancel: () => void;
}

export default function ConfirmActionModal({
  vi,
  action,
  onCancel,
}: ConfirmActionModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const isDanger = action.variant === "danger";
  const isEmerald = action.variant === "emerald";
  const isAmber = action.variant === "amber";

  const confirmBtnClass = isDanger
    ? "bg-rose-600 text-white hover:bg-rose-500"
    : isEmerald
      ? "bg-emerald-600 text-white hover:bg-emerald-500"
      : isAmber
        ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
        : "tv-accent-bg hover:opacity-90";

  const iconSymbol = isDanger ? "⚠" : isEmerald ? "✓" : isAmber ? "💰" : "⚙";

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={action.title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="tv-surface tv-border tv-text w-full max-w-md rounded-2xl border p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b tv-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                isDanger
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  : isEmerald
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "tv-accent-bg"
              }`}
            >
              {iconSymbol}
            </span>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest tv-text-muted">
                {vi ? "Xác Nhận Thao Tác Nghiệp Vụ" : "Confirm Business Action"}
              </span>
              <h3 className="text-base font-extrabold leading-snug">
                {action.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="tv-surface-2 tv-border flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs tv-text-muted hover:opacity-80 cursor-pointer"
            title={vi ? "Đóng (Esc)" : "Close (Esc)"}
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <p className="leading-relaxed tv-text">{action.description}</p>

          {(action.targetLabel || action.changePreview) && (
            <div className="tv-surface-2 tv-border rounded-xl border p-3.5 space-y-1.5">
              {action.targetLabel && (
                <div className="flex items-center justify-between gap-2">
                  <span className="tv-text-muted">
                    {vi ? "Đối tượng áp dụng:" : "Target Record:"}
                  </span>
                  <span className="font-bold tv-text text-right">
                    {action.targetLabel}
                  </span>
                </div>
              )}
              {action.changePreview && (
                <div className="flex items-center justify-between gap-2">
                  <span className="tv-text-muted">
                    {vi ? "Chi tiết thay đổi:" : "Change Summary:"}
                  </span>
                  <span className="font-mono font-bold tv-accent-text text-right">
                    {action.changePreview}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="tv-border mt-5 flex items-center justify-end gap-2 border-t pt-4 text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="tv-surface-2 tv-border rounded-xl border px-4 py-2 font-semibold tv-text hover:opacity-85 cursor-pointer"
          >
            {vi ? "Không, Hủy Bỏ" : "No, Cancel"}
          </button>
          <button
            type="button"
            onClick={() => {
              const fn = action.onConfirm;
              onCancel();
              void fn();
            }}
            className={`rounded-xl px-4 py-2 font-extrabold shadow-md transition cursor-pointer ${confirmBtnClass}`}
          >
            {action.confirmLabel ??
              (vi ? "✓ Có, Xác Nhận Thực Hiện" : "✓ Yes, Confirm Action")}
          </button>
        </div>
      </div>
    </div>
  );
}

