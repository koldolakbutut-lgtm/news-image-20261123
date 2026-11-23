// News image entry for make.fun competition news-image-20261123.
// Draws a one-page newspaper front page summing up the world news of
// Monday 23 November 2026, using only the Node.js standard library.
// Run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The program is deterministic: two runs write identical bytes.
// Output: /output/entry.png (or $MAKEFUN_OUTPUT_DIR/entry.png),
// a 1024x1024 PNG well under the 1 MiB limit.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

type RGB = [number, number, number];

// ---------- CRC32 (PNG chunks) ----------
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE.push(c >>> 0);
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(width: number, height: number, rgb: Uint8Array): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2 = RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter: none
    raw.set(rgb.subarray(y * width * 3, (y + 1) * width * 3), y * (1 + width * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Canvas: a plain RGB pixel buffer ----------
const px = new Uint8Array(W * H * 3);
function setPixel(x: number, y: number, c: RGB): void {
  // All callers may pass fractional coordinates (panel centres are x + w/2
  // with an odd panel width); a typed array silently drops writes at a
  // non-integer index, so floor here, once, for every shape and glyph.
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}
function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPixel(xx, yy, c);
  }
}
function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let yy = -r; yy <= r; yy++) {
    for (let xx = -r; xx <= r; xx++) {
      if (xx * xx + yy * yy <= r * r) setPixel(cx + xx, cy + yy, c);
    }
  }
}
function drawLine(x0: number, y0: number, x1: number, y1: number, c: RGB, thick = 1): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const r = Math.max(1, Math.floor(thick / 2));
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + (dx * i) / steps);
    const y = Math.round(y0 + (dy * i) / steps);
    fillCircle(x, y, r, c);
  }
}
function fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    const edges: Array<[number, number, number, number]> = [
      [x0, y0, x1, y1],
      [x1, y1, x2, y2],
      [x2, y2, x0, y0],
    ];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
      }
    }
    if (xs.length >= 2) {
      const lo = Math.floor(Math.min(...xs));
      const hi = Math.ceil(Math.max(...xs));
      for (let x = lo; x <= hi; x++) setPixel(x, y, c);
    }
  }
}
function rectOutline(x: number, y: number, w: number, h: number, t: number, c: RGB): void {
  fillRect(x, y, w, t, c);
  fillRect(x, y + h - t, w, t, c);
  fillRect(x, y, t, h, c);
  fillRect(x + w - t, y, t, h, c);
}

// ---------- Palette ----------
const NAVY: RGB = [20, 33, 61];
const PAPER: RGB = [247, 244, 236];
const WHITE: RGB = [255, 255, 255];
const INK: RGB = [24, 28, 36];
const GOLD: RGB = [233, 180, 76];
const RED: RGB = [178, 44, 36];
const BLUE: RGB = [37, 99, 168];
const TEAL: RGB = [15, 130, 124];
const ORANGE: RGB = [214, 110, 44];
const GREEN: RGB = [46, 125, 72];
const GREY: RGB = [96, 102, 114];
const LIGHTBLUE: RGB = [120, 170, 220];

// ---------- 5x7 bitmap font (uppercase, digits, punctuation) ----------
// Each glyph is 7 rows of 5 pixels; '1' is ink, '0' is empty.
const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
};
const FONT2: Record<string, string[]> = {
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
};
const GLYPHS: Record<string, string[]> = { ...FONT, ...FONT2 };

function drawChar(ch: string, x: number, y: number, scale: number, c: RGB): void {
  const g = GLYPHS[ch];
  if (!g) return;
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === '1') fillRect(x + col * scale, y + r * scale, scale, scale, c);
    }
  }
}
function textWidth(text: string, scale: number): number {
  return text.length * 6 * scale - scale;
}
function drawText(text: string, x: number, y: number, scale: number, c: RGB, align: 'left' | 'center' = 'left'): void {
  let sx = x;
  if (align === 'center') sx = x - Math.floor(textWidth(text, scale) / 2);
  for (let i = 0; i < text.length; i++) drawChar(text[i], sx + i * 6 * scale, y, scale, c);
}

