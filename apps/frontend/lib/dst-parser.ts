import type { ColorStop, StitchPathSegment } from "./types";

export interface ParsedDstResult {
  name: string;
  headerLabel: string;
  stitchCount: number;
  jumpCount: number;
  trimCount: number;
  colorCount: number;
  widthMm: number;
  heightMm: number;
  hoopSize: string;
  complexity: "Standard" | "Detailed" | "3D Puff" | "Jacket Back";
  colorSequence: ColorStop[];
  stitchPaths: StitchPathSegment[];
  estimatedThreadMeters: number;
}

const DEFAULT_MADEIRA_PALETTE: Omit<ColorStop, "needle">[] = [
  { threadCode: "M-1747", name: "Metallic Gold", hex: "#eab308" },
  { threadCode: "M-1838", name: "Classic Crimson", hex: "#dc2626" },
  { threadCode: "M-1801", name: "Super White", hex: "#f8fafc" },
  { threadCode: "M-1955", name: "Royal Blue", hex: "#38bdf8" },
  { threadCode: "M-1980", name: "Emerald Green", hex: "#10b981" },
  { threadCode: "M-1800", name: "Jet Black", hex: "#94a3b8" },
  { threadCode: "M-1921", name: " Imperial Purple", hex: "#c084fc" },
  { threadCode: "M-1678", name: "Sunset Orange", hex: "#fb923c" },
];

/**
 * Decode balanced ternary X/Y deltas (in 0.1mm units) from a 3-byte Tajima .DST record.
 */
function decodeDstDxDy(b0: number, b1: number, b2: number): [number, number] {
  let dx = 0;
  let dy = 0;

  // Byte 0
  if (b0 & 0x01) dx += 1;
  if (b0 & 0x02) dx -= 1;
  if (b0 & 0x04) dx += 9;
  if (b0 & 0x08) dx -= 9;
  if (b0 & 0x80) dy += 1;
  if (b0 & 0x40) dy -= 1;
  if (b0 & 0x20) dy += 9;
  if (b0 & 0x10) dy -= 9;

  // Byte 1
  if (b1 & 0x01) dx += 3;
  if (b1 & 0x02) dx -= 3;
  if (b1 & 0x04) dx += 27;
  if (b1 & 0x08) dx -= 27;
  if (b1 & 0x80) dy += 3;
  if (b1 & 0x40) dy -= 3;
  if (b1 & 0x20) dy += 27;
  if (b1 & 0x10) dy -= 27;

  // Byte 2
  if (b2 & 0x04) dx += 81;
  if (b2 & 0x08) dx -= 81;
  if (b2 & 0x20) dy += 81;
  if (b2 & 0x10) dy -= 81;

  return [dx, dy];
}

/**
 * Encode a single step (-121..+121 in 0.1mm units) into a 3-byte Tajima .DST record.
 */
function encodeDstRecord(
  dx: number,
  dy: number,
  type: "normal" | "jump" | "color_change" | "end",
): [number, number, number] {
  if (type === "end") {
    return [0x00, 0x00, 0xf3];
  }

  let b0 = 0;
  let b1 = 0;
  let b2 = 0x03; // Bits 0 and 1 of byte 2 are always set in Tajima .DST format

  const encodeAxis = (val: number): [number, number, number, number, number] => {
    let rem = Math.max(-121, Math.min(121, Math.round(val)));
    const weights = [81, 27, 9, 3, 1];
    const maxRem = [40, 13, 4, 1, 0];
    const trits: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) {
      if (rem > maxRem[i]) {
        trits[i] = 1;
        rem -= weights[i];
      } else if (rem < -maxRem[i]) {
        trits[i] = -1;
        rem += weights[i];
      }
    }
    return trits;
  };

  const [tx81, tx27, tx9, tx3, tx1] = encodeAxis(dx);
  const [ty81, ty27, ty9, ty3, ty1] = encodeAxis(dy);

  if (tx1 > 0) b0 |= 0x01;
  if (tx1 < 0) b0 |= 0x02;
  if (tx9 > 0) b0 |= 0x04;
  if (tx9 < 0) b0 |= 0x08;
  if (ty1 > 0) b0 |= 0x80;
  if (ty1 < 0) b0 |= 0x40;
  if (ty9 > 0) b0 |= 0x20;
  if (ty9 < 0) b0 |= 0x10;

  if (tx3 > 0) b1 |= 0x01;
  if (tx3 < 0) b1 |= 0x02;
  if (tx27 > 0) b1 |= 0x04;
  if (tx27 < 0) b1 |= 0x08;
  if (ty3 > 0) b1 |= 0x80;
  if (ty3 < 0) b1 |= 0x40;
  if (ty27 > 0) b1 |= 0x20;
  if (ty27 < 0) b1 |= 0x10;

  if (tx81 > 0) b2 |= 0x04;
  if (tx81 < 0) b2 |= 0x08;
  if (ty81 > 0) b2 |= 0x20;
  if (ty81 < 0) b2 |= 0x10;

  if (type === "jump") {
    b2 |= 0x80;
  } else if (type === "color_change") {
    b2 |= 0xc0;
  }

  return [b0, b1, b2];
}

