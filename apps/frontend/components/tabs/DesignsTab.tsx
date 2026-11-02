"use client";

import React, { useRef, useState } from "react";
import type { EmbroideryDesign } from "@/lib/types";
import {
  type ParsedDstResult,
  exportDesignToDstBinary,
  generateSampleDstBinary,
  parseDstBuffer,
} from "@/lib/dst-parser";
import DesignHoopPreview from "../DesignHoopPreview";
import PaginationBar from "../PaginationBar";
import type { DesignFormState, OrderFormState } from "./studio-constants";

interface DesignsTabProps {
  vi: boolean;
  designs: EmbroideryDesign[];
  onOpenNewDesignModal: (prefill?: Partial<DesignFormState>) => void;
  onEditDesignModal: (design: EmbroideryDesign) => void;
  onDeleteDesign: (id: string, code: string) => void;
  onOpenNewOrderModal: (prefill?: Partial<OrderFormState>) => void;
  onQuickSaveParsedDst: (
    parsed: ParsedDstResult,
    clientName: string,
  ) => Promise<void>;
  onShowToast: (msg: string) => void;
}

function DesignsTab({
  vi,
  designs,
  onOpenNewDesignModal,
  onEditDesignModal,
  onDeleteDesign,
  onOpenNewOrderModal,
  onQuickSaveParsedDst,
  onShowToast,
}: DesignsTabProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedDst, setParsedDst] = useState<ParsedDstResult | null>(null);
  const [dstClientName, setDstClientName] = useState<string>(
    "Saigon Heritage Hospitality",
  );
  const [selectedNeedleFilter, setSelectedNeedleFilter] = useState<
    number | "ALL"
  >("ALL");
  const [parseError, setParseError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(4);

  const effectiveSize = pageSize <= 0 ? Math.max(1, designs.length) : pageSize;
  const totalPages = Math.max(1, Math.ceil(designs.length / effectiveSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedDesigns = designs.slice(
    (safePage - 1) * effectiveSize,
    safePage * effectiveSize,
  );

  async function processDstFile(file: File) {
    setParseError(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseDstBuffer(buffer, file.name);
      setParsedDst(result);
      setSelectedNeedleFilter("ALL");
      onShowToast(
        vi
          ? `Đã đọc file .DST: ${result.name} (${result.stitchCount.toLocaleString()} mũi, ${result.widthMm}×${result.heightMm}mm)`
          : `Parsed .DST file: ${result.name} (${result.stitchCount.toLocaleString()} stitches, ${result.widthMm}×${result.heightMm}mm)`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to parse .DST binary file";
      setParseError(message);
    }
  }

  function handleLoadSampleDst(preset: "crest" | "lotus" | "star") {
    setParseError(null);
    const sample = generateSampleDstBinary(preset);
    const result = parseDstBuffer(sample.buffer, sample.fileName);
    result.name = sample.title;
    setDstClientName(sample.clientName);
    setParsedDst(result);
    setSelectedNeedleFilter("ALL");
    onShowToast(
      vi
        ? `Đã nạp & giải mã file mẫu ${sample.fileName} (${result.stitchCount.toLocaleString()} mũi)`
        : `Generated & parsed binary ${sample.fileName} (${result.stitchCount.toLocaleString()} stitches)`,
    );
  }

  function handleDownloadSampleDst(preset: "crest" | "lotus" | "star") {
    const sample = generateSampleDstBinary(preset);
    const blob = new Blob([sample.buffer], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = sample.fileName;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(
      vi
        ? `Đã tải file nhị phân ${sample.fileName} (512B header + 3B stitch packets)`
        : `Downloaded binary ${sample.fileName} (512B header + 3B stitch packets)`,
    );
  }

  // Construct preview EmbroideryDesign object for the live .DST inspector
  const livePreviewDesign: EmbroideryDesign | null = parsedDst
    ? {
        id: "dst-live-preview",
        code: "LIVE-DST",
        name: parsedDst.name,
        clientName: dstClientName,
        stitchCount: parsedDst.stitchCount,
        widthMm: parsedDst.widthMm,
        heightMm: parsedDst.heightMm,
        hoopSize: parsedDst.hoopSize,
        fileFormat: "DST",
        complexity: parsedDst.complexity,
        digitizerNotes: `Tajima .DST Header LA:${parsedDst.headerLabel} • ${parsedDst.jumpCount} jumps • ${parsedDst.trimCount} trims`,
        createdAt: new Date().toISOString().slice(0, 10),
        colorSequence:
          selectedNeedleFilter === "ALL"
            ? parsedDst.colorSequence
            : parsedDst.colorSequence.filter(
                (c) => c.needle === selectedNeedleFilter,
              ),
        stitchPaths:
          selectedNeedleFilter === "ALL"
            ? parsedDst.stitchPaths
            : parsedDst.stitchPaths.filter(
                (p) => p.needle === selectedNeedleFilter,
              ),
        jumpCount: parsedDst.jumpCount,
        trimCount: parsedDst.trimCount,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold">
            {vi
              ? "Thư Viện Mẫu Thêu Vi Tính & Trình Đọc File Máy Thêu .DST"
              : "Embroidery Digitizing Library & Real .DST Binary Parser"}
          </h2>
          <p className="text-xs tv-text-muted">
            {vi
              ? "Kéo thả trực tiếp file máy thêu Tajima (.DST) để tự động bóc tách số mũi, kích thước (mm), số lần cắt chỉ và vẽ đường kim thật"
              : "Drag and drop real Tajima .DST binary files (512-byte header + 3-byte stitch commands) to extract stitch counts, mm dimensions, and render vector stitch paths"}
          </p>
        </div>
        <button
          onClick={() => onOpenNewDesignModal()}
          className="tv-accent-bg rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
        >
          + {vi ? "Thêm Mẫu Thêu Thủ Công" : "Add Design Manually"}
        </button>
      </div>

      {/* ================= REAL .DST DRAG-AND-DROP PARSER & VISUALIZER ================= */}
      <div className="tv-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="tv-accent-bg flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-black">
              DST
            </span>
            <div>
              <h3 className="text-sm font-bold">
                {vi
                  ? "Trình Giải Mã & Mô Phỏng Đường Kim File Thêu .DST (Tajima Binary)"
                  : "Tajima .DST Binary Stitch Parser & Hoop Visualizer"}
              </h3>
              <p className="text-[11px] tv-text-muted">
                {vi
                  ? "Đọc chuẩn 512-byte Header (LA, ST, CO, +X/-X, +Y/-Y) & giải mã tọa độ tam phân cân bằng 3-byte/mũi (0.1mm)"
                  : "Decodes standard 512-byte ASCII header & 3-byte balanced ternary stitch coordinates (0.1mm precision)"}
              </p>
            </div>
          </div>

          {/* Built-in Sample .DST Generators & Downloaders */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] tv-text-muted mr-1">
              {vi ? "Nạp thử file .DST mẫu:" : "Try sample .DST binary:"}
            </span>
            <button
              type="button"
              onClick={() => handleLoadSampleDst("crest")}
              className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-[11px] font-semibold hover:opacity-85 cursor-pointer"
            >
              🛡 Royal Crest (3 Kim)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSampleDst("lotus")}
              className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-[11px] font-semibold hover:opacity-85 cursor-pointer"
            >
              ✿ Saigon Lotus (3 Kim)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSampleDst("star")}
              className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-[11px] font-semibold hover:opacity-85 cursor-pointer"
            >
              ★ VN Star Badge (2 Kim)
            </button>
            <button
              type="button"
              onClick={() => handleDownloadSampleDst("crest")}
              className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-400 hover:bg-sky-500/20 cursor-pointer"
              title={
                vi
                  ? "Tải file .DST thật về máy để thử kéo thả"
                  : "Download real .DST file to your computer to test drag & drop"
              }
            >
              ⬇ {vi ? "Tải File .DST Mẫu" : "Download .DST File"}
            </button>
          </div>
        </div>

        {/* Dropzone Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              void processDstFile(file);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`tv-surface-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition cursor-pointer ${
            isDragging
              ? "border-emerald-400 bg-emerald-500/10"
              : "tv-border hover:opacity-95"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".dst,.DST"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void processDstFile(file);
              }
              e.target.value = "";
            }}
          />
          <p className="text-xs font-bold">
            {vi
              ? "📂 Kéo thả file .DST từ máy tính vào đây, hoặc nhấn để chọn file (.DST)"
              : "📂 Drag & drop a Tajima .DST file here, or click to browse (.DST)"}
          </p>
          <p className="mt-1 text-[11px] tv-text-muted">
            {vi
              ? "Tự động tính tổng số mũi thêu, khổ thêu Rộng × Cao (mm), số lần nhảy mũi (Jump), cắt chỉ (Trim) và vẽ đường kim trực tiếp trên khung"
              : "Automatically extracts stitch count, width × height (mm), jump/trim telemetry, and renders live needle paths inside the hoop"}
          </p>
          {parseError && (
            <p className="mt-2 rounded bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-400">
              {parseError}
            </p>
          )}
        </div>

        {/* Live Parsed .DST Inspector Panel */}
        {parsedDst && livePreviewDesign && (
          <div className="tv-surface-2 tv-border rounded-xl border p-4">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              {/* Left: Large Hoop Vector Stitch Renderer */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center gap-2.5">
                <DesignHoopPreview design={livePreviewDesign} size="lg" />
                <div className="flex flex-wrap justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedNeedleFilter("ALL")}
                    className={`rounded px-2 py-0.5 text-[10px] font-bold cursor-pointer ${
                      selectedNeedleFilter === "ALL"
                        ? "tv-accent-bg"
                        : "tv-surface tv-border border tv-text-muted"
                    }`}
                  >
                    {vi ? "Tất Cả Kim" : "All Needles"}
                  </button>
                  {parsedDst.stitchPaths.map((seg) => (
                    <button
                      key={seg.needle}
                      type="button"
                      onClick={() => setSelectedNeedleFilter(seg.needle)}
                      className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold cursor-pointer ${
                        selectedNeedleFilter === seg.needle
                          ? "tv-accent-bg"
                          : "tv-surface tv-border border tv-text-muted"
                      }`}
                    >
                      {vi ? `Kim ${seg.needle}` : `N${seg.needle}`} (
                      {seg.stitchCount.toLocaleString()})
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Extracted .DST Telemetry & Save Controls */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                          ✓ PARSED TAJIMA .DST
                        </span>
                        <span className="font-mono text-xs tv-text-muted">
                          LA:{parsedDst.headerLabel}
                        </span>
                      </div>
                      <h4 className="mt-1 text-base font-bold">
                        {parsedDst.name}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => setParsedDst(null)}
                      className="text-xs tv-text-muted hover:text-rose-400 cursor-pointer"
                    >
                      ✕ {vi ? "Đóng" : "Clear"}
                    </button>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 text-xs">
                    <div className="tv-surface tv-border rounded-lg border p-2.5">
                      <p className="text-[10px] uppercase tv-text-muted">
                        {vi ? "Tổng Số Mũi" : "Total Stitches"}
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-black tv-accent-text">
                        {parsedDst.stitchCount.toLocaleString()}
                      </p>
                    </div>
                    <div className="tv-surface tv-border rounded-lg border p-2.5">
                      <p className="text-[10px] uppercase tv-text-muted">
                        {vi ? "Kích Thước Mẫu" : "Dimensions"}
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-bold">
                        {parsedDst.widthMm} × {parsedDst.heightMm} mm
                      </p>
                    </div>
                    <div className="tv-surface tv-border rounded-lg border p-2.5">
                      <p className="text-[10px] uppercase tv-text-muted">
                        {vi ? "Số Màu / Cắt Chỉ" : "Needles / Trims"}
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-sky-400">
                        {parsedDst.colorCount} {vi ? "kim" : "col"} •{" "}
                        {parsedDst.trimCount} {vi ? "cắt" : "trims"}
                      </p>
                    </div>
                    <div className="tv-surface tv-border rounded-lg border p-2.5">
                      <p className="text-[10px] uppercase tv-text-muted">
                        {vi ? "Mũi Nhảy (Jumps)" : "Jump Stitches"}
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-bold">
                        {parsedDst.jumpCount.toLocaleString()}
                      </p>
                    </div>
                    <div className="tv-surface tv-border rounded-lg border p-2.5">
                      <p className="text-[10px] uppercase tv-text-muted">
                        {vi ? "Định Mức Chỉ" : "Est. Thread"}
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-emerald-400">
                        ~{parsedDst.estimatedThreadMeters}m /{" "}
                        {vi ? "áo" : "pc"}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Needle Colorway Customizer for the Parsed .DST */}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider tv-text-muted mb-1.5">
                      {vi
                        ? "Gán Màu Chỉ Cho Từng Kim (Nhấn vào ô màu để đổi màu đường thêu trực tiếp)"
                        : "Assign Thread Colors to Parsed Needles (Click color swatch to preview live)"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {parsedDst.colorSequence.map((stop, idx) => (
                        <label
                          key={stop.needle}
                          className="tv-surface tv-border flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs cursor-pointer"
                        >
                          <input
                            type="color"
                            value={stop.hex}
                            onChange={(e) => {
                              const nextColors = [...parsedDst.colorSequence];
                              nextColors[idx] = {
                                ...stop,
                                hex: e.target.value,
                              };
                              setParsedDst({
                                ...parsedDst,
                                colorSequence: nextColors,
                              });
                            }}
                            className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0"
                          />
                          <span className="font-mono text-[10px] tv-text-muted">
                            {vi ? `Kim ${stop.needle}` : `N${stop.needle}`}
                          </span>
                          <span className="font-semibold">{stop.name}</span>
                          <span className="font-mono text-[10px] tv-accent-text">
                            ({stop.threadCode})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Save / Open in Editor Bar */}
                <div className="tv-border flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="tv-text-muted">
                      {vi ? "Khách hàng:" : "Client:"}
                    </span>
                    <input
                      type="text"
                      value={dstClientName}
                      onChange={(e) => setDstClientName(e.target.value)}
                      className="tv-input px-2.5 py-1 text-xs"
                    />
                    <span className="tv-surface rounded px-2 py-1 font-mono text-[11px] tv-text-muted">
                      {parsedDst.hoopSize}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenNewDesignModal({
                          name: parsedDst.name,
                          clientName: dstClientName,
                          stitchCount: parsedDst.stitchCount,
                          widthMm: parsedDst.widthMm,
                          heightMm: parsedDst.heightMm,
                          hoopSize: parsedDst.hoopSize,
                          fileFormat: "DST",
                          complexity: parsedDst.complexity,
                          digitizerNotes: `Tajima .DST (${parsedDst.headerLabel}) • ${parsedDst.jumpCount} jumps • ${parsedDst.trimCount} trims • ~${parsedDst.estimatedThreadMeters}m thread/pc`,
                          colorSequence: parsedDst.colorSequence,
                          stitchPaths: parsedDst.stitchPaths,
                          jumpCount: parsedDst.jumpCount,
                          trimCount: parsedDst.trimCount,
                        });
                      }}
                      className="tv-surface tv-border rounded-lg border px-3 py-1.5 text-xs font-semibold hover:opacity-85 cursor-pointer"
                    >
                      ✎ {vi ? "Chỉnh Sửa Chi Tiết..." : "Open in Editor..."}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void onQuickSaveParsedDst(parsedDst, dstClientName);
                        setParsedDst(null);
                      }}
                      className="tv-accent-bg rounded-lg px-4 py-1.5 text-xs font-extrabold shadow-md cursor-pointer"
                    >
                      +{" "}
                      {vi
                        ? "Lưu Mẫu .DST Vào Thư Viện"
                        : "Save .DST Design to Library"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= DIGITIZED DESIGNS CATALOG GRID ================= */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {pagedDesigns.map((des) => (
          <div
            key={des.id}
            className="tv-card p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-4">
                <DesignHoopPreview design={des} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold tv-accent-text">
                          {des.code}
                        </span>
                        <span className="tv-surface-2 rounded px-2 py-0.5 font-mono text-[10px] font-bold">
                          .{des.fileFormat}
                        </span>
                        <span className="rounded border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-400">
                          {des.complexity}
                        </span>
                        {des.stitchPaths && des.stitchPaths.length > 0 && (
                          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-400">
                            {vi ? "Đường Kim .DST Thật" : "Vector .DST"}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 text-base font-bold truncate">
                        {des.name}
                      </h3>
                      <p className="text-xs tv-text-muted">
                        {vi ? "Khách hàng:" : "Client:"} {des.clientName}
                      </p>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <span className="text-base font-bold">
                        {des.stitchCount.toLocaleString()}
                      </span>
                      <p className="text-[10px] uppercase tv-text-muted">
                        {vi ? "Mũi Thêu" : "Stitches"}
                      </p>
                    </div>
                  </div>

                  <div className="tv-surface-2 mt-3 grid grid-cols-2 gap-2 rounded-lg p-2.5 text-xs">
                    <div>
                      <span className="tv-text-muted">
                        {vi ? "Kích thước: " : "Size: "}
                      </span>
                      <span className="font-mono">
                        {des.widthMm}mm × {des.heightMm}mm
                      </span>
                    </div>
                    <div>
                      <span className="tv-text-muted">
                        {vi ? "Khung: " : "Hoop: "}
                      </span>
                      <span className="font-semibold">{des.hoopSize}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider tv-text-muted mb-2">
                  {vi
                    ? `Thứ Tự Kim & Màu Chỉ (${des.colorSequence.length} Kim)`
                    : `Needle Colorway Sequence (${des.colorSequence.length} Needles)`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {des.colorSequence.map((col) => (
                    <div
                      key={col.needle}
                      className="tv-surface-2 tv-border flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-slate-500"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="font-mono text-[10px] tv-text-muted">
                        {vi ? `Kim ${col.needle}` : `N${col.needle}`}
                      </span>
                      <span className="font-medium">{col.name}</span>
                      <span className="font-mono text-[10px] tv-accent-text">
                        ({col.threadCode})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="tv-border mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <p className="text-xs tv-text-muted truncate max-w-xs">
                <strong>{vi ? "Kỹ thuật:" : "Spec:"}</strong>{" "}
                {des.digitizerNotes}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const buf = exportDesignToDstBinary(des);
                    const blob = new Blob([buf], {
                      type: "application/octet-stream",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${des.code || "TV-DESIGN"}.dst`;
                    a.click();
                    URL.revokeObjectURL(url);
                    onShowToast(
                      vi
                        ? `Đã xuất file máy thêu ${des.code}.dst`
                        : `Exported machine file ${des.code}.dst`,
                    );
                  }}
                  className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-xs font-mono font-bold tv-accent-text hover:opacity-85 cursor-pointer"
                  title={
                    vi
                      ? "Tải file nhị phân .DST chuẩn máy Tajima/Barudan"
                      : "Download binary Tajima .DST file for USB/Machine"
                  }
                >
                  ⬇ .DST
                </button>
                <button
                  onClick={() => {
                    onOpenNewOrderModal({ designId: des.id });
                  }}
                  className="tv-accent-bg rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer"
                >
                  + {vi ? "Tạo Đơn" : "New Order"}
                </button>
                <button
                  onClick={() => onEditDesignModal(des)}
                  className="tv-surface-2 tv-border rounded-lg border px-2.5 py-1 text-xs cursor-pointer"
                >
                  {vi ? "Sửa" : "Edit"}
                </button>
                <button
                  onClick={() => onDeleteDesign(des.id, des.code)}
                  className="tv-surface-2 tv-border rounded-lg border px-2 py-1 text-xs tv-text-muted hover:text-rose-400 cursor-pointer"
                >
                  {vi ? "Xóa" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PaginationBar
        vi={vi}
        currentPage={safePage}
        pageSize={pageSize}
        totalItems={designs.length}
        pageSizeOptions={[4, 6, 10, 20]}
        unitLabel={vi ? "mẫu thêu .DST" : "designs"}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}

export default React.memo(DesignsTab);