// ---------- Flat icons, one per story (drawn, not pasted) ----------
// cx, cy = centre of the icon zone; s = rough half-size in pixels.
function iconShip(cx: number, cy: number, s: number, c: RGB): void {
  // Hull.
  fillTriangle(cx - s, cy + 6, cx + s, cy + 6, cx + s - 14, cy + s - 6, c);
  fillTriangle(cx - s, cy + 6, cx + s - 14, cy + s - 6, cx - s + 14, cy + s - 6, c);
  // Deck cabin + mast + flag.
  fillRect(cx - 14, cy - 16, 34, 22, c);
  drawLine(cx + 2, cy - 16, cx + 2, cy - s - 2, c, 4);
  fillTriangle(cx + 2, cy - s - 2, cx + 26, cy - s + 8, cx + 2, cy - s + 16, RED);
  // Waves.
  drawLine(cx - s - 4, cy + s + 4, cx - s + 22, cy + s + 4, LIGHTBLUE, 4);
  drawLine(cx - s + 18, cy + s + 14, cx + s + 4, cy + s + 14, LIGHTBLUE, 4);
}
function iconCapitol(cx: number, cy: number, s: number, c: RGB): void {
  // Dome + base + columns.
  fillCircle(cx, cy - 8, 26, c);
  fillRect(cx - 26, cy - 8, 52, 10, c);
  fillRect(cx - 4, cy - 44, 8, 12, c);
  fillRect(cx - s, cy + 2, 2 * s, 10, c);
  for (const ox of [-s + 8, -14, 10, s - 16]) fillRect(cx + ox, cy + 12, 8, s - 6, c);
  fillRect(cx - s, cy + s + 2, 2 * s, 8, c);
}
function iconGlobe(cx: number, cy: number, s: number, c: RGB): void {
  fillCircle(cx, cy, s, c);
  fillCircle(cx, cy, s - 8, PAPER);
  drawLine(cx - s + 4, cy, cx + s - 4, cy, c, 3);
  drawLine(cx, cy - s + 4, cx, cy + s - 4, c, 3);
  // Red slash: no deal.
  drawLine(cx - s - 2, cy + s - 6, cx + s - 6, cy - s + 2, RED, 7);
}
function iconDrone(cx: number, cy: number, s: number, c: RGB): void {
  drawLine(cx - s, cy - s, cx + s, cy + s, c, 5);
  drawLine(cx + s, cy - s, cx - s, cy + s, c, 5);
  fillRect(cx - 18, cy - 10, 36, 20, c);
  fillCircle(cx - s, cy - s, 11, c);
  fillCircle(cx + s, cy - s, 11, c);
  fillCircle(cx - s, cy + s, 11, c);
  fillCircle(cx + s, cy + s, 11, c);
  fillCircle(cx - s, cy - s, 5, PAPER);
  fillCircle(cx + s, cy - s, 5, PAPER);
  fillCircle(cx - s, cy + s, 5, PAPER);
  fillCircle(cx + s, cy + s, 5, PAPER);
  // Falling: small down arrow under the body.
  fillTriangle(cx - 8, cy + 18, cx + 8, cy + 18, cx, cy + 32, RED);
}
function iconStorm(cx: number, cy: number, s: number, c: RGB): void {
  fillCircle(cx - 22, cy - 6, 22, c);
  fillCircle(cx + 4, cy - 16, 26, c);
  fillCircle(cx + 26, cy - 2, 20, c);
  fillRect(cx - 42, cy - 6, 86, 18, c);
  // Lightning bolt.
  fillTriangle(cx - 2, cy + 12, cx + 16, cy + 12, cx + 2, cy + 34, GOLD);
  fillTriangle(cx + 2, cy + 34, cx + 16, cy + 12, cx + 6, cy + 52, GOLD);
  // Rain.
  drawLine(cx - s, cy + 22, cx - s - 6, cy + 40, LIGHTBLUE, 3);
  drawLine(cx + s, cy + 22, cx + s - 6, cy + 40, LIGHTBLUE, 3);
}
function iconTrophy(cx: number, cy: number, s: number, c: RGB): void {
  // Cup bowl + handles + stem + base, with a ball on top.
  fillCircle(cx, cy - s - 2, 10, c);
  fillRect(cx - s, cy - s + 8, 2 * s, 34, c);
  fillTriangle(cx - s, cy - s + 42, cx + s, cy - s + 42, cx - s + 14, cy - s + 58, c);
  fillTriangle(cx - s, cy - s + 42, cx + s - 14, cy - s + 58, cx + s, cy - s + 42, c);
  fillRect(cx - s - 12, cy - s + 12, 12, 20, c);
  fillRect(cx + s, cy - s + 12, 12, 20, c);
  fillRect(cx - 6, cy - s + 58, 12, 14, c);
  fillRect(cx - 26, cy - s + 72, 52, 10, c);
}
type IconName = 'ship' | 'capitol' | 'globe' | 'drone' | 'storm' | 'trophy';
const ICONS: Record<IconName, (cx: number, cy: number, s: number, c: RGB) => void> = {
  ship: iconShip,
  capitol: iconCapitol,
  globe: iconGlobe,
  drone: iconDrone,
  storm: iconStorm,
  trophy: iconTrophy,
};

