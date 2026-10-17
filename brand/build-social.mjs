// X (Twitter) profile picture and header, built from the Truva site's tokens and logo. All text outlined.
// usage: node social.mjs <outDir>
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const require = createRequire(import.meta.url);
const opentype = require("opentype.js");
const sharp = require("C:/Users/bamig/Documents/VIBE CODE/Truva/web/node_modules/sharp");
const out = process.argv[2];
mkdirSync(out, { recursive: true });

// Site tokens (web/src/app/globals.css)
const C = {
  bg: "#F1F1EC", surface: "#E4E4DC", surface2: "#D6D6CB", ink: "#0E2B20", field: "#0E3B2A",
  lime: "#C9F04F", done: "#1E6B45", muted: "#4B5F55",
};

const fontFile = (pkg, file) => readFileSync(path.join(path.dirname(require.resolve(`${pkg}/package.json`)), "files", file)).buffer;
const bodoni = opentype.parse(fontFile("@fontsource/bodoni-moda", "bodoni-moda-latin-500-normal.woff"));
const jost = opentype.parse(fontFile("@fontsource/jost", "jost-latin-400-normal.woff"));

/** Outlined text: returns {d, w} with the baseline at y. tracking in em. */
function text(font, str, size, x, y, trackingEm = 0) {
  const glyphs = font.stringToGlyphs(str);
  const p = new opentype.Path();
  let cx = x;
  glyphs.forEach((g, i) => {
    p.extend(g.getPath(cx, y, size));
    const kern = i < glyphs.length - 1 ? font.getKerningValue(g, glyphs[i + 1]) : 0;
    cx += ((g.advanceWidth + kern) / font.unitsPerEm) * size + trackingEm * size;
  });
  return { d: p.toPathData(2), w: cx - x };
}

// The mark (brand/logo/truva-mark.svg geometry, 64-unit grid)
const SILHOUETTE = "M12 12H32V16H52V28H40V52H24V24H12Z";
const LEG = { x: 32, y: 16, w: 20, h: 12 };
const mark = (x, y, size, bg = C.ink, body = C.bg, leg = C.lime) => {
  const s = size / 64;
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect width="64" height="64" fill="${bg}"/>` +
    `<path d="${SILHOUETTE}" fill="${body}"/><rect x="${LEG.x}" y="${LEG.y}" width="${LEG.w}" height="${LEG.h}" fill="${leg}"/></g>`;
};

// ---------- profile picture: 1000 x 1000, the T sized for X's circular crop ----------
{
  const S = 1000;
  // Glyph bbox is 12..52 on the 64 grid (40 units). Make it 46% of the canvas, centred.
  const glyphPx = S * 0.46;
  const s = glyphPx / 40;
  const ox = S / 2 - 32 * s;
  const oy = S / 2 - 32 * s;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">` +
    `<rect width="${S}" height="${S}" fill="${C.ink}"/>` +
    `<g transform="translate(${ox} ${oy}) scale(${s})"><path d="${SILHOUETTE}" fill="${C.bg}"/>` +
    `<rect x="${LEG.x}" y="${LEG.y}" width="${LEG.w}" height="${LEG.h}" fill="${C.lime}"/></g></svg>\n`;
  writeFileSync(path.join(out, "x-profile.svg"), svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(out, "x-profile.png"));
}

// ---------- header: 1500 x 500 ----------
{
  const W = 1500, H = 500;
  // Mosaic band on the right, like the site's hero: 3 x 2 flat tiles, gutterless.
  const mx = 900, tw = 200, th = 250;
  const tiles = [
    [0, 0, C.field], [1, 0, C.surface2], [2, 0, C.ink],
    [0, 1, C.surface], [1, 1, C.done], [2, 1, C.field],
  ].map(([c, r, f]) => `<rect x="${mx + c * tw}" y="${r * th}" width="${tw}" height="${th}" fill="${f}"/>`).join("");
  const settled = text(bodoni, "Settled", 52, mx + tw + 22, th + 160, -0.02);
  // The mark, large, in the top-right ink tile.
  const markSize = 150;
  const theMark = mark(mx + 2 * tw + (tw - markSize) / 2, 72, markSize);

  // Headline on the axis-left: two authored lines, kept above the avatar overlap (bottom-left) and
  // inside the band mobile keeps (y 60..440).
  const l1 = text(bodoni, "Checkout you", 96, 72, 150, -0.045);
  const l2 = text(bodoni, "can verify", 96, 72, 242, -0.045);
  const sub = text(jost, "RWA checkout and settlement on BOT Chain", 28, 76, 296, 0.01);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" fill="${C.bg}"/>${tiles}` +
    `<path d="${settled.d}" fill="${C.bg}"/>${theMark}` +
    `<path d="${l1.d}" fill="${C.ink}"/><path d="${l2.d}" fill="${C.ink}"/><path d="${sub.d}" fill="${C.ink}"/></svg>\n`;
  writeFileSync(path.join(out, "x-header.svg"), svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(out, "x-header.png"));
  console.log("headline widths", Math.round(l1.w), Math.round(l2.w), "sub", Math.round(sub.w));
}

// ---------- review sheet: header as X shows it, with the avatar circle overlapping ----------
{
  const header = await sharp(path.join(out, "x-header.png")).png().toBuffer();
  const avatar = await sharp(path.join(out, "x-profile.png"))
    .resize(300, 300)
    .composite([{ input: Buffer.from('<svg width="300" height="300"><circle cx="150" cy="150" r="150" fill="#fff"/></svg>'), blend: "dest-in" }])
    .png()
    .toBuffer();
  const ring = Buffer.from('<svg width="316" height="316"><circle cx="158" cy="158" r="158" fill="#fff"/></svg>');
  await sharp({ create: { width: 1500, height: 720, channels: 3, background: "#ffffff" } })
    .composite([
      { input: header, left: 0, top: 0 },
      { input: ring, left: 40, top: 342 },
      { input: avatar, left: 48, top: 350 },
    ])
    .png()
    .toFile(path.join(out, "_x-preview.png"));
}
