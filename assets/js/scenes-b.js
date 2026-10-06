/* =====================================================================
   ESCENAS 13–24
   ===================================================================== */
(function () {
  'use strict';
  const C = window.CONTENT;
  const { sceneIndex, press, FULL, NS, snd } = window.SceneUtil;
  const keyAct = (fn) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); fn(e); } };

  /* ===================================================================
     13 · M.2 / NVMe — el SSD entra en la ranura
     =================================================================== */
  const M2_CAM = { x: 81, y: 117, z: 2.9, sx: 1290, sy: 300 };
  Deck.register('m2', {
    scrim: ['l','b'],
    cam: M2_CAM,
    world(W) { W.install('.inst-cpu'); W.focus(['m2', 'socket']); },
    enter(el) {
      const hs = World.svg.querySelector('.m2-hs'), ssd = World.svg.querySelector('.inst-nvme');
      // colas: AHCI (una fila) vs NVMe (muchas filas en paralelo)
      const q = (id, rows) => {
        const s = $('#' + id, el); let h = '';
        for (let r = 0; r < rows; r++) for (let c = 0; c < 32; c++) h += `<rect x="${c * 10.3}" y="${r * (rows > 1 ? 9 : 0) + (rows > 1 ? 0 : 26)}" width="7" height="${rows > 1 ? 6 : 18}" rx="1" class="qc" style="--r:${r}"/>`;
        s.innerHTML = h + (rows > 1 ? '<text x="330" y="68" text-anchor="end" class="q-more">… × 65 535</text>' : '');
      };
      q('qAhci', 1); q('qNvme', 7);
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise($('.kicker', el)), .3)
        // 1. se retira el disipador · 2. el SSD entra inclinado · 3. baja y se atornilla
        .to(hs, { y: -34, opacity: 0, duration: .7, ease: 'power2.in' }, 1.4)
        .call(() => ssd.classList.add('on'), null, 2)
        .fromTo(ssd, { x: 34, rotation: -11, svgOrigin: '44 117' }, { x: 0, duration: .8, ease: 'power2.out' }, 2)
        .to(ssd, { rotation: 0, svgOrigin: '44 117', duration: .5, ease: 'back.out(2.5)' }, 2.8)
        .call(() => snd('snap'), null, 3.02)
        .call(() => { World.lit('m2'); World.routes('m2a'); }, null, 3.2)
        .from($$('.ms-rows span, .ms-col', el), { opacity: 0, y: 24, stagger: .06, duration: .5, ease: 'power3.out' }, 1.4)
        .from($$('.mq', el), { opacity: 0, y: 16, stagger: .12, duration: .5 }, 2.2)
        .from($$('#qAhci .qc', el), { opacity: 0, stagger: .015, duration: .2 }, 2.4)
        .from($$('#qNvme .qc', el), { opacity: 0, stagger: { each: .0025, from: 'start' }, duration: .2 }, 2.4);
      M.loop(() => gsap.to($$('#qNvme .qc', el), { opacity: .3, duration: .6, repeat: -1, yoyo: true, stagger: { each: .004, repeat: -1, yoyo: true } }));
      return tl;
    },
  });

  /* ===================================================================
     14 · SATA — cables que se dibujan solos
     =================================================================== */
  const SATA_CAM = { x: 232, y: 207, z: 3.3, sx: 1500, sy: 560 };
  const SATA_DEV = [
    { id: 'ssd', name: 'SSD 2,5"', sub: 'memoria flash · sin partes móviles', icon: 'i-ssd', y: 250, port: 185.5 },
    { id: 'hdd', name: 'Disco duro', sub: 'platos magnéticos · mucha capacidad', icon: 'i-hdd', y: 470, port: 197.5 },
    { id: 'odd', name: 'Unidad óptica', sub: 'ejemplo histórico · DVD / Blu-ray', icon: 'i-disc', y: 690, port: 209.5, old: true },
  ];
  Deck.register('sata', {
    scrim: 'l',
    cam: SATA_CAM,
    world(W) { W.focus(['sata']); },
    enter(el) {
      const svg = $('#sataDg', el);
      let h = '';
      SATA_DEV.forEach((d, i) => {
        const [px, py] = World.project(222, d.port, SATA_CAM);
        const x1 = 1080, y1 = d.y + 70, mx = (x1 + px) / 2;
        const path = `M${x1} ${y1} C ${mx} ${y1}, ${mx - 40} ${py}, ${px - 36} ${py}`;
        h += `<g class="sdev ${d.old ? 'old' : ''}" data-i="${i}">
          <rect x="820" y="${d.y}" width="260" height="140" rx="8" class="box"/>
          <svg x="846" y="${d.y + 26}" width="44" height="44"><use href="#${d.icon}"/></svg>
          <text x="906" y="${d.y + 58}" class="t-big" font-size="26">${d.name}</text>
          <text x="846" y="${d.y + 110}" class="sm">${d.sub}</text>
          <path class="cable" d="${path}"/><path class="cable-flow" d="${path}"/>
          <g class="plug" transform="translate(${px - 38} ${py - 9})"><rect width="38" height="18" rx="2"/><rect x="30" y="4" width="8" height="10"/></g>
        </g>`;
      });
      svg.innerHTML = h;
      World.routes('sata');
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), ...$$('.lede, .note', el)], { stagger: .1 }), .35)
        // el primer conector entra en su puerto: instalación física
        .from($$('.plug', svg)[0], { x: '-=70', opacity: 0, duration: .7, ease: 'back.out(1.6)' }, .8)
        .call(() => snd('plug'), null, 1.28)
        .from($$('.sdev .box, .sdev svg, .sdev text', svg), { opacity: 0, x: -20, stagger: .04, duration: .45 }, 1.1)
        .add(M.draw($$('.cable', svg), { d: .9, stagger: .35, reverse: true }), 1.4)
        .from($$('.plug', svg).slice(1), { opacity: 0, x: '-=30', stagger: .35, duration: .4 }, 2)
        .call(() => snd('plug'), null, 2.3).call(() => snd('plug'), null, 2.65)
        .call(() => { svg.classList.add('live'); World.lit('sata'); snd('bits'); }, null, 2.8);
      return tl;
    },
  });

  /* ===================================================================
     15 · PANEL TRASERO — puertos interactivos
     =================================================================== */
  const PORTS = {
    flash: ['Botón de actualización de firmware', 'Actualiza el firmware desde un USB; en algunas placas, incluso sin CPU ni RAM instaladas.', 'Memoria USB con el archivo del firmware.'],
    clr: ['Clear CMOS', 'Restablece los ajustes del firmware a los valores de fábrica.', 'Después de un ajuste que impide arrancar.'],
    usb2: ['USB 2.0 · USB-A', 'Hasta 480 Mb/s: más que suficiente para periféricos.', 'Teclado, ratón, receptor inalámbrico.'],
    usb5: ['USB 5 Gb/s · USB-A', 'Antes llamado USB 3.0 o 3.2 Gen 1. Para almacenamiento externo.', 'Memoria USB, disco externo.'],
    usb10: ['USB 10 Gb/s · USB-A', 'USB 3.2 Gen 2: el doble de ancho de banda.', 'SSD externo.'],
    usbc: ['USB-C', 'USB-C es el conector, no la velocidad: según la placa va de 5 a 20 Gb/s, o más con USB4.', 'Móvil, SSD externo, hub o dock.'],
    hdmi: ['HDMI', 'Salida de vídeo de la gráfica integrada de la CPU. Si la CPU no tiene gráfica integrada, no da imagen.', 'Monitor o TV (sólo con gráfica integrada).'],
    dp: ['DisplayPort', 'Otra salida de la gráfica integrada. Con tarjeta gráfica, conecta el monitor a la tarjeta.', 'Monitor (sólo con gráfica integrada).'],
    wifi: ['Conector de antena Wi-Fi', 'Para las antenas del módulo Wi-Fi/Bluetooth integrado en la placa.', 'Las antenas externas que vienen con la placa.'],
    rj45: ['Ethernet · RJ45', 'Red por cable. Sus LED indican enlace y actividad. De 1 a 10 Gb/s, según el controlador.', 'Router o switch.'],
    jack: ['Audio analógico 3,5 mm', 'Colores estándar: verde = salida, rosa = micrófono, azul = entrada de línea.', 'Auriculares, altavoces, micrófono.'],
    spdif: ['S/PDIF óptico', 'Audio digital por fibra óptica, sin interferencias eléctricas.', 'Barra de sonido o amplificador.'],
  };
  function ioPanelSVG() {
    const usbA = (x, y, t) => `<g class="port" data-p="${t}" tabindex="0" role="button" aria-label="${PORTS[t][0]}"><rect x="${x}" y="${y}" width="112" height="44" rx="3" class="shell"/><rect x="${x + 12}" y="${y + 10}" width="88" height="14" class="tongue ${t}"/></g>`;
    const usbC = (x, y) => `<g class="port" data-p="usbc" tabindex="0" role="button" aria-label="USB-C"><rect x="${x}" y="${y}" width="92" height="30" rx="15" class="shell"/><rect x="${x + 18}" y="${y + 11}" width="56" height="8" rx="4" class="tongue"/></g>`;
    const jack = (x, y, c) => `<g class="port" data-p="jack" tabindex="0" role="button" aria-label="Audio 3,5 mm"><circle cx="${x}" cy="${y}" r="28" class="shell"/><circle cx="${x}" cy="${y}" r="17" class="ring-c" style="stroke:${c}"/><circle cx="${x}" cy="${y}" r="8" class="hole"/></g>`;
    return `<rect x="0" y="0" width="1680" height="330" rx="10" class="io-plate"/>
      <rect x="10" y="10" width="1660" height="310" rx="6" class="io-inner"/>
      <g class="port" data-p="flash" tabindex="0" role="button" aria-label="${PORTS.flash[0]}"><rect x="50" y="80" width="84" height="54" rx="6" class="shell"/><rect x="66" y="94" width="52" height="26" rx="4" class="btn-cap"/></g>
      <text x="92" y="162" text-anchor="middle" class="io-l">FLASHBACK</text>
      <g class="port" data-p="clr" tabindex="0" role="button" aria-label="Clear CMOS"><rect x="50" y="196" width="84" height="54" rx="6" class="shell"/><rect x="66" y="210" width="52" height="26" rx="4" class="btn-cap"/></g>
      <text x="92" y="278" text-anchor="middle" class="io-l">CLR_CMOS</text>
      ${usbA(190, 60, 'usb2')}${usbA(190, 120, 'usb2')}${usbA(190, 190, 'usb5')}${usbA(190, 250, 'usb5')}
      <g class="port" data-p="hdmi" tabindex="0" role="button" aria-label="HDMI"><path d="M370 70 h150 v34 l-14 14 h-122 l-14 -14 z" class="shell"/><rect x="386" y="82" width="118" height="14" class="tongue"/></g>
      <text x="445" y="146" text-anchor="middle" class="io-l">HDMI</text>
      <g class="port" data-p="dp" tabindex="0" role="button" aria-label="DisplayPort"><path d="M370 172 h150 v48 h-132 l-18 -18 z" class="shell"/><rect x="390" y="186" width="112" height="14" class="tongue"/></g>
      <text x="445" y="248" text-anchor="middle" class="io-l">DP</text>
      <g class="port" data-p="wifi" tabindex="0" role="button" aria-label="Antena Wi-Fi"><circle cx="630" cy="104" r="34" class="shell"/><circle cx="630" cy="104" r="16" class="hole"/><circle cx="630" cy="104" r="5" class="pinc"/></g>
      <g class="port" data-p="wifi" tabindex="0" role="button" aria-label="Antena Wi-Fi"><circle cx="630" cy="222" r="34" class="shell"/><circle cx="630" cy="222" r="16" class="hole"/><circle cx="630" cy="222" r="5" class="pinc"/></g>
      <text x="630" y="290" text-anchor="middle" class="io-l">Wi-Fi</text>
      <g class="port" data-p="rj45" tabindex="0" role="button" aria-label="Ethernet RJ45"><rect x="740" y="54" width="130" height="112" rx="4" class="shell"/><path d="M760 76 h90 v56 h-24 v14 h-42 v-14 h-24 z" class="hole"/><rect x="746" y="58" width="16" height="9" class="led-g"/><rect x="848" y="58" width="16" height="9" class="led-y"/></g>
      ${usbA(749, 190, 'usb10')}${usbA(749, 250, 'usb10')}
      ${usbC(960, 72)}${usbC(960, 124)}
      <text x="1006" y="178" text-anchor="middle" class="io-l">USB-C</text>
      ${usbA(950, 200, 'usb10')}${usbA(950, 256, 'usb5')}
      <g class="io-audio">${jack(1200, 96, '#8fd96b')}${jack(1280, 96, '#e98fb4')}${jack(1360, 96, '#6fa6e9')}${jack(1200, 176, '#c9c9c9')}${jack(1280, 176, '#e9b86f')}</g>
      <g class="port" data-p="spdif" tabindex="0" role="button" aria-label="S/PDIF óptico"><rect x="1334" y="150" width="54" height="54" rx="4" class="shell"/><rect x="1348" y="164" width="26" height="26" rx="3" class="hole"/></g>
      <text x="1280" y="262" text-anchor="middle" class="io-l">AUDIO</text>
      <g class="io-vent">${Array.from({ length: 8 }, (_, i) => `<rect x="${1450 + i * 26}" y="60" width="12" height="210" rx="6"/>`).join('')}</g>`;
  }
  Deck.register('io', {
    cam: { x: 122, y: 150, z: 1.2, sx: 960, sy: 540, o: .1 },   // plano amplio: evita barrer la placa entera con zoom alto
    world(W) { W.lit('io'); },
    enter(el) {
      const svg = $('#ioPanel', el), read = $('#ioRead', el);
      svg.innerHTML = ioPanelSVG();
      const pick = (g) => {
        const k = g.dataset.p;
        $$('.port', svg).forEach((p) => p.classList.toggle('on', p === g));
        $('.ir-name', read).textContent = PORTS[k][0];
        $('.ir-what', read).textContent = PORTS[k][1];
        $('.ir-ex', read).textContent = PORTS[k][2];
        gsap.fromTo(read.children, { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: .06, duration: .4 });
      };
      svg.addEventListener('click', (e) => { const g = e.target.closest('.port'); if (g) pick(g); });
      svg.addEventListener('keydown', (e) => { const g = e.target.closest('.port'); if (g) keyAct(() => pick(g))(e); });
      pick(svg.querySelector('.port[data-p="usbc"]'));
      const tl = gsap.timeline();
      // la cámara "orbita" hasta mirar el borde de la placa de frente
      tl.from($('.io-wrap', el), { rotationY: -68, x: -500, opacity: 0, transformPerspective: 1800, transformOrigin: 'left center', duration: 1.4, ease: 'power3.out' }, .2)
        .from($$('.port', svg), { opacity: 0, stagger: { each: .025, from: 'start' }, duration: .3 }, .9)
        .add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), $('.note', el), read], { stagger: .1 }), .4);
      return tl;
    },
  });

  /* ===================================================================
     16 · HEADERS — cables que suben a la caja
     =================================================================== */
  const HDR_CAM = { x: 111, y: 295, z: 2.6, sx: 960, sy: 790 };
  const HDR = [
    { k: 'faudio', parts: ['faudio'], mm: [[14.5, 291]], dest: 'Audio frontal', icon: 'i-audio', x: 150,
      t: 'F_AUDIO · HD Audio', v: 'Lleva la salida de auriculares y la entrada de micrófono al frontal de la caja.' },
    { k: 'argb', parts: ['argb'], mm: [[65.5, 292]], dest: 'Tira LED ARGB', icon: 'i-led', x: 520,
      t: 'ARGB · 5 V, 3 pines', v: 'Controla LED direccionables uno a uno. No es compatible con RGB de 12 V y 4 pines: conectarlo mal puede dañar los LED.' },
    { k: 'fans', parts: ['fans'], mm: [[105.5, 292]], dest: 'Ventilador de caja', icon: 'i-fan', x: 890,
      t: 'SYS_FAN · 4 pines PWM', v: 'Alimenta el ventilador, lee sus RPM y regula su velocidad. El de la CPU (CPU_FAN) está junto al socket.' },
    { k: 'usbh', parts: ['usbh'], mm: [[156, 291], [174, 291]], dest: 'USB frontal', icon: 'i-usb', x: 1270,
      t: 'USB 2.0 (9 pines) · USB 5 Gb/s (19/20 pines)', v: 'Conectan los USB del frontal. El de 19 pines y el USB-C frontal están en el borde derecho.' },
    { k: 'fpanel', parts: ['fpanel'], mm: [[208, 291]], dest: 'Botones y LED', icon: 'i-btn', x: 1640,
      t: 'F_PANEL · panel frontal', v: 'Botón de encendido, reset, LED de encendido y LED de disco. Los LED tienen polaridad: + y −.' },
  ];
  Deck.register('headers', {
    scrim: 't',
    cam: HDR_CAM,
    world(W) { W.focus(['faudio', 'argb', 'fans', 'usbh', 'fpanel']); },
    enter(el) {
      const svg = $('#hdrDg', el), dest = $('#hdrDest', el), read = $('#hdrRead', el);
      const cardY = 470;
      let h = '';
      HDR.forEach((d) => {
        d.mm.forEach(([mx, my], j) => {
          const [hx, hy] = World.project(mx, my, HDR_CAM);
          for (let s = -1; s <= 1; s++) {
            const x0 = hx + s * 7, x1 = d.x + 120 + s * 7 + j * 30;
            const p = `M${x0} ${hy} C ${x0} ${hy - 150}, ${x1} ${cardY + 240}, ${x1} ${cardY + 96}`;
            h += `<path class="wire" data-k="${d.k}" d="${p}"/>`;
          }
          h += `<circle class="hdot" data-k="${d.k}" cx="${hx}" cy="${hy}" r="7"/>`;
        });
      });
      svg.innerHTML = h;
      dest.innerHTML = HDR.map((d) => `<button class="hd" data-k="${d.k}" style="left:${d.x}px;top:${cardY}px"><svg><use href="#${d.icon}"/></svg><span>${d.dest}</span></button>`).join('');
      const pick = (k) => {
        const d = HDR.find((q) => q.k === k);
        $$('.hd', dest).forEach((b) => b.classList.toggle('on', b.dataset.k === k));
        svg.dataset.sel = k;
        $$('.wire, .hdot', svg).forEach((w) => w.classList.toggle('on', w.dataset.k === k));
        World.focus(d.parts);
        snd(k === 'fans' ? 'hum' : k === 'argb' ? 'spark' : 'trickle');
        $('.hr-k', read).textContent = d.t; $('.hr-v', read).textContent = d.v;
        gsap.fromTo($('.hr-v', read), { opacity: 0 }, { opacity: 1, duration: .4 });
      };
      dest.onclick = (e) => { const b = e.target.closest('.hd'); if (b) pick(b.dataset.k); };
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), read], { stagger: .1 }), .35)
        .from($$('.hdot', svg), { scale: 0, transformOrigin: 'center', stagger: .06, duration: .4, ease: 'back.out(3)' }, .6)
        .add(M.draw($$('.wire', svg), { d: 1.1, stagger: .03 }), .8)
        .from($$('.hd', dest), { opacity: 0, y: 20, stagger: .08, duration: .5 }, 1.5);
      return tl;
    },
  });

  /* ===================================================================
     17 · UEFI — consola de arranque
     =================================================================== */
  const TERM = [
    [0, 'PS_ON# activo · raíles 12 V / 5 V / 3,3 V estables · PWR_OK'],
    [1, 'Reset liberado · la CPU ejecuta el firmware del chip SPI'],
    [2, 'Inicializando procesador ................ OK', 'cpu'],
    [2, 'Entrenamiento de memoria · DDR5 ........ OK', 'ram'],
    [2, 'Enumerando PCIe · GPU · NVMe ............ OK', 'pci'],
    [2, 'Dispositivos de almacenamiento .......... OK', 'sto'],
    [3, 'Boot Manager → NVMe0 · partición de sistema EFI'],
    [4, 'Cargando \\EFI\\Microsoft\\Boot\\bootmgfw.efi'],
    [4, 'ExitBootServices() · el sistema operativo toma el control'],
  ];
  let uefiRun = null;
  Deck.register('uefi', {
    cam: { x: 154, y: 240, z: 2.6, sx: 1560, sy: 300, o: .14 },
    world(W) { W.focus('bios'); },
    enter(el) {
      const body = $('#termBody', el), steps = $$('.uc', el);
      const boot = () => {
        uefiRun?.kill();
        body.innerHTML = '';
        steps.forEach((s) => s.classList.remove('on', 'done'));
        $$('.chk', el).forEach((c) => c.classList.remove('ok'));
        const run = uefiRun = gsap.timeline();
        run.call(() => { steps[0].classList.add('on'); snd('spark'); setTimeout(() => snd('power'), 120); });
        TERM.forEach(([st, txt, chk], i) => {
          const at = .5 + i * .62;
          run.call(() => {
            steps.forEach((s, j) => { s.classList.toggle('on', j === st); s.classList.toggle('done', j < st); });
            const ln = document.createElement('div');
            ln.className = 'tl'; ln.innerHTML = `<span class="tp">&gt;</span> <span class="tx"></span>`;
            body.appendChild(ln);
            const tx = ln.querySelector('.tx'), o = { n: 0 };
            gsap.to(o, { n: txt.length, duration: RM ? 0 : Math.min(.5, txt.length * .012), ease: 'none', onUpdate: () => { tx.textContent = txt.slice(0, Math.round(o.n)); }, onComplete: () => { if (chk) { tx.innerHTML = txt.replace('OK', '<b>OK</b>'); el.querySelector(`.chk[data-c="${chk}"]`).classList.add('ok'); } } });
          }, null, at);
        });
        run.call(() => { steps.forEach((s) => { s.classList.remove('on'); s.classList.add('done'); }); body.insertAdjacentHTML('beforeend', '<div class="tl done">_ SISTEMA EN MARCHA</div>'); }, null, .5 + TERM.length * .62 + .3);
      };
      $('#uefiPower', el).onclick = boot;
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), $('.term', el), ...steps, $('.uefi-def', el)], { stagger: .07 }), .35)
        .call(boot, null, 1.4);
      return tl;
    },
    leave() { uefiRun?.kill(); },
  });

  /* ===================================================================
     18 · CMOS / RTC — el reloj que nunca se para
     =================================================================== */
  const CMOS_CAM = { x: 100, y: 159, z: 3.2, sx: 1320, sy: 540 };   // ≤3× respecto a la escena siguiente: sin trozos negros
  let rtcTimer = null;
  Deck.register('cmos', {
    scrim: 'l',
    cam: CMOS_CAM,
    world(W) { W.focus('cmos'); },
    enter(el) {
      const svg = $('#cmosDg', el), seg = $('#cmosSeg', el), msg = $('.cmos-msg', el);
      const cx = 1320, cy = 540, R = 200;
      let ticks = '';
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2, r1 = R - (i % 5 ? 10 : 22);
        ticks += `<line x1="${cx + Math.sin(a) * R}" y1="${cy - Math.cos(a) * R}" x2="${cx + Math.sin(a) * r1}" y2="${cy - Math.cos(a) * r1}" class="${i % 5 ? 'tk' : 'tk big'}"/>`;
      }
      svg.innerHTML = `<circle cx="${cx}" cy="${cy}" r="${R}" class="rtc-ring"/>${ticks}
        <g class="rtc-hand"><line x1="${cx}" y1="${cy - R + 34}" x2="${cx}" y2="${cy - R - 6}" class="hand"/><circle cx="${cx}" cy="${cy - R}" r="7" class="hand-dot"/></g>
        <text x="${cx}" y="${cy - R - 44}" text-anchor="middle" class="rtc-time">RTC · --:--:--</text>
        <g class="src src-bat"><path d="M${cx - 170} ${cy + 250} Q ${cx - 95} ${cy + 150}, ${cx - 55} ${cy + 88}" class="arrow"/><text x="${cx - 330}" y="${cy + 285}" class="src-t">PILA 3 V → RTC</text></g>
        <g class="src src-sb"><path d="M1900 ${cy + 130} H${cx + 250} Q ${cx + 150} ${cy + 130}, ${cx + 90} ${cy + 80}" class="arrow sb"/><text x="1870" y="${cy + 110}" text-anchor="end" class="src-t sb">5 VSB DESDE LA FUENTE →</text></g>`;
      const hand = svg.querySelector('.rtc-hand'), time = svg.querySelector('.rtc-time');
      const tick = () => {
        const d = new Date();
        time.textContent = 'RTC · ' + d.toTimeString().slice(0, 8);
        gsap.to(hand, { rotation: d.getSeconds() * 6, svgOrigin: `${cx} ${cy}`, duration: RM ? 0 : .35, ease: 'back.out(3)' });
      };
      tick(); clearInterval(rtcTimer); rtcTimer = setInterval(tick, 1000);
      const set = (p) => {
        press(seg, seg.querySelector(`[data-p="${p}"]`));
        el.classList.toggle('plugged', p === 'on');
        World.routes('p24rtc', p === 'on');
        if (!first) snd(p === 'on' ? 'buzz' : 'pulse');
        World.lit('cmos', p === 'off', 'demo');
        msg.innerHTML = p === 'on'
          ? '<b>Fuente enchufada:</b> la placa alimenta el RTC con la tensión de standby (5 VSB). La pila apenas trabaja.'
          : '<b>Desenchufado:</b> la pila mantiene el reloj en marcha durante años. Si se agota, el PC pierde la fecha y, en muchas placas, los ajustes.';
        gsap.fromTo(msg, { opacity: 0 }, { opacity: 1, duration: .4 });
      };
      let first = true;
      seg.onclick = (e) => { const b = e.target.closest('button'); if (b) set(b.dataset.p); };
      set('off'); first = false;
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), $('.lede', el), seg, ...$$('.note', el)], { stagger: .08 }), .35)
        .add(M.draw(svg.querySelector('.rtc-ring'), { d: 1.4 }), .6)
        .from($$('.tk', svg), { opacity: 0, stagger: .01, duration: .2 }, .8)
        .from([hand, time], { opacity: 0, duration: .5 }, 1.4)
        .from($$('.src > *', svg), { opacity: 0, duration: .6 }, 1.6);
      return tl;
    },
    leave() { clearInterval(rtcTimer); },
  });

  /* ===================================================================
     19 · VIAJE DE LA ENERGÍA
     =================================================================== */
  const EN_CAM = { x: 122, y: 152.5, z: 1.0, sx: 1330, sy: 545 };
  const EN = {
    cpu: { cables: ['eps'], routes: ['eps', 'vcore'], parts: ['eps', 'vrm', 'socket'], hops: ['Fuente', 'EPS 12 V', 'VRM', 'CPU'],
      t: 'El VRM baja los 12 V a ≈1 V justo al lado del socket, donde la CPU los necesita.' },
    ram: { cables: ['atx'], routes: ['p24ram'], parts: ['atx24', 'dimm'], hops: ['Fuente', 'ATX 24 pines', 'Placa', 'Módulos'],
      t: 'En DDR5 cada módulo lleva su propio regulador (PMIC). En DDR4 el voltaje lo regula la placa.' },
    gpu: { cables: ['atx', 'gpu'], routes: ['p24pcie'], parts: ['atx24', 'pcie1'], hops: ['Fuente', 'Cables PCIe / 12V-2x6', 'GPU', '+ ranura ≤ 75 W'],
      t: 'La ranura aporta hasta 75 W. La mayor parte llega por cables directos desde la fuente.' },
    pch: { cables: ['atx'], routes: ['p24pch'], parts: ['atx24', 'pch'], hops: ['Fuente', 'ATX 24 pines', 'Reguladores', 'Chipset · USB'],
      t: 'Pequeños reguladores repartidos por la placa alimentan el chipset, los USB y el resto de circuitos.' },
  };
  Deck.register('energy', {
    scrim: 'l',
    cam: EN_CAM,
    world(W) { W.install('.inst-cpu, .inst-ram[data-i="1"], .inst-ram[data-i="3"], .inst-gpu'); },
    enter(el) {
      const svg = $('#enDg', el), read = $('#enRead', el), btns = $('#enBtns', el);
      const P = (x, y) => World.project(x, y, EN_CAM);
      const [ax, ay] = P(209, 44), [ex, ey] = P(35, 1), [gx, gy] = P(214, 131);
      const psu = { x: 780, y: 700 };
      svg.innerHTML = `
        <g class="psu"><rect x="${psu.x - 130}" y="${psu.y - 110}" width="260" height="220" rx="10"/>
          <circle cx="${psu.x - 30}" cy="${psu.y}" r="70" class="grill"/>${Array.from({ length: 5 }, (_, i) => `<circle cx="${psu.x - 30}" cy="${psu.y}" r="${14 * i + 8}" class="grill-r"/>`).join('')}
          <text x="${psu.x + 52}" y="${psu.y - 62}" class="t-big" font-size="28">PSU</text><text x="${psu.x - 112}" y="${psu.y + 96}" class="sm">AC → 12 · 5 · 3,3 V</text></g>
        <g class="cab" data-c="atx"><path d="M${psu.x + 130} ${psu.y - 60} C ${psu.x + 700} ${psu.y - 60}, ${ax - 80} ${ay - 160}, ${ax + 20} ${ay}"/><path class="cf" d="M${psu.x + 130} ${psu.y - 60} C ${psu.x + 700} ${psu.y - 60}, ${ax - 80} ${ay - 160}, ${ax + 20} ${ay}"/></g>
        <g class="cab" data-c="eps"><path d="M${psu.x} ${psu.y - 110} C ${psu.x} ${ey - 40}, ${ex - 200} ${ey - 30}, ${ex} ${ey}"/><path class="cf" d="M${psu.x} ${psu.y - 110} C ${psu.x} ${ey - 40}, ${ex - 200} ${ey - 30}, ${ex} ${ey}"/></g>
        <g class="cab" data-c="gpu"><path d="M${psu.x + 130} ${psu.y + 40} C ${psu.x + 900} ${psu.y + 40}, ${gx} ${gy + 300}, ${gx} ${gy}"/><path class="cf" d="M${psu.x + 130} ${psu.y + 40} C ${psu.x + 900} ${psu.y + 40}, ${gx} ${gy + 300}, ${gx} ${gy}"/></g>`;
      const set = (k) => {
        const d = EN[k];
        press(btns, btns.querySelector(`[data-k="${k}"]`));
        $$('.cab', svg).forEach((c) => c.classList.toggle('on', d.cables.includes(c.dataset.c)));
        World.routesOnly(d.routes);
        World.focus(d.parts);
        snd({ cpu: 'surge', ram: 'flow', gpu: 'zap', pch: 'buzz' }[k]);
        if (k === 'gpu') setTimeout(() => snd('surge'), 220);
        setTimeout(() => snd('trickle'), 420);
        read.innerHTML = `<div class="hops">${d.hops.map((h, i) => `<span style="--i:${i}">${h}</span>`).join('<i>→</i>')}</div><p class="note">${d.t}</p>`;
        gsap.fromTo($$('.hops span, .hops i', read), { opacity: 0, x: -8 }, { opacity: 1, x: 0, stagger: .08, duration: .3 });
        gsap.fromTo(read.querySelector('.note'), { opacity: 0 }, { opacity: 1, duration: .4, delay: .3 });
      };
      btns.onclick = (e) => { const b = e.target.closest('button'); if (b) set(b.dataset.k); };
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), ...$$('button', btns), $('.en-legend', el)], { stagger: .06 }), .35)
        .from(svg.querySelector('.psu'), { opacity: 0, x: -60, duration: .8, ease: 'power3.out' }, .5)
        .add(M.draw($$('.cab > path:first-child', svg), { d: 1.2, stagger: .2 }), .9)
        .call(() => snd('trail', 1), null, .9)   // estela de luz: la energía sale de la fuente
        .call(() => set('cpu'), null, 1.6);
      return tl;
    },
  });

  /* ===================================================================
     20 · VIAJE DE LOS DATOS — herramienta de diagnóstico
     =================================================================== */
  const DATA_CAM = { x: 122, y: 152.5, z: 1.0, sx: 660, sy: 545 };
  const DATA = [
    { k: 'ram', l: 'RAM', i: 'i-ram', r: ['mem'], p: ['socket', 'dimm'], hops: ['CPU · IMC', 'bus DDR5', 'DIMM'], t: 'Directo a la CPU: el camino más corto y más usado del sistema.' },
    { k: 'gpu', l: 'GPU', i: 'i-gpu', r: ['pcie16'], p: ['socket', 'pcie1'], hops: ['CPU', 'PCIe x16', 'GPU'], t: 'Lanes de la propia CPU, sin intermediarios.' },
    { k: 'nvme', l: 'NVMe (CPU)', i: 'i-ssd', r: ['m2a'], p: ['socket', 'm2'], hops: ['CPU', 'PCIe x4', 'M.2_1'], t: 'La primera M.2 suele ir directa a la CPU.' },
    { k: 'nvme2', l: 'NVMe (PCH)', i: 'i-ssd', r: ['dmi', 'm2b'], p: ['socket', 'pch', 'm2'], hops: ['CPU', 'enlace DMI', 'PCH', 'PCIe x4', 'M.2_2'], t: 'Pasa por el chipset: comparte su enlace con todo lo demás.' },
    { k: 'sata', l: 'SATA', i: 'i-hdd', r: ['dmi', 'sata'], p: ['socket', 'pch', 'sata'], hops: ['CPU', 'DMI', 'PCH', 'SATA', 'disco'], t: 'El controlador SATA vive en el chipset.' },
    { k: 'usb', l: 'USB', i: 'i-usb', r: ['dmi', 'usb'], p: ['socket', 'pch', 'usbh'], hops: ['CPU', 'DMI', 'PCH', 'USB'], t: 'La mayoría de USB cuelgan del chipset (algunos, de la CPU).' },
    { k: 'net', l: 'Red', i: 'i-net', r: ['dmi', 'lan'], p: ['socket', 'pch', 'lan'], hops: ['CPU', 'DMI', 'PCH', 'PCIe x1', 'LAN'], t: 'El controlador de red es un dispositivo PCIe más.' },
    { k: 'audio', l: 'Audio', i: 'i-audio', r: ['dmi', 'audio'], p: ['socket', 'pch', 'audio'], hops: ['CPU', 'DMI', 'PCH', 'HD Audio', 'códec'], t: 'El códec convierte digital ↔ analógico cerca de los jacks.' },
  ];
  const ALL_DATA = ['mem', 'pcie16', 'm2a', 'dmi', 'm2b', 'sata', 'usb', 'lan', 'audio'];
  Deck.register('data', {
    scrim: 'r',
    cam: DATA_CAM,
    world(W) { W.install('.inst-cpu, .inst-ram[data-i="1"], .inst-ram[data-i="3"]'); W.routesOnly(ALL_DATA); },
    enter(el) {
      const btns = $('#dataBtns', el), read = $('#dataRead', el);
      btns.innerHTML = DATA.map((d) => `<button data-k="${d.k}" aria-pressed="false"><svg><use href="#${d.i}"/></svg>${d.l}</button>`).join('') + '<button data-k="all" aria-pressed="true" class="all">Todas las rutas</button>';
      const set = (k) => {
        press(btns, btns.querySelector(`[data-k="${k}"]`));
        if (k === 'all') {
          if (!set.quiet) snd('trickle');
          World.routesOnly(ALL_DATA); World.focus(null);
          read.innerHTML = '<p class="note">Todas las rutas a la vez. Elige un dispositivo para aislar su camino.</p>';
          return;
        }
        const d = DATA.find((q) => q.k === k);
        snd('bits');
        World.routesOnly(d.r); World.focus(d.p);
        read.innerHTML = `<div class="hops">${d.hops.map((h) => `<span>${h}</span>`).join('<i>⇄</i>')}</div><p class="note">${d.t}</p>`;
        gsap.fromTo($$('.hops span, .hops i', read), { opacity: 0, x: -8 }, { opacity: 1, x: 0, stagger: .07, duration: .3 });
      };
      btns.onclick = (e) => { const b = e.target.closest('button'); if (b) set(b.dataset.k); };
      set.quiet = true; set('all'); set.quiet = false;
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), ...$$('button', btns), read], { stagger: .04 }), .35)
        .from($$('.route.on', World.svg), { opacity: 0, stagger: .12, duration: .5 }, .6);
      return tl;
    },
  });

  /* ===================================================================
     21 · DEL BOTÓN AL SISTEMA — la cámara sigue el recorrido
     =================================================================== */
  const BOOT = [
    ['Fuente', 'atx24', 'Siempre hay 5 V de standby. Al pulsar, la placa activa la señal PS_ON# y la fuente enciende sus raíles. Cuando son estables, responde con «Power Good».', ['p24pch']],
    ['Placa base', 'pch', 'La lógica de encendido de la placa pone en marcha, en orden, los reguladores: VRM de la CPU, memoria, chipset.', ['eps', 'vcore', 'p24ram']],
    ['Firmware', 'bios', 'Se libera el reset. Un procesador de seguridad integrado (PSP en AMD, CSME en Intel) prepara el terreno y la CPU ejecuta el UEFI del chip flash.', ['spi']],
    ['CPU', 'socket', 'El firmware inicializa núcleos, microcódigo y cachés.', []],
    ['Memoria', 'dimm', 'Entrenamiento de memoria: se calibran señales y tiempos con cada módulo. Si falla, no hay imagen (LED de diagnóstico o pitidos).', ['mem']],
    ['Dispositivos', 'pcie1', 'Se detectan PCIe, USB y SATA y se les asignan recursos. La POST termina.', ['pcie16', 'dmi']],
    ['Dispositivo de arranque', 'm2', 'El gestor de arranque de UEFI sigue el orden configurado y busca la partición de sistema EFI del disco.', ['m2a']],
    ['Cargador', 'm2', 'Se ejecuta el cargador (Windows Boot Manager, GRUB…), que carga el núcleo del sistema en la RAM.', ['m2a', 'mem']],
    ['Sistema operativo', null, 'El sistema toma el control del hardware y carga sus propios controladores. El firmware ha terminado su trabajo.', ALL_DATA],
  ];
  let bootRun = null;
  Deck.register('boot', {
    scrim: 'l',
    cam: { ...FULL(1390, 545, .95), o: .35 },
    world(W) { W.install('.inst-cpu, .inst-ram[data-i="1"], .inst-ram[data-i="3"], .inst-gpu, .inst-nvme'); },
    enter(el) {
      const line = $('#bootLine', el), stepEl = $('#bootStep', el), power = $('#bootPower', el), play = $('#bootPlay', el);
      line.innerHTML = BOOT.map((b, i) => `<button class="bn" role="listitem" data-i="${i}"><span class="bn-d"></span><span class="bn-n">${String(i + 1).padStart(2, '0')}</span><span class="bn-l">${b[0]}</span></button>`).join('');
      stepEl.hidden = true; power.hidden = false; play.hidden = true;
      let cur = -1, playing = false;
      const show = (i) => {
        cur = i;
        const [name, part, txt, routes] = BOOT[i];
        $$('.bn', line).forEach((b, j) => { b.classList.toggle('on', j === i); b.classList.toggle('done', j < i); });
        gsap.to(line, { '--prog': (i / (BOOT.length - 1)) * 100 + '%', duration: RM ? 0 : .6 });
        stepEl.hidden = false;
        $('.bs-n', stepEl).textContent = String(i + 1).padStart(2, '0');
        $('.bs-name', stepEl).textContent = name;
        $('.bs-text', stepEl).textContent = txt;
        $('.bs-part', stepEl).textContent = part ? '◉ ' + Board.PARTS[part].label : '◉ PLATAFORMA COMPLETA';
        gsap.fromTo($$('.bs-n, .bs-name, .bs-text, .bs-part', stepEl), { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: .07, duration: .55, ease: 'power3.out' });
        World.routesOnly(routes);
        World.svg.classList.toggle('is-live', !part);
        snd(['buzz', 'flow', 'spark', 'surge', 'flow', 'zap', 'tick', 'flow', 'power'][i]);
        if (part) { World.focus(part); World.to({ ...World.camFor(part, { sx: 1390, sy: 520, fill: .5, max: 3.2 }), o: 1 }, 1.1); }
        else { World.focus(null); World.to({ ...FULL(1390, 545, .95), o: 1 }, 1.2); }
      };
      const auto = (from) => {
        bootRun?.kill(); playing = true; play.hidden = false; play.textContent = '❚❚ Pausa';
        const run = bootRun = gsap.timeline({ onComplete: () => { playing = false; play.textContent = '↺ Repetir'; } });
        for (let i = from; i < BOOT.length; i++) run.call(() => show(i), null, (i - from) * 3.4);
        run.to({}, { duration: 1 });
      };
      power.onclick = () => {
        snd('power');
        gsap.to(power, { scale: .6, opacity: 0, duration: RM ? 0 : .5, ease: 'power2.in', onComplete: () => { power.hidden = true; } });
        auto(0);
      };
      play.onclick = () => {
        if (bootRun && playing) { bootRun.pause(); playing = false; play.textContent = '▶ Continuar'; }
        else if (bootRun && bootRun.paused()) { bootRun.resume(); playing = true; play.textContent = '❚❚ Pausa'; }
        else auto(cur >= BOOT.length - 1 ? 0 : cur + 1);
      };
      line.onclick = (e) => {
        const b = e.target.closest('.bn'); if (!b) return;
        bootRun?.kill(); bootRun = null; playing = false;
        power.hidden = true; play.hidden = false; play.textContent = '▶ Continuar';
        show(+b.dataset.i);
      };
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el)], {}), .3)
        .from(power, { scale: .5, opacity: 0, duration: .8, ease: 'back.out(2)' }, .5)
        .from($$('.bn', line), { opacity: 0, y: 16, stagger: .05, duration: .4 }, .7);
      M.loop(() => gsap.to(power, { '--pulse': 1, duration: 1.6, repeat: -1, ease: 'sine.inOut', yoyo: true }));
      return tl;
    },
    leave() { bootRun?.kill(); bootRun = null; World.svg.classList.remove('is-live'); },
  });

  /* ===================================================================
     22 · LA PLACA EN VIVO — 3D, cámara térmica, consumo y sonido
     Valores orientativos de un PC de gama media (no de un modelo concreto).
     =================================================================== */
  const LIVE_CAM = FULL(1370, 545, .92);
  const LOAD = {
    idle:   { f: .15, fan: '1.7s', flow: '1.6s', temp: { cpu: 42, vrm: 38, gpu: 36, pch: 46, m2: 38, ram: 34 }, w: { CPU: 22, GPU: 14, RAM: 6, Chipset: 7, SSD: 3, Ventiladores: 3 } },
    game:   { f: .65, fan: '.7s', flow: '.7s', temp: { cpu: 70, vrm: 56, gpu: 74, pch: 50, m2: 46, ram: 42 }, w: { CPU: 75, GPU: 200, RAM: 8, Chipset: 8, SSD: 4, Ventiladores: 8 } },
    render: { f: 1, fan: '.42s', flow: '.45s', temp: { cpu: 88, vrm: 72, gpu: 48, pch: 52, m2: 55, ram: 46 }, w: { CPU: 140, GPU: 45, RAM: 10, Chipset: 8, SSD: 6, Ventiladores: 12 } },
  };
  const WCAT = { CPU: 'cpu', GPU: 'io', RAM: 'mem', Chipset: 'fw', SSD: 'sto', Ventiladores: 'pwr' };
  // paleta térmica: azul frío → morado → rojo → naranja → amarillo → blanco
  const PAL = [[25, [27, 27, 110]], [40, [90, 30, 140]], [55, [192, 48, 107]], [70, [242, 104, 60]], [82, [251, 197, 74]], [95, [255, 255, 224]]];
  const heat = (t) => {
    t = Math.max(PAL[0][0], Math.min(PAL[PAL.length - 1][0], t));
    for (let i = 1; i < PAL.length; i++) if (t <= PAL[i][0]) {
      const [t0, c0] = PAL[i - 1], [t1, c1] = PAL[i], k = (t - t0) / (t1 - t0);
      return `rgb(${c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(',')})`;
    }
    return 'rgb(255,255,224)';
  };
  const SRC = {   // fuentes de sonido (mm)
    fan: [[136.5, 25.5], [105.5, 282.5], [227, 24], [123, 140]],
    coil: [[94, 25], [48, 64]],
    hum: [[209, 70], [173, 201]],
  };
  Deck.register('live', {
    scrim: 'l',
    cam: LIVE_CAM,
    world(W) {
      W.install('.inst-cpu, .inst-ram[data-i="1"], .inst-ram[data-i="3"], .inst-gpu, .inst-nvme');
      W.routesOnly(['eps', 'vcore', 'p24ram', 'p24pch', 'p24pcie']);
      W.svg.classList.add('live-flow', 'is-live');
      W.lit('fans', true, 'demo');
    },
    enter(el) {
      const svg = World.svg, bars = $('#wattBars', el), now = $('#wattNow', el), wall = $('#wattWall', el);
      const seg = $('#loadSeg', el), tTh = $('#tglThermal', el), tSnd = $('#tglSound', el), drag = $('#liveDrag', el);
      let load = 'idle', total = 0, sound = true, lastLv = { fan: 0, coil: 0, hum: 0 };
      const temps = { ...LOAD.idle.temp };
      bars.innerHTML = Object.keys(LOAD.idle.w).map((k) => `<div class="wb" data-cat="${WCAT[k]}"><span>${k}</span><div class="wb-track"><div class="wb-fill"></div></div><span class="wb-v">0 W</span></div>`).join('');
      // pinta la cámara térmica con las temperaturas actuales
      const paint = () => {
        Object.keys(Board.THERMAL).forEach((k) => {
          const t = temps[k.startsWith('vrm') ? 'vrm' : k];
          const st = svg.querySelectorAll(`#th-${k} stop`);
          st[0].setAttribute('stop-color', heat(t + 4));
          st[1].setAttribute('stop-color', heat(t - 10));
          st[2].setAttribute('stop-color', heat(t - 30));
          const lab = svg.querySelector(`.th-lab[data-k="${k}"]`);
          if (lab) lab.textContent = `${k.startsWith('vrm') ? 'VRM ' : k === 'm2' ? 'SSD ' : k.toUpperCase() + ' '}${Math.round(t)} °C`;
        });
      };
      const setLoad = (l, quiet) => {
        load = l; press(seg, seg.querySelector(`[data-l="${l}"]`));
        const L = LOAD[l], w = Object.values(L.w), sum = w.reduce((a, b) => a + b, 0);
        M.count(now, sum, { from: total, d: RM ? 0 : .9 }); total = sum;
        wall.textContent = `Desde el enchufe ≈ ${Math.round(sum / .9)} W · la fuente pierde ~10 % en calor`;
        $$('.wb', bars).forEach((row, i) => {
          gsap.to(row.querySelector('.wb-fill'), { width: Math.min(100, w[i] / 2.2) + '%', duration: RM ? 0 : .8, ease: 'power3.out' });
          M.count(row.querySelector('.wb-v'), w[i], { from: parseInt(row.querySelector('.wb-v').textContent, 10) || 0, d: RM ? 0 : .8, suffix: ' W' });
        });
        gsap.to(temps, { ...L.temp, duration: RM ? 0 : 1.6, ease: 'power2.out', onUpdate: paint });
        $$('.fan-rotor animateTransform', svg).forEach((a) => a.setAttribute('dur', L.fan));
        svg.style.setProperty('--flow-d', L.flow);
        if (!quiet) snd(l === 'idle' ? 'pulse' : l === 'game' ? 'surge' : 'power');
        if (sound) window.Music?.proxSet(lastLv, L.f);
      };
      seg.onclick = (e) => { const b = e.target.closest('button'); if (b) setLoad(b.dataset.l); };
      tTh.onclick = () => {
        const on = tTh.getAttribute('aria-pressed') !== 'true';
        tTh.setAttribute('aria-pressed', on); svg.classList.toggle('show-thermal', on); el.classList.toggle('thermal-on', on);
        snd(on ? 'surge' : 'tick');
      };
      tSnd.onclick = () => {
        sound = tSnd.getAttribute('aria-pressed') !== 'true';
        tSnd.setAttribute('aria-pressed', sound);
        if (!sound) window.Music?.proxStop(); else window.Music?.proxSet(lastLv, LOAD[load].f);
      };
      $('#tglCenter', el).onclick = () => World.to({ ...LIVE_CAM }, .9);

      // posición del ratón → mm de la placa (aprox. ignorando la inclinación)
      const toMM = (e) => { const [px, py] = Stage.toStage(e.clientX, e.clientY), st = World.state, k = (1000 / Board.VB.h) * st.z; return [st.x + (px - st.sx) / k, st.y + (py - st.sy) / k]; };
      const near = (pts, [x, y], R) => Math.max(0, ...pts.map(([a, b]) => 1 - Math.hypot(a - x, b - y) / R));
      const listen = (e) => {
        const p = toMM(e);
        lastLv = { fan: near(SRC.fan, p, 55), coil: near(SRC.coil, p, 45), hum: near(SRC.hum, p, 50) };
        if (sound) window.Music?.proxSet(lastLv, LOAD[load].f);
      };
      // arrastrar = girar la placa en 3D
      let d0 = null;
      drag.addEventListener('pointerdown', (e) => {
        drag.setPointerCapture(e.pointerId); drag.classList.add('dragging');
        World.halt(1100);
        d0 = { x: e.clientX, y: e.clientY, rx: World.state.rx, rz: World.state.rz };
      });
      drag.addEventListener('pointermove', (e) => {
        if (!d0) { listen(e); return; }
        const sc = Stage.scale;
        World.state.rx = Math.max(0, Math.min(58, d0.rx + (e.clientY - d0.y) / sc * .16));
        World.state.rz = Math.max(-45, Math.min(45, d0.rz + (e.clientX - d0.x) / sc * .12));
        World.apply();
      });
      const end = () => { d0 = null; drag.classList.remove('dragging'); };
      drag.addEventListener('pointerup', end); drag.addEventListener('pointercancel', end);
      drag.addEventListener('pointerleave', () => { if (!d0) { lastLv = { fan: 0, coil: 0, hum: 0 }; window.Music?.proxSet(lastLv, 0); } });
      drag.addEventListener('dblclick', () => World.to({ ...LIVE_CAM }, .9));

      paint(); setLoad('idle', true);
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), $('.live-help', el), $('.live-ctl', el), $('.watt', el), $('.live-foot', el)], { stagger: .08 }), .35)
        .call(() => snd('power'), null, 1);
      // la cámara se inclina un poco al entrar: invita a girarla
      tl.call(() => World.to({ ...LIVE_CAM, rx: 24, rz: -12 }, 1.6, 'power2.inOut'), null, 1.5);
      return tl;
    },
    leave() { window.Music?.proxStop(); },
  });

  /* ===================================================================
     23 · CONSTRUYE TU PC — drag & drop educativo
     =================================================================== */
  const ITEMS = [
    { k: 'cpu', n: 'Procesador', i: 'i-cpu', to: 'socket', inst: '.inst-cpu', ok: 'La CPU va en el socket: la única interfaz para sus más de mil contactos.' },
    { k: 'ram', n: 'Módulo de RAM', i: 'i-ram', to: 'dimm', inst: '.inst-ram[data-i="1"]', ok: 'La RAM va en las ranuras DIMM, junto al socket: su controlador está en la CPU.' },
    { k: 'gpu', n: 'Tarjeta gráfica', i: 'i-gpu', to: 'pcie1', inst: '.inst-gpu', ok: 'La gráfica va en la ranura PCIe x16 principal, unida a las lanes de la CPU.' },
    { k: 'nvme', n: 'SSD NVMe M.2', i: 'i-ssd', to: 'm2', inst: '.inst-nvme', ok: 'Un SSD NVMe va en una ranura M.2: habla NVMe sobre PCIe.' },
    { k: 'sata', n: 'SSD SATA 2,5"', i: 'i-hdd', to: 'sata', cable: { box: [222, 181, 20, 9], dir: [1, 0], wires: ['#c0392b'], flat: true }, ok: 'Un SSD de 2,5" se conecta con un cable de datos a un puerto SATA.' },
    { k: 'wifi', n: 'Tarjeta de red Wi-Fi (x1)', i: 'i-wifi', to: 'pcieaux', inst: '.inst-wifi', ok: 'La tarjeta de red va en la ranura PCIe x1, la pequeña bajo la gráfica. También valdría la larga inferior (x4).' },
    { k: 'eps', n: 'Cable EPS 8 pines', i: 'i-cable', to: 'eps', cable: { box: [25, 1, 19.5, 10.5], dir: [0, -1], wires: ['#f1c40f', '#151515', '#f1c40f', '#151515', '#f1c40f', '#151515', '#f1c40f', '#151515'] }, ok: 'El EPS de 8 pines alimenta el VRM de la CPU: esquina superior izquierda.' },
    { k: 'atx', n: 'Cable ATX 24 pines', i: 'i-psu', to: 'atx24', cable: { box: [202, 44, 14, 53], dir: [1, 0], wires: ['#e74c3c', '#151515', '#f1c40f', '#151515', '#ff8c1a', '#151515', '#e74c3c', '#9b59b6', '#151515', '#f1c40f', '#27ae60', '#151515'] }, ok: 'El conector de 24 pines es la alimentación principal: borde derecho.' },
    { k: 'fan', n: 'Ventilador de CPU', i: 'i-fan', to: 'fans', cable: { box: [131, 34.5, 11, 5.5], dir: [0, -1], wires: ['#151515', '#e74c3c', '#f1c40f', '#3498db'] }, ok: 'El ventilador del disipador va a un header de 4 pines: CPU_FAN, junto al socket.' },
    { k: 'fp', n: 'Botón de encendido', i: 'i-btn', to: 'fpanel', cable: { box: [198, 290.5, 20, 9.5], dir: [0, 1], wires: ['#ecf0f1', '#27ae60', '#e74c3c', '#3498db', '#f1c40f'] }, ok: 'El botón de la caja va al header F_PANEL, abajo a la derecha.' },
  ];
  const SPECIAL = {
    'nvme>sata': 'El puerto SATA es otra interfaz, más antigua. Un NVMe necesita las lanes PCIe de una ranura M.2.',
    'sata>m2': 'Casi: existen SSD M.2 SATA, pero éste es de 2,5" y se conecta por cable a un puerto SATA.',
    'wifi>pcie1': 'Cabría (una tarjeta x1 funciona en una ranura x16), pero ocuparías la ranura que necesita la gráfica.',
    'wifi>lan': 'Ese chip ya es la red por cable (Ethernet) integrada en la placa. Una tarjeta de red de expansión va en una ranura PCIe, la x1.',
    'wifi>io': 'El panel trasero sólo tiene conectores. La tarjeta de red se instala dentro, en una ranura PCIe x1.',
    'wifi>m2': 'Hay tarjetas Wi-Fi en formato M.2 (clave E), pero ésta es una tarjeta PCIe x1: va en la ranura x1.',
    'gpu>pcieaux': 'La ranura grande de abajo suele tener sólo 4 lanes y cuelga del chipset. La gráfica va en la x16 principal.',
    'fan>usbh': 'Parecen pines similares, pero un USB no es un header de ventilador. Busca uno de 4 pines (PWM).',
    'eps>atx24': 'El de 24 pines es la alimentación general. La CPU necesita su propio EPS de 8 pines, junto al VRM.',
    'atx>eps': 'Ése es el EPS, de 8 pines, para la CPU. El de 24 pines va en el borde derecho de la placa.',
  };
  /* Cable que se enchufa: el conector llega desde fuera, encaja en los pines
     (clic), se queda un momento y se desvanece para no estorbar. */
  function plugCable(c, key) {
    const [x, y, w, h] = c.box, [dx, dy] = c.dir;
    const horiz = dx !== 0;
    const bw = horiz ? h : w;                         // grosor del mazo de cables
    // punto de salida del conector (lado por donde entra el cable)
    const sx = dx > 0 ? x + w : dx < 0 ? x : x + w / 2;
    const sy = dy > 0 ? y + h : dy < 0 ? y : y + h / 2;
    const ex = sx + dx * 55 + (horiz ? 0 : 18), ey = sy + dy * 55 + (horiz ? -14 : 0);
    const c1x = sx + dx * 25, c1y = sy + dy * 25;
    const n = c.wires.length, pitch = Math.min(bw / n, 2.4);
    let wires = '';
    c.wires.forEach((col, i) => {
      const o = (i - (n - 1) / 2) * pitch;
      const ox = horiz ? 0 : o, oy = horiz ? o : 0;
      wires += `<path d="M${sx + ox} ${sy + oy} C ${c1x + ox} ${c1y + oy}, ${c1x + ox} ${c1y + oy}, ${ex + ox} ${ey + oy}" stroke="${col}" stroke-width="${c.flat ? bw * .55 : pitch * .8}" fill="none" stroke-linecap="round"/>`;
    });
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'plug-cable');
    g.innerHTML = `${wires}<rect x="${x - .6}" y="${y - .6}" width="${w + 1.2}" height="${h + 1.2}" rx="1" class="pc-housing"/>
      <rect x="${x + .6}" y="${y + .6}" width="${w - 1.2}" height="${h - 1.2}" rx=".6" class="pc-face"/>
      <rect x="${dx > 0 ? x + w - 1.6 : x}" y="${dy > 0 ? y + h - 1.6 : y}" width="${horiz ? 1.6 : w}" height="${horiz ? h : 1.6}" class="pc-latch"/>`;
    World.svg.querySelector('.routes').before(g);
    const d = 22, tl = gsap.timeline({ onComplete: () => g.remove() });
    tl.fromTo(g, { x: dx * d, y: dy * d, opacity: 0 }, { x: dx * 2.5, y: dy * 2.5, opacity: 1, duration: .45, ease: 'power2.out' })
      .to(g, { x: 0, y: 0, duration: .12, ease: 'power4.in' })
      .call(() => window.Music?.place(key, false))
      .to(g, { x: -dx * .6, y: -dy * .6, duration: .05, yoyo: true, repeat: 1 })
      .to(g, { opacity: 0, x: dx * 6, y: dy * 6, duration: .6, ease: 'power2.in' }, '+=1.1');
    return tl;
  }
  const partName = (id) => C.parts[id]?.name || Board.PARTS[id].label;
  Deck.register('build', {
    scrim: 'l',
    cam: FULL(1300, 545, 1.02),
    enter(el) {
      const tray = $('#tray', el), read = $('#buildRead', el), ghost = $('#dragGhost', el);
      const done = new Set();
      let sel = null;
      tray.innerHTML = ITEMS.map((it) => `<button class="it" data-k="${it.k}" aria-pressed="false"><svg><use href="#${it.i}"/></svg><span>${it.n}</span></button>`).join('');
      const say = (type, html) => {
        read.dataset.state = type;
        $('.br-k', read).textContent = type === 'ok' ? 'CORRECTO' : type === 'bad' ? 'REVISA' : type === 'win' ? 'SISTEMA COMPLETO' : 'ESTADO';
        $('.br-v', read).innerHTML = html;
        gsap.fromTo(read, { opacity: .3 }, { opacity: 1, duration: .35 });
      };
      const hints = (on) => Object.keys(Board.PARTS).forEach((id) => World.lit(id, on && !done.has(ITEMS.find((i) => i.to === id)?.k), 'hint'));
      const select = (k) => {
        sel = k;
        $$('.it', tray).forEach((b) => b.setAttribute('aria-pressed', b.dataset.k === k ? 'true' : 'false'));
        hints(!!k);
        if (k) say('', `<b>${ITEMS.find((i) => i.k === k).n}</b>: ¿dónde lo instalarías? Pulsa una zona de la placa.`);
      };
      const drop = (k, part) => {
        const it = ITEMS.find((i) => i.k === k);
        hints(false);
        if (part === it.to) {
          // cada pieza suena a su propio encaje; los cables, al conectar (dentro de plugCable)
          if (it.cable) setTimeout(() => window.Music?.sfx('ok'), 1000); else window.Music?.place(k);
          done.add(k);
          const b = tray.querySelector(`[data-k="${k}"]`); b.classList.add('done'); b.disabled = true; b.setAttribute('aria-pressed', 'false');
          if (it.inst) {
            const inst = World.svg.querySelector(it.inst); inst.classList.add('on');
            gsap.fromTo(inst, { scale: 1.12, svgOrigin: Board.bboxOf(it.to).slice(0, 2).map((v, i) => v + Board.bboxOf(it.to)[i + 2] / 2).join(' ') }, { scale: 1, duration: .5, ease: 'back.out(2.4)' });
          }
          World.lit(part, true, 'ok');
          if (it.cable) plugCable(it.cable, k);
          say(done.size === ITEMS.length ? 'win' : 'ok', done.size === ITEMS.length ? '10 / 10. Todas las piezas están en su sitio: la placa ya puede comunicarse con todo.' : `${it.ok} <span class="cnt">${done.size} / ${ITEMS.length}</span>`);
          if (done.size === ITEMS.length) { setTimeout(() => snd('surge'), 650); setTimeout(() => snd('flow'), 1300); World.svg.classList.add('is-live'); World.routesOnly(ALL_DATA.concat(['eps', 'vcore'])); }
        } else {
          window.Music?.sfx('bad');
          const why = SPECIAL[`${k}>${part}`] || `Eso es: <b>${partName(part)}</b>. ${it.ok}`;
          say('bad', why);
          World.lit(part, true, 'bad');
          World.lit(it.to, true, 'hint');
          setTimeout(() => { World.lit(part, false, 'bad'); World.lit(it.to, false, 'hint'); }, 2200);
        }
        select(null);
      };
      World.interactive(true, (part) => { if (sel) drop(sel, part); else say('', 'Primero elige una pieza de la bandeja.'); }, { extra: true });
      tray.onclick = (e) => { const b = e.target.closest('.it'); if (b && !b.disabled && !b.dataset.dragged) select(sel === b.dataset.k ? null : b.dataset.k); delete b?.dataset.dragged; };

      // arrastrar con puntero (ratón o táctil)
      let drag = null;
      tray.addEventListener('pointerdown', (e) => {
        const b = e.target.closest('.it'); if (!b || b.disabled) return;
        drag = { k: b.dataset.k, b, x0: e.clientX, y0: e.clientY, on: false };
      });
      const move = (e) => {
        if (!drag) return;
        if (!drag.on && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) {
          drag.on = true; ghost.innerHTML = drag.b.innerHTML; ghost.classList.add('show'); hints(true);
          $$('.it', tray).forEach((q) => q.setAttribute('aria-pressed', 'false'));
        }
        if (!drag.on) return;
        const [x, y] = Stage.toStage(e.clientX, e.clientY);
        ghost.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('.part');
        $$('.part.over', World.svg).forEach((p) => p !== over && p.classList.remove('over'));
        over?.classList.add('over');
      };
      const up = (e) => {
        if (!drag) return;
        const d = drag; drag = null;
        if (!d.on) return;
        d.b.dataset.dragged = '1';
        ghost.classList.remove('show');
        $$('.part.over', World.svg).forEach((p) => p.classList.remove('over'));
        const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('.part');
        if (over) drop(d.k, over.dataset.part); else { hints(false); say('', 'Suelta la pieza sobre una zona de la placa.'); }
      };
      addEventListener('pointermove', move); addEventListener('pointerup', up);
      this.cleanup = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
      say('', `0 / ${ITEMS.length} piezas instaladas.`);
      const tl = gsap.timeline();
      tl.add(M.title($('.h2', el)), .2)
        .add(M.rise([$('.kicker', el), $('.build-help', el)], { stagger: .1 }), .3)
        .fromTo($$('.it', tray), { opacity: 0, y: 20, scale: .96 }, { opacity: 1, y: 0, scale: 1, stagger: .04, duration: .45 }, .5);
      return tl;
    },
    leave() { this.cleanup?.(); },
  });

  /* ===================================================================
     24 · QUIZ — hardware lab challenge
     =================================================================== */
  const QUIZ = [
    { type: 'hot', tag: 'Localiza', q: 'Señala el chipset (PCH) en la placa.', a: 'pch', ex: 'El PCH es el disipador plano de la zona inferior derecha: el hub de entrada/salida.' },
    { type: 'choice', tag: 'Componente', q: '¿Qué convierte los 12 V de la fuente en el voltaje que usa la CPU?', o: ['VRM', 'Chipset', 'Pila CMOS', 'Puerto SATA'], a: 0, lit: 'vrm', ex: 'El VRM, con sus fases (MOSFET, bobinas y condensadores) junto al socket.' },
    { type: 'tf', tag: 'Verdadero / falso', q: 'Una ranura PCIe x16 hace que cualquier tarjeta vaya 16 veces más rápido.', a: false, ex: 'Más lanes = un enlace más ancho. Sólo ayuda si el dispositivo necesita ese ancho de banda.' },
    { type: 'choice', tag: 'Conexión', q: 'En una plataforma actual, ¿a qué se conecta directamente la RAM?', o: ['Al controlador de memoria de la CPU', 'Al chipset', 'Al chip de la BIOS', 'Al VRM'], a: 0, lit: 'dimm', ex: 'El controlador de memoria está integrado en la CPU desde hace años.' },
    { type: 'order', tag: 'Ordena el proceso', q: 'Ordena el arranque. Pulsa los pasos en orden.', o: ['Power Good de la fuente', 'UEFI empieza a ejecutarse', 'Entrenamiento de memoria', 'Cargador del sistema operativo'], ex: 'Energía estable → firmware → memoria → arranque del sistema.' },
    { type: 'hot', tag: 'Identifica la ranura', q: '¿Dónde instalarías la tarjeta gráfica?', a: 'pcie1', ex: 'En la PCIe x16 principal, la reforzada, unida a las lanes de la CPU.' },
    { type: 'match', tag: 'Asocia función', q: 'Une cada componente con su función.', pairs: [['UEFI', 'Inicializa el hardware y arranca'], ['RTC', 'Mantiene fecha y hora'], ['VRM', 'Regula la energía de la CPU'], ['PCH', 'Reparte USB, SATA, red y audio']], ex: 'Firmware, reloj, energía y E/S: cuatro funciones, cuatro sitios de la placa.' },
    { type: 'tf', tag: 'Verdadero / falso', q: 'Todos los SSD M.2 usan NVMe.', a: false, ex: 'M.2 es el formato. También existen SSD M.2 SATA, que usan AHCI.' },
    { type: 'choice', tag: 'Configuración', q: 'Placa con 4 ranuras y 2 módulos de RAM: ¿dónde van normalmente?', o: ['A2 y B2', 'A1 y A2', 'B1 y B2', 'Da igual'], a: 0, lit: 'dimm', ex: 'Un módulo por canal, en las ranuras que recomienda el fabricante (normalmente A2 y B2). Confírmalo en el manual.' },
    { type: 'tf', tag: 'Verdadero / falso', q: 'La pila CMOS guarda el firmware UEFI.', a: false, ex: 'El firmware está en un chip flash no volátil. La pila mantiene el RTC (y, en algunas placas, ciertos ajustes).' },
  ];
  const LET = 'ABCD';
  Deck.register('quiz', {
    scrim: 'l',
    cam: FULL(1350, 545, .98),
    world(W) { W.install('.inst-cpu'); },
    enter(el) {
      const card = $('#quizCard', el), bar = $('#quizBar', el);
      let i = 0, score = 0, streak = 0; const res = [];
      bar.innerHTML = QUIZ.map((_, j) => `<span data-j="${j}"></span>`).join('');
      const paintBar = () => $$('span', bar).forEach((s, j) => { s.className = j === i ? 'now' : res[j] == null ? '' : res[j] ? 'ok' : 'bad'; });
      const finish = (ok, extra = '') => {
        const q = QUIZ[i];
        res[i] = ok; if (ok) score++;
        streak = ok ? streak + 1 : 0;
        setTimeout(() => snd(ok ? 'qok' : 'qbad', streak - 1), 90);
        paintBar();
        World.interactive(false);
        const fb = card.querySelector('.qfb');
        fb.dataset.ok = ok ? '1' : '0';
        fb.innerHTML = `<span class="qfb-k mono">${ok ? '✓ DIAGNÓSTICO CORRECTO' : '✕ REVISA'}</span><p>${extra}${q.ex}</p><button class="btn solid qnext">${i === QUIZ.length - 1 ? 'Ver resultado' : 'Siguiente'} <span class="arr">→</span></button>`;
        gsap.fromTo(fb, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45 });
        fb.querySelector('.qnext').onclick = () => { i++; i < QUIZ.length ? render() : result(); };
        fb.querySelector('.qnext').focus({ preventScroll: true });
        $$('.qopts button', card).forEach((b) => { b.disabled = true; });
        if (q.lit) World.focus(q.lit);
        if (q.type === 'hot') World.focus(q.a);
      };
      const render = () => {
        const q = QUIZ[i];
        paintBar();
        World.focus(null); World.interactive(false);
        $$('.part', World.svg).forEach((p) => p.classList.remove('ok', 'bad'));
        let body = '';
        if (q.type === 'choice') body = `<div class="qopts">${q.o.map((o, j) => `<button data-j="${j}"><span class="ql">${LET[j]}</span>${o}</button>`).join('')}</div>`;
        if (q.type === 'tf') body = `<div class="qopts tf"><button data-v="1"><span class="ql">V</span>Verdadero</button><button data-v="0"><span class="ql">F</span>Falso</button></div>`;
        if (q.type === 'hot') body = `<div class="qhot mono"><span class="pulse-dot"></span>Pulsa directamente sobre la placa →</div>`;
        if (q.type === 'order') {
          const sh = q.o.map((t, j) => [t, j]).sort((a, b) => ((a[1] * 7 + 3) % 4) - ((b[1] * 7 + 3) % 4));
          body = `<div class="qopts order">${sh.map(([t, j]) => `<button data-j="${j}"><span class="ql">·</span>${t}</button>`).join('')}</div>`;
        }
        if (q.type === 'match') {
          const right = q.pairs.map((p, j) => [p[1], j]).sort((a, b) => ((a[1] * 3 + 1) % 4) - ((b[1] * 3 + 1) % 4));
          body = `<div class="qmatch"><div class="qopts ml">${q.pairs.map((p, j) => `<button data-j="${j}"><span class="ql">${LET[j]}</span>${p[0]}</button>`).join('')}</div>
            <div class="qopts mr">${right.map(([t, j]) => `<button data-j="${j}"><span class="ql">·</span>${t}</button>`).join('')}</div></div>`;
        }
        snd('qin');
        card.innerHTML = `<div class="qh mono"><span>Q ${String(i + 1).padStart(2, '0')} / ${QUIZ.length}</span><span class="qtag">${q.tag}</span></div>
          <p class="qq">${q.q}</p>${body}<div class="qfb"></div>`;
        gsap.fromTo(card.children, { opacity: 0, y: 18 }, { opacity: 1, y: 0, stagger: .06, duration: .45, ease: 'power3.out' });
        const opts = card.querySelector('.qopts');
        if (q.type === 'choice') opts.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; const ok = +b.dataset.j === q.a; b.classList.add(ok ? 'ok' : 'bad'); opts.children[q.a].classList.add('ok'); finish(ok); };
        if (q.type === 'tf') opts.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; const ok = (b.dataset.v === '1') === q.a; b.classList.add(ok ? 'ok' : 'bad'); finish(ok); };
        if (q.type === 'hot') {
          World.interactive(true, (part) => {
            const ok = part === q.a;
            World.lit(part, true, ok ? 'ok' : 'bad');
            finish(ok, ok ? '' : `Has señalado: <b>${partName(part)}</b>. `);
          });
        }
        if (q.type === 'order') {
          let n = 0, ok = true;
          opts.onclick = (e) => {
            const b = e.target.closest('button'); if (!b || b.classList.contains('picked')) return;
            const good = +b.dataset.j === n; if (!good) ok = false;
            b.classList.add('picked', good ? 'ok' : 'bad'); b.querySelector('.ql').textContent = n + 1; n++;
            if (n < q.o.length) setTimeout(() => snd(good ? 'qstep' : 'qbad', n - 1), 40);
            if (n === q.o.length) finish(ok, ok ? '' : 'El orden correcto: ' + q.o.join(' → ') + '. ');
          };
        }
        if (q.type === 'match') {
          let left = null, made = 0, ok = true;
          const ml = card.querySelector('.ml'), mr = card.querySelector('.mr');
          ml.onclick = (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; $$('button', ml).forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); left = b; };
          mr.onclick = (e) => {
            const b = e.target.closest('button'); if (!b || b.disabled || !left) return;
            const good = b.dataset.j === left.dataset.j; if (!good) ok = false;
            [left, b].forEach((x) => { x.classList.remove('sel'); x.classList.add(good ? 'ok' : 'bad'); x.disabled = true; });
            b.querySelector('.ql').textContent = LET[+left.dataset.j]; left = null; made++;
            if (made < q.pairs.length) setTimeout(() => snd(good ? 'qstep' : 'qbad', made - 1), 40);
            if (made === q.pairs.length) finish(ok, ok ? '' : 'Correcto: ' + q.pairs.map((p) => `${p[0]} → ${p[1].toLowerCase()}`).join(' · ') + '. ');
          };
        }
      };
      const result = () => {
        World.focus(null); World.svg.classList.add('is-live'); World.routesOnly(ALL_DATA);
        paintBar();
        const verdict = score >= 9 ? 'Experto de laboratorio' : score >= 6 ? 'Sistema estable' : 'Revisa los módulos';
        card.innerHTML = `<div class="qh mono"><span>DIAGNÓSTICO COMPLETADO</span><span class="qtag">${verdict}</span></div>
          <div class="qscore"><b class="qs-n">0</b><span>/ ${QUIZ.length}</span></div>
          <div class="qres mono">${QUIZ.map((q, j) => `<span class="${res[j] ? 'ok' : 'bad'}">${res[j] ? '✓' : '✕'} ${String(j + 1).padStart(2, '0')} · ${q.tag}</span>`).join('')}</div>
          <button class="btn qagain">↺ Repetir el reto</button>`;
        M.count(card.querySelector('.qs-n'), score, { d: 1.2 });
        for (let k = 0; k < score; k++) setTimeout(() => snd('qcount', k), 120 + k * (1100 / Math.max(score, 1)));
        setTimeout(() => snd('qfinal', score), 1400);
        gsap.from(card.children, { opacity: 0, y: 18, stagger: .08, duration: .5 });
        card.querySelector('.qagain').onclick = () => { i = 0; score = 0; res.length = 0; World.svg.classList.remove('is-live'); World.routesOnly([]); render(); };
      };
      render();
      const tl = gsap.timeline();
      tl.add(M.rise([$('.kicker', el), bar], { stagger: .1 }), .2);
      return tl;
    },
  });

  /* ===================================================================
     25 · FINAL — todo vuelve a encenderse
     =================================================================== */
  const END_SEQ = [
    [['socket'], []], [['dimm'], ['mem']], [['vrm', 'eps'], ['eps', 'vcore']], [['pcie1', 'pcieaux'], ['pcie16', 'aux']],
    [['m2', 'sata'], ['m2a', 'm2b', 'sata']], [['io', 'lan', 'audio', 'usbh'], ['usb', 'lan', 'audio']], [['pch'], ['dmi']], [['bios', 'cmos'], ['spi']],
  ];
  Deck.register('end', {
    scrim: 'l',
    cam: FULL(1300, 545, .96),
    camLive: true,
    world(W) { W.install('.inst-cpu, .inst-ram[data-i="1"], .inst-ram[data-i="3"]'); W.focus([]); },
    enter(el) {
      const list = $$('#endList span', el);
      $('#endRestart', el).onclick = () => Deck.go(0);
      const tl = gsap.timeline();
      END_SEQ.forEach(([parts, routes], j) => {
        tl.call(() => { parts.forEach((p) => World.part(p).classList.add('sel')); World.routes(routes); snd('pulse', j * 2); }, null, .6 + j * .38)
          .from(list[j], { opacity: 0, x: -24, duration: .45, ease: 'power3.out' }, .6 + j * .38);
      });
      tl.call(() => { World.focus(null); World.svg.classList.add('is-live', 'show-co'); snd('power'); }, null, 4)
        .from($$('.co', World.svg), { opacity: 0, stagger: .06, duration: .5 }, 4)
        .from($('.end-a', el), { opacity: 0, y: 30, duration: 1, ease: 'power3.out' }, 4.3)
        .from($('.end-b', el), { opacity: 0, y: 30, duration: 1.2, ease: 'power3.out' }, 6.2)
        .from([$('.end-credit', el), $('.end-restart', el)], { opacity: 0, duration: .6, stagger: .2 }, 7.4);
      tl.call(() => World.to(FULL(1300, 545, .9), RM ? 0 : 10, 'power1.inOut', { live: true }), null, 1.5);
      return tl;
    },
  });
})();
