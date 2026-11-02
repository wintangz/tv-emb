"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { StudioLocale } from "@/lib/i18n";

export interface ThemeConfig {
  presetId: string;
  name: string;
  mode: "dark" | "light";
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentFg: string;
  radius: "0.375rem" | "0.75rem" | "1.125rem";
  layout: "sidebar" | "top";
}

export const THEME_PRESETS: ThemeConfig[] = [
  {
    presetId: "imperial-gold",
    name: "Imperial Gold",
    mode: "dark",
    bg: "#090d16",
    surface: "#111827",
    surface2: "#1e293b",
    border: "#334155",
    text: "#f8fafc",
    textMuted: "#cbd5e1",
    accent: "#f59e0b",
    accentFg: "#090d16",
    radius: "0.75rem",
    layout: "sidebar",
  },
  {
    presetId: "saigon-jade",
    name: "Saigon Jade",
    mode: "dark",
    bg: "#06110e",
    surface: "#0d1f1a",
    surface2: "#16332b",
    border: "#28594b",
    text: "#ecfdf5",
    textMuted: "#a7f3d0",
    accent: "#10b981",
    accentFg: "#041a13",
    radius: "0.75rem",
    layout: "sidebar",
  },
  {
    presetId: "indigo-denim",
    name: "Indigo Denim",
    mode: "dark",
    bg: "#090b16",
    surface: "#121629",
    surface2: "#1e2544",
    border: "#364275",
    text: "#f1f5f9",
    textMuted: "#cbd5e1",
    accent: "#6366f1",
    accentFg: "#ffffff",
    radius: "0.75rem",
    layout: "sidebar",
  },
  {
    presetId: "crimson-silk",
    name: "Crimson Silk",
    mode: "dark",
    bg: "#13090c",
    surface: "#1f1116",
    surface2: "#301a22",
    border: "#542d3c",
    text: "#fff1f2",
    textMuted: "#fecdd3",
    accent: "#f43f5e",
    accentFg: "#ffffff",
    radius: "0.75rem",
    layout: "sidebar",
  },
  {
    presetId: "atelier-daylight",
    name: "Atelier Daylight",
    mode: "light",
    bg: "#e2e8f0",
    surface: "#ffffff",
    surface2: "#eef2f6",
    border: "#cbd5e1",
    text: "#0f172a",
    textMuted: "#475569",
    accent: "#2563eb",
    accentFg: "#ffffff",
    radius: "0.75rem",
    layout: "sidebar",
  },
  {
    presetId: "warm-linen",
    name: "Warm Linen & Gold",
    mode: "light",
    bg: "#ede7de",
    surface: "#ffffff",
    surface2: "#f3efe8",
    border: "#d6cbb9",
    text: "#1c1917",
    textMuted: "#57534e",
    accent: "#b45309",
    accentFg: "#ffffff",
    radius: "0.75rem",
    layout: "sidebar",
  },
];

const THREAD_ACCENT_SWATCHES = [
  { name: "Vàng Kim (Gold)", hex: "#f59e0b", fg: "#090d16" },
  { name: "Ngọc Lục Bảo (Jade)", hex: "#10b981", fg: "#051b14" },
  { name: "Xanh Hoàng Gia", hex: "#2563eb", fg: "#ffffff" },
  { name: "Chàm Indigo", hex: "#4f46e5", fg: "#ffffff" },
  { name: "Đỏ Nhung (Crimson)", hex: "#e11d48", fg: "#ffffff" },
  { name: "Xanh Ngọc (Cyan)", hex: "#0891b2", fg: "#ffffff" },
  { name: "Tím Thạch Anh", hex: "#9333ea", fg: "#ffffff" },
  { name: "Đồng Đỏ (Copper)", hex: "#ea580c", fg: "#ffffff" },
];

const THEME_STORAGE_KEY = "tuong_vinh_theme_v2";
let currentThemeSnapshot: ThemeConfig = THEME_PRESETS[0];
let initializedFromStorage = false;
const listeners = new Set<() => void>();

