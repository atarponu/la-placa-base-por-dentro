// Genera screenshots/contact-sheet.png con todas las capturas en rejilla.
// Uso: node scripts/contact.mjs [--cols=4] [--from=1 --to=24] [--out=contact-sheet.png]
import { chromium } from 'playwright-core';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const opt = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const cols = +(opt.cols || 4), from = +(opt.from || 1), to = +(opt.to || 99);
const dir = resolve(root, opt.dir || 'screenshots');
const files = readdirSync(dir).filter((f) => opt.dir ? f.endsWith('.png') : /^\d\d\.png$/.test(f)).filter((f) => { const n = parseInt(f, 10); return n >= from && n <= to; }).sort();
const W = 480, H = 270;
const html = `<html><body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${W}px);gap:6px;padding:6px;font:12px monospace;color:#ccc">
${files.map((f) => `<div style="position:relative"><img src="file://${dir}/${f}" width="${W}" height="${H}"><span style="position:absolute;left:6px;top:4px;background:#000a;padding:2px 5px">${f.replace('.png','')}</span></div>`).join('')}</body></html>`;
const tmp = resolve(dir, '_sheet.html');
writeFileSync(tmp, html);
const exe = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', process.env.CHROME_PATH].find((p) => p && existsSync(p));
const b = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
const rows = Math.ceil(files.length / cols);
const p = await b.newPage({ viewport: { width: cols * (W + 6) + 6, height: rows * (H + 6) + 6 } });
await p.goto('file://' + tmp);
await p.waitForTimeout(500);
await p.screenshot({ path: resolve(dir, opt.out || 'contact-sheet.png') });
await b.close();
console.log('ok', files.length);
