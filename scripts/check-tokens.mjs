/**
 * Acceptance check: no raw hex in screen code, and no module-scope style object
 * that freezes a token at import time.
 *
 * The token layer (src/tokens.ts) is the one file allowed to name colours.
 * Everything else must resolve through C / G / SHADOW / TASK_TONES / IDENTITY,
 * and must read them during render — the token objects are re-filled in place
 * when the accent or theme changes, so a captured value goes stale.
 *
 *   node scripts/check-tokens.mjs
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const ALLOW_HEX = new Set(['src/tokens.ts']);
const TOKEN_REF = /\b(?:C|G|SHADOW|TASK_TONES)\.\w+/;

// globSync hands back native separators, so on Windows every path arrived as
// `src\tokens.ts` and missed the allow-list — the token layer reported itself
// as 106 violations.
const files = globSync('{app,src}/**/*.{ts,tsx}')
  .map((f) => f.split('\\').join('/'))
  .sort();
const problems = [];

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');

  if (!ALLOW_HEX.has(file)) {
    lines.forEach((line, i) => {
      if (/['"]#[0-9A-Fa-f]{3,8}['"]/.test(line)) {
        problems.push([file, i + 1, `raw hex — use a token: ${line.trim().slice(0, 72)}`]);
      }
      if (/\bshadow(Color|Opacity|Radius|Offset)\b/.test(line)) {
        problems.push([file, i + 1, `legacy shadow prop — use SHADOW.* via boxShadow`]);
      }
    });
  }

  // Module-scope `const NAME = { … }` / `= [ … ]` that mentions a token.
  const re = /^const ([A-Za-z_$][\w$]*)(?::[^=]+)? = (\{|\[)$/gm;
  let m;
  while ((m = re.exec(src))) {
    const closer = m[2] === '{' ? /^\};?$/m : /^\];?/m;
    closer.lastIndex = 0;
    const rest = src.slice(m.index + m[0].length);
    const end = rest.search(m[2] === '{' ? /^\}/m : /^\]/m);
    const body = end === -1 ? rest : rest.slice(0, end);
    if (TOKEN_REF.test(body)) {
      const line = src.slice(0, m.index).split('\n').length;
      problems.push([
        file,
        line,
        `module-scope '${m[1]}' captures a token — make it a factory: const ${m[1]} = () => (…)`,
      ]);
    }
  }
}

for (const [file, line, msg] of problems) console.log(`${file}:${line}  ${msg}`);
console.log(
  problems.length
    ? `\n${problems.length} token violation(s)`
    : `\ntokens: ${files.length} files clean`
);
process.exit(problems.length ? 1 : 0);
