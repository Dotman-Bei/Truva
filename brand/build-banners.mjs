// Post banners (1600 x 900, 16:9) in the Truva brand. All text outlined.
// usage: node banners.mjs <outDir>
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const require = createRequire(import.meta.url);
const opentype = require("opentype.js");
const sharp = require("C:/Users/bamig/Documents/VIBE CODE/Truva/web/node_modules/sharp");
const out = process.argv[2];
mkdirSync(out, { recursive: true });

const C = {
  bg: "#F1F1EC", surface: "#E4E4DC", surface2: "#D6D6CB", ink: "#0E2B20", field: "#0E3B2A",
  lime: "#C9F04F", done: "#1E6B45", muted: "#4B5F55",
};
const fontFile = (pkg, file) => readFileSync(path.join(path.dirname(require.resolve(`${pkg}/package.json`)), "files", file)).buffer;
const bodoni = opentype.parse(fontFile("@fontsource/bodoni-moda", "bodoni-moda-latin-500-normal.woff"));
const jost = opentype.parse(fontFile("@fontsource/jost", "jost-latin-400-normal.woff"));
const jostMed = opentype.parse(fontFile("@fontsource/jost", "jost-latin-500-normal.woff"));

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
const SILHOUETTE = "M12 12H32V16H52V28H40V52H24V24H12Z";
const mark = (x, y, size) =>
  `<g transform="translate(${x} ${y}) scale(${size / 64})"><rect width="64" height="64" fill="${C.ink}"/>` +
  `<path d="${SILHOUETTE}" fill="${C.bg}"/><rect x="32" y="16" width="20" height="12" fill="${C.lime}"/></g>`;

const W = 1600, H = 900, COL = 1120; // text area 0..1120, tile column 1120..1600
const BANNERS = {
  pr: { l1: "Officially launched", l2: "on BOT Chain Mainnet", sub: "ERC-3643 checkout and settlement, chain 677", word: "Mainnet" },
  thread: { l1: "How a checkout", l2: "settles on-chain", sub: "Eligibility, intent, payment, delivery. A technical thread.", word: "Settled" },
  failclosed: { l1: "Truva fails", l2: "closed", sub: "An unknown answer is treated as a no.", word: "Closed" },
  receipt: { l1: "A receipt,", l2: "not a deed", sub: "Verified transactions, never a claim of ownership.", word: "Receipt" },
  gas: { l1: "A full suite", l2: "for 0.102 BOT", sub: "Proxies on BOT Chain’s T-REX 4.1.3 and ONCHAINID 2.2.1", word: "0.102" },
  health: { l1: "Status you", l2: "can query", sub: "/api/health checks storage and chain, live.", word: "Healthy" },
  issuers: { l1: "Built for", l2: "ERC-3643 issuers", sub: "Bring your suite. Every step verified on BOT Chain.", word: "Issuers" },
};

const sizes = {};
for (const [name, b] of Object.entries(BANNERS)) {
  // Headline: two authored lines, sized so the longer line fits the text column.
  let size = 120;
  const fit = () => Math.max(text(bodoni, b.l1, size, 0, 0, -0.04).w, text(bodoni, b.l2, size, 0, 0, -0.04).w);
  while (fit() > COL - 180 && size > 70) size -= 2;
  sizes[name] = size;
  const top = 300;
  const l1 = text(bodoni, b.l1, size, 96, top, -0.04);
  const l2 = text(bodoni, b.l2, size, 96, top + size * 0.98, -0.04);
  const sub = text(jost, b.sub, 34, 100, top + size * 0.98 + 92, 0.01);
  const site = text(jostMed, "truva-smoky.vercel.app", 28, 96 + 64 + 22, H - 96 + 9, 0.01);

  // Tile column: 2 x 3, gutterless, like the site's hero mosaic.
  const tw = (W - COL) / 2, th = H / 3;
  const cells = [
    [0, 0, C.field], [1, 0, C.ink],
    [0, 1, C.surface2], [1, 1, C.surface],
    [0, 2, C.done], [1, 2, C.field],
  ].map(([c, r, f]) => `<rect x="${COL + c * tw}" y="${r * th}" width="${tw}" height="${th}" fill="${f}"/>`).join("");
  const wordSize = b.word.length > 6 ? 46 : 54;
  const word = text(bodoni, b.word, wordSize, COL + 26, 3 * th - 34, -0.02);
  const bigMark = mark(COL + tw + (tw - 150) / 2, (th - 150) / 2, 150);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" fill="${C.bg}"/>${cells}${bigMark}<path d="${word.d}" fill="${C.bg}"/>` +
    `<path d="${l1.d}" fill="${C.ink}"/><path d="${l2.d}" fill="${C.ink}"/><path d="${sub.d}" fill="${C.ink}"/>` +
    `${mark(96, H - 96 - 64 + 20, 64)}<path d="${site.d}" fill="${C.muted}"/></svg>\n`;
  writeFileSync(path.join(out, `post-${name}.svg`), svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(out, `post-${name}.png`));
}
console.log("headline sizes", sizes);

// Contact sheet for review
const names = Object.keys(BANNERS);
const thumbs = await Promise.all(names.map((n) => sharp(path.join(out, `post-${n}.png`)).resize(560).png().toBuffer()));
await sharp({ create: { width: 1160, height: Math.ceil(names.length / 2) * 335, channels: 3, background: "#ffffff" } })
  .composite(thumbs.map((t, i) => ({ input: t, left: (i % 2) * 580 + 10, top: Math.floor(i / 2) * 335 + 10 })))
  .png()
  .toFile(path.join(out, "_sheet.png"));
