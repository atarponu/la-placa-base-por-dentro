/* =====================================================================
   BOARD — generador SVG de la placa base (ATX, vista superior)
   ---------------------------------------------------------------------
   Unidades: milímetros reales. Placa ATX = 244 × 305 mm (retrato).
   Todo lo que se dibuja aquí vive en el "mundo" y se mueve con la
   cámara global (ver engine.js). Cada componente es un <g class="part">
   con data-part, data-cat y un anillo (.ring) para los estados
   idle / hover / active / focused / selected / disabled.

   Para mover un componente: cambia su entrada en PARTS (bbox) y su
   dibujo en la función draw* correspondiente.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- helpers de construcción ---------- */
  const a = (o) => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');
  const rect = (x, y, w, h, o = {}) => `<rect ${a({ x, y, width: w, height: h, ...o })}/>`;
  const circ = (cx, cy, r, o = {}) => `<circle ${a({ cx, cy, r, ...o })}/>`;
  const path = (d, o = {}) => `<path ${a({ d, ...o })}/>`;
  const text = (x, y, t, o = {}) => `<text ${a({ x, y, ...o })}>${t}</text>`;
  const range = (n) => Array.from({ length: n }, (_, i) => i);

  // RNG determinista: la placa es idéntica en cada carga
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // Desplaza una polilínea (inglete) — sirve para dibujar buses de pistas paralelas
  function offsetPolyline(pts, d) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], prev = pts[i - 1], next = pts[i + 1];
      const n = (p1, p2) => { const dx = p2[0] - p1[0], dy = p2[1] - p1[1], L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L]; };
      let nx, ny;
      if (!prev) [nx, ny] = n(p, next);
      else if (!next) [nx, ny] = n(prev, p);
      else {
        const n1 = n(prev, p), n2 = n(p, next);
        let mx = n1[0] + n2[0], my = n1[1] + n2[1];
        const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
        const cos = mx * n1[0] + my * n1[1] || 1;
        nx = mx / cos; ny = my / cos;
      }
      out.push([p[0] + nx * d, p[1] + ny * d]);
    }
    return 'M' + out.map((q) => q[0].toFixed(2) + ' ' + q[1].toFixed(2)).join(' L');
  }
  function bundle(pts, n, gap, cls = 'trace') {
    let s = '';
    for (let i = 0; i < n; i++) s += path(offsetPolyline(pts, (i - (n - 1) / 2) * gap), { class: cls });
    return s;
  }

  /* =====================================================================
     PARTS — metadatos de cada zona interactiva
     bbox: [x, y, w, h] en mm (se permiten varias cajas por componente)
     ===================================================================== */
  const PARTS = {
    socket:  { cat: 'cpu', label: 'CPU SOCKET', boxes: [[57, 29, 70, 72]] },
    vrm:     { cat: 'pwr', label: 'VRM', poly: '46,1 142,1 142,31 54,31 54,102 23,102 23,21 46,21' },
    eps:     { cat: 'pwr', label: 'CPU EPS 12V', boxes: [[24, 0, 22, 13]] },
    atx24:   { cat: 'pwr', label: 'ATX 24-PIN', boxes: [[201, 43, 18, 56]] },
    dimm:    { cat: 'mem', label: 'RAM · DIMM', boxes: [[147, 7, 39, 139]] },
    pcie1:   { cat: 'cpu', label: 'PCIe x16', boxes: [[20, 135, 94, 13]] },
    pcieaux: { cat: 'io',  label: 'PCIe x1 / x4', boxes: [[20, 154, 30, 10], [20, 200, 94, 11]] },
    m2:      { cat: 'sto', label: 'M.2', boxes: [[37, 103, 88, 27], [37, 170, 88, 27]] },
    sata:    { cat: 'sto', label: 'SATA', boxes: [[221, 178, 23, 55]] },
    pch:     { cat: 'io',  label: 'CHIPSET · PCH', boxes: [[147, 177, 52, 48]] },
    bios:    { cat: 'fw',  label: 'BIOS / UEFI', boxes: [[146, 232, 16, 16]] },
    cmos:    { cat: 'fw',  label: 'CMOS · RTC', boxes: [[87, 146, 26, 26]], circle: [100, 159, 12.6] },
    audio:   { cat: 'io',  label: 'AUDIO', boxes: [[2, 221, 43, 60]] },
    lan:     { cat: 'io',  label: 'LAN', boxes: [[24, 106, 13, 14]] },
    usbh:    { cat: 'io',  label: 'USB HEADERS', boxes: [[220, 101, 23, 14], [146, 289, 40, 13]] },
    fans:    { cat: 'pwr', label: 'FAN HEADERS', boxes: [[130, 33, 13, 8], [98, 289, 15, 13], [233, 16, 10, 16]] },
    io:      { cat: 'io',  label: 'REAR I/O', boxes: [[-1, 13, 24, 118]] },
    // conectores que no son hotspot del mapa pero sí de la escena de headers
    fpanel:  { cat: 'io',  label: 'F_PANEL', boxes: [[197, 289, 22, 13]], extra: true },
    argb:    { cat: 'io',  label: 'ARGB', boxes: [[58, 289, 15, 13]], extra: true },
    faudio:  { cat: 'io',  label: 'F_AUDIO', boxes: [[4, 289, 21, 13]], extra: true },
  };

  function bboxOf(id) {
    const p = PARTS[id];
    if (p.poly) {
      const pts = p.poly.split(' ').map((q) => q.split(',').map(Number));
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
    }
    let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
    p.boxes.forEach(([x, y, w, h]) => { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x + w); y2 = Math.max(y2, y + h); });
    return [x1, y1, x2 - x1, y2 - y1];
  }

  /* =====================================================================
     ROUTES — rutas lógicas de datos / energía (capa de diagnóstico)
     ===================================================================== */
  const ROUTES = {
    mem:     { cat: 'mem', d: 'M112 58 H160.5 M112 72 H180.5' },
    pcie16:  { cat: 'cpu', d: 'M92 100 V132 L86 141.5 H40' },
    m2a:     { cat: 'sto', d: 'M78 100 V116.5 H58' },
    dmi:     { cat: 'io',  d: 'M122 98 L146 122 V150 L158 162 H173 V190' },
    sata:    { cat: 'sto', d: 'M196 201 H212 M212 185.5 V221.5 M212 185.5 H232 M212 197.5 H232 M212 209.5 H232 M212 221.5 H232' },
    usb:     { cat: 'io',  d: 'M188 180 V150 L198 140 H231 V112 M170 222 V284 M170 284 H157 V292 M170 284 H175 V292' },
    lan:     { cat: 'io',  d: 'M150 186 H130 V133.5 H30.5 V119' },
    audio:   { cat: 'io',  d: 'M150 218 H112 L106 224 H19 V244' },
    spi:     { cat: 'fw',  d: 'M165 222 V240 H158' },
    aux:     { cat: 'io',  d: 'M150 204 H116 V159 H47 M116 205.5 H111' },
    m2b:     { cat: 'sto', d: 'M150 194 H126 V183 H100' },
    eps:     { cat: 'pwr', d: 'M35 11 V16 H72 V22' },
    vcore:   { cat: 'pwr', d: 'M72 28 V35 M92 28 V35 M112 28 V35 M52 52 H60 M52 68 H60 M52 84 H60' },
    p24ram:  { cat: 'pwr', d: 'M204 60 H186' },
    p24pch:  { cat: 'pwr', d: 'M210 98 V172 L200 182 H196' },
    p24pcie: { cat: 'pwr', d: 'M206 98 V118 L188 146 L186 150 H118 L112 144' },
    p24rtc:  { cat: 'pwr', d: 'M204 86 H190 V150 H113 V159' },
  };

  /* =====================================================================
     DIBUJO
     ===================================================================== */
  function defs() {
    return `<defs>
      <linearGradient id="gPcb" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#0d1c16"/><stop offset=".55" stop-color="#0a1612"/><stop offset="1" stop-color="#07100d"/>
      </linearGradient>
      <radialGradient id="gSheen" cx=".35" cy=".25" r=".9">
        <stop offset="0" stop-color="#9fffe0" stop-opacity=".05"/><stop offset=".6" stop-color="#9fffe0" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="gMetal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#5d676b"/><stop offset=".45" stop-color="#2e3538"/><stop offset=".7" stop-color="#434c50"/><stop offset="1" stop-color="#1f2527"/>
      </linearGradient>
      <linearGradient id="gSink" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a4245"/><stop offset="1" stop-color="#1b2022"/>
      </linearGradient>
      <linearGradient id="gSinkH" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#3a4245"/><stop offset="1" stop-color="#1b2022"/>
      </linearGradient>
      <linearGradient id="gIhs" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#b9c2c5"/><stop offset=".5" stop-color="#7d878b"/><stop offset="1" stop-color="#a7b0b3"/>
      </linearGradient>
      <linearGradient id="gSweep" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <pattern id="pVias" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r=".22" fill="#1b3a2d"/><circle cx="4" cy="4" r=".16" fill="#15302a"/>
      </pattern>
      <pattern id="pPins" width="1.05" height="1.05" patternUnits="userSpaceOnUse">
        <circle cx=".52" cy=".52" r=".26" fill="#8c7446"/>
      </pattern>
      <pattern id="pFinsV" width="2.4" height="10" patternUnits="userSpaceOnUse">
        <rect width="1.2" height="10" fill="#4b5558" opacity=".55"/>
      </pattern>
      <pattern id="pFinsH" width="10" height="2.4" patternUnits="userSpaceOnUse">
        <rect width="10" height="1.2" fill="#4b5558" opacity=".55"/>
      </pattern>
      <pattern id="pGroove" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="1" height="3" fill="#ffffff" opacity=".05"/>
      </pattern>
    </defs>`;
  }

  // Pequeños SMD dispersos: dan densidad de PCB real
  function smd() {
    const zones = [[56, 102, 72, 3], [128, 30, 18, 70], [186, 10, 16, 130], [200, 102, 20, 70], [124, 150, 22, 25],
      [115, 212, 30, 20], [160, 226, 55, 55], [48, 228, 60, 50], [115, 262, 45, 24], [200, 238, 40, 45], [4, 132, 16, 90], [26, 186, 14, 12]];
    let s = '';
    zones.forEach(([x, y, w, h]) => {
      const n = Math.round((w * h) / 70);
      for (let i = 0; i < n; i++) {
        const px = x + rnd() * w, py = y + rnd() * h, v = rnd() > .5;
        const c = rnd() > .75 ? '#6b5a3c' : '#2b3432';
        s += rect(px.toFixed(1), py.toFixed(1), v ? .6 : 1.2, v ? 1.2 : .6, { fill: c, rx: .1 });
      }
    });
    return `<g class="smd">${s}</g>`;
  }

  function traces() {
    let s = '';
    s += bundle([[126, 46], [147, 46]], 12, 1.5);
    s += bundle([[126, 80], [147, 80]], 12, 1.5);
    s += bundle([[118, 100], [128, 110], [128, 131], [113, 138]], 6, 1.3);
    s += bundle([[124, 100], [146, 122], [146, 150], [158, 162], [165, 162], [165, 177]], 8, 1.1);
    s += bundle([[199, 196], [221, 196]], 12, 1.3);
    s += bundle([[172, 225], [172, 289]], 7, 1.3);
    s += bundle([[147, 208], [118, 208], [113, 205]], 5, 1.1);
    s += bundle([[147, 214], [60, 214], [48, 226]], 6, 1.1);
    s += bundle([[201, 56], [187, 56]], 10, 2.2);
    s += bundle([[201, 88], [187, 88]], 8, 1.4);
    s += bundle([[23, 128], [23, 150], [20, 154]], 4, 1.2);
    s += bundle([[12, 131], [12, 220]], 5, 1.4);
    s += bundle([[48, 150], [86, 150]], 5, 1.1);
    s += bundle([[199, 214], [212, 227], [212, 286]], 5, 1.2);
    s += bundle([[113, 225], [113, 286]], 4, 1.4);
    s += bundle([[62, 228], [62, 286]], 3, 1.4);
    return `<g class="traces">${s}</g>`;
  }

  function silk() {
    return `<g class="silk">
      ${rect(1.2, 1.2, 241.6, 302.6, { rx: 1.6, class: 'silk-edge' })}
      ${text(160, 300.5, 'ATX · REV 1.0 · 8L PCB', { class: 'silk-t' })}
      ${text(60, 27.5, 'CPU', { class: 'silk-t' })}
      ${text(149, 150.5, 'DDR5_A1 A2 B1 B2', { class: 'silk-t' })}
      ${text(22, 152.5, 'PCIEX16_1', { class: 'silk-t' })}
      ${text(22, 199, 'PCIEX16_2 (x4)', { class: 'silk-t' })}
      ${text(22, 168, 'PCIEX1_1', { class: 'silk-t' })}
      ${text(38, 102, 'M.2_1 (CPU)', { class: 'silk-t' })}
      ${text(38, 169, 'M.2_2 (PCH)', { class: 'silk-t' })}
      ${text(203, 41.5, 'ATX_PWR', { class: 'silk-t' })}
      ${text(224, 176, 'SATA6G', { class: 'silk-t' })}
      ${text(88, 174.5, 'BAT · CR2032', { class: 'silk-t' })}
      ${text(146, 252, 'BIOS', { class: 'silk-t' })}
      ${text(199, 288, 'F_PANEL', { class: 'silk-t' })}
      ${text(147, 288, 'USB_2  USB_3', { class: 'silk-t' })}
      ${text(99, 288, 'SYS_FAN', { class: 'silk-t' })}
      ${text(58, 288, 'ARGB', { class: 'silk-t' })}
      ${text(5, 288, 'F_AUDIO', { class: 'silk-t' })}
      ${text(129, 43.8, 'CPU_FAN', { class: 'silk-t' })}
      ${path('M3 219 C 20 223 36 220 46 219 V 284', { class: 'silk-line' })}
    </g>`;
  }

  function holes() {
    return `<g class="holes">${[[140, 9], [236, 9], [236, 160], [8, 172], [8, 296], [135, 296], [236, 296], [128, 160]]
      .map(([x, y]) => circ(x, y, 2.4, { class: 'hole-ring' }) + circ(x, y, 1.5, { class: 'hole' })).join('')}</g>`;
  }

  /* ---------- componentes ---------- */
  const ring = (id) => {
    const p = PARTS[id], pad = 1.2;
    if (p.poly) return `<polygon class="ring" points="${p.poly}"/><polygon class="hit" points="${p.poly}"/>`;
    if (p.circle) return circ(...p.circle, { class: 'ring' }) + circ(...p.circle, { class: 'hit' });
    return p.boxes.map(([x, y, w, h]) =>
      rect(x - pad, y - pad, w + pad * 2, h + pad * 2, { rx: 1.4, class: 'ring' }) + rect(x - pad, y - pad, w + pad * 2, h + pad * 2, { class: 'hit' })).join('');
  };

  const drawers = {
    socket() {
      return `${rect(58, 30, 68, 70, { rx: 2, fill: 'url(#gMetal)', class: 'mt' })}
        ${rect(61, 33, 62, 64, { rx: 1.2, fill: '#0c0e0f' })}
        ${rect(64, 36, 56, 58, { fill: 'url(#pPins)' })}
        ${rect(82, 55, 20, 20, { fill: '#0c0e0f' })}
        ${rect(61, 33, 62, 64, { rx: 1.2, fill: 'none', stroke: '#6f7a7e', 'stroke-width': .5 })}
        ${path('M127 34 V 98 M127 98 h -4', { stroke: '#8f9a9e', 'stroke-width': 1.4, 'stroke-linecap': 'round', fill: 'none' })}
        ${circ(127, 34, 1.4, { fill: '#8f9a9e' })}
        ${path('M58 34 l3 -3 M126 34 l-3 -3', { stroke: '#d9e3df', 'stroke-width': .5, opacity: .6 })}
        <g class="fx fx-sweep"><rect x="44" y="36" width="16" height="58" fill="url(#gSweep)" opacity=".7"/></g>
        <g class="inst inst-cpu">
          ${rect(66, 40, 52, 50, { rx: 2.5, fill: 'url(#gIhs)' })}
          ${rect(69, 43, 46, 44, { rx: 2, fill: 'none', stroke: '#e8eef0', 'stroke-width': .4, opacity: .6 })}
          ${text(73, 83, 'CPU', { class: 'ihs-t' })}
          ${path('M70 88 l3 0 l-3 -3 z', { fill: '#e2c16b' })}
        </g>`;
    },
    vrm() {
      let chokes = '';
      range(8).forEach((i) => { chokes += `<g class="choke" style="--i:${i}">${rect(55 + i * 10.5, 22, 7, 7, { rx: .8, fill: '#2a2f31', stroke: '#4a5357', 'stroke-width': .35 })}${text(56.3 + i * 10.5, 26.8, 'R22', { class: 'choke-t' })}</g>`; });
      range(6).forEach((i) => { chokes += `<g class="choke" style="--i:${i + 8}">${rect(45, 36 + i * 10.5, 7, 7, { rx: .8, fill: '#2a2f31', stroke: '#4a5357', 'stroke-width': .35 })}${text(45.6 + 0, 40.8 + i * 10.5, 'R22', { class: 'choke-t' })}</g>`; });
      let caps = '';
      range(9).forEach((i) => { caps += circ(54 + i * 10.5, 31.8, 1.1, { fill: '#1d2123', stroke: '#6d777b', 'stroke-width': .3 }); });
      return `${rect(47, 2, 94, 18, { rx: 1.5, fill: 'url(#gSink)' })}
        ${rect(49, 4, 90, 14, { fill: 'url(#pFinsV)' })}
        ${path('M47 3.5 H141', { stroke: '#8d989c', 'stroke-width': .4, opacity: .7 })}
        ${rect(24, 22, 19, 78, { rx: 1.5, fill: 'url(#gSinkH)' })}
        ${rect(26, 24, 15, 74, { fill: 'url(#pFinsH)' })}
        ${path('M25 23 V99', { stroke: '#8d989c', 'stroke-width': .4, opacity: .7 })}
        ${chokes}${caps}
        ${rect(136, 23, 5, 5, { fill: '#111', stroke: '#555', 'stroke-width': .3 })}`;
    },
    eps() {
      let pins = '';
      range(4).forEach((c) => range(2).forEach((r) => { pins += rect(27.3 + c * 4.2, 2.6 + r * 4.2, 3, 3, { rx: .6, class: 'pin', style: `--i:${c * 2 + r}` }); }));
      return rect(25, 1, 19.5, 10.5, { rx: .8, fill: '#e9ece8', opacity: .12 }) + rect(25, 1, 19.5, 10.5, { rx: .8, fill: 'none', stroke: '#c9d1cd', 'stroke-width': .4 }) + pins;
    },
    atx24() {
      let pins = '';
      range(12).forEach((r) => range(2).forEach((c) => { pins += rect(203.6 + c * 4.9, 45.5 + r * 4.2, 3.2, 3, { rx: .6, class: 'pin', style: `--i:${r * 2 + c}` }); }));
      return rect(202, 44, 14, 53, { rx: 1, fill: '#e9ece8', opacity: .12 }) + rect(202, 44, 14, 53, { rx: 1, fill: 'none', stroke: '#c9d1cd', 'stroke-width': .4 }) + pins;
    },
    dimm() {
      let s = '';
      [150, 158, 170, 178].forEach((x, i) => {
        s += `<g class="slot" data-slot="${['A1', 'A2', 'B1', 'B2'][i]}">
          ${rect(x, 12, 5, 130, { rx: .6, fill: i % 2 ? '#26292b' : '#141718' })}
          ${rect(x + 2.1, 14, .8, 126, { fill: '#050606' })}
          ${rect(x + 2.1, 70, .8, 2.6, { fill: i % 2 ? '#26292b' : '#141718' })}
          <g class="latch">${rect(x - .4, 8, 5.8, 5, { rx: .6, fill: '#3b4245' })}</g>
          <g class="latch">${rect(x - .4, 141, 5.8, 5, { rx: .6, fill: '#3b4245' })}</g>
          ${rect(x + 2.1, 14, .8, 126, { class: 'fx fx-seq-bar', style: `--i:${i}` })}
          <g class="inst inst-ram" data-i="${i}">
            ${rect(x - .6, 14.5, 6.2, 125, { rx: .8, fill: '#1c2124', stroke: '#6c767a', 'stroke-width': .35 })}
            ${rect(x + .4, 16, 4.2, 122, { fill: 'url(#pGroove)' })}
            ${rect(x + 2.5 - .3, 20, .6, 110, { fill: '#a995ff', opacity: .35, class: 'ram-led' })}
          </g>
        </g>`;
      });
      return s;
    },
    pcie1() {
      return `${rect(22, 137, 89, 9, { rx: .8, fill: 'url(#gMetal)' })}
        ${rect(23.2, 138.2, 86.6, 6.6, { rx: .5, fill: '#121516' })}
        ${rect(24, 140.9, 84, 1.2, { fill: '#040505' })}
        ${rect(33.4, 139.5, 1.4, 4, { fill: '#121516' })}
        ${rect(108, 136, 5, 11, { rx: .8, fill: '#3a4245' })}
        ${rect(24, 140.9, 84, 1.2, { class: 'fx fx-contact' })}
        <g class="inst inst-gpu">
          ${rect(3, 129, 240, 23, { rx: 2.5, fill: '#121517', stroke: '#6b777b', 'stroke-width': .45 })}
          ${rect(3, 149, 240, 3, { fill: '#1a3a2b' })}
          ${rect(6, 131.5, 234, 16.5, { fill: 'url(#pFinsV)', opacity: .9 })}
          ${[40, 110, 180].map((x) => path(`M${x} 131.5 V148`, { stroke: '#b98b4e', 'stroke-width': 1.2, opacity: .7 })).join('')}
          ${rect(206, 125.5, 16, 5, { rx: .6, fill: '#e9ece8', opacity: .2, stroke: '#c9d1cd', 'stroke-width': .3 })}
          ${text(122, 135.6, 'GPU · PCIe x16', { class: 'ihs-t sm' })}
        </g>`;
    },
    pcieaux() {
      return `${rect(22, 156, 26, 6.4, { rx: .6, fill: '#1b1f21' })}
        ${rect(23.5, 158.6, 23, 1.2, { fill: '#040505' })}
        ${rect(22, 202, 89, 7, { rx: .6, fill: '#1b1f21' })}
        ${rect(23.2, 204.9, 86.6, 1.2, { fill: '#040505' })}
        ${rect(33.4, 203.4, 1.4, 4, { fill: '#1b1f21' })}
        ${range(4).map((i) => rect(36 + i * 3.2, 204.9, 2.2, 1.2, { class: 'fx fx-blink', style: `--i:${i}` })).join('')}
        ${rect(24, 158.6, 3, 1.2, { class: 'fx fx-blink', style: '--i:0' })}
        <g class="inst inst-wifi">
          ${rect(19, 154, 32, 10.5, { rx: 1.2, fill: '#1c2326', stroke: '#6b777b', 'stroke-width': .4 })}
          ${rect(19, 162.8, 32, 1.7, { fill: '#1a3a2b' })}
          ${text(21, 160.6, 'RED Wi-Fi · x1', { class: 'ihs-t sm' })}
        </g>`;
    },
    m2() {
      const nand = (x, y) => range(4).map((i) => rect(x + 8 + i * 17, y + 4, 13, 13, { rx: .6, fill: '#15191a', stroke: '#434b4e', 'stroke-width': .3, class: 'nand', style: `--i:${i}` })).join('');
      return `${rect(39, 106, 6, 22, { rx: .6, fill: '#151819' })}
        ${circ(120, 117, 1.8, { fill: '#8a7447' })}
        <g class="inst inst-nvme">
          ${rect(44, 106, 78, 22, { rx: 1.2, fill: '#10271c', stroke: '#2c5a44', 'stroke-width': .35 })}
          ${nand(44, 106)}
          ${text(46, 126.4, 'NVMe 2280', { class: 'ihs-t sm' })}
        </g>
        <g class="m2-hs">
          ${rect(38, 104.5, 86, 25, { rx: 2, fill: 'url(#gSink)' })}
          ${rect(41, 107, 80, 20, { fill: 'url(#pGroove)' })}
          ${path('M42 106 H121', { stroke: '#8d989c', 'stroke-width': .4, opacity: .8 })}
          ${text(44, 119.8, 'M.2 · PCIe', { class: 'hs-t' })}
        </g>
        ${rect(39, 172, 6, 22, { rx: .6, fill: '#151819' })}
        ${circ(120, 183, 1.8, { fill: '#8a7447' })}
        ${rect(38, 171, 86, 25, { rx: 2, fill: 'url(#gSink)' })}
        ${rect(41, 173.5, 80, 20, { fill: 'url(#pGroove)' })}
        ${path('M42 172.5 H121', { stroke: '#8d989c', 'stroke-width': .4, opacity: .8 })}
        ${text(44, 186, 'M.2', { class: 'hs-t' })}
        <g class="fx fx-flash">${range(4).map((i) => rect(52 + i * 17, 110, 13, 13, { rx: .6, style: `--i:${i}` })).join('')}</g>`;
    },
    sata() {
      return range(4).map((i) => `${rect(222, 181 + i * 12, 20, 9, { rx: .8, fill: '#161a1c', stroke: '#4a5357', 'stroke-width': .35 })}
        ${path(`M225 ${184 + i * 12} h13 v3 h-11 z`, { fill: '#050606' })}
        ${rect(225, 184 + i * 12, 13, 3, { class: 'fx fx-seq', style: `--i:${i}` })}`).join('');
    },
    pch() {
      return `${rect(150, 180, 46, 42, { rx: 2, fill: 'url(#gSink)' })}
        ${rect(153, 183, 40, 36, { fill: 'url(#pGroove)' })}
        ${path('M150 181 H196', { stroke: '#8d989c', 'stroke-width': .5, opacity: .8 })}
        ${path('M160 208 l6 -6 l6 6 l6 -6 l6 6', { stroke: '#8d989c', 'stroke-width': .6, fill: 'none', opacity: .5 })}
        ${text(155, 192, 'PCH', { class: 'hs-t' })}
        <g class="fx fx-scan">${rect(151, 181, 44, 1.6, { fill: '#fff', opacity: .5 })}</g>`;
    },
    bios() {
      return `${rect(149, 235, 10, 10, { rx: .6, fill: '#121415', stroke: '#434b4e', 'stroke-width': .3 })}
        ${range(4).map((i) => rect(147.4, 236 + i * 2.4, 1.6, .9, { fill: '#8d989c' }) + rect(159, 236 + i * 2.4, 1.6, .9, { fill: '#8d989c' })).join('')}
        ${circ(150.6, 236.6, .5, { fill: '#8d989c' })}
        <g class="fx fx-flicker">${range(6).map((i) => rect(150.5 + (i % 3) * 2.4, 239 + Math.floor(i / 3) * 2.6, 1.6, 1.6, { style: `--i:${i}` })).join('')}</g>`;
    },
    cmos() {
      return `${circ(100, 159, 11, { fill: '#1a1e20', stroke: '#48514f', 'stroke-width': .5 })}
        ${circ(100, 159, 10, { fill: 'url(#gIhs)' })}
        ${circ(100, 159, 8.6, { fill: 'none', stroke: '#e8eef0', 'stroke-width': .3, opacity: .6 })}
        ${text(94.3, 160.4, 'CR2032', { class: 'bat-t' })}
        ${text(97.8, 155.5, '+', { class: 'bat-t' })}
        <g class="fx fx-rot"><path d="M100 159 V151.2" stroke="#1d2a25" stroke-width=".32" stroke-linecap="round"/></g>`;
    },
    audio() {
      let caps = '';
      [[30, 232], [36, 232], [30, 262], [36, 262], [8, 266], [14, 266]].forEach(([x, y]) => { caps += circ(x, y, 2.6, { fill: '#b89a55', stroke: '#6d5a2f', 'stroke-width': .35 }) + circ(x, y, 1, { fill: '#6d5a2f' }); });
      return `${rect(12, 238, 12, 12, { rx: .6, fill: '#121415', stroke: '#434b4e', 'stroke-width': .3 })}
        ${text(13.5, 245, 'CODEC', { class: 'chip-t' })}
        ${caps}
        <g class="fx fx-eq">${range(5).map((i) => rect(13 + i * 2.2, 253, 1.3, 6, { style: `--i:${i}` })).join('')}</g>`;
    },
    lan() {
      return `${rect(25, 107, 11, 11, { rx: .6, fill: '#121415', stroke: '#434b4e', 'stroke-width': .3 })}
        ${text(26.4, 113.6, '2.5G', { class: 'chip-t' })}
        <g class="fx fx-led">${circ(27.5, 116, .8, { class: 'led-a' })}${circ(33.5, 116, .8, { class: 'led-b' })}</g>`;
    },
    usbh() {
      let s = rect(222, 103, 19, 9.5, { rx: .8, fill: '#15191b', stroke: '#4a5357', 'stroke-width': .35 });
      range(10).forEach((i) => { s += rect(223.3 + i * 1.75, 104.6, .9, .9, { class: 'pin', style: `--i:${i}` }) + rect(223.3 + i * 1.75, 109.6, .9, .9, { class: 'pin', style: `--i:${i}` }); });
      [148, 166].forEach((x) => {
        s += rect(x, 291, 16, 8.5, { rx: .6, fill: '#15191b', stroke: '#4a5357', 'stroke-width': .35 });
        range(5).forEach((i) => { s += rect(x + 1.6 + i * 2.8, 292.6, 1.2, 1.2, { class: 'pin', style: `--i:${i}` }) + rect(x + 1.6 + i * 2.8, 296, 1.2, 1.2, { class: 'pin', style: `--i:${i}` }); });
      });
      return s;
    },
    fans() {
      const hdr = (x, y, vert) => {
        let s = rect(x, y, vert ? 6 : 11, vert ? 12 : 5.5, { rx: .5, fill: '#e9ece8', opacity: .14 }) + rect(x, y, vert ? 6 : 11, vert ? 12 : 5.5, { rx: .5, fill: 'none', stroke: '#c9d1cd', 'stroke-width': .35 });
        range(4).forEach((i) => { s += vert ? rect(x + 2.3, y + 1.3 + i * 2.6, 1.3, 1.3, { class: 'pin', style: `--i:${i}` }) : rect(x + 1.3 + i * 2.6, y + 2.1, 1.3, 1.3, { class: 'pin', style: `--i:${i}` }); });
        return s;
      };
      // mini ventilador (sólo visible al pasar/seleccionar): marco, aro, rotor que gira y su cable al header
      const fan = (cx, cy, wx, wy) => `<g class="fx fx-fan">
          <path class="fan-wire" d="M${cx} ${cy} L${wx} ${wy}"/>
          <g transform="translate(${cx} ${cy})">
            <rect x="-4.4" y="-4.4" width="8.8" height="8.8" rx="1.4" class="fan-frame"/>
            <circle r="3.7" class="fan-ring"/>
            <g class="fan-rotor"><circle r="3.5" fill="transparent"/>
              ${range(5).map((i) => { const a = i * 72 * Math.PI / 180, r = (x, y) => `${(x * Math.cos(a) - y * Math.sin(a)).toFixed(2)} ${(x * Math.sin(a) + y * Math.cos(a)).toFixed(2)}`;
                return `<path d="M0 0 C ${r(1.2, -1.2)}, ${r(2.9, -1.6)}, ${r(3.3, -.6)} C ${r(2.6, .2)}, ${r(1.3, .5)}, 0 0 Z" class="fan-blade"/>`; }).join('')}
              <circle r="1.05" class="fan-hub"/>
              <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.1s" repeatCount="indefinite"/></g>
          </g></g>`;
      return hdr(131, 34.5) + hdr(100, 292) + hdr(235, 18, true) + fan(136.5, 25.5, 136.5, 34.5) + fan(105.5, 282.5, 105.5, 292) + fan(227, 24, 235, 24);
    },
    io() {
      let s = `${path('M0 14 H18 L22 18 V126 L18 130 H0 Z', { fill: '#1a1f21', stroke: '#59656a', 'stroke-width': .5 })}
        ${path('M3 18 H17 L19 20 V124 L17 126 H3 Z', { fill: 'url(#pFinsH)', opacity: .7 })}`;
      // puertos vistos desde arriba (sobresalen del borde)
      [[16, 8], [27, 9], [39, 12], [55, 8], [66, 12], [81, 8], [92, 10], [105, 14]].forEach(([y, h], i) => {
        s += rect(-1.5, y, 5, h, { rx: .5, fill: '#2d3437', stroke: '#7b878b', 'stroke-width': .3 }) + rect(-1.5, y, 5, h, { rx: .5, class: 'fx fx-seq', style: `--i:${i}` });
      });
      return s;
    },
    fpanel() {
      let s = rect(198, 290.5, 20, 9.5, { rx: .6, fill: '#15191b', stroke: '#4a5357', 'stroke-width': .35 });
      range(5).forEach((i) => { s += rect(199.8 + i * 3.6, 292.2, 1.3, 1.3, { class: 'pin', style: `--i:${i}` }) + rect(199.8 + i * 3.6, 296.6, 1.3, 1.3, { class: 'pin', style: `--i:${i}` }); });
      return s;
    },
    argb() {
      let s = rect(60, 292, 11, 5.5, { rx: .5, fill: '#15191b', stroke: '#4a5357', 'stroke-width': .35 });
      range(3).forEach((i) => { s += rect(61.6 + i * 3.2, 294.1, 1.3, 1.3, { class: 'pin', style: `--i:${i}` }); });
      return s;
    },
    faudio() {
      let s = rect(6, 290.5, 17, 9.5, { rx: .6, fill: '#15191b', stroke: '#4a5357', 'stroke-width': .35 });
      range(5).forEach((i) => { s += rect(7.6 + i * 3.1, 292.2, 1.2, 1.2, { class: 'pin', style: `--i:${i}` }) + rect(7.6 + i * 3.1, 296.6, 1.2, 1.2, { class: 'pin', style: `--i:${i}` }); });
      return s;
    },
  };

  function parts() {
    // orden de pintado: primero lo bajo, después disipadores/lo alto
    const order = ['cmos', 'bios', 'audio', 'lan', 'sata', 'usbh', 'fans', 'fpanel', 'argb', 'faudio', 'atx24', 'eps', 'dimm', 'pcieaux', 'm2', 'pch', 'socket', 'vrm', 'io', 'pcie1'];
    return order.map((id) => {
      const p = PARTS[id];
      return `<g class="part" id="part-${id}" data-part="${id}" data-cat="${p.cat}" role="button" tabindex="-1" aria-label="${p.label}">
        <g class="body">${drawers[id]()}</g>${ring(id)}</g>`;
    }).join('');
  }

  function routes() {
    return Object.entries(ROUTES).map(([id, r]) =>
      `<g class="route" data-route="${id}" data-cat="${r.cat}">${path(r.d, { class: 'r-base' })}${path(r.d, { class: 'r-flow' })}</g>`).join('');
  }

  // Etiquetas técnicas sobre la placa (intro y cierre)
  const CALLOUTS = [
    ['socket', 92, 34, 112, 16, 'CPU_SOCKET'],
    ['dimm', 181, 20, 200, 6, 'DDR5 · DIMM'],
    ['vrm', 34, 60, 8, 50, 'VRM'],
    ['pcie1', 60, 141, 70, 124, 'PCIe x16'],
    ['m2', 100, 183, 128, 166, 'M.2'],
    ['pch', 173, 201, 190, 236, 'PCH'],
    ['sata', 242, 190, 256, 176, 'SATA'],
    ['atx24', 216, 70, 232, 58, 'ATX_24P'],
    ['io', 11, 40, -4, 26, 'REAR_I/O'],
    ['cmos', 100, 159, 84, 146, 'RTC'],
  ];
  /* Capa térmica (escena "La placa en vivo"): manchas de calor con degradados
     cuyo color/temperatura se cambian desde JS (World.svg .th-* stop). */
  const THERMAL = {
    cpu:  { shape: 'circle', cx: 92, cy: 65, r: 40, lab: [92, 22] },
    vrm1: { shape: 'ellipse', cx: 94, cy: 15, rx: 52, ry: 16 },
    vrm2: { shape: 'ellipse', cx: 36, cy: 62, rx: 16, ry: 44, lab: [12, 58] },
    gpu:  { shape: 'ellipse', cx: 123, cy: 140, rx: 118, ry: 22, lab: [214, 128] },
    pch:  { shape: 'circle', cx: 173, cy: 201, r: 28, lab: [173, 233] },
    m2:   { shape: 'ellipse', cx: 81, cy: 117, rx: 44, ry: 15, lab: [40, 99] },
    ram:  { shape: 'ellipse', cx: 167, cy: 77, rx: 24, ry: 66, lab: [167, 8] },
  };
  function thermal() {
    const grads = Object.keys(THERMAL).map((k) => `<radialGradient id="th-${k}" class="th-grad"><stop offset="0" stop-color="#ffd25a"/><stop offset=".45" stop-color="#e2453b" stop-opacity=".8"/><stop offset="1" stop-color="#3b1a7a" stop-opacity="0"/></radialGradient>`).join('');
    const blobs = Object.entries(THERMAL).map(([k, b]) => b.shape === 'circle'
      ? circ(b.cx, b.cy, b.r, { fill: `url(#th-${k})`, class: 'th-blob', 'data-k': k })
      : `<ellipse cx="${b.cx}" cy="${b.cy}" rx="${b.rx}" ry="${b.ry}" fill="url(#th-${k})" class="th-blob" data-k="${k}"/>`).join('');
    const labs = Object.entries(THERMAL).filter(([, b]) => b.lab).map(([k, b]) => text(b.lab[0], b.lab[1], '—', { class: 'th-lab', 'data-k': k, 'text-anchor': 'middle' })).join('');
    return `<g class="thermal"><defs>${grads}</defs>
      <rect x="0" y="0" width="244" height="305" rx="3" class="th-base"/>${blobs}${labs}</g>`;
  }

  function callouts() {
    return `<g class="callouts">${CALLOUTS.map(([id, x1, y1, x2, y2, t], i) => {
      const right = x2 >= x1;
      return `<g class="co" data-part="${id}" data-cat="${PARTS[id].cat}" style="--i:${i}">
        ${circ(x1, y1, .9, { class: 'co-dot' })}
        ${path(`M${x1} ${y1} L${x2} ${y2} H${x2 + (right ? 16 : -16)}`, { class: 'co-line' })}
        ${text(x2 + (right ? 1 : -1), y2 - 1.6, t, { class: 'co-t', 'text-anchor': right ? 'start' : 'end' })}
      </g>`;
    }).join('')}</g>`;
  }

  /* =====================================================================
     API pública
     ===================================================================== */
  const VB = { x: -8, y: -8, w: 260, h: 321 };

  function svg() {
    return `<svg id="mb" class="mb" viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="false" role="img" aria-label="Placa base ATX ilustrada">
      ${defs()}
      <style>${(window.BOARD_CSS || '').replace(/</g, '\\3c ')}</style>
      <g class="pcb">
        ${path('M3 0 H241 A3 3 0 0 1 244 3 V302 A3 3 0 0 1 241 305 H3 A3 3 0 0 1 0 302 V3 A3 3 0 0 1 3 0 Z', { class: 'pcb-shape', fill: 'url(#gPcb)' })}
        ${rect(0, 0, 244, 305, { rx: 3, fill: 'url(#pVias)' })}
        ${rect(0, 0, 244, 305, { rx: 3, fill: 'url(#gSheen)' })}
      </g>
      ${traces()}${smd()}${silk()}${holes()}
      <g class="parts">${parts()}</g>
      <g class="routes">${routes()}</g>
      ${thermal()}
      ${callouts()}
      ${path('M3 0 H241 A3 3 0 0 1 244 3 V302 A3 3 0 0 1 241 305 H3 A3 3 0 0 1 0 302 V3 A3 3 0 0 1 3 0 Z', { class: 'pcb-outline' })}
    </svg>`;
  }

  window.Board = { svg, PARTS, ROUTES, VB, bboxOf, THERMAL };
})();
