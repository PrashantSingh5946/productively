/**
 * Generates the launcher icon, the adaptive-icon layers, the splash mark and
 * the favicon.
 *
 * These were the six Expo template placeholders — the blue "A" on a
 * construction grid and a blank target — right up until a release build was
 * cut. They are generated rather than drawn so the artwork cannot drift from
 * the app: the geometry is the same `logo` glyph `src/icons.tsx` renders on the
 * App icon screen, and the colours are `IDENTITY.icons.default` from the token
 * layer, which is the tile that screen shows as "Default".
 *
 * Pure Node — no ImageMagick, no sharp, no canvas. Shapes are rasterised from a
 * signed distance field (one clean antialiased edge, no supersampling) and
 * written as PNG by hand: IHDR / IDAT / IEND, filter type 0, zlib via the
 * built-in `deflateSync`.
 *
 *   node scripts/make-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

/* ── the mark ─────────────────────────────────────────────────────────
   Lifted verbatim from `case 'logo'` in src/icons.tsx. Three stacked
   rounded bars on a 40×40 viewBox: a task list, with the middle line at
   full strength because that is the one you are on. The bounding box is
   x 7→33, y 8.5→31.5, so the mark is already centred on (20, 20) and the
   whole viewBox can be scaled about its middle. */
const LOGO_VIEWBOX = 40;
const BARS = [
  { x: 7, y: 8.5, w: 26, h: 6, r: 3, opacity: 0.38 },
  { x: 7, y: 17, w: 26, h: 6, r: 3, opacity: 1 },
  { x: 7, y: 25.5, w: 18, h: 6, r: 3, opacity: 0.62 },
];

/* ── the palette ──────────────────────────────────────────────────────
   IDENTITY.icons.default in src/tokens.ts. Kept as literals here because
   this script runs in plain Node and tokens.ts is TypeScript; the check
   below fails the build if the two ever drift apart. */
const EMBER = ['#FFA47C', '#FF7A45'];
const INK = '#241F1C';

/* ── colour ───────────────────────────────────────────────────────────── */

const hex = (s) => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];

/** sRGB is not linear; blending in it directly muddies a two-stop ramp. */
const toLinear = (c) => {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
};
const toSrgb = (n) =>
  Math.round(255 * (n <= 0.0031308 ? n * 12.92 : 1.055 * n ** (1 / 2.4) - 0.055));

const mix = (a, b, t) =>
  [0, 1, 2].map((i) => toSrgb(toLinear(a[i]) * (1 - t) + toLinear(b[i]) * t));

/* ── geometry ─────────────────────────────────────────────────────────── */

/**
 * Signed distance to a rounded rectangle, negative inside. Coverage is read
 * straight off it: a half-pixel band either side of the edge is exactly the
 * antialiasing an icon needs, and it costs one expression per pixel.
 */
function roundedRectSdf(px, py, x, y, w, h, r) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const qx = Math.abs(px - cx) - (w / 2 - r);
  const qy = Math.abs(py - cy) - (h / 2 - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

const coverage = (d) => Math.min(1, Math.max(0, 0.5 - d));

/* ── canvas ───────────────────────────────────────────────────────────── */

const canvas = (size) => ({ size, data: new Float64Array(size * size * 4) });

/** Source-over, premultiplied by hand so partial coverage composites right. */
function blend(c, i, rgb, alpha) {
  if (alpha <= 0) return;
  const dstA = c.data[i + 3];
  const outA = alpha + dstA * (1 - alpha);
  for (let k = 0; k < 3; k++) {
    c.data[i + k] = (rgb[k] * alpha + c.data[i + k] * dstA * (1 - alpha)) / outA;
  }
  c.data[i + 3] = outA;
}

/**
 * Diagonal two-stop ramp, top-left to bottom-right — the app's `diag` grads.
 * With `radius` it fills a rounded rect inset by `inset` instead of the whole
 * canvas, which is how the tile is drawn.
 */
function fillGradient(c, from, to, { radius = 0, inset = 0 } = {}) {
  const a = hex(from);
  const b = hex(to);
  const span = c.size - inset * 2;
  for (let y = 0; y < c.size; y++) {
    for (let x = 0; x < c.size; x++) {
      const alpha = radius
        ? coverage(roundedRectSdf(x + 0.5, y + 0.5, inset, inset, span, span, radius))
        : 1;
      if (alpha <= 0) continue;
      const t = (x + y) / (2 * (c.size - 1));
      blend(c, (y * c.size + x) * 4, mix(a, b, t), alpha);
    }
  }
}

/**
 * Draws the mark, its 40-unit viewBox scaled to `span` px and centred.
 * `paint` is either a flat hex or a two-stop ramp across the mark itself.
 */
function drawLogo(c, span, paint) {
  const scale = span / LOGO_VIEWBOX;
  const offset = (c.size - span) / 2;
  const flat = typeof paint === 'string';
  const a = flat ? hex(paint) : hex(paint[0]);
  const b = flat ? a : hex(paint[1]);

  // Only the rows the mark can reach — the bars stop well short of the edges.
  const y0 = Math.max(0, Math.floor(offset + BARS[0].y * scale) - 2);
  const y1 = Math.min(c.size, Math.ceil(offset + (BARS[2].y + BARS[2].h) * scale) + 2);

  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < c.size; x++) {
      // Sample at pixel centres, back in viewBox units.
      const ux = (x + 0.5 - offset) / scale;
      const uy = (y + 0.5 - offset) / scale;

      for (const bar of BARS) {
        const d = roundedRectSdf(ux, uy, bar.x, bar.y, bar.w, bar.h, bar.r) * scale;
        const alpha = coverage(d) * bar.opacity;
        if (alpha <= 0) continue;
        const t = flat ? 0 : (x + y) / (2 * (c.size - 1));
        blend(c, (y * c.size + x) * 4, flat ? a : mix(a, b, t), alpha);
      }
    }
  }
}