// ---------- The six stories of 23 November 2026 ----------
// Sources: Reuters, CNN, WSJ, BBC, Al Jazeera, France 24 (see README.md).
interface Panel {
  tag: string;
  color: RGB;
  icon: IconName;
  headline: string[];
  sub: string[];
  place: string;
}
const PANELS: Panel[] = [
  {
    tag: 'WAR AT SEA', color: RED, icon: 'ship',
    headline: ['UKRAINE SINKS', 'RUSSIAN SHIP'],
    sub: ['7 DRONES SINK', 'MERKURY OFF LIBYA'],
    place: 'BENGHAZI, LIBYA',
  },
  {
    tag: 'USA', color: NAVY, icon: 'capitol',
    headline: ['DEMOCRATS WIN', 'THE HOUSE'],
    sub: ['258 SEATS, MOST', 'SINCE 1992'],
    place: 'WASHINGTON, USA',
  },
  {
    tag: 'CLIMATE', color: TEAL, icon: 'globe',
    headline: ['COP31 ENDS', 'WITH NO DEAL'],
    sub: ['TALKS FAIL OVER', 'FOSSIL FUELS'],
    place: 'ANTALYA, TURKIYE',
  },
  {
    tag: 'MIDDLE EAST', color: ORANGE, icon: 'drone',
    headline: ['IRAN DOWNS', 'US DRONE'],
    sub: ['IRAN CLAIMS IT', 'DOWNED MQ-9'],
    place: 'STRAIT OF HORMUZ',
  },
  {
    tag: 'WEATHER', color: BLUE, icon: 'storm',
    headline: ['STORM HITS', 'BRAZIL TOWN'],
    sub: ['THOUSANDS FLEE', 'TUPANCIRETA'],
    place: 'RIO GRANDE DO SUL',
  },
  {
    tag: 'SPORT', color: GOLD, icon: 'trophy',
    headline: ['ALCARAZ WINS', 'ATP FINALS'],
    sub: ['BEATS ZVEREV', '6-2, 7-6'],
    place: "MEN'S SINGLES FINAL",
  },
];

// ---------- Layout: 1024x1024 front page ----------
function drawPanel(p: Panel, x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, WHITE);
  rectOutline(x, y, w, h, 3, NAVY);
  // Tag strip.
  fillRect(x, y, w, 36, p.color);
  drawText(p.tag, x + w / 2, y + 8, 3, WHITE, 'center');
  // Icon.
  ICONS[p.icon](x + w / 2, y + 96, 44, p.color);
  // Headline, two centred lines.
  drawText(p.headline[0], x + w / 2, y + 168, 4, INK, 'center');
  drawText(p.headline[1], x + w / 2, y + 200, 4, INK, 'center');
  // Gold divider.
  fillRect(x + w / 2 - 32, y + 246, 64, 4, GOLD);
  // Sub-label, two centred lines.
  drawText(p.sub[0], x + w / 2, y + 262, 3, GREY, 'center');
  drawText(p.sub[1], x + w / 2, y + 286, 3, GREY, 'center');
  // Place line.
  drawText(p.place, x + w / 2, y + 336, 2, p.color, 'center');
  // Bottom accent bar.
  fillRect(x, y + h - 10, w, 10, p.color);
}

function main(): void {
  // Paper background.
  fillRect(0, 0, W, H, PAPER);
  // Header band.
  fillRect(0, 0, W, 140, NAVY);
  drawText('WORLD NEWS', W / 2, 24, 8, WHITE, 'center');
  drawText('MONDAY, 23 NOVEMBER 2026', W / 2, 92, 4, GOLD, 'center');
  fillRect(0, 140, W, 6, GOLD);
  // 2 rows x 3 columns of stories.
  const margin = 24;
  const gap = 12;
  const pw = 317;
  const ph = 396;
  for (let i = 0; i < PANELS.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    drawPanel(PANELS[i], margin + col * (pw + gap), 162 + row * (ph + gap), pw, ph);
  }
  // Footer: sources.
  drawText('SOURCES: REUTERS - CNN - BBC - AL JAZEERA - FRANCE 24', W / 2, 984, 2, GREY, 'center');
  // Write the image.
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outDir, { recursive: true });
  const png = encodePNG(W, H, px);
  const outPath = join(outDir, 'entry.png');
  writeFileSync(outPath, png);
  console.log(`wrote ${outPath} (${png.length} bytes, ${W}x${H})`);
}

main();
