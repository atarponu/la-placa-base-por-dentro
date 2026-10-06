// QA de interacción: ejecuta clics / teclado / drag en las escenas clave y captura estados.
// Uso: node scripts/qa-interact.mjs
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'screenshots/interact'); mkdirSync(out, { recursive: true });
const exe = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'].find((p) => p && existsSync(p));
const b = await chromium.launch({ executablePath: exe });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const go = async (n, w = 2600) => { await p.evaluate((i) => Deck.go(i - 1, { force: true }), n); await p.waitForTimeout(w); };
const shot = (n) => p.screenshot({ path: resolve(out, n + '.png') });
const center = (sel) => p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, sel);
const log = (...a) => console.log('·', ...a);

await p.goto('file://' + resolve(root, 'index.html#01'));
await p.waitForTimeout(800);

// 02 · nodo
await go(2); await p.click('.node[data-k="ram"]'); await p.waitForTimeout(900); await shot('02-ram');
log('02 info:', await p.textContent('.wi-a'));

// 03 · mapa: hover + click + ESC
await go(3);
let [x, y] = await center('#part-vrm .ring'); await p.mouse.move(x, y); await p.waitForTimeout(500); await shot('03-hover');
await p.mouse.click(x, y); await p.waitForTimeout(1400); await shot('03-zoom');
log('03 panel:', await p.textContent('.mp-name'));
await p.keyboard.press('Escape'); await p.waitForTimeout(1200);
log('03 panel hidden after ESC:', await p.evaluate(() => document.querySelector('#mapPanel').hidden));
await p.click('.lg[data-part="m2"]'); await p.waitForTimeout(1300); await shot('03-legend-m2');
await p.click('.mp-go'); await p.waitForTimeout(1500);
log('03 → detalle, escena ahora:', await p.evaluate(() => Deck.current.dataset.id));

// 04 · factor de forma
await go(4); await p.click('#formSeg [data-f="itx"]'); await p.waitForTimeout(1300); await shot('04-itx');
log('04 itx:', await p.textContent('#fsW'), await p.textContent('#fsSlots'));

// 05 · PGA
await go(5); await p.click('#sockSeg [data-t="pga"]'); await p.waitForTimeout(1800); await shot('05-pga');

// 06 · bloque IMC
await go(6); await p.click('.blk[data-b="imc"]'); await p.waitForTimeout(700); await shot('06-imc');

// 07 · inductor
await go(7); await p.click('.pc[data-p="inductor"]'); await p.waitForTimeout(700); await shot('07-inductor');

// 09 · single
await go(9); await p.click('#chanSeg [data-m="1"]'); await p.waitForTimeout(900); await shot('09-single');

// 10 · antes
await go(10); await p.click('#pchSeg [data-a="old"]'); await p.waitForTimeout(1400); await shot('10-old');

// 11 · x4 gen5
await go(11, 3400); await p.click('#laneSeg [data-w="4"]'); await p.click('#genSeg [data-g="5"]'); await p.waitForTimeout(700); await shot('11-x4g5');
log('11:', await p.textContent('.pcie-gen'));

// 15 · RJ45
await go(15); await p.click('.port[data-p="rj45"]'); await p.waitForTimeout(600); await shot('15-rj45');

// 16 · F_PANEL
await go(16); await p.click('.hd[data-k="fpanel"]'); await p.waitForTimeout(700); await shot('16-fpanel');

// 17 · consola completa
await go(17, 8000); await shot('17-done');

// 18 · enchufado
await go(18); await p.click('#cmosSeg [data-p="on"]'); await p.waitForTimeout(800); await shot('18-on');

// 19 · GPU
await go(19); await p.click('#enBtns [data-k="gpu"]'); await p.waitForTimeout(900); await shot('19-gpu');

// 20 · SATA
await go(20); await p.click('#dataBtns [data-k="sata"]'); await p.waitForTimeout(900); await shot('20-sata');

// 21 · POWER → paso 5 → click en paso 3
await go(21); await p.click('#bootPower'); await p.waitForTimeout(3400 * 1 + 1500); await shot('21-step2');
await p.click('.bn[data-i="4"]'); await p.waitForTimeout(1500); await shot('21-step5');

// 22 · la placa en vivo
await go(22, 3500); await p.click('#loadSeg [data-l="render"]'); await p.click('#tglThermal'); await p.waitForTimeout(1800); await shot('22-termica');
{ const r = await p.evaluate(() => { const e = document.querySelector('#liveDrag').getBoundingClientRect(); return [e.x + e.width / 2, e.y + e.height / 2]; }); await p.mouse.move(r[0], r[1]); await p.mouse.down(); await p.mouse.move(r[0] + 160, r[1] + 120, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(400); await shot('22-giro'); }
log('22 vatios:', await p.textContent('#wattNow'), '·', await p.textContent('#wattWall'));

// 23 · construir: drag correcto + error por clic
await go(23);
[x, y] = await center('.it[data-k="cpu"]'); const [tx, ty] = await center('#part-socket .ring');
await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x + 40, y + 10, { steps: 4 }); await p.mouse.move(tx, ty, { steps: 12 }); await p.waitForTimeout(200); await shot('23-dragging'); await p.mouse.up();
await p.waitForTimeout(800); await shot('23-cpu-ok');
log('23 after drag:', await p.textContent('.br-v'));
await p.click('.it[data-k="nvme"]'); await p.waitForTimeout(300);
[x, y] = await center('#part-sata .ring'); await p.mouse.click(x, y); await p.waitForTimeout(500); await shot('23-nvme-bad');
log('23 wrong:', await p.textContent('.br-v'));

// 24 · quiz: completa con respuestas
await go(24);
const hot = async (id) => { const [hx, hy] = await center(`#part-${id} .ring`); await p.mouse.click(hx, hy); };
const next = async () => { await p.waitForTimeout(400); await p.click('.qnext'); await p.waitForTimeout(600); };
await hot('pch'); await shot('24-q1'); await next();
await p.click('.qopts button[data-j="0"]'); await next();
await p.click('.qopts button[data-v="0"]'); await next();
await p.click('.qopts button[data-j="1"]'); await shot('24-q4-wrong'); await next();
for (const j of [0, 1, 2, 3]) await p.click(`.qopts.order button[data-j="${j}"]`); await next();
await hot('pcie1'); await next();
for (const j of [0, 1, 2, 3]) { await p.click(`.ml button[data-j="${j}"]`); await p.click(`.mr button[data-j="${j}"]`); } await shot('24-match'); await next();
await p.click('.qopts button[data-v="0"]'); await next();
await p.click('.qopts button[data-j="0"]'); await next();
await p.click('.qopts button[data-v="0"]'); await p.waitForTimeout(400); await p.click('.qnext'); await p.waitForTimeout(1600); await shot('24-result');
log('24 score:', await p.textContent('.qs-n'));

// 25 · final completo
await go(25, 9000); await shot('25-full');

// teclado: flechas / Home / End
await p.keyboard.press('Home'); await p.waitForTimeout(300); const a = await p.evaluate(() => Deck.i);
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); const b2 = await p.evaluate(() => Deck.i);
await p.keyboard.press('End'); await p.waitForTimeout(300); const c = await p.evaluate(() => Deck.i);
log('teclado Home/→/End:', a, b2, c);
console.log(errs.length ? 'ERRORES:\n' + errs.join('\n') : 'sin errores de página');
await b.close();
