// Truva logo generator: mark, wordmark, lockups (colour + mono), favicons and a preview sheet.
// usage: node build.mjs <outDir>
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
const require = createRequire(import.meta.url);
const opentype = require("opentype.js");
const sharp = require("C:/Users/bamig/Documents/VIBE CODE/Truva/web/node_modules/sharp");

const out = process.argv[2];
mkdirSync(out, { recursive: true });

const C = { ink: "#0E2B20", paper: "#F1F1EC", lime: "#C9F04F", black: "#000000", white: "#FFFFFF" };

// ---------- the mark: a T whose crossbar is two legs meeting on one stem ----------
// The payment leg (left) and the delivery leg (right) join on a single stem: the settled record.
// The delivery leg sits one step lower: it lands after payment. Drawn on a 16-px grid (64 units,
// every edge a multiple of 4) so it stays sharp at favicon size.
const G = {
  left: { x: 12, y: 12, w: 20, h: 12 }, // payment leg
  stem: { x: 24, y: 24, w: 16, h: 28 }, // the settled record
  right: { x: 32, y: 16, w: 20, h: 12 }, // delivery leg, one step down
};
const rect = (r, fill) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${fill}"/>`;
// The whole silhouette as one path (no seams at any scale); the delivery leg is laid over it in colour.
const SILHOUETTE = "M12 12H32V16H52V28H40V52H24V24H12Z";
const glyph = (body, leg) =>
  `<path d="${SILHOUETTE}" fill="${body}"/>` + (leg === body ? "" : rect(G.right, leg));

