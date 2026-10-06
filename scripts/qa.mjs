// QA visual: captura cada escena, recoge errores de consola y comprueba overflow.
// Uso:
//   node scripts/qa.mjs                → todas las escenas a 1920×1080
//   node scripts/qa.mjs 3 5 12         → sólo esas escenas
//   node scripts/qa.mjs --size=1280x720 --wait=3500
//   node scripts/qa.mjs --mobile       → viewport de móvil horizontal (844×390)
// Requiere un navegador Chromium. Busca Chrome/Brave/Edge o usa CHROME_PATH.
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const only = args.filter((a) => /^\d+$/.test(a)).map(Number);
const [W, H] = opt.mobile ? [844, 390] : (opt.size || '1920x1080').split('x').map(Number);
const wait = +(opt.wait || 3200);
const outDir = resolve(root, opt.out || 'screenshots');
mkdirSync(outDir, { recursive: true });

const candidates = [process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Chromium.app/Contents/MacOS/Chromium'].filter(Boolean);
const exe = candidates.find((p) => existsSync(p));
if (!exe) { console.error('No se encontró Chromium. Define CHROME_PATH.'); process.exit(1); }

const browser = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: opt.dpr ? +opt.dpr : 1, reducedMotion: opt.rm ? 'reduce' : 'no-preference' });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });

const url = 'file://' + resolve(root, 'index.html');
await page.goto(url + '#01');
await page.waitForTimeout(600);
const total = await page.evaluate(() => Deck.scenes.length);
const list = only.length ? only : Array.from({ length: total }, (_, i) => i + 1);
const suffix = opt.mobile ? '-mobile' : (opt.size ? '-' + opt.size : '');

for (const n of list) {
  await page.evaluate((i) => Deck.go(i - 1, { force: true }), n);
  await page.waitForTimeout(wait);
  // comprobación de desbordes: elementos de texto fuera del escenario
  const issues = await page.evaluate(() => {
    const out = [];
    const sc = Deck.current;
    sc.querySelectorAll('h1,h2,h3,p,li,button,.panel,.lede,.note').forEach((el) => {
      const r = Stage.rectOf(el);
      if (r.w === 0) return;
      if (r.x < -2 || r.y < -2 || r.x + r.w > 1922 || r.y + r.h > 1082) out.push(`fuera: ${el.tagName}.${el.className} "${el.textContent.trim().slice(0, 40)}"`);
      if (el.scrollHeight > el.clientHeight + 4 && getComputedStyle(el).overflow !== 'visible') out.push(`overflow: ${el.className}`);
    });
    return out;
  });
  const file = resolve(outDir, `${String(n).padStart(2, '0')}${suffix}.png`);
  await page.screenshot({ path: file });
  console.log(`✓ ${String(n).padStart(2, '0')}  ${file.split('/').pop()}${issues.length ? '\n   ⚠ ' + issues.join('\n   ⚠ ') : ''}`);
}
if (errors.length) console.log('\nCONSOLA:\n' + [...new Set(errors)].join('\n'));
await browser.close();