export function recommendHoopSize(widthMm: number, heightMm: number): string {
  const maxDim = Math.max(widthMm, heightMm);
  if (maxDim <= 105) return "120x120mm Tubular";
  if (maxDim <= 138) return "150x150mm Tubular";
  if (maxDim <= 185) return "200x200mm Tubular";
  return "300x290mm Jacket Back";
}

/**
 * Parse a real Tajima .DST binary buffer (512-byte header + 3-byte stitch records)
 * and generate normalized SVG vector paths for DesignHoopPreview.
 */
export function parseDstBuffer(
  buffer: ArrayBuffer,
  fileName = "Custom-Design.dst",
): ParsedDstResult {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 515) {
    throw new Error(
      "Invalid .DST file: File is smaller than the 512-byte Tajima header.",
    );
  }

  // 1. Parse 512-byte ASCII header
  const headerText = new TextDecoder("ascii").decode(bytes.subarray(0, 512));
  const laMatch = headerText.match(/LA:([^\r\n]+)/);
  const rawLabel = laMatch ? laMatch[1].trim() : "";
  const cleanFileName = fileName.replace(/\.(dst|emb|pes|exp)$/i, "");
  const name = rawLabel && rawLabel.length >= 2 ? rawLabel : cleanFileName;

  // 2. Decode 3-byte stitch records starting at byte 512
  interface RawSegment {
    needle: number;
    subpaths: Array<Array<[number, number]>>;
    stitchCount: number;
  }

  const segments: RawSegment[] = [
    { needle: 1, subpaths: [[]], stitchCount: 0 },
  ];

  let curX = 0;
  let curY = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  let normalStitches = 0;
  let jumpCount = 0;
  let trimCount = 0;
  let consecutiveJumps = 0;
  let currentNeedle = 1;

  for (let offset = 512; offset + 2 < bytes.length; offset += 3) {
    const b0 = bytes[offset];
    const b1 = bytes[offset + 1];
    const b2 = bytes[offset + 2];

    // End of design marker
    if (b2 === 0xf3) {
      break;
    }

    const isColorChange = (b2 & 0xc0) === 0xc0;
    const isJump = !isColorChange && (b2 & 0x80) !== 0;

    const [dx, dy] = decodeDstDxDy(b0, b1, b2);
    curX += dx;
    curY += dy;

    if (isColorChange) {
      currentNeedle += 1;
      trimCount += 1;
      consecutiveJumps = 0;
      segments.push({
        needle: currentNeedle,
        subpaths: [[]],
        stitchCount: 0,
      });
      continue;
    }

    if (isJump) {
      jumpCount += 1;
      consecutiveJumps += 1;
      if (consecutiveJumps === 3) {
        trimCount += 1;
      }
      const activeSeg = segments[segments.length - 1];
      if (activeSeg.subpaths[activeSeg.subpaths.length - 1].length > 0) {
        activeSeg.subpaths.push([]);
      }
      continue;
    }

    // Normal stitch penetration
    consecutiveJumps = 0;
    normalStitches += 1;
    if (curX < minX) minX = curX;
    if (curX > maxX) maxX = curX;
    if (curY < minY) minY = curY;
    if (curY > maxY) maxY = curY;

    const activeSeg = segments[segments.length - 1];
    activeSeg.stitchCount += 1;
    activeSeg.subpaths[activeSeg.subpaths.length - 1].push([curX, curY]);
  }

  // Fallback bounds if file had no normal stitches
  if (!Number.isFinite(minX) || normalStitches === 0) {
    minX = -450;
    maxX = 450;
    minY = -300;
    maxY = 300;
  }

  const spanX = Math.max(10, maxX - minX);
  const spanY = Math.max(10, maxY - minY);
  // Each unit in .DST is 0.1mm
  const widthMm = Math.max(8, Math.round(spanX / 10));
  const heightMm = Math.max(8, Math.round(spanY / 10));

  // Normalize coordinates into [18..82] x [18..82] inside the 100x100 hoop SVG viewBox
  const targetBoxSize = 62;
  const scale = targetBoxSize / Math.max(spanX, spanY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Downsample factor if design is very dense (> 4500 stitches) so SVG DOM stays fast
  const stride =
    normalStitches > 18000
      ? 5
      : normalStitches > 9000
        ? 3
        : normalStitches > 4500
          ? 2
          : 1;

  const nonEmptySegments = segments.filter((s) => s.stitchCount > 0);
  const stitchPaths: StitchPathSegment[] = nonEmptySegments.map((seg, idx) => {
    const pathParts: string[] = [];
    for (const sub of seg.subpaths) {
      if (sub.length === 0) continue;
      for (let i = 0; i < sub.length; i++) {
        if (i !== 0 && i !== sub.length - 1 && i % stride !== 0) continue;
        const [rx, ry] = sub[i];
        const sx = Number((50 + (rx - centerX) * scale).toFixed(1));
        // Flip Y because .DST +Y is up and SVG +Y is down
        const sy = Number((50 - (ry - centerY) * scale).toFixed(1));
        pathParts.push(`${i === 0 ? "M" : "L"}${sx} ${sy}`);
      }
    }
    return {
      needle: idx + 1,
      d: pathParts.join(" "),
      stitchCount: seg.stitchCount,
    };
  });

  const colorCount = Math.max(1, stitchPaths.length);
  const colorSequence: ColorStop[] = Array.from(
    { length: colorCount },
    (_, i) => {
      const preset =
        DEFAULT_MADEIRA_PALETTE[i % DEFAULT_MADEIRA_PALETTE.length];
      return {
        needle: i + 1,
        threadCode: preset.threadCode,
        name: preset.name,
        hex: preset.hex,
      };
    },
  );

  const hoopSize = recommendHoopSize(widthMm, heightMm);
  const complexity: ParsedDstResult["complexity"] =
    widthMm > 180 || heightMm > 180
      ? "Jacket Back"
      : normalStitches > 14000
        ? "Detailed"
        : "Standard";

  // ~5.5 meters of thread (top + bobbin) per 1,000 stitches
  const estimatedThreadMeters = Math.max(
    5,
    Math.round((normalStitches / 1000) * 5.5),
  );

  return {
    name,
    headerLabel: rawLabel || name.slice(0, 16),
    stitchCount: normalStitches,
    jumpCount,
    trimCount,
    colorCount,
    widthMm,
    heightMm,
    hoopSize,
    complexity,
    colorSequence,
    stitchPaths,
    estimatedThreadMeters,
  };
}