const svg = (w, h, inner, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">` +
  `<title>${title}</title>${inner}</svg>\n`;

const tile = (bg, body, leg) => `<rect width="64" height="64" fill="${bg}"/>` + glyph(body, leg);

// ---------- the wordmark: "Truva" in Bodoni Moda 500, outlined ----------
const font = opentype.parse(
  require("node:fs").readFileSync(
    path.join(path.dirname(require.resolve("@fontsource/bodoni-moda/package.json")), "files/bodoni-moda-latin-500-normal.woff"),
  ).buffer,
);
const FS = 100;
const tracking = -0.03 * FS;
function wordPath() {
  const glyphs = font.stringToGlyphs("Truva");
  let x = 0;
  const parts = [];
  glyphs.forEach((g, i) => {
    parts.push(g.getPath(x, 0, FS));
    const adv = (g.advanceWidth / font.unitsPerEm) * FS;
    const kern = i < glyphs.length - 1 ? (font.getKerningValue(g, glyphs[i + 1]) / font.unitsPerEm) * FS : 0;
    x += adv + kern + tracking;
  });
  const p = new opentype.Path();
  parts.forEach((q) => p.extend(q));
  const bb = p.getBoundingBox();
  return { d: p.toPathData(2), bb };
}
const W = wordPath();
const ww = Math.ceil(W.bb.x2 - W.bb.x1);
const wh = Math.ceil(W.bb.y2 - W.bb.y1);
const word = (fill, dx = 0, dy = 0) =>
  `<path transform="translate(${(dx - W.bb.x1).toFixed(2)} ${(dy - W.bb.y1).toFixed(2)})" d="${W.d}" fill="${fill}"/>`;

// Lockup: tile height = cap height of the wordmark, gap = half a tile.
function lockup(bg, body, leg, wordFill) {
  const t = wh; // tile size matches the wordmark height
  const s = t / 64;
  const gap = Math.round(t * 0.32);
  const w = t + gap + ww;
  const inner = `<g transform="scale(${s.toFixed(4)})">${tile(bg, body, leg)}</g>` + word(wordFill, t + gap, 0);
  return { w, h: t, inner };
}

const files = {
  // Marks
  "truva-mark.svg": svg(64, 64, tile(C.ink, C.paper, C.lime), "Truva"),
  "truva-mark-black.svg": svg(64, 64, tile(C.black, C.white, C.white), "Truva"),
  "truva-mark-white.svg": svg(64, 64, tile(C.white, C.black, C.black), "Truva"),
  "truva-glyph-ink.svg": svg(64, 64, glyph(C.ink, C.ink), "Truva"),
  "truva-glyph-black.svg": svg(64, 64, glyph(C.black, C.black), "Truva"),
  "truva-glyph-white.svg": svg(64, 64, glyph(C.white, C.white), "Truva"),
  // Wordmarks
  "truva-wordmark.svg": svg(ww, wh, word(C.ink), "Truva"),
  "truva-wordmark-black.svg": svg(ww, wh, word(C.black), "Truva"),
  "truva-wordmark-white.svg": svg(ww, wh, word(C.white), "Truva"),
};
for (const [name, args] of Object.entries({
  "truva-lockup.svg": [C.ink, C.paper, C.lime, C.ink],
  "truva-lockup-on-dark.svg": [C.paper, C.ink, C.ink, C.paper],
  "truva-lockup-black.svg": [C.black, C.white, C.white, C.black],
  "truva-lockup-white.svg": [C.white, C.black, C.black, C.white],
})) {
  const l = lockup(...args);
  files[name] = svg(l.w, l.h, l.inner, "Truva");
}
for (const [n, s] of Object.entries(files)) writeFileSync(path.join(out, n), s);

// ---------- favicons ----------
const markSvg = Buffer.from(files["truva-mark.svg"]);
const png = (size) => sharp(markSvg, { density: 72 * (size / 64) * 4 }).resize(size, size).png().toBuffer();
const sizes = [16, 32, 48, 180, 512];
const pngs = Object.fromEntries(await Promise.all(sizes.map(async (s) => [s, await png(s)])));
writeFileSync(path.join(out, "truva-mark-512.png"), pngs[512]);
writeFileSync(path.join(out, "apple-icon.png"), pngs[180]);
// ICO with PNG entries (16, 32, 48)
const icoSizes = [16, 32, 48];
const header = Buffer.alloc(6 + 16 * icoSizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);
let offset = header.length;
icoSizes.forEach((s, i) => {
  const b = pngs[s];
  const e = 6 + 16 * i;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(b.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += b.length;
});
writeFileSync(path.join(out, "favicon.ico"), Buffer.concat([header, ...icoSizes.map((s) => pngs[s])]));

// ---------- preview sheet (for review only) ----------
const toPng = (s, h) => sharp(Buffer.from(s), { density: 300 }).resize({ height: h }).png().toBuffer();
const cells = [
  { s: files["truva-lockup.svg"], h: 90, bg: C.paper },
  { s: files["truva-lockup-on-dark.svg"], h: 90, bg: C.ink },
  { s: files["truva-lockup-black.svg"], h: 90, bg: "#FFFFFF" },
  { s: files["truva-lockup-white.svg"], h: 90, bg: "#000000" },
];
const W2 = 1200;
const rowH = 150;
const comps = [];
let y = 0;
for (const c of cells) {
  comps.push({ input: { create: { width: W2, height: rowH, channels: 3, background: c.bg } }, left: 0, top: y });
  comps.push({ input: await toPng(c.s, c.h), left: 60, top: y + 30 });
  y += rowH;
}
// favicon strip at true pixel sizes, then 8x enlarged 16px
comps.push({ input: { create: { width: W2, height: 220, channels: 3, background: "#FFFFFF" } }, left: 0, top: y });
let x = 60;
for (const s of [16, 32, 48, 180]) {
  comps.push({ input: pngs[s], left: x, top: y + 20 });
  x += s + 40;
}
comps.push({
  input: await sharp(pngs[16]).resize(128, 128, { kernel: "nearest" }).png().toBuffer(),
  left: x + 20,
  top: y + 20,
});
for (const g of ["truva-mark-black.svg", "truva-mark-white.svg"]) {
  comps.push({ input: await toPng(files[g], 128), left: x + 180, top: y + 20 });
  x += 150;
}
y += 220;
await sharp({ create: { width: W2, height: y, channels: 3, background: "#FFFFFF" } })
  .composite(comps)
  .png()
  .toFile(path.join(out, "_preview.png"));
console.log("wordmark", ww, "x", wh, "| files:", Object.keys(files).length + 4);
