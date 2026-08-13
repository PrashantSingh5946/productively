/**
 * Acceptance check: text ≥4.5:1, large text / UI glyphs ≥3:1 — verified for
 * every accent preset in both themes.
 *
 *   node scripts/check-contrast.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const out = mkdtempSync(join(tmpdir(), 'productively-tokens-'));
// Run the installed compiler directly rather than through `npx`: on Windows the
// launcher is `npx.cmd`, which execFileSync will not resolve, and the whole
// check suite fell over before it compiled anything.
execFileSync(
  process.execPath,
  ['node_modules/typescript/bin/tsc', 'src/tokens.ts', '--ignoreConfig', '--outDir', out, '--module', 'es2020', '--target', 'es2020', '--skipLibCheck'],
  { stdio: 'inherit' }
);

const mod = await import(pathToFileURL(join(out, 'tokens.js')).href);
const { buildPalette, contrast, ACCENT_KEYS } = mod;

/** Flatten an `rgba()` token over an opaque backdrop so it can be measured. */
function flatten(color, bg) {
  const m = /rgba?\(([^)]+)\)/.exec(color);
  if (!m) return color;
  const [r, g, b, a = 1] = m[1].split(',').map(Number);
  const k = bg.replace('#', '');
  const [kr, kg, kb] = [0, 2, 4].map((i) => parseInt(k.slice(i, i + 2), 16));
  const mix = (f, t) => Math.round(f * a + t * (1 - a));
  return '#' + [mix(r, kr), mix(g, kg), mix(b, kb)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

const TEXT = 4.5;
const GLYPH = 3;

let failures = 0;
for (const mode of ['light', 'dark']) {
  for (const accent of ACCENT_KEYS) {
    const p = buildPalette(accent, mode);
    const tint = flatten(p.accentTintTo, p.card);
    const checks = [
      ['ink on card', p.ink, p.card, TEXT],
      ['ink on paper', p.ink, p.paper, TEXT],
      ['secondary on card', p.text, p.card, TEXT],
      ['muted on card', p.muted, p.card, GLYPH],
      ['accent text on tint', p.accentText, tint, TEXT],
      ['accent icon on tint', p.accentIcon, tint, GLYPH],
      ['on-accent on fill', p.accentOn, p.accentTo, TEXT],
      ['dock idle on card', p.dockIdle, p.card, GLYPH],
      ['success on card', p.good, p.card, GLYPH],
      ['overrun on card', p.over, p.card, GLYPH],
      ['info on info chip', p.info, flatten(p.infoBg, p.card), TEXT],
    ];
    for (const [name, fg, bg, min] of checks) {
      const ratio = contrast(fg, bg);
      const ok = ratio >= min;
      if (!ok) failures++;
      if (!ok || process.env.VERBOSE) {
        console.log(
          `${ok ? 'ok  ' : 'FAIL'} ${mode.padEnd(5)} ${accent.padEnd(7)} ${name.padEnd(20)} ${ratio.toFixed(2)} (min ${min})`
        );
      }
    }
  }
}

console.log(failures ? `\n${failures} contrast failure(s)` : '\ncontrast: all presets pass in light and dark');
process.exit(failures ? 1 : 0);
