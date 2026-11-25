/**
 * Zero-dependency ISO/IEC 18004 QR Code Model 2 (Byte mode, ECC Level M) SVG generator.
 * Supports payloads up to 213 UTF-8 bytes (Versions 1–10), covering Stellar StrKeys (56 chars)
 * and standard BIP39 mnemonics.
 *
 * @license Apache-2.0
 */

// Version 1..10 specs for ECC Level M: [totalCodewords, ecCodewordsPerBlock, numBlocks, alignmentCenters]
interface VersionSpec {
  version: number;
  size: number;
  dataCodewords: number;
  ecPerBlock: number;
  blocks: number;
  align: number[];
}

const VERSIONS_M: VersionSpec[] = [
  { version: 1, size: 21, dataCodewords: 16, ecPerBlock: 10, blocks: 1, align: [] },
  { version: 2, size: 25, dataCodewords: 28, ecPerBlock: 16, blocks: 1, align: [6, 18] },
  { version: 3, size: 29, dataCodewords: 44, ecPerBlock: 26, blocks: 1, align: [6, 22] },
  { version: 4, size: 33, dataCodewords: 64, ecPerBlock: 18, blocks: 2, align: [6, 26] },
  { version: 5, size: 37, dataCodewords: 86, ecPerBlock: 24, blocks: 2, align: [6, 30] },
  { version: 6, size: 41, dataCodewords: 108, ecPerBlock: 16, blocks: 4, align: [6, 34] },
  { version: 7, size: 45, dataCodewords: 124, ecPerBlock: 18, blocks: 4, align: [6, 22, 38] },
  { version: 8, size: 49, dataCodewords: 154, ecPerBlock: 22, blocks: 4, align: [6, 24, 42] },
  { version: 9, size: 53, dataCodewords: 182, ecPerBlock: 22, blocks: 5, align: [6, 26, 46] },
  { version: 10, size: 57, dataCodewords: 216, ecPerBlock: 26, blocks: 5, align: [6, 28, 50] },
];

// GF(256) with primitive polynomial 0x11d
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255]!;
  }
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a]! + GF_LOG[b]!]!;
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = GF_EXP[i]!;
    for (let j = 0; j < poly.length; j++) {
      next[j] = (next[j]! ^ poly[j]!) & 0xff;
      next[j + 1] = (next[j + 1]! ^ gfMul(poly[j]!, factor)) & 0xff;
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGeneratorPoly(ecCount);
  const rem = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i]! ^ rem[0]!;
    rem.copyWithin(0, 1);
    rem[ecCount - 1] = 0;
    for (let j = 0; j < ecCount; j++) {
      rem[j] = rem[j]! ^ gfMul(gen[j + 1]!, factor);
    }
  }
  return rem;
}

function encodeDataCodewords(payload: Uint8Array, spec: VersionSpec): Uint8Array {
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  // Mode indicator: Byte (0100)
  pushBits(0b0100, 4);
  // Character count indicator: 8 bits for versions 1..9, 16 bits for version 10+
  const countBits = spec.version <= 9 ? 8 : 16;
  pushBits(payload.length, countBits);

  for (let i = 0; i < payload.length; i++) {
    pushBits(payload[i]!, 8);
  }

  const maxBits = spec.dataCodewords * 8;
  // Terminator (up to 4 zero bits)
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const out = new Uint8Array(spec.dataCodewords);
  const byteCount = bits.length / 8;
  for (let i = 0; i < byteCount; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j]!;
    }
    out[i] = b;
  }

  // Pad bytes alternating 0xEC, 0x11
  let padToggle = true;
  for (let i = byteCount; i < spec.dataCodewords; i++) {
    out[i] = padToggle ? 0xec : 0x11;
    padToggle = !padToggle;
  }

  return out;
}

function interleaveBlocks(data: Uint8Array, spec: VersionSpec): Uint8Array {
  const totalCodewords = spec.dataCodewords + spec.ecPerBlock * spec.blocks;
  const shortBlockLen = Math.floor(spec.dataCodewords / spec.blocks);
  const numLongBlocks = spec.dataCodewords % spec.blocks;
  const numShortBlocks = spec.blocks - numLongBlocks;

  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;

  for (let b = 0; b < spec.blocks; b++) {
    const len = b < numShortBlocks ? shortBlockLen : shortBlockLen + 1;
    const block = data.subarray(offset, offset + len);
    offset += len;
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, spec.ecPerBlock));
  }

  const out = new Uint8Array(totalCodewords);
  let idx = 0;
  const maxDataLen = shortBlockLen + (numLongBlocks > 0 ? 1 : 0);

  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < spec.blocks; b++) {
      const blk = dataBlocks[b]!;
      if (i < blk.length) {
        out[idx++] = blk[i]!;
      }
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (let b = 0; b < spec.blocks; b++) {
      out[idx++] = ecBlocks[b]![i]!;
    }
  }

  return out;
}

