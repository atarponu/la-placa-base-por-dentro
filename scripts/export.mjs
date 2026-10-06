// Exporta cada escena (estado final de su animación) a PNG 1920×1080 y a presentation.pdf.
// Uso: node scripts/export.mjs      (requiere Node ≥ 20 y un navegador Chromium instalado)
import { chromium } from 'playwright-core';
import { PDFDocument } from 'pdf-lib';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'exports/slides'); mkdirSync(outDir, { recursive: true });
const exe = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'].find((p) => p && existsSync(p));
const b = await chromium.launch({ executablePath: exe });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto('file://' + resolve(root, 'index.html#01'));
await p.waitForTimeout(800);
// ocultar la interfaz de navegación en la exportación
await p.addStyleTag({ content: '.chrome, .edit-btn, .edit-hot { display: none !important; }' });
const total = await p.evaluate(() => Deck.scenes.length);
const WAIT = { 1: 6500, 17: 8500, 21: 5200, 25: 9500 };
const pdf = await PDFDocument.create();
for (let n = 1; n <= total; n++) {
  await p.evaluate((i) => Deck.go(i - 1, { force: true }), n);
  if (n === 21) { await p.waitForTimeout(1500); await p.click('#bootPower'); }
  await p.waitForTimeout(WAIT[n] || 4800);
  const file = resolve(outDir, String(n).padStart(2, '0') + '.jpg');
  await p.screenshot({ path: file, type: 'jpeg', quality: 90 });
  const img = await pdf.embedJpg(readFileSync(file));
  pdf.addPage([1920, 1080]).drawImage(img, { x: 0, y: 0, width: 1920, height: 1080 });
  console.log('✓', n);
}
writeFileSync(resolve(root, 'exports/presentation.pdf'), await pdf.save());
await b.close();
console.log('PDF → exports/presentation.pdf');