/**
 * Generate a real binary Tajima .DST file (512-byte ASCII header + 3-byte balanced ternary stitch packets)
 * so users can test parsing, visualizing, or downloading a standards-compliant .DST file with one click.
 */
export function generateSampleDstBinary(
  preset: "crest" | "lotus" | "star" = "crest",
): {
  buffer: ArrayBuffer;
  fileName: string;
  title: string;
  clientName: string;
} {
  interface Command {
    x: number;
    y: number;
    type: "normal" | "jump" | "color_change";
  }

  const commands: Command[] = [];

  const moveJumpTo = (tx: number, ty: number) => {
    commands.push({ x: Math.round(tx), y: Math.round(ty), type: "jump" });
  };

  const stitchTo = (tx: number, ty: number) => {
    commands.push({ x: Math.round(tx), y: Math.round(ty), type: "normal" });
  };

  const colorChange = () => {
    const last = commands[commands.length - 1] ?? { x: 0, y: 0 };
    commands.push({ x: last.x, y: last.y, type: "color_change" });
  };

  let label = "TV_ROYAL_CREST";
  let fileName = "TV-Royal-Crest.dst";
  let title = "Tuong Vinh Royal Crest (DST)";
  let clientName = "Saigon Heritage Hospitality";

  if (preset === "crest") {
    // Needle 1 (Gold): Outer Shield Satin Ring (radius 42mm = 420 units)
    const outerSteps = 180;
    for (let i = 0; i <= outerSteps; i++) {
      const angle = (i / outerSteps) * Math.PI * 2;
      const r = i % 2 === 0 ? 440 : 395;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) moveJumpTo(x, y);
      else stitchTo(x, y);
    }

    // Color Change -> Needle 2 (Crimson): Inner Tatami Diamond Fill
    colorChange();
    const diamondRows = 28;
    for (let row = -diamondRows; row <= diamondRows; row++) {
      const y = row * 9;
      const halfSpan = Math.max(20, (diamondRows - Math.abs(row)) * 9.5);
      const leftX = -halfSpan;
      const rightX = halfSpan;
      if (row === -diamondRows) {
        moveJumpTo(leftX, y);
      }
      if (row % 2 === 0) {
        stitchTo(leftX, y);
        const segs = Math.max(2, Math.floor((rightX - leftX) / 35));
        for (let s = 1; s <= segs; s++) {
          stitchTo(leftX + ((rightX - leftX) * s) / segs, y);
        }
      } else {
        stitchTo(rightX, y);
        const segs = Math.max(2, Math.floor((rightX - leftX) / 35));
        for (let s = 1; s <= segs; s++) {
          stitchTo(rightX - ((rightX - leftX) * s) / segs, y);
        }
      }
    }

    // Color Change -> Needle 3 (Super White): 5-Pointed Crown Star in Center
    colorChange();
    const points = 10;
    for (let pass = 0; pass < 3; pass++) {
      const scale = 1 - pass * 0.18;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2 + Math.PI / 2;
        const r = (i % 2 === 0 ? 195 : 82) * scale;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0 && pass === 0) moveJumpTo(x, y);
        else stitchTo(x, y);
      }
    }
  } else if (preset === "lotus") {
    label = "SAIGON_LOTUS";
    fileName = "Saigon-Lotus-Medallion.dst";
    title = "Saigon Lotus Medallion (DST)";
    clientName = "District 1 Boutique Roastery";

    // Needle 1: 8-Petal Lotus Satin Outline
    const petals = 8;
    const steps = 220;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const baseR = 260 + 170 * Math.abs(Math.cos((petals * t) / 2));
      const r = i % 2 === 0 ? baseR + 18 : baseR - 18;
      const x = Math.cos(t) * r;
      const y = Math.sin(t) * r;
      if (i === 0) moveJumpTo(x, y);
      else stitchTo(x, y);
    }

    // Needle 2: Inner Ring
    colorChange();
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * Math.PI * 2;
      const r = i % 2 === 0 ? 185 : 150;
      const x = Math.cos(t) * r;
      const y = Math.sin(t) * r;
      if (i === 0) moveJumpTo(x, y);
      else stitchTo(x, y);
    }

    // Needle 3: Center Rosette
    colorChange();
    for (let i = 0; i <= 90; i++) {
      const t = (i / 90) * Math.PI * 6;
      const r = (i / 90) * 115;
      const x = Math.cos(t) * r;
      const y = Math.sin(t) * r;
      if (i === 0) moveJumpTo(x, y);
      else stitchTo(x, y);
    }
  } else {
    label = "VN_GOLD_STAR";
    fileName = "VN-Star-Emblem.dst";
    title = "Vietnam Gold Star Badge (DST)";
    clientName = "Mekong Logistics Fleet";

    // Needle 1: Circular Badge Frame (radius 45mm)
    for (let i = 0; i <= 160; i++) {
      const t = (i / 160) * Math.PI * 2;
      const r = i % 2 === 0 ? 450 : 415;
      const x = Math.cos(t) * r;
      const y = Math.sin(t) * r;
      if (i === 0) moveJumpTo(x, y);
      else stitchTo(x, y);
    }

    // Needle 2: Concentric Star Rays
    colorChange();
    for (let layer = 1; layer <= 6; layer++) {
      const factor = layer / 6;
      for (let i = 0; i <= 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + Math.PI / 2;
        const r = (i % 2 === 0 ? 340 : 135) * factor;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (layer === 1 && i === 0) moveJumpTo(x, y);
        else stitchTo(x, y);
      }
    }
  }

  // Convert absolute commands into bounded <= 121-unit relative .DST records
  const records: Array<[number, number, number]> = [];
  let curX = 0;
  let curY = 0;
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  let colorChanges = 0;

  for (const cmd of commands) {
    if (cmd.type === "color_change") {
      records.push(encodeDstRecord(0, 0, "color_change"));
      colorChanges += 1;
      continue;
    }

    let remX = cmd.x - curX;
    let remY = cmd.y - curY;

    while (Math.abs(remX) > 121 || Math.abs(remY) > 121) {
      const stepX = Math.max(-121, Math.min(121, remX));
      const stepY = Math.max(-121, Math.min(121, remY));
      records.push(encodeDstRecord(stepX, stepY, "jump"));
      curX += stepX;
      curY += stepY;
      remX = cmd.x - curX;
      remY = cmd.y - curY;
    }

    records.push(encodeDstRecord(remX, remY, cmd.type));
    curX += remX;
    curY += remY;
    if (curX < minX) minX = curX;
    if (curX > maxX) maxX = curX;
    if (curY < minY) minY = curY;
    if (curY > maxY) maxY = curY;
  }

  // End-of-file record
  records.push(encodeDstRecord(0, 0, "end"));

  // Build 512-byte Tajima ASCII header
  const headerStr = [
    `LA:${label.padEnd(16, " ").slice(0, 16)}`,
    `ST:${String(records.length).padStart(7, " ")}`,
    `CO:${String(colorChanges).padStart(3, " ")}`,
    `+X:${String(Math.round(Math.abs(maxX))).padStart(5, " ")}`,
    `-X:${String(Math.round(Math.abs(minX))).padStart(5, " ")}`,
    `+Y:${String(Math.round(Math.abs(maxY))).padStart(5, " ")}`,
    `-Y:${String(Math.round(Math.abs(minY))).padStart(5, " ")}`,
    "AX:+    0",
    "AY:+    0",
    "MX:+    0",
    "MY:+    0",
    "PD:******",
  ].join("\r") + "\r";

  const totalBytes = 512 + records.length * 3;
  const out = new Uint8Array(totalBytes);
  out.fill(0x20, 0, 512); // Pad 512-byte header with spaces
  const encodedHeader = new TextEncoder().encode(headerStr);
  out.set(encodedHeader.subarray(0, Math.min(511, encodedHeader.length)), 0);
  out[511] = 0x1a; // Standard Tajima EOF header terminator at byte 511

  let writeOffset = 512;
  for (const [b0, b1, b2] of records) {
    out[writeOffset] = b0;
    out[writeOffset + 1] = b1;
    out[writeOffset + 2] = b2;
    writeOffset += 3;
  }

  return {
    buffer: out.buffer,
    fileName,
    title,
    clientName,
  };
}