function formatBits(mask: number): number {
  // ECC Level M = 00
  const data = (0b00 << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function versionBits(version: number): number {
  let rem = version;
  for (let i = 0; i < 12; i++) {
    rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  }
  return (version << 12) | rem;
}

export interface QrMatrix {
  size: number;
  modules: Uint8Array; // 1 = dark, 0 = light, row-major
}

export function encodeQrMatrix(text: string): QrMatrix {
  const payload = new TextEncoder().encode(text);
  const spec = VERSIONS_M.find((v) => {
    const headerBytes = v.version <= 9 ? 2 : 3;
    return payload.length + headerBytes <= v.dataCodewords;
  });

  if (!spec) {
    throw new RangeError("QR payload exceeds maximum capacity");
  }

  const data = encodeDataCodewords(payload, spec);
  const codewords = interleaveBlocks(data, spec);

  const size = spec.size;
  const modules = new Uint8Array(size * size);
  const isFunc = new Uint8Array(size * size);

  const setFunc = (x: number, y: number, dark: boolean) => {
    modules[y * size + x] = dark ? 1 : 0;
    isFunc[y * size + x] = 1;
  };

  // Finder patterns + separators
  const drawFinder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const dark = dist !== 2 && dist !== 4;
        setFunc(x, y, dark);
      }
    }
  };
  drawFinder(3, 3);
  drawFinder(size - 4, 3);
  drawFinder(3, size - 4);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunc(i, 6, i % 2 === 0);
    setFunc(6, i, i % 2 === 0);
  }

  // Alignment patterns
  for (const cy of spec.align) {
    for (const cx of spec.align) {
      if (isFunc[cy * size + cx]) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const dist = Math.max(Math.abs(dx), Math.abs(dy));
          setFunc(cx + dx, cy + dy, dist !== 1);
        }
      }
    }
  }

  // Reserve format info areas + dark module
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setFunc(8, i, false);
      setFunc(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setFunc(size - 1 - i, 8, false);
    if (i < 7) setFunc(8, size - 1 - i, false);
  }
  setFunc(8, size - 8, true); // Dark module

  // Version info for version >= 7
  if (spec.version >= 7) {
    const vBits = versionBits(spec.version);
    for (let i = 0; i < 18; i++) {
      const bit = ((vBits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunc(a, b, bit);
      setFunc(b, a, bit);
    }
  }

  // Place data bits in zig-zag columns
  let bitIdx = 0;
  const totalBits = codewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (isFunc[y * size + x]) continue;
        let dark = false;
        if (bitIdx < totalBits) {
          dark = ((codewords[bitIdx >>> 3]! >>> (7 - (bitIdx & 7))) & 1) === 1;
          bitIdx++;
        }
        modules[y * size + x] = dark ? 1 : 0;
      }
    }
  }

  // Apply Mask 0 ((x + y) % 2 === 0) — clean, fast, reliable for Level M
  const mask = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!isFunc[y * size + x] && (x + y) % 2 === 0) {
        const idx = y * size + x;
        modules[idx] = modules[idx]! ^ 1;
      }
    }
  }

  // Write format info
  const fBits = formatBits(mask);
  for (let i = 0; i <= 5; i++) setFunc(8, i, ((fBits >>> i) & 1) === 1);
  setFunc(8, 7, ((fBits >>> 6) & 1) === 1);
  setFunc(8, 8, ((fBits >>> 7) & 1) === 1);
  setFunc(7, 8, ((fBits >>> 8) & 1) === 1);
  for (let i = 9; i < 15; i++) setFunc(14 - i, 8, ((fBits >>> i) & 1) === 1);

  for (let i = 0; i < 8; i++) setFunc(size - 1 - i, 8, ((fBits >>> i) & 1) === 1);
  for (let i = 8; i < 15; i++) setFunc(8, size - 15 + i, ((fBits >>> i) & 1) === 1);
  setFunc(8, size - 8, true);

  return { size, modules };
}

/**
 * Convert QR matrix into a compact SVG `<path>` string (with 4-module quiet zone).
 */
export function qrToSvgPath(matrix: QrMatrix, quietZone = 4): { viewBoxSize: number; d: string } {
  const { size, modules } = matrix;
  const parts: string[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modules[y * size + x]) {
        parts.push(`M${x + quietZone},${y + quietZone}h1v1h-1z`);
      }
    }
  }
  return {
    viewBoxSize: size + quietZone * 2,
    d: parts.join(""),
  };
}