export function applyThemeToDocument(theme: ThemeConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme-mode", theme.mode);
  root.style.setProperty("--tv-bg", theme.bg);
  root.style.setProperty("--tv-surface", theme.surface);
  root.style.setProperty("--tv-surface-2", theme.surface2);
  root.style.setProperty("--tv-border", theme.border);
  root.style.setProperty("--tv-text", theme.text);
  root.style.setProperty("--tv-text-muted", theme.textMuted);
  root.style.setProperty("--tv-accent", theme.accent);
  root.style.setProperty("--tv-accent-fg", theme.accentFg);
  root.style.setProperty("--tv-radius", theme.radius);
}

function getThemeSnapshot(): ThemeConfig {
  if (typeof window !== "undefined" && !initializedFromStorage) {
    initializedFromStorage = true;
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ThemeConfig;
        const matchedPreset = THEME_PRESETS.find(
          (p) => p.presetId === parsed.presetId,
        );
        currentThemeSnapshot = matchedPreset
          ? {
              ...matchedPreset,
              layout: parsed.layout ?? matchedPreset.layout,
              radius: parsed.radius ?? matchedPreset.radius,
            }
          : parsed;
      }
    } catch {
      // ignore storage errors
    }
    applyThemeToDocument(currentThemeSnapshot);
  }
  return currentThemeSnapshot;
}

function getServerThemeSnapshot(): ThemeConfig {
  return THEME_PRESETS[0];
}

function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setStudioTheme(next: ThemeConfig): void {
  currentThemeSnapshot = next;
  initializedFromStorage = true;
  applyThemeToDocument(next);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
  for (const listener of listeners) {
    listener();
  }
}

export function useStudioTheme(): [ThemeConfig, (next: ThemeConfig) => void] {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  return [theme, setStudioTheme];
}

interface ThemeCustomizerProps {
  theme: ThemeConfig;
  locale: StudioLocale;
  onChange: (next: ThemeConfig) => void;
  onClose: () => void;
}

