"use client";

import React from "react";
import type { EmbroideryDesign } from "@/lib/types";

function DesignHoopPreview({
  design,
  size = "md",
}: {
  design: EmbroideryDesign;
  size?: "sm" | "md" | "lg";
}) {
  const colors =
    design.colorSequence.length > 0
      ? design.colorSequence.map((c) => c.hex)
      : ["#eab308", "#1e3a8a", "#f8fafc"];

  const hasRealStitchPaths =
    Array.isArray(design.stitchPaths) && design.stitchPaths.length > 0;

  const ratio = Math.min(
    1.35,
    Math.max(0.65, design.widthMm / Math.max(1, design.heightMm)),
  );
  const boxW = Math.round(54 * ratio);
  const boxH = Math.round(54 / ratio);

  const sizeClass =
    size === "lg"
      ? "h-52 w-52 p-3"
      : size === "sm"
        ? "h-20 w-20 p-1.5"
        : "h-28 w-28 p-2";

  return (
    <div
      className={`tv-surface-2 tv-border relative flex shrink-0 items-center justify-center rounded-xl border shadow-inner ${sizeClass}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full overflow-visible"
        aria-label={`Hoop preview for ${design.name}`}
      >
        {/* Outer & Inner Tubular Embroidery Hoop Ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="#0b1120"
          stroke="#475569"
          strokeWidth="3.5"
        />
        <circle
          cx="50"
          cy="50"
          r="42.5"
          fill="none"
          stroke="#1e293b"
          strokeWidth="1"
        />
        {/* Hoop Tension Bracket at Top */}
        <rect x="44" y="0" width="12" height="6" rx="2" fill="#64748b" />
        <circle cx="50" cy="3" r="1.4" fill="#cbd5e1" />

        {/* Center Registration Crosshairs */}
        <line
          x1="10"
          y1="50"
          x2="90"
          y2="50"
          stroke="#334155"
          strokeWidth="0.75"
          strokeDasharray="2 2"
        />
        <line
          x1="50"
          y1="10"
          x2="50"
          y2="90"
          stroke="#334155"
          strokeWidth="0.75"
          strokeDasharray="2 2"
        />

        {hasRealStitchPaths ? (
          /* Real Parsed .DST Vector Stitch Paths */
          <g>
            {design.stitchPaths!.map((seg, idx) => {
              const strokeColor =
                colors[idx % colors.length] ?? colors[0] ?? "#eab308";
              return (
                <path
                  key={`${seg.needle}-${idx}`}
                  d={seg.d}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={size === "lg" ? "1.15" : "1.35"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.95}
                />
              );
            })}
          </g>
        ) : (
          /* Schematic Hoop Preview Fallback */
          <g>
            <rect
              x={50 - boxW / 2}
              y={50 - boxH / 2}
              width={boxW}
              height={boxH}
              rx="6"
              fill="none"
              stroke={colors[0]}
              strokeWidth="2.2"
              strokeDasharray="3 1.5"
            />
            {colors.slice(0, 4).map((hex, i) => {
              const r = Math.max(6, 20 - i * 4.5);
              return (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke={hex}
                  strokeWidth="3.2"
                  strokeDasharray={i % 2 === 0 ? "4 1.5" : "2 1"}
                />
              );
            })}
            <circle cx="50" cy="50" r="3.5" fill={colors[0]} />
          </g>
        )}
      </svg>

      {hasRealStitchPaths && (
        <span className="absolute top-1 left-1.5 rounded bg-emerald-500/20 border border-emerald-500/40 px-1 py-0.5 font-mono text-[8px] font-bold text-emerald-400">
          DST
        </span>
      )}

      <span className="tv-surface tv-text-muted absolute bottom-1 right-1.5 rounded px-1 py-0.5 font-mono text-[9px]">
        {design.widthMm}×{design.heightMm}
      </span>
    </div>
  );
}

export default React.memo(DesignHoopPreview);
