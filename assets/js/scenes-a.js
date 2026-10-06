/* =====================================================================
   ESCENAS 01–12
   Cada escena registra:
     cam    · encuadre de la cámara sobre la placa (o función)
     world  · estado de la placa (rutas, componentes iluminados, etc.)
     enter  · timeline de entrada + interacción (dentro de gsap.context)
     leave  · limpieza extra (opcional)
     esc    · qué hace la tecla Escape (opcional)
   ===================================================================== */
(function () {
  'use strict';
  const C = window.CONTENT;
  const NS = 'http://www.w3.org/2000/svg';
  const sceneIndex = (id) => Deck.scenes.findIndex((s) => s.dataset.id === id);
  const press = (group, btn) => $$('button', group).forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
  // encuadre general de la placa, reutilizado por varias escenas
  const FULL = (sx, sy, z = 1, extra = {}) => ({ x: 122, y: 152.5, z, sx, sy, ...extra });
  const snd = (k, arg) => window.Music?.sfx(k, false, arg);
  window.SceneUtil = { sceneIndex, press, FULL, NS, snd };

  /* ===================================================================
     01 · HERO — la placa "cobra vida"
     =================================================================== */
  const HERO_CAM = { x: 122, y: 140, z: 1.12, sx: 1440, sy: 580, rx: 46, rz: -34, o: 1 };
  Deck.register('hero', {
    scrim: 'l',
    cam: HERO_CAM,
    camLive: true,
    world(W) {
      W.svg.classList.add('show-co', 'is-live');
      W.routes(['mem', 'pcie16', 'dmi', 'eps', 'vcore', 'sata', 'usb', 'm2a', 'lan']);
      W.install('.inst-cpu, .inst-ram[data-i="1"], .inst-ram[data-i="3"]');
    },
    enter(el, { first }) {
      const svg = World.svg;
      const tl = gsap.timeline();
      // Cámara: parte más lejos y empuja lentamente (push-in cinematográfico)
      World.to({ ...HERO_CAM, z: .86, rx: 54, rz: -40 }, 0);
      World.to(HERO_CAM, RM ? 0 : 9, 'power2.out', { live: true });

      // 1. silueta → 2. pistas → 3. componentes → 4. pulsos y etiquetas
      tl.from(svg.querySelector('.pcb'), { opacity: 0, duration: 1.4, ease: 'power2.out' }, .1)
        .add(M.draw(svg.querySelector('.pcb-outline'), { d: 1.8, ease: 'power2.inOut' }), 0)
        .add(M.draw($$('.trace', svg), { d: 1.6, stagger: .006, ease: 'power1.inOut' }), .5)
        .from([svg.querySelector('.smd'), svg.querySelector('.silk'), svg.querySelector('.holes')], { opacity: 0, duration: 1 }, 1)
        .from($$('.part > .body', svg), { opacity: 0, duration: .7, stagger: { each: .07, from: 'random' }, ease: 'power2.out' }, 1.2)
        .from(svg.querySelector('.routes'), { opacity: 0, duration: 1.2 }, 2.6)
        .call(() => snd('power'), null, 2.55)
        .call(() => snd('trickle'), null, 3.3)
        .from($$('.co', svg), { opacity: 0, x: -3, duration: .6, stagger: .08 }, 2.8);

      // Texto
      tl.add(M.decode($('.hero-top span', el), { d: .8 }), .3)
        .add(M.title($('.h1', el), { d: 1.3, stagger: .12 }), .6)
        .from($('.hero-sub', el), { opacity: 0, y: 20, duration: 1 }, 1.6)
        .from($$('.hero-author, .hero-board', el), { opacity: 0, duration: .8, stagger: .2 }, 2.1)
        .from($('.hero-quote', el), { opacity: 0, duration: 1.4 }, 3.4)
        .from($('.hero-quote .q-mark', el), { scaleX: 0, transformOrigin: 'left', duration: 1.2, ease: 'expo.out' }, 3.4)
        .from($$('.hero-read > div', el), { opacity: 0, x: 20, stagger: .12, duration: .6 }, 2.4)
        .from($('.hero-hint', el), { opacity: 0, duration: .8 }, 4);
      $$('.hero-read b', el).forEach((b, i) => tl.add(M.decode(b, { d: .7 }), 2.5 + i * .12));
      return tl;
    },
  });

  /* ===================================================================
     02 · ¿QUÉ ES? — el sistema nervioso
     =================================================================== */
  const WHAT_CAM = { x: 122, y: 152.5, z: .56, sx: 1290, sy: 560 };
  const WHAT_NODES = [
    { k: 'cpu', label: 'CPU', icon: 'i-cpu', cat: 'cpu', at: [1290, 150], part: 'socket', pt: [92, 36],
      a: 'Procesador ↔ socket', b: 'La placa le da energía estable y lo conecta con memoria y dispositivos.', c: 'Contactos del socket · líneas directas a RAM y PCIe' },
    { k: 'ram', label: 'RAM', icon: 'i-ram', cat: 'mem', at: [1700, 270], part: 'dimm', pt: [167, 30],
      a: 'Módulos DIMM ↔ controlador de la CPU', b: 'Memoria de trabajo: lo que se está usando ahora mismo.', c: 'Bus de memoria DDR, directo a la CPU' },
    { k: 'gpu', label: 'GPU', icon: 'i-gpu', cat: 'cpu', at: [940, 470], part: 'pcie1', pt: [30, 141],
      a: 'Tarjeta gráfica ↔ ranura PCIe x16', b: 'Genera la imagen y acelera cálculos en paralelo.', c: 'PCI Express x16 · lanes de la CPU' },
    { k: 'ssd', label: 'SSD', icon: 'i-ssd', cat: 'sto', at: [940, 720], part: 'm2', pt: [42, 183],
      a: 'Almacenamiento ↔ M.2 o SATA', b: 'Guarda datos de forma permanente: sistema, programas, archivos.', c: 'NVMe sobre PCIe (M.2) o SATA' },
    { k: 'usb', label: 'USB', icon: 'i-usb', cat: 'io', at: [1720, 640], part: 'usbh', pt: [240, 108],
      a: 'Periféricos ↔ controladores USB', b: 'Teclado, ratón, memorias, móviles… por detrás y por el frontal.', c: 'USB · controlador en chipset (o CPU)' },
    { k: 'net', label: 'RED', icon: 'i-net', cat: 'io', at: [1000, 220], part: 'lan', pt: [30, 107],
      a: 'Controlador Ethernet / Wi-Fi ↔ chipset', b: 'Conecta el equipo a la red local e Internet.', c: 'Controlador de red unido por una lane PCIe' },
    { k: 'audio', label: 'AUDIO', icon: 'i-audio', cat: 'io', at: [1080, 950], part: 'audio', pt: [20, 262],
      a: 'Códec de audio ↔ chipset', b: 'Convierte sonido digital en analógico y al revés.', c: 'Enlace HD Audio desde el chipset' },
  ];
  Deck.register('what', {
    scrim: 'l',
    cam: WHAT_CAM,
    world(W) { W.install('.inst-cpu'); },
    enter(el) {
      const lines = $('#whatLines', el), wrap = $('#whatNodes', el), info = $('#whatInfo', el);
      lines.innerHTML = ''; wrap.innerHTML = '';
      WHAT_NODES.forEach((n) => {
        const [x2, y2] = World.project(n.pt[0], n.pt[1], WHAT_CAM);
        const [x1, y1] = n.at;
        const mx = (x1 + x2) / 2, d = `M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'wl'); g.dataset.k = n.k; g.dataset.cat = n.cat;
        g.innerHTML = `<path class="wl-base" d="${d}"/><path class="wl-flow" d="${d}"/><circle class="wl-end" cx="${x2}" cy="${y2}" r="6"/>`;
        lines.appendChild(g);
        const b = document.createElement('button');
        b.className = 'node'; b.dataset.k = n.k; b.dataset.cat = n.cat;
        b.style.left = x1 + 'px'; b.style.top = y1 + 'px';
        b.setAttribute('aria-label', `${n.label}: ver cómo se conecta`);
        b.innerHTML = `<span class="node-ic"><svg><use href="#${n.icon}"/></svg></span><span class="node-l">${n.label}</span>`;
        wrap.appendChild(b);
      });
      const pick = (k) => {
        const n = WHAT_NODES.find((q) => q.k === k);
        $$('.node', wrap).forEach((b) => b.classList.toggle('on', b.dataset.k === k));
        $$('.wl', lines).forEach((g) => g.classList.toggle('on', g.dataset.k === k));
        $$('.wl', lines).forEach((g) => g.classList.toggle('off', g.dataset.k !== k));
        World.focus(n.part);
        info.dataset.cat = n.cat;
        $('.wi-cat', info).textContent = n.label;
        $('.wi-a', info).textContent = n.a; $('.wi-b', info).textContent = n.b; $('.wi-c', info).textContent = n.c;
        gsap.fromTo($$('.wi-v', info), { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: .06, duration: .45, ease: 'power2.out' });
      };
      wrap.addEventListener('click', (e) => { const b = e.target.closest('.node'); if (b) pick(b.dataset.k); });
      wrap.addEventListener('pointerover', (e) => { const b = e.target.closest('.node'); if (b) World.lit(WHAT_NODES.find((q) => q.k === b.dataset.k).part, true, 'demo'); });
      wrap.addEventListener('pointerout', (e) => { const b = e.target.closest('.node'); if (b) World.lit(WHAT_NODES.find((q) => q.k === b.dataset.k).part, false, 'demo'); });

      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), $('.lede', el)], { stagger: .15 }), .3)
        .add(M.draw($$('.wl-base', lines), { d: 1, stagger: .08 }), .9)
        .from($$('.node', wrap), { scale: .6, opacity: 0, duration: .6, stagger: .08, ease: 'back.out(2)' }, .9)
        .from($$('.wl-end', lines), { scale: 0, transformOrigin: 'center', duration: .4, stagger: .08 }, 1.6)
        .from(info, { opacity: 0, y: 30, duration: .8, ease: 'power3.out' }, 1.4);
      return tl;
    },
  });

  /* ===================================================================
     03 · MAPA INTERACTIVO
     =================================================================== */
  const MAP_CAM = FULL(640, 545, 1);
  const MAP_ORDER = ['socket', 'pcie1', 'dimm', 'vrm', 'eps', 'atx24', 'fans', 'm2', 'sata', 'pch', 'pcieaux', 'io', 'lan', 'audio', 'usbh', 'bios', 'cmos'];
  let mapSel = null;
  Deck.register('map', {
    scrim: 'r',
    cam: MAP_CAM,
    world(W) { W.install('.inst-cpu'); },
    enter(el) {
      const legend = $('#mapLegend', el), panel = $('#mapPanel', el);
      mapSel = null;
      panel.hidden = true; legend.hidden = false;
      legend.innerHTML = MAP_ORDER.map((id) => {
        const p = Board.PARTS[id];
        return `<button class="lg" role="listitem" data-part="${id}" data-cat="${p.cat}"><span class="cat-dot"></span>${C.parts[id].name.split(' · ')[0].replace('Ranuras ', '').replace('Conector ', '')}</button>`;
      }).join('');

      const open = (id) => {
        mapSel = id;
        const d = C.parts[id], p = Board.PARTS[id];
        World.focus(id);
        World.to(World.camFor(id, { sx: 640, sy: 545, fill: .62, max: 3 }), 1.1, 'power3.inOut');
        panel.dataset.cat = p.cat;
        $('.mp-cat', panel).textContent = C.catNames[p.cat];
        $('.mp-name', panel).textContent = d.name;
        $('.mp-what', panel).textContent = d.what;
        $('.mp-does', panel).textContent = d.does;
        $('.mp-links', panel).innerHTML = '<em>Conecta con</em>' + d.links.map((l) => `<span>${l}</span>`).join('');
        $('.mp-go', panel).dataset.scene = d.scene;
        legend.hidden = true; panel.hidden = false;
        gsap.fromTo(panel, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: .6, ease: 'power3.out' });
        gsap.fromTo($$('.p-name, .p-what, .p-does, .p-links, .mp-actions', panel), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5, stagger: .06, delay: .15 });
        $('.p-close', panel).focus({ preventScroll: true });
      };
      const close = () => {
        if (!mapSel) return;
        const last = mapSel; mapSel = null;
        World.focus(null);
        World.to(MAP_CAM, 1, 'power3.inOut');
        panel.hidden = true; legend.hidden = false;
        gsap.fromTo($$('.lg', legend), { opacity: 0, x: 20 }, { opacity: 1, x: 0, stagger: .02, duration: .4 });
        legend.querySelector(`[data-part="${last}"]`)?.focus({ preventScroll: true });
      };
      this.esc = close;
      World.interactive(true, (id) => (mapSel === id ? close() : open(id)));
      legend.addEventListener('click', (e) => { const b = e.target.closest('.lg'); if (b) open(b.dataset.part); });
      legend.addEventListener('pointerover', (e) => { const b = e.target.closest('.lg'); if (b) World.lit(b.dataset.part, true, 'demo') || World.lit(b.dataset.part, true); });
      legend.addEventListener('pointerout', (e) => { const b = e.target.closest('.lg'); if (b) { World.lit(b.dataset.part, false, 'demo'); World.lit(b.dataset.part, false); } });
      legend.addEventListener('focusin', (e) => { const b = e.target.closest('.lg'); if (b) World.lit(b.dataset.part, true); });
      legend.addEventListener('focusout', (e) => { const b = e.target.closest('.lg'); if (b) World.lit(b.dataset.part, false); });
      $('.p-close', panel).onclick = close;
      $('.mp-go', panel).onclick = (e) => Deck.go(sceneIndex(e.currentTarget.dataset.scene));

      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), $('.note', el)]), .3)
        .from($$('.lg', legend), { opacity: 0, x: 24, duration: .45, stagger: .035, ease: 'power2.out' }, .6);
      // barrido de reconocimiento: cada componente se "detecta" una vez
      const parts = MAP_ORDER.map((id) => World.part(id).querySelector('.body'));
      tl.to(parts, { keyframes: [{ opacity: .35, duration: .15 }, { opacity: 1, duration: .35 }], stagger: .05 }, .5);
      return tl;
    },
    leave() { mapSel = null; },
  });

  /* ===================================================================
     04 · FACTOR DE FORMA — la placa cambia físicamente de tamaño
     =================================================================== */
  const FF = {
    atx:  { w: 244, h: 305, slots: 7, dimm: [150, 158, 170, 178], pch: [150, 180, 46, 42], label: 'ATX', dims: [305, 244], use: 'Torres de sobremesa: la opción con más ranuras y conexiones.' },
    matx: { w: 244, h: 244, slots: 4, dimm: [150, 158, 170, 178], pch: [150, 180, 46, 42], label: 'microATX', dims: [244, 244], use: 'Equipos compactos o económicos. Suele bastar con una gráfica y una ranura extra.' },
    itx:  { w: 170, h: 170, slots: 1, dimm: [140, 150], pch: [120, 152, 34, 14], label: 'Mini-ITX', dims: [170, 170], use: 'PCs muy pequeños (SFF, salón): una sola ranura PCIe y dos de RAM.' },
  };
  const FS = 2.85, FO = [150, 70];
  const fx = (mm) => FO[0] + mm * FS, fy = (mm) => FO[1] + mm * FS;
  Deck.register('form', {
    cam: FULL(1500, 560, 1.3, { o: .06 }),
    enter(el) {
      const svg = $('#formDg', el);
      const ghost = (k, f) => `<g class="ff-ghost" data-f="${k}"><rect x="${fx(0)}" y="${fy(0)}" width="${f.w * FS}" height="${f.h * FS}" rx="6"/>
        <text x="${fx(f.w) - 14}" y="${fy(f.h) - 16}" text-anchor="end">${f.label} · ${f.dims[0]} × ${f.dims[1]}</text></g>`;
      let slots = '';
      for (let i = 0; i < 7; i++) slots += `<rect class="ff-slot" data-i="${i}" x="${fx(22)}" y="${fy(138 + i * 20.32)}" width="${89 * FS}" height="${7 * FS}" rx="3"/>`;
      let dimms = '';
      for (let i = 0; i < 4; i++) dimms += `<rect class="ff-dimm" data-i="${i}" x="${fx(FF.atx.dimm[i])}" y="${fy(12)}" width="${5 * FS}" height="${130 * FS}" rx="2"/>`;
      svg.innerHTML = `
        <g class="ff-board">
          <rect class="ff-pcb" x="${fx(0)}" y="${fy(0)}" width="${244 * FS}" height="${305 * FS}" rx="8"/>
          <rect class="ff-grid" x="${fx(0)}" y="${fy(0)}" width="${244 * FS}" height="${305 * FS}" rx="8"/>
          <rect class="ff-io" x="${fx(0)}" y="${fy(14)}" width="${22 * FS}" height="${116 * FS}" rx="3"/>
          <rect class="ff-sock" x="${fx(58)}" y="${fy(30)}" width="${68 * FS}" height="${70 * FS}" rx="4"/>
          <text class="ff-lab" x="${fx(92)}" y="${fy(68)}" text-anchor="middle">CPU</text>
          ${slots}${dimms}
          <rect class="ff-pch" x="${fx(150)}" y="${fy(180)}" width="${46 * FS}" height="${42 * FS}" rx="3"/>
          <text class="ff-lab ff-pchl" x="${fx(173)}" y="${fy(204)}" text-anchor="middle">PCH</text>
        </g>
        <g class="ff-ghosts">${ghost('atx', FF.atx)}${ghost('matx', FF.matx)}${ghost('itx', FF.itx)}</g>
        <g class="ff-rulers">
          <path class="ff-rule ff-rw" d="M${fx(0)} ${FO[1] - 30} H${fx(244)}"/><text class="ff-rt ff-rwt" x="${fx(122)}" y="${FO[1] - 42}" text-anchor="middle">244 mm</text>
          <path class="ff-rule ff-rh" d="M${FO[0] - 30} ${fy(0)} V${fy(305)}"/><text class="ff-rt ff-rht" x="${FO[0] - 42}" y="${fy(152)}" text-anchor="middle" transform="rotate(-90 ${FO[0] - 42} ${fy(152)})">305 mm</text>
        </g>`;
      const seg = $('#formSeg', el);
      const set = (k, dur = .9) => {
        const f = FF[k];
        press(seg, seg.querySelector(`[data-f="${k}"]`));
        const d = RM ? 0 : dur, e = 'power3.inOut';
        gsap.to($$('.ff-pcb, .ff-grid', svg), { attr: { width: f.w * FS, height: f.h * FS }, duration: d, ease: e });
        $$('.ff-slot', svg).forEach((s, i) => gsap.to(s, { opacity: i < f.slots ? 1 : 0, x: i < f.slots ? 0 : -30, duration: d * .6, delay: i < f.slots ? i * .04 : (6 - i) * .04, ease: 'power2.out' }));
        $$('.ff-dimm', svg).forEach((s, i) => gsap.to(s, { attr: { x: fx(f.dimm[i] ?? f.dimm[f.dimm.length - 1]) }, opacity: i < f.dimm.length ? 1 : 0, duration: d, ease: e }));
        gsap.to(svg.querySelector('.ff-pch'), { attr: { x: fx(f.pch[0]), y: fy(f.pch[1]), width: f.pch[2] * FS, height: f.pch[3] * FS }, duration: d, ease: e });
        gsap.to(svg.querySelector('.ff-pchl'), { attr: { x: fx(f.pch[0] + f.pch[2] / 2), y: fy(f.pch[1] + f.pch[3] / 2 + 2) }, duration: d, ease: e });
        gsap.to(svg.querySelector('.ff-rw'), { attr: { d: `M${fx(0)} ${FO[1] - 30} H${fx(f.w)}` }, duration: d, ease: e });
        gsap.to(svg.querySelector('.ff-rwt'), { attr: { x: fx(f.w / 2) }, duration: d, ease: e });
        gsap.to(svg.querySelector('.ff-rh'), { attr: { d: `M${FO[0] - 30} ${fy(0)} V${fy(f.h)}` }, duration: d, ease: e });
        gsap.to(svg.querySelector('.ff-rht'), { attr: { y: fy(f.h / 2), transform: `rotate(-90 ${FO[0] - 42} ${fy(f.h / 2)})` }, duration: d, ease: e });
        svg.querySelector('.ff-rwt').textContent = `${f.w} mm`; svg.querySelector('.ff-rht').textContent = `${f.h} mm`;
        $$('.ff-ghost', svg).forEach((g) => g.classList.toggle('on', g.dataset.f === k));
        M.count($('#fsW', el), f.dims[0], { from: +$('#fsW', el).textContent, d: d || .01 });
        M.count($('#fsH', el), f.dims[1], { from: +$('#fsH', el).textContent, d: d || .01 });
        M.count($('#fsSlots', el), f.slots, { from: +$('#fsSlots', el).textContent, d: (d || .01) * .6 });
        $('#fsDimm', el).textContent = f.dimm.length;
        $('#fsUse', el).textContent = f.use;
      };
      seg.onclick = (e) => { const b = e.target.closest('button'); if (b) set(b.dataset.f); };
      set('atx', 0);

      // Entrada: la placa grande entra desde fuera; las otras se superponen
      const tl = gsap.timeline();
      tl.from(svg.querySelector('.ff-board'), { x: 1300, duration: 1.1, ease: 'expo.out' }, .1)
        .from(svg.querySelector('.ff-ghost[data-f="matx"]'), { x: 1300, duration: 1, ease: 'expo.out' }, .8)
        .from(svg.querySelector('.ff-ghost[data-f="itx"]'), { x: 1300, duration: 1, ease: 'expo.out' }, 1.2)
        .from(svg.querySelector('.ff-rulers'), { opacity: 0, duration: .6 }, 1.4)
        .from($$('.ff-slot', svg), { scaleX: 0, transformOrigin: 'left center', stagger: .05, duration: .5 }, .7)
        .add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), seg, ...$$('.fs', el), $('.note', el)], { stagger: .06 }), .4);
      return tl;
    },
  });

  /* ===================================================================
     05 · SOCKET — macro LGA / PGA
     =================================================================== */
  const SOCK_CAM = { x: 92, y: 65, z: 3.4, sx: 1230, sy: 520 };
  function lensLGA() {
    let springs = '', pads = '';
    for (let i = 0; i < 7; i++) {
      const x = 68 + i * 52;
      springs += `<path class="spring" d="M${x} 318 v-10 q 0 -26 22 -34 l 6 -2" />`;
      pads += `<rect class="pad" x="${x + 16}" y="266" width="20" height="5" rx="1"/>`;
    }
    return `<g class="lg-socket"><rect x="0" y="318" width="460" height="142" class="sock-body"/><text x="30" y="420" class="lens-l">SOCKET · contactos elásticos</text>${springs}</g>
      <g class="lg-cpu"><rect x="20" y="140" width="420" height="36" class="ihs"/><rect x="40" y="176" width="380" height="90" class="substrate"/>${pads}
        <text x="60" y="226" class="lens-l dark">CPU · pads planos</text></g>`;
  }
  function lensPGA() {
    let pins = '', holes = '';
    for (let i = 0; i < 7; i++) {
      const x = 76 + i * 52;
      pins += `<rect class="pin" x="${x}" y="246" width="7" height="62" rx="2"/>`;
      holes += `<rect class="hole" x="${x - 6}" y="262" width="19" height="74" rx="2"/>`;
    }
    return `<g class="lg-socket"><rect x="0" y="262" width="460" height="198" class="sock-body"/>${holes}<rect x="0" y="252" width="460" height="10" class="zif"/><text x="30" y="410" class="lens-l">SOCKET · orificios</text></g>
      <g class="lg-cpu"><rect x="20" y="120" width="420" height="36" class="ihs"/><rect x="40" y="156" width="380" height="90" class="substrate"/>${pins}
        <text x="60" y="210" class="lens-l dark">CPU · pines</text></g>`;
  }
  Deck.register('socket', {
    scrim: 'l',
    cam: SOCK_CAM,
    world(W) { W.focus('socket'); },
    enter(el) {
      const lens = $('#lens', el), lsvg = $('#lensSvg', el), seg = $('#sockSeg', el);
      // guía desde un punto del socket hasta la lupa
      const [px, py] = World.project(70, 52, SOCK_CAM);
      const lead = $('.sock-lead', el);
      lead.innerHTML = `<rect class="lead-box" x="${px - 28}" y="${py - 28}" width="56" height="56"/><path class="lead" d="M${px + 28} ${py + 28} L${1500} ${py + 28} L1560 560"/>`;
      let cur = null;
      const set = (t, anim = true) => {
        cur = t; press(seg, seg.querySelector(`[data-t="${t}"]`));
        el.classList.toggle('is-pga', t === 'pga');
        lsvg.innerHTML = `<defs><clipPath id="lensClip"><circle cx="230" cy="230" r="226"/></clipPath></defs><g clip-path="url(#lensClip)"><rect width="460" height="460" class="lens-bg"/>${t === 'lga' ? lensLGA() : lensPGA()}</g>`;
        if (!anim || RM) return;
        // la CPU baja sobre el socket: el contacto físico es la lección
        const tl = gsap.timeline();
        tl.from(lsvg.querySelector('.lg-cpu'), { y: -110, duration: 1.1, ease: 'power3.inOut' });
        tl.call(() => snd('snap'), null, 1.05);
        if (t === 'lga') tl.to($$('.spring', lsvg), { scaleY: .82, transformOrigin: '50% 100%', duration: .25, ease: 'power2.out' }, '-=.1');
        else tl.fromTo(lsvg.querySelector('.zif'), { x: 0 }, { x: 14, duration: .4, ease: 'power2.inOut' });
        tl.from($$('.lens-l', lsvg), { opacity: 0, duration: .4, stagger: .1 });
      };
      seg.onclick = (e) => { const b = e.target.closest('button'); if (b && b.dataset.t !== cur) set(b.dataset.t); };
      set('lga', false);
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .3)
        .add(M.rise([$('.kicker', el), $('.lede', el), seg, ...$$('.sock-facts .note', el)], { stagger: .07 }), .4)
        .from($('.lead-box', lead), { scale: 0, transformOrigin: 'center', duration: .5, ease: 'back.out(2)' }, 1.1)
        .add(M.draw($('.lead', lead), { d: .7 }), 1.3)
        .from(lens, { scale: 0, opacity: 0, duration: .9, ease: 'expo.out' }, 1.7)
        .from(lsvg.querySelector('.lg-cpu'), { y: -110, duration: 1.1, ease: 'power3.inOut' }, 2.2)
        .to($$('.spring', lsvg), { scaleY: .82, transformOrigin: '50% 100%', duration: .25 }, 3.2)
        .call(() => snd('snap'), null, 3.25);
      return tl;
    },
  });

  /* ===================================================================
     06 · CPU — radiografía del chip sobre el socket
     =================================================================== */
  const CPU_BLOCKS = {
    cores: ['Núcleos', 'Unidades que ejecutan instrucciones de forma independiente. Más núcleos permiten más tareas en paralelo.'],
    threads: ['Hilos', 'Con SMT (Hyper-Threading), un núcleo atiende dos hilos y aprovecha mejor sus recursos. No duplica el rendimiento.'],
    cache: ['Caché', 'Memoria pequeñísima y rapidísima dentro del chip (L1, L2, L3). Evita tener que ir a la RAM a cada momento.'],
    imc: ['Controlador de memoria', 'Está dentro de la CPU. Por eso las ranuras de RAM van cableadas directamente al socket, no al chipset.'],
    pcie: ['Controlador PCIe', 'La CPU tiene sus propias lanes para la gráfica y el SSD principal. La placa decide cómo repartirlas entre ranuras.'],
    io: ['Enlace con el chipset', 'Un único enlace (DMI o PCIe, según la plataforma) lleva al chipset todo el tráfico de USB, SATA, red, audio…'],
  };
  Deck.register('cpu', {
    scrim: 'l',
    cam: { x: 92, y: 65, z: 2.55, sx: 1270, sy: 540, o: .5 },
    world(W) { W.install('.inst-cpu'); W.focus('socket'); },
    enter(el) {
      const svg = $('#cpuDie', el), read = $('#cpuRead', el);
      const X = 370, Y = 180;
      let cores = '';
      for (let i = 0; i < 8; i++) {
        const cx = X + 25 + (i % 4) * 130, cy = Y + 25 + Math.floor(i / 4) * 140;
        cores += `<g class="core" style="--i:${i}"><rect x="${cx}" y="${cy}" width="112" height="124" rx="4"/>
          <text x="${cx + 12}" y="${cy + 26}">C${i}</text>
          <rect class="thr t0" x="${cx + 12}" y="${cy + 84}" width="88" height="10" rx="2"/><rect class="thr t1" x="${cx + 12}" y="${cy + 100}" width="88" height="10" rx="2"/></g>`;
      }
      svg.innerHTML = `
        <rect class="die-shadow" x="${X - 20}" y="${Y - 20}" width="600" height="600" rx="14"/>
        <rect class="die" x="${X}" y="${Y}" width="560" height="560" rx="10"/>
        <g class="blk" data-b="cores" tabindex="0" role="button" aria-label="Núcleos">${cores}</g>
        <g class="blk" data-b="threads" tabindex="0" role="button" aria-label="Hilos"><rect class="thr-hit" x="${X + 560 + 24}" y="${Y + 200}" width="128" height="64" rx="4"/><text x="${X + 600}" y="${Y + 227}">HILOS</text><text x="${X + 600}" y="${Y + 250}" class="sm">T0 · T1</text><path class="ld" d="M${X + 584} ${Y + 232} H${X + 540}"/></g>
        <g class="blk" data-b="cache" tabindex="0" role="button" aria-label="Caché"><rect x="${X + 25}" y="${Y + 320}" width="510" height="80" rx="4" class="cache"/><text x="${X + 45}" y="${Y + 368}">CACHÉ L3 · compartida</text></g>
        <g class="blk" data-b="imc" tabindex="0" role="button" aria-label="Controlador de memoria" data-cat="mem"><rect x="${X + 25}" y="${Y + 420}" width="160" height="115" rx="4"/><text x="${X + 40}" y="${Y + 455}">IMC</text><text x="${X + 40}" y="${Y + 480}" class="sm">memoria</text></g>
        <g class="blk" data-b="pcie" tabindex="0" role="button" aria-label="Controlador PCIe" data-cat="cpu"><rect x="${X + 200}" y="${Y + 420}" width="160" height="115" rx="4"/><text x="${X + 215}" y="${Y + 455}">PCIe</text><text x="${X + 215}" y="${Y + 480}" class="sm">lanes</text></g>
        <g class="blk" data-b="io" tabindex="0" role="button" aria-label="Enlace con el chipset" data-cat="io"><rect x="${X + 375}" y="${Y + 420}" width="160" height="115" rx="4"/><text x="${X + 390}" y="${Y + 455}">I/O</text><text x="${X + 390}" y="${Y + 480}" class="sm">enlace PCH</text></g>
        <g class="exits">
          <g class="ex" data-cat="mem"><path class="ex-l" d="M${X + 105} ${Y + 535} V${Y + 640} H${X - 130} V${Y + 700}"/><text x="${X - 210}" y="${Y + 735}">MEMORIA · DDR5</text></g>
          <g class="ex" data-cat="cpu"><path class="ex-l" d="M${X + 280} ${Y + 535} V${Y + 720}"/><text x="${X + 200}" y="${Y + 755}">PCIe · GPU · M.2</text></g>
          <g class="ex" data-cat="io"><path class="ex-l" d="M${X + 455} ${Y + 535} V${Y + 640} H${X + 690} V${Y + 700}"/><text x="${X + 610}" y="${Y + 735}">CHIPSET</text></g>
          <g class="ex" data-cat="io"><path class="ex-l" d="M${X + 740} ${Y + 745} H${X + 860}"/><text x="${X + 755}" y="${Y + 790}" class="sm">USB · SATA · red · audio</text></g>
        </g>
        <text class="die-lab" x="${X}" y="${Y - 34}">CPU · VISTA ESQUEMÁTICA (NO A ESCALA)</text>`;
      const pick = (b) => {
        $$('.blk', svg).forEach((g) => g.classList.toggle('on', g.dataset.b === b));
        svg.classList.add('has-sel');
        const [k, v] = CPU_BLOCKS[b];
        read.dataset.cat = svg.querySelector(`.blk[data-b="${b}"]`).dataset.cat || 'cpu';
        $('.cr-k', read).textContent = k; $('.cr-v', read).textContent = v;
        gsap.fromTo($('.cr-v', read), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .4 });
        snd(b === 'imc' || b === 'pcie' || b === 'io' ? 'bits' : 'pulse');
        if (b === 'imc') World.routesOnly(['mem']); else if (b === 'pcie') World.routesOnly(['pcie16', 'm2a']); else if (b === 'io') World.routesOnly(['dmi']); else World.routesOnly([]);
      };
      svg.addEventListener('click', (e) => { const g = e.target.closest('.blk'); if (g) pick(g.dataset.b); });
      svg.addEventListener('keydown', (e) => { const g = e.target.closest('.blk'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); pick(g.dataset.b); } });

      const tl = gsap.timeline();
      // el chip "emerge" del socket: mismo lugar, mismo tamaño → escala
      tl.from([svg.querySelector('.die'), svg.querySelector('.die-shadow')], { scale: .78, opacity: 0, transformOrigin: '650px 460px', duration: 1, ease: 'expo.out' }, .3)
        .from($$('.core', svg), { opacity: 0, scale: .8, transformOrigin: 'center', stagger: .05, duration: .5 }, .7)
        .from($$('.thr', svg), { scaleX: 0, transformOrigin: 'left', stagger: .02, duration: .4 }, 1.1)
        .from($$('.blk[data-b="cache"], .blk[data-b="imc"], .blk[data-b="pcie"], .blk[data-b="io"], .blk[data-b="threads"]', svg), { opacity: 0, y: 12, stagger: .1, duration: .5 }, 1.2)
        .from(svg.querySelector('.die-lab'), { opacity: 0, duration: .6 }, 1.2)
        // cadena CPU → memoria → PCIe → chipset → I/O
        .add(M.draw($$('.ex-l', svg), { d: .7, stagger: .45 }), 1.8)
        .from($$('.ex text', svg), { opacity: 0, stagger: .45, duration: .4 }, 2.2)
        .add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), $('.lede', el), read], { stagger: .1 }), .35);
      tl.call(() => { $$('.ex', svg).forEach((g) => g.classList.add('live')); snd('trickle'); }, null, 3.8);
      tl.call(() => snd('pulse'), null, 1.8).call(() => snd('pulse', 3), null, 2.25).call(() => snd('pulse', 5), null, 2.7).call(() => snd('pulse', 7), null, 3.15);
      // los hilos "laten": dos flujos por núcleo
      M.loop(() => gsap.to($$('.thr.t1', svg), { opacity: .35, duration: .5, repeat: -1, yoyo: true, stagger: { each: .07, repeat: -1, yoyo: true }, ease: 'sine.inOut' }));
      return tl;
    },
  });

  /* ===================================================================
     07 · VRM — la energía viaja
     =================================================================== */
  const VRM_CAM = { x: 84, y: 50, z: 2.3, sx: 1270, sy: 440 };
  const PHASE = {
    phase: ['Fase', 'Un convertidor reductor completo. El VRM reparte la carga entre varias fases que se turnan: menos calor y una salida más suave.'],
    mosfet: ['MOSFET · etapa de potencia', 'Interruptores que abren y cierran el paso de los 12 V cientos de miles de veces por segundo.'],
    inductor: ['Inductor (bobina)', 'Almacena energía entre pulso y pulso y la convierte en una corriente continua.'],
    cond: ['Condensadores', 'Filtran el rizado y responden al instante a los picos de consumo de la CPU.'],
  };
  Deck.register('vrm', {
    scrim: 'l',
    cam: VRM_CAM,
    world(W) { W.focus(['vrm', 'eps', 'socket']); W.install('.inst-cpu'); },
    enter(el) {
      // cable de 12 V bajando desde la fuente hasta el EPS
      const [ex, ey] = World.project(34.75, 1, VRM_CAM);
      const cab = $('#vrmCable', el);
      let wires = '';
      for (let i = 0; i < 8; i++) wires += `<path class="wire ${i % 2 ? 'gnd' : ''}" d="M${ex - 42 + i * 12} -20 V${ey - 90} Q ${ex - 42 + i * 12} ${ey - 40}, ${ex - 28 + i * 8} ${ey}"/>`;
      cab.innerHTML = `${wires}<g class="cab-tag" transform="translate(${ex + 70} ${ey - 150})"><text class="t1">12 V</text><text class="t2" y="30">DESDE LA FUENTE · EPS 8 PINES</text></g>`;

      // esquema de una fase (convertidor buck)
      const ph = $('#phaseSvg', el);
      ph.innerHTML = `
        <path class="w" d="M20 70 H150"/><path class="w" d="M210 70 H250 V125 M250 180 V125 H330"/>
        <path class="w" d="M430 125 H520 M520 125 H680"/><path class="w" d="M250 180 V225 M520 150 V225 M40 225 H680"/>
        <path class="wflow" d="M20 70 H150 M210 70 H250 V125 H330 M430 125 H680"/>
        <text x="20" y="54" class="lbl hot">12 V</text><text x="596" y="110" class="lbl hot">VCORE</text><text x="40" y="245" class="lbl">GND</text>
        <g class="pc" data-p="mosfet" tabindex="0" role="button" aria-label="MOSFET"><rect x="150" y="48" width="60" height="44" rx="4"/><rect x="220" y="158" width="60" height="44" rx="4"/><text x="152" y="36" class="lbl">MOSFET</text></g>
        <g class="pc" data-p="inductor" tabindex="0" role="button" aria-label="Inductor"><path d="M330 125 q12 -26 25 0 q12 -26 25 0 q12 -26 25 0 q12 -26 25 0" class="coil"/><rect x="326" y="95" width="108" height="40" class="hit"/><text x="342" y="86" class="lbl">INDUCTOR</text></g>
        <g class="pc" data-p="cond" tabindex="0" role="button" aria-label="Condensadores"><path d="M500 150 H540 M500 160 H540" class="cap"/><rect x="494" y="138" width="52" height="30" class="hit"/><text x="470" y="192" class="lbl">CONDENS.</text></g>
        <g class="pc" data-p="phase" tabindex="0" role="button" aria-label="Fase completa"><rect x="136" y="24" width="420" height="190" rx="8" class="frame"/><text x="140" y="16" class="lbl dim">UNA FASE</text></g>
        <g class="pwm"><rect x="40" y="130" width="80" height="44" rx="4"/><text x="54" y="158" class="lbl">PWM</text><path d="M120 150 H160 V92 M120 162 H220" class="ctl"/></g>`;
      const read = $('.vp-read', el);
      const pick = (p) => {
        $$('.pc', ph).forEach((g) => g.classList.toggle('on', g.dataset.p === p));
        read.innerHTML = `<b>${PHASE[p][0]}</b> — ${PHASE[p][1]}`;
        World.lit('vrm', p === 'inductor' || p === 'phase', 'demo');
        if (!pick.quiet) snd({ phase: 'flow', mosfet: 'zap', inductor: 'buzz', cond: 'surge' }[p]);
        gsap.fromTo(read, { opacity: 0 }, { opacity: 1, duration: .35 });
      };
      ph.addEventListener('click', (e) => { const g = e.target.closest('.pc'); if (g) pick(g.dataset.p); });
      ph.addEventListener('keydown', (e) => { const g = e.target.closest('.pc'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); pick(g.dataset.p); } });

      // osciloscopio: 6 fases intercaladas + salida estable
      const sc = $('#scopeSvg', el);
      const wave = (row) => {
        let d = '', x = 0; const y0 = 12 + row * 20, per = 120, on = 18, off = row * 20;
        d += `M0 ${y0 + 12}`;
        for (let k = -1; k < 10; k++) { const s = k * per + off; d += ` H${s} V${y0} H${s + on} V${y0 + 12}`; }
        return `<path class="ph" d="${d} H1300"/>`;
      };
      let rows = ''; for (let r = 0; r < 6; r++) rows += wave(r);
      sc.innerHTML = `<g class="scope-grid">${Array.from({ length: 8 }, (_, i) => `<path d="M${i * 80} 0 V190"/>`).join('')}<path d="M0 150 H560"/></g>
        <g class="scope-scroll">${rows}</g><path class="vout" d="M0 164 ${Array.from({ length: 56 }, (_, i) => `L${i * 10 + 10} ${164 + (i % 2 ? 1.2 : -1.2)}`).join(' ')}"/>`;

      World.routes(['eps', 'vcore']);
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), $('.note', el)], { stagger: .12 }), .35)
        .add(M.draw($$('.wire', cab), { d: 1.1, stagger: .03 }), .4)
        .from($('.cab-tag', cab), { opacity: 0, x: -10, duration: .5 }, 1.2)
        .call(() => snd('zap'), null, 1.3)
        .call(() => snd('flow'), null, 1.75)
        .call(() => snd('hum'), null, 2.9)
        .from($('.vrm-phase', el), { opacity: 0, y: 30, duration: .8, ease: 'power3.out' }, 1)
        .add(M.draw($$('.w', ph), { d: .8, stagger: .06 }), 1.3)
        .from($('.scope', el), { opacity: 0, y: 20, duration: .8 }, 1.4)
        .add(M.draw($$('.ph', sc), { d: 1, stagger: .08 }), 1.6);
      M.loop(() => gsap.to($('.scope-scroll', sc), { x: -120, duration: 1.2, ease: 'none', repeat: -1 }));
      pick.quiet = true; pick('phase'); pick.quiet = false;
      return tl;
    },
  });

  /* ===================================================================
     08 · RAM — el módulo encaja
     =================================================================== */
  const RAM_TXT = {
    cap: ['16 · 32 · 64 GB', 'Cuántos datos caben a la vez. Si se queda corta, el sistema recurre al SSD y todo se ralentiza.'],
    spd: ['DDR5-6000 = 6000 MT/s', 'Transferencias por segundo. No son MHz reales: la DDR transfiere dos veces por ciclo de reloj.'],
    lat: ['CL30 a 6000 MT/s ≈ 10 ns', 'CL son ciclos de espera. Lo que cuenta es el tiempo real: ns ≈ CL × 2000 ÷ MT/s.'],
    ch: ['2 canales', 'Caminos independientes entre el controlador y los módulos. Lo vemos en la siguiente escena.'],
  };
  Deck.register('ram', {
    scrim: 'l',
    cam: { x: 150, y: 77, z: 2.1, sx: 1290, sy: 540 },
    world(W) { W.install('.inst-cpu'); W.focus(['dimm', 'socket']); },
    enter(el) {
      const tabs = $('#ramTabs', el), read = $('#ramRead', el);
      const set = (k) => {
        $$('[role="tab"]', tabs).forEach((b) => b.setAttribute('aria-selected', b.dataset.k === k ? 'true' : 'false'));
        read.innerHTML = `<div class="rr-big">${RAM_TXT[k][0]}</div><p class="note">${RAM_TXT[k][1]}</p>${k === 'ch' ? '<button class="btn rr-go">Ver canales <span class="arr">→</span></button>' : ''}`;
        read.querySelector('.rr-go')?.addEventListener('click', () => Deck.next());
        gsap.fromTo(read.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: .06, duration: .4 });
      };
      tabs.onclick = (e) => { const b = e.target.closest('[role="tab"]'); if (b) set(b.dataset.k); };
      set('cap');

      const stick = World.svg.querySelector('.inst-ram[data-i="1"]');
      const latches = $$('.slot[data-slot="A2"] .latch', World.svg);
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), $('.lede', el), tabs, read], { stagger: .08 }), .35)
        // el módulo baja, encaja (snap) y los pestillos se cierran
        .set(stick, { y: -150 }, 0)
        .call(() => stick.classList.add('on'), null, 1.45)
        .to(stick, { y: 0, duration: .75, ease: 'power3.in' }, 1.45)
        .to(stick, { y: 1.2, duration: .06, yoyo: true, repeat: 1, ease: 'power1.out' }, 2.2)
        .call(() => snd('snap'), null, 2.19)
        .fromTo(latches[0], { y: -3 }, { y: 0, duration: .25, ease: 'back.out(3)' }, 2.21)
        .fromTo(latches[1], { y: 3 }, { y: 0, duration: .25, ease: 'back.out(3)' }, 2.21)
        .call(() => { World.lit('dimm'); World.routes('mem'); snd('bits'); }, null, 2.45)
        .from($('.ram-path', el).children, { opacity: 0, x: -14, stagger: .12, duration: .4 }, 2.55);
      return tl;
    },
  });

  /* ===================================================================
     09 · CANALES — una carretera o dos
     =================================================================== */
  Deck.register('chan', {
    cam: FULL(1500, 540, 1.5, { o: .06 }),
    enter(el) {
      const svg = $('#chanDg', el), seg = $('#chanSeg', el), msg = $('.chan-msg', el);
      const road = (y, k) => `<g class="road" data-ch="${k}">
          <rect x="280" y="${y - 44}" width="920" height="88" rx="4" class="asphalt"/>
          <path d="M280 ${y} H1200" class="mid"/>
          <text x="300" y="${y - 56}" class="road-l">CANAL ${k}</text>
          <text x="1190" y="${y - 56}" text-anchor="end" class="road-empty">sin módulo · canal vacío</text>
          <g class="pk-r"></g><g class="pk-l"></g>
        </g>`;
      const slot = (y, n, has) => `<g class="cslot" data-s="${n}"><rect x="1260" y="${y}" width="400" height="38" rx="4" class="slot-b"/>
          <rect x="1266" y="${y + 5}" width="388" height="28" rx="3" class="mod ${has}"/><text x="1680" y="${y + 26}" class="slot-l">${n}</text></g>`;
      svg.innerHTML = `
        <g class="imc"><rect x="0" y="80" width="250" height="400" rx="8"/><text x="30" y="130" class="t-big" font-size="40">CPU</text><text x="30" y="165">controlador de</text><text x="30" y="190">memoria (IMC)</text>
          <rect x="236" y="130" width="28" height="60" class="port"/><rect x="236" y="370" width="28" height="60" class="port"/></g>
        ${road(160, 'A')}${road(400, 'B')}
        <path class="bracket" d="M1200 160 H1230 V120 H1260 M1230 160 V200 H1260"/>
        <path class="bracket" d="M1200 400 H1230 V360 H1260 M1230 400 V440 H1260"/>
        ${slot(100, 'A1', 'm-empty')}${slot(181, 'A2', 'm-a2')}${slot(340, 'B1', 'm-empty')}${slot(421, 'B2', 'm-b2')}`;
      // paquetes: rectángulos que recorren cada carretera en ambos sentidos
      const tweens = [];
      ['A', 'B'].forEach((k) => {
        const g = svg.querySelector(`.road[data-ch="${k}"]`), y = k === 'A' ? 160 : 400;
        for (let i = 0; i < 6; i++) {
          const r = document.createElementNS(NS, 'rect');
          r.setAttribute('class', 'pk'); r.setAttribute('width', 34); r.setAttribute('height', 12); r.setAttribute('rx', 2);
          r.setAttribute('y', y - 26); g.querySelector('.pk-r').appendChild(r);
          const l = r.cloneNode(); l.setAttribute('y', y + 14); l.setAttribute('class', 'pk back'); g.querySelector('.pk-l').appendChild(l);
          M.loop(() => {
            tweens.push(gsap.fromTo(r, { x: 290 }, { x: 1156, duration: 2.4, ease: 'none', repeat: -1, delay: -i * .4 }));
            tweens.push(gsap.fromTo(l, { x: 1156 }, { x: 290, duration: 2.4, ease: 'none', repeat: -1, delay: -i * .4 - .2 }));
          });
        }
      });
      const set = (m) => {
        press(seg, seg.querySelector(`[data-m="${m}"]`));
        svg.classList.toggle('single', m === '1');
        if (!set.quiet) snd(m === '1' ? 'pulse' : 'flow');
        msg.innerHTML = m === '1'
          ? '<b>Un solo módulo:</b> el controlador usa un único canal. Funciona, pero la mitad del camino hacia la memoria queda sin usar.'
          : '<b>Dos módulos en canales distintos:</b> dos caminos independientes y paralelos. El controlador puede trabajar con ambos a la vez.';
        gsap.fromTo(msg, { opacity: 0 }, { opacity: 1, duration: .4 });
        gsap.fromTo(svg.querySelector('.m-b2'), { opacity: m === '1' ? 1 : 0, x: m === '1' ? 0 : 60 }, { opacity: m === '1' ? 0 : 1, x: m === '1' ? 60 : 0, duration: RM ? 0 : .5, ease: 'back.out(1.8)' });
      };
      seg.onclick = (e) => { const b = e.target.closest('button'); if (b) set(b.dataset.m); };
      set.quiet = true; set('2'); set.quiet = false;
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), seg, msg, $('.chan-foot', el)], { stagger: .08 }), .4)
        .from(svg.querySelector('.imc'), { opacity: 0, x: -40, duration: .7, ease: 'power3.out' }, .5)
        .from($$('.asphalt', svg), { scaleX: 0, transformOrigin: 'left center', duration: 1, stagger: .15, ease: 'expo.out' }, .7)
        .add(M.draw($$('.mid, .bracket', svg), { d: .8 }), 1)
        .from($$('.cslot', svg), { opacity: 0, x: 40, stagger: .08, duration: .5 }, 1.2);
      return tl;
    },
  });

  /* ===================================================================
     10 · CHIPSET / PCH — arquitectura dinámica (hoy ↔ antes)
     =================================================================== */
  Deck.register('chipset', {
    cam: { x: 173, y: 201, z: 2.2, sx: 1500, sy: 540, o: .06 },
    enter(el) {
      const svg = $('#pchDg', el), seg = $('#pchSeg', el), msg = $('.pch-msg', el);
      const ends = [['USB', 'i-usb'], ['SATA', 'i-hdd'], ['Red · Wi-Fi', 'i-net'], ['Audio', 'i-audio'], ['PCIe extra', 'i-chip'], ['M.2 secundaria', 'i-ssd'], ['Firmware (SPI)', 'i-chip']];
      const endY = (i) => 14 + i * 96;
      svg.innerHTML = `
        <g class="lk now"><path d="M420 320 H820" class="uplink"/><path d="M420 320 H820" class="uplink-flow"/>
          <text x="620" y="296" text-anchor="middle" class="lk-t">DMI / PCIe · enlace compartido</text>
          <path d="M240 170 V92" class="ln-cpu"/><path d="M150 470 V560" class="ln-cpu"/><path d="M330 470 V560" class="ln-cpu"/>
          <path d="M240 170 V92" class="ln-flow" data-cat="mem"/><path d="M150 470 V560" class="ln-flow" data-cat="cpu"/><path d="M330 470 V560" class="ln-flow" data-cat="sto"/></g>
        <g class="lk old"><path d="M420 320 H470" class="fsb"/><text x="445" y="300" text-anchor="middle" class="lk-t">FSB</text>
          <path d="M770 320 H820" class="fsb"/><path d="M620 170 V92 M620 470 V560" class="ln-cpu"/></g>
        <g class="nb"><rect x="470" y="170" width="300" height="300" rx="8"/><text x="492" y="210" class="t-big" font-size="30">NORTHBRIDGE</text></g>
        <g class="ram-b" data-cat="mem"><rect x="60" y="0" width="360" height="92" rx="6"/><text x="84" y="56" class="t-big" font-size="30">RAM</text></g>
        <g class="gpu-b" data-cat="cpu"><rect x="60" y="560" width="180" height="84" rx="6"/><text x="84" y="612">GPU · x16</text></g>
        <g class="m2-b" data-cat="sto"><rect x="252" y="560" width="168" height="84" rx="6"/><text x="272" y="612">M.2 · x4</text></g>
        <g class="cpu-b"><rect x="60" y="170" width="360" height="300" rx="8"/><text x="84" y="220" class="t-big" font-size="40">CPU</text>
          <rect x="84" y="250" width="312" height="80" rx="4" class="sub"/><text x="104" y="298">núcleos · caché</text></g>
        <g class="mv imc-b" data-cat="mem"><rect x="84" y="350" width="150" height="96" rx="4" class="sub"/><text x="100" y="405">IMC</text></g>
        <g class="mv pci-b" data-cat="cpu"><rect x="246" y="350" width="150" height="96" rx="4" class="sub"/><text x="262" y="405">PCIe</text></g>
        <g class="pch-b" data-cat="io"><rect x="820" y="210" width="300" height="220" rx="8"/><text x="846" y="262" class="t-big pch-name" font-size="40">PCH</text><text x="846" y="296" class="pch-sub">chipset · hub de E/S</text></g>
        <g class="fan">${ends.map((e, i) => `<path class="fo" d="M1120 320 C 1220 320, 1240 ${endY(i) + 36}, 1330 ${endY(i) + 36}"/><path class="fo-flow" style="--d:${1 + (i % 3) * .25}s" d="M1120 320 C 1220 320, 1240 ${endY(i) + 36}, 1330 ${endY(i) + 36}"/>
          <g class="end" transform="translate(1330 ${endY(i)})"><rect width="360" height="72" rx="6"/><svg x="22" y="18" width="36" height="36"><use href="#${e[1]}"/></svg><text x="76" y="44">${e[0]}</text></g>`).join('')}</g>`;
      let mode = null;
      const set = (m, anim = true) => {
        if (m === mode) return; mode = m;
        press(seg, seg.querySelector(`[data-a="${m}"]`));
        const d = anim && !RM ? 1 : 0, e = 'power3.inOut', old = m === 'old';
        svg.classList.toggle('is-old', old);
        // los bloques IMC y PCIe salen de la CPU hacia el northbridge (o vuelven)
        gsap.to(svg.querySelector('.imc-b'), { x: old ? 410 : 0, y: old ? -80 : 0, duration: d, ease: e });
        gsap.to(svg.querySelector('.pci-b'), { x: old ? 248 : 0, y: old ? 10 : 0, duration: d, ease: e, delay: d * .1 });
        gsap.to(svg.querySelector('.nb'), { opacity: old ? 1 : 0, scale: old ? 1 : .9, transformOrigin: '620px 320px', duration: d * .7, delay: old ? d * .2 : 0 });
        gsap.to(svg.querySelector('.ram-b'), { x: old ? 380 : 0, duration: d, ease: e });
        gsap.to(svg.querySelector('.gpu-b'), { x: old ? 470 : 0, duration: d, ease: e });
        gsap.to(svg.querySelector('.m2-b'), { opacity: old ? 0 : 1, duration: d * .5 });
        gsap.to(svg.querySelector('.lk.now'), { opacity: old ? 0 : 1, duration: d * .5 });
        gsap.to(svg.querySelector('.lk.old'), { opacity: old ? 1 : 0, duration: d * .5, delay: old ? d * .5 : 0 });
        gsap.to($$('.fan .end:nth-of-type(n)', svg), { opacity: 1 });
        svg.querySelector('.pch-name').textContent = old ? 'SOUTHBRIDGE' : 'PCH';
        svg.querySelector('.pch-sub').textContent = old ? 'E/S lentas' : 'chipset · hub de E/S';
        msg.innerHTML = old
          ? '<b>Antes:</b> el northbridge controlaba la memoria y la gráfica; el southbridge, las E/S lentas. La CPU hablaba con todo a través del FSB.'
          : '<b>Hoy:</b> la CPU integra el controlador de memoria y las lanes principales. El PCH reparte el resto de E/S, <b>todo por un único enlace</b> con la CPU.';
        gsap.fromTo(msg, { opacity: 0 }, { opacity: 1, duration: .4 });
      };
      seg.onclick = (e) => { const b = e.target.closest('button'); if (b) set(b.dataset.a); };
      set('now', false);
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), seg, msg], { stagger: .08 }), .4)
        .from(svg.querySelector('.cpu-b'), { opacity: 0, x: -40, duration: .7 }, .5)
        .from($$('.mv', svg), { opacity: 0, duration: .5, stagger: .1 }, .8)
        .from(svg.querySelector('.pch-b'), { opacity: 0, x: 40, duration: .7 }, .7)
        .add(M.draw(svg.querySelector('.uplink'), { d: .8 }), 1.1)
        .call(() => snd('bits'), null, 1.5).call(() => snd('trickle'), null, 1.9)
        .from($$('.ram-b, .gpu-b, .m2-b', svg), { opacity: 0, duration: .5, stagger: .1 }, 1.2)
        .add(M.draw($$('.fo', svg), { d: .8, stagger: .07 }), 1.4)
        .from($$('.end', svg), { opacity: 0, x: 30, duration: .5, stagger: .07 }, 1.6);
      return tl;
    },
  });

  /* ===================================================================
     11 · PCI EXPRESS — carriles
     =================================================================== */
  const GEN = { 3: [8, 1], 4: [16, 2], 5: [32, 4], 6: [64, 8], 7: [128, 16] };
  const WDEV = { 1: 'Tarjeta de red 2,5 GbE · capturadora · sonido', 4: 'SSD NVMe · red 10 GbE', 8: 'Controladora RAID / HBA', 16: 'Tarjeta gráfica' };
  Deck.register('pcie', {
    cam: { x: 66, y: 141, z: 3, sx: 1500, sy: 540, o: .06 },
    enter(el) {
      const svg = $('#pcieDg', el);
      let lanes = '';
      for (let i = 0; i < 16; i++) {
        const y = 36 + i * 31;
        lanes += `<g class="lane" data-i="${i}"><text x="232" y="${y + 5}" text-anchor="end" class="ln-l">L${i}</text>
          <path class="tx" d="M250 ${y - 5} H1430"/><path class="rx" d="M250 ${y + 5} H1430"/>
          <path class="txf" d="M250 ${y - 5} H1430"/><path class="rxf" d="M250 ${y + 5} H1430"/></g>`;
      }
      svg.innerHTML = `
        <g class="ctl"><rect x="0" y="10" width="190" height="510" rx="8"/><text x="24" y="60" class="t-big" font-size="30">CPU</text><text x="24" y="92">o chipset</text></g>
        ${lanes}
        <g class="dev"><rect x="1470" y="10" width="210" height="510" rx="8"/><text x="1494" y="60" class="t-big" font-size="30">DISPOSITIVO</text>
          <foreignObject x="1490" y="90" width="176" height="200"><div xmlns="http://www.w3.org/1999/xhtml" class="dev-name"></div></foreignObject>
          <text x="1494" y="470" class="dev-w t-big" font-size="84">x16</text></g>
        <text x="840" y="540" text-anchor="middle" class="legend-t">TX ▸ envía   ◂ RX recibe · cada lane es full-duplex</text>`;
      let w = 16, g = 4;
      const lseg = $('#laneSeg', el), gseg = $('#genSeg', el), gread = $('.pcie-gen', el);
      const upd = (anim = true) => {
        press(lseg, lseg.querySelector(`[data-w="${w}"]`)); press(gseg, gseg.querySelector(`[data-g="${g}"]`));
        const lanesEls = $$('.lane', svg);
        lanesEls.forEach((l, i) => l.classList.toggle('on', i < w));
        if (anim && !RM) gsap.fromTo(lanesEls.slice(0, w), { opacity: .2 }, { opacity: 1, duration: .3, stagger: .03 });
        svg.style.setProperty('--spd', (2.4 / Math.log2(GEN[g][0] / 4)).toFixed(2) + 's');
        svg.querySelector('.dev-name').textContent = WDEV[w];
        svg.querySelector('.dev-w').textContent = 'x' + w;
        gread.innerHTML = `Gen ${g} · <b>${GEN[g][0]} GT/s</b> por lane · enlace x${w} ≈ <b>${GEN[g][1] * w} GB/s</b> por sentido${g >= 6 ? ' · <em>aún poco habitual en PCs de consumo</em>' : ''}`;
      };
      lseg.onclick = (e) => { const b = e.target.closest('button'); if (b) { w = +b.dataset.w; upd(); snd('pulse', { 1: 0, 4: 4, 8: 7, 16: 12 }[w]); } };
      gseg.onclick = (e) => { const b = e.target.closest('button'); if (b) { g = +b.dataset.g; upd(false); snd(g >= 6 ? 'surge' : 'bits'); } };
      upd(false);
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), ...$$('.pcie-notes .note', el), $('.pcie-ctl', el)], { stagger: .08 }), .35)
        .from(svg.querySelector('.ctl'), { opacity: 0, x: -30, duration: .6 }, .5)
        .from(svg.querySelector('.dev'), { opacity: 0, x: 30, duration: .6 }, .6)
        // carriles luminosos 1 → 4 → 8 → 16
        .add(M.draw($$('.tx, .rx', svg), { d: .6, stagger: .025 }), .7)
        .call(() => { w = 1; upd(); snd('pulse'); }, null, 1.3).call(() => { w = 4; upd(); snd('pulse', 4); }, null, 1.8)
        .call(() => { w = 8; upd(); snd('pulse', 7); }, null, 2.3).call(() => { w = 16; upd(); snd('pulse', 12); snd('trickle'); }, null, 2.8);
      return tl;
    },
  });

  /* ===================================================================
     12 · GPU — la tarjeta entra en la ranura
     =================================================================== */
  let gpuRun = null;
  const GPU_CAM = { x: 118, y: 150, z: 1.6, sx: 1250, sy: 560 };
  Deck.register('gpu', {
    scrim: 'l',
    cam: GPU_CAM,
    world(W) { W.install('.inst-cpu'); W.focus(['pcie1', 'socket']); },
    enter(el) {
      const card = World.svg.querySelector('.inst-gpu');
      const chain = $$('.gc', el);
      // --- capa visual de la simulación (VRAM, render y salida de imagen) ---
      const dg = $('#gpuDg', el), P = (x, y) => World.project(x, y, GPU_CAM);
      const [bx, by] = P(3, 140);                 // soporte de la tarjeta (salidas de vídeo)
      const chips = Array.from({ length: 6 }, (_, i) => P(132 + i * 12, 136.5));
      const cw = 9 * 1000 / 321 * GPU_CAM.z, ch = 7 * 1000 / 321 * GPU_CAM.z;
      const [sx0, sy0] = P(66, 141);              // ranura PCIe
      // malla del "fotograma": un pequeño terreno low-poly con un sol
      const mesh = [], shade = [];
      const tri = (a, b, c, col) => { const d = `M${a} L${b} L${c} Z`; mesh.push(`<path d="${d}"/>`); shade.push(`<path d="${d}" fill="${col}"/>`); };
      const R = { x: 1440, y: 236, w: 380, h: 200 };
      const pts = [[0, 150], [60, 110], [120, 135], [180, 80], [250, 120], [310, 95], [380, 140]].map(([x, y]) => [R.x + x, R.y + y]);
      const base = R.y + R.h;
      const cols = ['#1f6f6a', '#2a8a7a', '#1b5e60', '#329a86', '#24746c', '#1f6460'];
      for (let i = 0; i < pts.length - 1; i++) {
        tri(pts[i].join(' '), pts[i + 1].join(' '), `${pts[i][0]} ${base}`, cols[i]);
        tri(pts[i + 1].join(' '), `${pts[i + 1][0]} ${base}`, `${pts[i][0]} ${base}`, cols[(i + 2) % cols.length]);
      }
      dg.innerHTML = `
        <g class="vram">${chips.map(([x, y]) => `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="2"/><rect class="fill" x="${x}" y="${y + ch}" width="${cw}" height="0" rx="2"/>`).join('')}
          <text class="vram-l" x="${chips[5][0] + cw + 10}" y="${chips[0][1] + ch - 4}">VRAM</text></g>
        <g class="pkts">${Array.from({ length: 6 }, () => `<rect class="pk" width="12" height="6" rx="2" x="${sx0}" y="${sy0 - 3}"/>`).join('')}</g>
        <g class="rpanel"><rect class="frame" x="${R.x - 14}" y="${R.y - 40}" width="${R.w + 28}" height="${R.h + 58}" rx="6"/>
          <text class="rp-l" x="${R.x}" y="${R.y - 16}">RENDER · FOTOGRAMA</text><text class="rp-pct" x="${R.x + R.w}" y="${R.y - 12}" text-anchor="end">0%</text>
          <g class="shade">${shade.join('')}<circle cx="${R.x + 300}" cy="${R.y + 40}" r="20" fill="#ffd25a"/></g><g class="mesh">${mesh.join('')}</g></g>
        <g class="ports"><rect x="${bx - 12}" y="${by - 30}" width="14" height="22" rx="2"/><rect x="${bx - 12}" y="${by + 2}" width="14" height="22" rx="2"/>
          <rect class="lit" x="${bx - 10}" y="${by - 28}" width="10" height="18" rx="1"/><rect class="lit" x="${bx - 10}" y="${by + 4}" width="10" height="18" rx="1"/>
          <text class="out-l" x="${bx + 14}" y="${by - 38}">SALIDAS DE VÍDEO</text></g>
        <path class="cable" d="M${bx - 6} ${by + 26} C ${bx - 6} ${by + 160}, 860 690, 860 772"/>
        <path class="cable-f" d="M${bx - 6} ${by + 26} C ${bx - 6} ${by + 160}, 860 690, 860 772"/>
        <g class="mon"><rect class="stand" x="846" y="960" width="28" height="34"/><rect class="stand" x="800" y="990" width="120" height="8" rx="3"/>
          <rect class="bezel" x="720" y="772" width="280" height="190" rx="8"/><rect class="scr" x="732" y="784" width="256" height="166" rx="3"/>
          <g class="mon-img" transform="translate(732 784) scale(${256 / R.w} ${166 / (R.h + 10)}) translate(${-R.x} ${-R.y + 4})"><g class="shade">${shade.join('')}<circle cx="${R.x + 300}" cy="${R.y + 40}" r="20" fill="#ffd25a"/></g></g></g>`;
      const q = (sel) => dg.querySelectorAll(sel);
      const resetVis = () => {
        gsap.set(q('.vram .fill'), { attr: { height: 0, y: (i) => chips[i][1] + ch } });
        gsap.set([q('.vram')[0], q('.rpanel')[0], q('.ports')[0], q('.mon')[0], q('.pk')], { opacity: 0 });
        gsap.set(q('.cable, .cable-f'), { opacity: 0 });
        gsap.set(q('.rpanel .shade')[0], { opacity: 0 }); gsap.set(q('.mon-img')[0], { opacity: 0 });
        q('.rp-pct')[0].textContent = '0%';
      };
      const sim = () => {
        gpuRun?.kill();
        chain.forEach((c) => c.classList.remove('on', 'done'));
        World.routesOnly([]); resetVis();
        const run = gpuRun = gsap.timeline();
        const T = [0, 1.2, 2.5, 4.6];
        chain.forEach((c, i) => {
          run.call(() => {
            chain.forEach((q2, j) => { q2.classList.toggle('on', j === i); q2.classList.toggle('done', j < i); });
            snd(['bits', 'trickle', 'pulse', 'bits'][i]);
            if (i === 1) World.routes('pcie16');
            if (i === 2) World.lit('pcie1', true, 'demo');
          }, null, T[i]);
        });
        // 02 · paquetes recorren la ranura hacia la tarjeta
        const [vx, vy] = chips[0];
        run.to(q('.pk'), { opacity: 1, duration: .1, stagger: .12 }, T[1] + .2)
          .fromTo(q('.pk'), { x: 0, y: 0 }, { x: vx - sx0, y: vy - sy0, duration: .8, ease: 'power2.inOut', stagger: .12 }, T[1] + .2)
          .to(q('.pk'), { opacity: 0, duration: .15, stagger: .12 }, T[1] + 1);
        // 03 · la VRAM se llena chip a chip y el fotograma se renderiza
        run.to(q('.vram')[0], { opacity: 1, duration: .3 }, T[2])
          .to(q('.vram .fill'), { attr: { height: ch, y: (i) => chips[i][1] }, duration: .35, stagger: .12, ease: 'power2.out' }, T[2] + .1)
          .to(q('.rpanel')[0], { opacity: 1, duration: .3 }, T[2] + .3)
          .add(M.draw(q('.rpanel .mesh path'), { d: .9, stagger: .02 }), T[2] + .4)
          .to(q('.rpanel .shade')[0], { opacity: 1, duration: .6 }, T[2] + 1.2)
          .add(M.count(q('.rp-pct')[0], 100, { d: 1.6, suffix: '%' }), T[2] + .4);
        // 04 · la imagen sale por los puertos de la GPU hasta el monitor
        run.to(q('.ports')[0], { opacity: 1, duration: .3 }, T[3])
          .fromTo(q('.ports .lit'), { opacity: .2 }, { opacity: 1, duration: .25, repeat: 3, yoyo: true }, T[3])
          .set(q('.cable, .cable-f'), { opacity: 1 }, T[3] + .2)
          .add(M.draw(q('.cable')[0], { d: .7 }), T[3] + .2)
          .to(q('.mon')[0], { opacity: 1, duration: .4 }, T[3] + .5)
          .to(q('.mon-img')[0], { opacity: 1, duration: .5 }, T[3] + .9)
          .call(() => snd('ok'), null, T[3] + .9);
        run.call(() => chain.forEach((q2) => q2.classList.add('done')), null, T[3] + 1.4);
      };
      resetVis();
      $('#gpuSim', el).onclick = sim;
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), $('.note', el), $('#gpuSim', el), ...chain, $$('.note', el)[1]], { stagger: .06 }), .35)
        // la tarjeta desciende hacia la placa (profundidad → escala) y asienta
        .call(() => card.classList.add('on'), null, 1.4)
        .fromTo(card, { scale: 1.18, svgOrigin: '123 141' }, { scale: 1, duration: 1, ease: 'power3.in' }, 1.4)
        .call(() => { World.lit('pcie1'); snd('seat'); }, null, 2.4)
        .fromTo(card, { y: -1.2 }, { y: 0, duration: .3, ease: 'back.out(4)' }, 2.4)
        .call(sim, null, 3);
      return tl;
    },
    leave() { gpuRun?.kill(); gpuRun = null; },
  });
})();
