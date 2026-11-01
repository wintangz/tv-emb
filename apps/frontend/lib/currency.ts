const VND_FORMATTER = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

/**
 * Formats an amount in Vietnamese Đồng (VND) using a cached Intl.NumberFormat
 * singleton for high-speed rendering across large tables and lists.
 * Example: 19800000 -> "19.800.000 ₫"
 */
export function formatVnd(amount: number | undefined | null): string {
  const safe = Number.isFinite(amount) ? Math.round(amount as number) : 0;
  return `${VND_FORMATTER.format(safe)} ₫`;
}

/**
 * Formats large VND amounts compactly for KPI cards while keeping smaller
 * amounts exact.
 * Example (vi=true): 72400000 -> "72,4 tr ₫", 450000000 -> "450 tr ₫"
 * Example (vi=false): 72400000 -> "72.4M ₫"
 */
export function formatVndCompact(
  amount: number | undefined | null,
  vi = true,
): string {
  const safe = Number.isFinite(amount) ? Math.round(amount as number) : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "");
    return vi
      ? `${sign}${val.replace(".", ",")} tỷ ₫`
      : `${sign}${val}B ₫`;
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return vi
      ? `${sign}${val.replace(".", ",")} tr ₫`
      : `${sign}${val}M ₫`;
  }
  return formatVnd(safe);
}