/* ── PNG ──────────────────────────────────────────────────────────────── */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(body.length);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([head, typed, crc]);
}

function encodePng(c) {
  /* App Review rejects an iOS app icon that carries an alpha channel, so a
     canvas that turned out fully opaque is written as truecolour without one.
     Nothing here has to remember which files those are — it falls out of the
     art. */
  const opaque = c.data.every((v, i) => i % 4 !== 3 || v >= 1);
  const channels = opaque ? 3 : 4;

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.size, 0);
  ihdr.writeUInt32BE(c.size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = opaque ? 2 : 6; // truecolour, with alpha only when it is used
  // 10–12: deflate, adaptive filtering, no interlace — all zero.

  // One filter byte (0 = none) per scanline. The art is smooth ramps and flat
  // fields; deflate handles those well enough that per-line filter search
  // would buy a few percent for a lot of code.
  const raw = Buffer.alloc(c.size * (c.size * channels + 1));
  let p = 0;
  const byte = (v) => Math.round(Math.max(0, Math.min(255, v)));
  for (let y = 0; y < c.size; y++) {
    raw[p++] = 0;
    for (let x = 0; x < c.size; x++) {
      const i = (y * c.size + x) * 4;
      for (let k = 0; k < 3; k++) raw[p++] = byte(c.data[i + k]);
      if (!opaque) raw[p++] = byte(c.data[i + 3] * 255);
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function write(name, c) {
  const png = encodePng(c);
  writeFileSync(join(ASSETS, name), png);
  const kind = png[25] === 6 ? 'RGBA' : 'RGB ';
  console.log(
    `  ${name.padEnd(30)} ${String(c.size).padStart(4)}²  ${kind}  ${(png.length / 1024).toFixed(1)} KB`
  );
}

/* ── the six ──────────────────────────────────────────────────────────── */

console.log('icons');

/* iOS and the generic app icon. Full-bleed square — every platform applies its
   own mask, so rounding it here would only round it twice. */
{
  const c = canvas(1024);
  fillGradient(c, EMBER[0], EMBER[1]);
  drawLogo(c, 1024 * 0.86, INK);
  write('icon.png', c);
}

/* Android adaptive icon, 1024 px = 108 dp. Only the middle 66 dp (626 px) is
   guaranteed to survive the launcher's mask, and the shape can be anything from
   a circle to a squircle, so the mark is scaled to sit well inside it: the
   viewBox lands at 614 px and the bars span 399 px, a little under 60% of the
   72 dp the common circle mask actually shows. */
{
  const bg = canvas(1024);
  fillGradient(bg, EMBER[0], EMBER[1]);
  write('android-icon-background.png', bg);

  const fg = canvas(1024);
  drawLogo(fg, 1024 * 0.6, INK);
  write('android-icon-foreground.png', fg);

  /* Themed icons (Android 13+). The system recolours this to the user's
     wallpaper palette and keeps the alpha, so the mark's own 38/100/62
     hierarchy survives; it must be a silhouette, never the branded orange. */
  const mono = canvas(1024);
  drawLogo(mono, 1024 * 0.6, '#000000');
  write('android-icon-monochrome.png', mono);
}

/* Splash. One asset serves both themes — app.json points the light and dark
   variants at the same file — which rules out the bare mark: the top bar is
   38% opacity, and 38% of #FFA47C over #F4F1EA paper is very nearly nothing.
   So the splash is the app's own tile, carrying its background with it. It
   reads the same on paper and on ink, and it is the icon the user just tapped.
   Proportions are `app-icon.tsx`'s exactly: a 58 px tile with RADIUS.tile = 16
   and a 36 px glyph, i.e. r/size 0.276 and glyph/size 0.62. */
{
  const c = canvas(1024);
  fillGradient(c, EMBER[0], EMBER[1], { radius: 1024 * (16 / 58) });
  drawLogo(c, 1024 * 0.62, INK);
  write('splash-icon.png', c);
}

/* Web favicon. Rendered at its final size rather than downsampled — the SDF
   antialiases at 48 px as cleanly as at 1024. */
{
  const c = canvas(48);
  fillGradient(c, EMBER[0], EMBER[1]);
  drawLogo(c, 48 * 0.86, INK);
  write('favicon.png', c);
}

console.log('\nicons: written from IDENTITY.icons.default and the `logo` glyph');