export default function ThemeCustomizer({
  theme,
  locale,
  onChange,
  onClose,
}: ThemeCustomizerProps) {
  const vi = locale === "vi";

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function selectPreset(preset: ThemeConfig) {
    onChange({
      ...preset,
      radius: theme.radius,
      layout: theme.layout,
    });
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label={vi ? "Tùy chỉnh giao diện" : "Theme customizer"}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="tv-surface tv-border flex h-full w-full max-w-md flex-col justify-between border-l shadow-2xl overflow-y-auto"
      >
        {/* Sticky Header so Close is always 1 click away */}
        <div className="tv-surface tv-border sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4">
          <div>
            <span className="tv-accent-text text-[10px] font-bold uppercase tracking-widest">
              {vi ? "Tùy Chỉnh Giao Diện" : "Studio Personalization"}
            </span>
            <h3 className="text-base font-bold tv-text">
              {vi
                ? "Màu Sắc & Bố Cục Hệ Thống"
                : "Theme & Layout Customizer"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            title={vi ? "Đóng bảng tùy chỉnh (Esc)" : "Close panel (Esc)"}
            className="tv-surface-2 tv-border flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold tv-text hover:opacity-80 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 p-6">

          {/* 1. Theme Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider tv-text-muted mb-2.5">
              {vi
                ? "1. Bộ Giao Diện Mẫu (Tối & Sáng)"
                : "1. Studio Theme Presets (Dark & Light)"}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {THEME_PRESETS.map((preset) => {
                const isSelected = theme.presetId === preset.presetId;
                return (
                  <button
                    key={preset.presetId}
                    onClick={() => selectPreset(preset)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-(--tv-accent) border-transparent"
                        : "opacity-90 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: preset.surface,
                      borderColor: preset.border,
                      color: preset.text,
                    }}
                  >
                    <div className="flex -space-x-1.5 shrink-0">
                      <span
                        className="h-5 w-5 rounded-full border border-slate-400/40"
                        style={{ backgroundColor: preset.bg }}
                      />
                      <span
                        className="h-5 w-5 rounded-full border border-slate-400/40"
                        style={{ backgroundColor: preset.accent }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold">
                        {preset.name}
                      </p>
                      <p
                        className="text-[10px] capitalize"
                        style={{ color: preset.textMuted }}
                      >
                        {preset.mode === "dark"
                          ? vi
                            ? "Nền tối"
                            : "Dark mode"
                          : vi
                            ? "Nền sáng"
                            : "Light mode"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Thread Spool Accent Color */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider tv-text-muted mb-2.5">
              {vi
                ? "2. Màu Nhấn Chủ Đạo (Theo Màu Chỉ Thêu)"
                : "2. Primary Thread Accent Color"}
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {THREAD_ACCENT_SWATCHES.map((sw) => (
                <button
                  key={sw.hex}
                  onClick={() =>
                    onChange({
                      ...theme,
                      presetId: "custom",
                      accent: sw.hex,
                      accentFg: sw.fg,
                    })
                  }
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                    theme.accent.toLowerCase() === sw.hex.toLowerCase()
                      ? "tv-accent-border ring-1 ring-(--tv-accent)"
                      : "tv-border"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: sw.hex }}
                  />
                  <span className="text-[11px]">{sw.name}</span>
                </button>
              ))}
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-3 gap-2.5 rounded-xl border tv-border tv-surface-2 p-3 text-xs">
              <div>
                <span className="block text-[10px] tv-text-muted mb-1">
                  {vi ? "Màu Nhấn" : "Custom Accent"}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={theme.accent}
                    onChange={(e) =>
                      onChange({
                        ...theme,
                        presetId: "custom",
                        accent: e.target.value,
                      })
                    }
                    className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <span className="font-mono text-[11px]">{theme.accent}</span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] tv-text-muted mb-1">
                  {vi ? "Màu Nền Chính" : "Background"}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={theme.bg}
                    onChange={(e) =>
                      onChange({
                        ...theme,
                        presetId: "custom",
                        bg: e.target.value,
                      })
                    }
                    className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <span className="font-mono text-[11px]">{theme.bg}</span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] tv-text-muted mb-1">
                  {vi ? "Nền Thẻ (Card)" : "Card Surface"}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={theme.surface}
                    onChange={(e) =>
                      onChange({
                        ...theme,
                        presetId: "custom",
                        surface: e.target.value,
                      })
                    }
                    className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <span className="font-mono text-[11px]">{theme.surface}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Navigation Layout Style */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider tv-text-muted mb-2">
              {vi ? "3. Bố Cục Thanh Điều Hướng" : "3. Workspace Navigation Layout"}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  {
                    id: "sidebar",
                    label: vi
                      ? "Thanh Bên Trái (Khuyên Dùng)"
                      : "Left Studio Sidebar",
                  },
                  {
                    id: "top",
                    label: vi ? "Thanh Ngang Phía Trên" : "Top Ribbon Navigation",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onChange({ ...theme, layout: opt.id })}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition cursor-pointer ${
                    theme.layout === opt.id
                      ? "tv-accent-bg font-bold"
                      : "tv-border tv-surface-2 tv-text"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Corner Geometry */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider tv-text-muted mb-2">
              {vi ? "4. Độ Bo Góc Khung Thẻ" : "4. Card Corner Geometry"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { val: "0.375rem", label: vi ? "Vuông Gọn" : "Sharp" },
                  { val: "0.75rem", label: vi ? "Hiện Đại" : "Modern" },
                  { val: "1.125rem", label: vi ? "Bo Mềm" : "Plush" },
                ] as const
              ).map((r) => (
                <button
                  key={r.val}
                  onClick={() => onChange({ ...theme, radius: r.val })}
                  className={`rounded-lg border py-2 text-xs font-semibold transition cursor-pointer ${
                    theme.radius === r.val
                      ? "tv-accent-bg font-bold"
                      : "tv-border tv-surface-2 tv-text"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Footer Reset */}
        <div className="tv-surface tv-border sticky bottom-0 z-10 flex items-center justify-between border-t px-6 py-4">
          <button
            type="button"
            onClick={() => onChange(THEME_PRESETS[0])}
            className="text-xs tv-text-muted hover:underline cursor-pointer"
          >
            {vi
              ? "Khôi phục mặc định (Imperial Gold)"
              : "Reset to Default (Imperial Gold)"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="tv-accent-bg rounded-xl px-5 py-2 text-xs font-bold shadow-md cursor-pointer"
          >
            {vi ? "Đóng (Esc)" : "Done (Esc)"}
          </button>
        </div>
      </div>
    </div>
  );
}
