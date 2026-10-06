/* =====================================================================
   ENGINE
   ---------------------------------------------------------------------
   1. Stage   · escenario fijo 1920×1080 escalado al viewport
   2. World   · la placa base persistente + cámara virtual
   3. M       · gramática de motion (helpers GSAP)
   4. Deck    · navegación, progreso, teclado, swipe, pantalla completa
   5. Edit    · edición inline ligera (tecla E)
   ===================================================================== */
(function () {
  'use strict';

  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  window.$ = $; window.$$ = $$; window.RM = RM;

  /* ===================================================================
     1. STAGE
     =================================================================== */
  const Stage = {
    el: null, scale: 1, rect: null,
    init() {
      this.el = $('#deckStage');
      const fit = () => {
        const s = Math.min(innerWidth / 1920, innerHeight / 1080);
        const x = (innerWidth - 1920 * s) / 2, y = (innerHeight - 1080 * s) / 2;
        this.scale = s;
        this.el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
        this.rect = { x, y };
      };
      fit();
      addEventListener('resize', fit);
    },
    // convierte coordenadas de cliente → coordenadas del escenario 1920×1080
    toStage(cx, cy) { return [(cx - this.rect.x) / this.scale, (cy - this.rect.y) / this.scale]; },
    rectOf(el) {
      const r = el.getBoundingClientRect();
      const [x, y] = this.toStage(r.left, r.top);
      return { x, y, w: r.width / this.scale, h: r.height / this.scale, cx: x + r.width / this.scale / 2, cy: y + r.height / this.scale / 2 };
    },
  };

  /* ===================================================================
     2. WORLD — cámara sobre la placa
     El SVG mide 1000px de alto a zoom 1 → K px por mm.
     Estado de cámara: (x,y) punto de la placa en mm que se coloca en
     (sx,sy) del escenario, con zoom z, inclinación rx/rz y opacidad o.
     =================================================================== */
  const VB = Board.VB;
  const K = 1000 / VB.h;
  const World = {
    el: null, tilt: null, cam: null, svg: null,
    state: { x: 122, y: 152, z: 1, sx: 1180, sy: 540, rx: 0, rz: 0, o: 0 },
    tween: null,
    init() {
      this.el = $('#world'); this.tilt = $('#tilt'); this.cam = $('#cam');
      this.cam.innerHTML = Board.svg();
      this.svg = $('#mb');
      this.restLayout(0);
      this.apply();
      this.bindParts();
    },
    /* CÁMARA
       · En reposo: el SVG real, del tamaño del escenario, encuadrado con su
         viewBox → nítido, interactivo y con sus animaciones.
       · En movimiento: se hace UNA instantánea de la placa (≈20–40 ms) en un
         <canvas> de tamaño controlado y es esa imagen la que se mueve en la GPU.
         Un canvas ya son píxeles: el navegador no tiene que redibujar trozos del
         SVG durante el movimiento, así que no pueden aparecer zonas negras.
         Al terminar se vuelve al SVG real (sin salto: misma imagen, mismo encuadre).
       · opts.live: mueve el SVG real (para escenas cuya placa se anima mientras
         la cámara se mueve: portada y cierre).
       · El margen extra sólo se usa cuando la placa está inclinada en 3D. */
    mode: 'rest', margin: 0, moveU: null, zmin: 1, tok: 0,
    viewport(st, m) {
      const k = K * st.z;
      return { x: st.x - (st.sx + m) / k, y: st.y - (st.sy + m) / k, w: (1920 + 2 * m) / k, h: (1080 + 2 * m) / k };
    },
    union(a, b, m) {
      const va = this.viewport(a, m), vb = this.viewport(b, m);
      let x0 = Math.min(va.x, vb.x), y0 = Math.min(va.y, vb.y), x1 = Math.max(va.x + va.w, vb.x + vb.w), y1 = Math.max(va.y + va.h, vb.y + vb.h);
      const pw = (x1 - x0) * .06, ph = (y1 - y0) * .06;
      x0 = Math.max(VB.x, x0 - pw); y0 = Math.max(VB.y, y0 - ph);
      x1 = Math.min(VB.x + VB.w, x1 + pw); y1 = Math.min(VB.y + VB.h, y1 + ph);
      return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
    },
    restLayout(m = 0) {
      this.mode = 'rest'; this.margin = m;
      this.cam.style.transform = 'none';
      Object.assign(this.svg.style, { position: 'absolute', left: -m + 'px', top: -m + 'px', width: (1920 + 2 * m) + 'px', height: (1080 + 2 * m) + 'px' });
    },
    moveLayout(a, b, m) {
      this.mode = 'move'; this.margin = m;
      const U = this.moveU = this.union(a, b, m);
      this.zmin = Math.min(a.z, b.z);
      const k = K * this.zmin;
      Object.assign(this.svg.style, { position: 'absolute', left: '0px', top: '0px', width: (U.w * k) + 'px', height: (U.h * k) + 'px' });
      this.svg.setAttribute('viewBox', `${U.x} ${U.y} ${U.w} ${U.h}`);
    },
    // Instantánea: SVG serializado (con sus estilos internos + tokens de color) → imagen → canvas
    async snapshot(U, zr) {
      const snap = this.snapEl || (this.snapEl = document.getElementById('snap'));
      const cssW = U.w * K * zr, cssH = U.h * K * zr;
      const want = (window.devicePixelRatio || 1) * Stage.scale;
      const pr = Math.max(.25, Math.min(want, 2560 / cssW, 2560 / cssH));
      const pw = Math.round(cssW * pr), ph = Math.round(cssH * pr);
      const c = this.svg.cloneNode(true);
      c.removeAttribute('style'); c.removeAttribute('id');
      c.setAttribute('width', pw); c.setAttribute('height', ph);
      c.setAttribute('viewBox', `${U.x} ${U.y} ${U.w} ${U.h}`);
      const cs = getComputedStyle(document.documentElement);
      const vars = ['--c-cpu', '--c-mem', '--c-pwr', '--c-sto', '--c-io', '--c-fw', '--c-ui', '--carbon', '--white', '--text', '--dim', '--font-display', '--font-mono']
        .map((v) => `${v}:${cs.getPropertyValue(v)}`).join(';');
      let fonts = '';
      for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) if (r.type === 5) fonts += r.cssText; } catch (e) { /* hojas externas en file:// */ } }
      const st = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      st.textContent = `${fonts} svg{${vars}}`;
      c.insertBefore(st, c.firstChild);
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)], { type: 'image/svg+xml' }));
      const img = new Image(); img.src = url;
      try { await img.decode(); } finally { URL.revokeObjectURL(url); }
      snap.width = pw; snap.height = ph;
      snap.style.width = cssW + 'px'; snap.style.height = cssH + 'px';
      snap.getContext('2d').drawImage(img, 0, 0, pw, ph);
      this.snapU = U; this.snapZ = zr;
    },
    apply() {
      const s = this.state;
      if (this.mode === 'snap') {
        const U = this.snapU, k = K * s.z;
        this.snapEl.style.transform = `translate3d(${s.sx - (s.x - U.x) * k}px, ${s.sy - (s.y - U.y) * k}px, 0) scale(${s.z / this.snapZ})`;
      } else if (this.mode === 'move') {
        const U = this.moveU, k = K * s.z;
        this.cam.style.transform = `translate3d(${s.sx - (s.x - U.x) * k}px, ${s.sy - (s.y - U.y) * k}px, 0) scale(${s.z / this.zmin})`;
      } else {
        const v = this.viewport(s, this.margin);
        this.svg.setAttribute('viewBox', `${v.x.toFixed(3)} ${v.y.toFixed(3)} ${v.w.toFixed(3)} ${v.h.toFixed(3)}`);
      }
      this.tilt.style.transformOrigin = `${s.sx}px ${s.sy}px`;
      this.tilt.style.transform = (s.rx || s.rz) ? `perspective(2600px) rotateX(${s.rx}deg) rotateZ(${s.rz}deg)` : 'none';
      this.el.style.opacity = s.o;
    },
    halt(m = this.margin) {
      this.tok++; if (this.tween) this.tween.kill();
      this.restLayout(m); this.apply(); this.showSvg(true); this.showSnap(false);
    },
    showSvg(on) { this.svg.style.visibility = on ? 'visible' : 'hidden'; },
    showSnap(on) { if (this.snapEl) this.snapEl.style.visibility = on ? 'visible' : 'hidden'; },
    // Interpola sobre un proxy (no sobre state) para que gsap.context().revert()
    // de una escena nunca "rebobine" la cámara. El zoom se interpola en escala
    // logarítmica: el acercamiento se percibe constante, como una cámara real.
    to(target, dur = 1.3, ease = 'power3.inOut', opts = {}) {
      if (this.tween) this.tween.kill();
      const tok = ++this.tok;
      const t = Object.assign({ rx: 0, rz: 0, o: 1 }, target);
      const from = { ...this.state };
      const end = { ...from, ...t };
      const tiltEnd = !!(end.rx || end.rz), tilted = tiltEnd || !!(from.rx || from.rz);
      const m = tilted ? 1100 : 0;
      const lz0 = Math.log(from.z), lz1 = Math.log(end.z);
      const p = { v: 0 };
      const step = () => {
        const v = p.v, s = this.state;
        for (const k of ['x', 'y', 'sx', 'sy', 'rx', 'rz', 'o']) if (t[k] != null) s[k] = from[k] + (t[k] - from[k]) * v;
        s.z = Math.exp(lz0 + (lz1 - lz0) * v);
        this.apply();
      };
      // final: SVG real en reposo; la instantánea se retira dos fotogramas después
      // (cuando el SVG ya está dibujado debajo) → cambio invisible
      const settle = () => {
        this.restLayout(tiltEnd ? 1100 : 0); this.apply(); this.showSvg(true);
        requestAnimationFrame(() => requestAnimationFrame(() => { if (tok === this.tok) this.showSnap(false); }));
      };
      if (RM || dur === 0) { Object.assign(this.state, t); this.showSnap(false); settle(); return null; }
      if (opts.live) {
        this.showSnap(false); this.showSvg(true);
        this.moveLayout(from, end, m); this.apply();
        this.tween = gsap.to(p, { v: 1, duration: dur, ease, onUpdate: step, onComplete: settle });
        return this.tween;
      }
      const U = this.union(from, end, m);
      const zr = Math.max(from.z, end.z);
      this.snapshot(U, zr).then(() => {
        if (tok !== this.tok) return;
        this.mode = 'snap'; this.apply();
        this.showSnap(true); this.showSvg(false);
        this.tween = gsap.to(p, { v: 1, duration: dur, ease, onUpdate: step, onComplete: settle });
      }).catch(() => {
        // si la instantánea fallase, se mueve el SVG real
        if (tok !== this.tok) return;
        this.moveLayout(from, end, m); this.apply();
        this.tween = gsap.to(p, { v: 1, duration: dur, ease, onUpdate: step, onComplete: settle });
      });
      return null;
    },
    // encuadre automático de un componente
    camFor(id, { sx = 1200, sy = 540, fill = .62, max = 4.2 } = {}) {
      const [x, y, w, h] = Board.bboxOf(id);
      const z = Math.min(max, (1080 * fill) / (h * K), (1920 * fill * .6) / (w * K));
      return { x: x + w / 2, y: y + h / 2, z, sx, sy };
    },
    // proyección plana mm → escenario (con el estado dado o el actual)
    project(mx, my, s = this.state) {
      return [s.sx + (mx - s.x) * K * s.z, s.sy + (my - s.y) * K * s.z];
    },
    part(id) { return this.svg.querySelector(`#part-${id}`); },
    route(id) { return this.svg.querySelector(`.route[data-route="${id}"]`); },

    /* ---- estado visual de la placa ---- */
    reset() {
      const s = this.svg;
      s.classList.remove('is-focus', 'is-dim', 'is-live', 'no-fx', 'show-co', 'show-thermal', 'live-flow');
      s.style.removeProperty('--flow-d');
      $$('.fan-rotor animateTransform', s).forEach((a) => a.setAttribute('dur', '1.1s'));
      s.removeAttribute('data-install');
      $$('.part', s).forEach((p) => p.classList.remove('lit', 'sel', 'hint', 'ok', 'bad', 'off', 'demo', 'over'));
      $$('.route', s).forEach((r) => r.classList.remove('on', 'dim'));
      $$('.inst', s).forEach((i) => i.classList.remove('on'));
      $$('.m2-hs', s).forEach((i) => i.removeAttribute('style'));
      this.interactive(false);
      this.el.classList.remove('ghost');
    },
    lit(ids, on = true, cls = 'lit') { [].concat(ids).forEach((id) => this.part(id)?.classList.toggle(cls, on)); },
    focus(ids) {
      this.svg.classList.toggle('is-focus', !!ids);
      $$('.part', this.svg).forEach((p) => p.classList.remove('sel'));
      if (ids) [].concat(ids).forEach((id) => this.part(id)?.classList.add('sel'));
    },
    routes(ids, on = true) { [].concat(ids).forEach((id) => this.route(id)?.classList.toggle('on', on)); },
    routesOnly(ids) {
      $$('.route', this.svg).forEach((r) => r.classList.toggle('on', ids.includes(r.dataset.route)));
    },
    install(sel, on = true) { $$(sel, this.svg).forEach((i) => i.classList.toggle('on', on)); },
    interactive(on, handler, opts = {}) {
      this.allowExtra = !!opts.extra;
      this.el.classList.toggle('interactive', on);
      this.el.classList.toggle('allow-extra', this.allowExtra);
      $$('.part', this.svg).forEach((p) => {
        p.setAttribute('tabindex', on && this.usable(p.dataset.part) ? '0' : '-1');
      });
      this.handler = on ? handler : null;
    },
    usable(id) { return !Board.PARTS[id].extra || this.allowExtra; },
    bindParts() {
      const tip = $('#tip');
      const show = (p) => {
        if (!this.el.classList.contains('interactive')) return;
        const r = Stage.rectOf(p.querySelector('.ring'));
        tip.textContent = Board.PARTS[p.dataset.part].label;
        tip.dataset.cat = p.dataset.cat;
        tip.style.transform = `translate(${r.cx}px, ${r.y - 14}px) translate(-50%, -100%)`;
        tip.classList.add('show');
      };
      const hide = () => tip.classList.remove('show');
      this.svg.addEventListener('pointerover', (e) => { const p = e.target.closest('.part'); if (p && this.usable(p.dataset.part)) show(p); });
      this.svg.addEventListener('pointerout', (e) => { if (e.target.closest('.part')) hide(); });
      this.svg.addEventListener('focusin', (e) => { const p = e.target.closest('.part'); if (p) show(p); });
      this.svg.addEventListener('focusout', hide);
      const act = (e) => {
        const p = e.target.closest('.part');
        if (!p || !this.handler || !this.usable(p.dataset.part)) return;
        hide();
        this.handler(p.dataset.part, p, e);
      };
      this.svg.addEventListener('click', act);
      this.svg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); act(e); } });
    },
  };

  /* ===================================================================
     3. MOTION GRAMMAR
     Cada helper tiene un motivo narrativo:
       title  → máscara: la idea "emerge" de una ranura
       draw   → trazado: una conexión se establece
       decode → los labels técnicos "se leen" como en un instrumento
       snap   → instalación física
       count  → magnitudes que se miden
     =================================================================== */
  const M = {
    split(root = document) {
      $$('[data-split]', root).forEach((el) => {
        if (el.dataset.splitDone) return;
        const lines = el.innerHTML.split(/<br\s*\/?>/i);
        el.innerHTML = lines.map((l) => `<span class="ln"><span class="ln-i">${l}</span></span>`).join('');
        el.dataset.splitDone = 1;
      });
    },
    title(el, o = {}) {
      return gsap.fromTo($$('.ln-i', el), { yPercent: 108, rotate: 2.5 }, { yPercent: 0, rotate: 0, duration: o.d || 1, ease: 'expo.out', stagger: o.stagger || .09, delay: o.delay || 0 });
    },
    rise(els, o = {}) {
      return gsap.fromTo(els, { y: o.y ?? 26, opacity: 0 }, { y: 0, opacity: 1, duration: o.d || .8, ease: 'power3.out', stagger: o.stagger ?? .07, delay: o.delay || 0 });
    },
    draw(els, o = {}) {
      const list = typeof els === 'string' ? $$(els) : [].concat(els).flatMap((e) => (e instanceof NodeList || Array.isArray(e) ? Array.from(e) : [e]));
      const len = (i, p) => (p.getTotalLength ? p.getTotalLength() : 100) + 1;
      return gsap.fromTo(list,
        { strokeDasharray: len, strokeDashoffset: (i, p) => (o.reverse ? -1 : 1) * len(i, p) },
        { strokeDashoffset: 0, duration: o.d || 1.2, ease: o.ease || 'power2.inOut', stagger: o.stagger ?? .05, delay: o.delay || 0 });
    },
    decode(el, o = {}) {
      const final = el.dataset.final || (el.dataset.final = el.textContent);
      const chars = '01ABCDEF#<>/_-=';
      const obj = { p: 0 };
      return gsap.to(obj, {
        p: 1, duration: o.d || .9, delay: o.delay || 0, ease: 'none',
        onUpdate() {
          const n = Math.floor(obj.p * final.length);
          el.textContent = final.slice(0, n) + final.slice(n).replace(/[^\s·]/g, () => chars[(Math.random() * chars.length) | 0]);
        },
        onComplete() { el.textContent = final; },
      });
    },
    count(el, to, o = {}) {
      const obj = { v: o.from || 0 };
      return gsap.to(obj, { v: to, duration: o.d || 1.2, delay: o.delay || 0, ease: 'power2.out', onUpdate() { el.textContent = (o.dec ? obj.v.toFixed(o.dec) : Math.round(obj.v)) + (o.suffix || ''); } });
    },
    snap(el, o = {}) {
      return gsap.fromTo(el, { y: o.from ?? -120, opacity: 0 }, { y: 0, opacity: 1, duration: o.d || .9, ease: 'back.out(2.2)', delay: o.delay || 0 });
    },
    // bucles ambientales: desactivados con reduced-motion
    loop(fn) { return RM ? null : fn(); },
  };

  /* ===================================================================
     4. DECK
     =================================================================== */
  const Deck = {
    scenes: [], mods: {}, i: -1, ctx: null, busy: null,
    register(id, mod) { this.mods[id] = mod; },
    init() {
      this.scenes = $$('.scene');
      this.buildChrome();
      this.bindInput();
      M.split();
      const m = location.hash.match(/#\/?(\d+)/);
      this.go(m ? Math.max(0, parseInt(m[1], 10) - 1) : 0, { first: true });
    },
    get current() { return this.scenes[this.i]; },
    mod(el) { return this.mods[el.dataset.id] || {}; },

    go(n, opt = {}) {
      n = Math.max(0, Math.min(this.scenes.length - 1, n));
      if (n === this.i && !opt.force) return;
      const prev = this.current, next = this.scenes[n], dir = n > this.i ? 1 : -1;
      const pm = prev ? this.mod(prev) : null;
      if (prev) {
        pm.leave?.(prev);
        this.ctx?.revert();
        prev.classList.remove('active');
        prev.setAttribute('aria-hidden', 'true');
        // salida breve: el contenido anterior se apaga mientras la cámara ya se mueve
        const ghost = prev.cloneNode(true);
        ghost.classList.add('ghosting'); ghost.removeAttribute('id');
        prev.after(ghost);
        gsap.to(ghost, { opacity: 0, duration: RM ? 0 : .35, ease: 'power1.in', onComplete: () => ghost.remove() });
      }
      this.i = n;
      next.classList.add('active');
      next.removeAttribute('aria-hidden');
      $('#tip').classList.remove('show');
      const m = this.mod(next);
      World.reset();
      if (m.world) m.world(World);
      const sc = [].concat(m.scrim || []);
      $$('.scrim').forEach((x) => x.classList.toggle('on', sc.includes(x.dataset.scrim)));
      const cam = typeof m.cam === 'function' ? m.cam() : m.cam;
      if (cam) World.to(cam, opt.first ? 0 : (m.camDur || 1.35), m.camEase, { live: m.camLive });
      this.ctx = gsap.context(() => {
        const tl = m.enter?.(next, { dir, World, M, first: !!opt.first });
        if (RM && tl && tl.progress) tl.progress(1);
      }, next);
      this.updateChrome();
      history.replaceState(null, '', '#' + String(n + 1).padStart(2, '0'));
      document.title = `${next.dataset.title} · La placa base por dentro`;
    },
    next() { this.go(this.i + 1); },
    prev() { this.go(this.i - 1); },

    buildChrome() {
      const bar = $('#progress');
      bar.innerHTML = this.scenes.map((s, i) =>
        `<button class="tick" data-i="${i}" aria-label="Ir a ${String(i + 1).padStart(2, '0')} · ${s.dataset.title}"><span class="tick-l">${String(i + 1).padStart(2, '0')} · ${s.dataset.title}</span></button>`).join('');
      bar.addEventListener('click', (e) => { const t = e.target.closest('.tick'); if (t) this.go(+t.dataset.i); });
      $('#btnPrev').onclick = () => this.prev();
      $('#btnNext').onclick = () => this.next();
      $('#btnFs').onclick = () => this.fullscreen();
      $('#countTotal').textContent = String(this.scenes.length).padStart(2, '0');
    },
    updateChrome() {
      $$('#progress .tick').forEach((t, i) => { t.classList.toggle('done', i < this.i); t.classList.toggle('now', i === this.i); });
      $('#countNow').textContent = String(this.i + 1).padStart(2, '0');
      $('#sceneName').textContent = this.current.dataset.title;
      $('#btnPrev').disabled = this.i === 0;
      $('#btnNext').disabled = this.i === this.scenes.length - 1;
    },
    fullscreen() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    },
    bindInput() {
      addEventListener('keydown', (e) => {
        if (Edit.on) { if (e.key === 'Escape') Edit.toggle(false); return; }
        const t = e.target;
        if (t.matches('input, textarea, [contenteditable="true"]')) return;
        const onControl = t.closest('button, [role="button"], .part');
        const m = this.mod(this.current);
        if (m.key && m.key(e) === true) return;
        switch (e.key) {
          case 'ArrowRight': case 'PageDown': e.preventDefault(); this.next(); break;
          case 'ArrowLeft': case 'PageUp': e.preventDefault(); this.prev(); break;
          case ' ': if (onControl) return; e.preventDefault(); e.shiftKey ? this.prev() : this.next(); break;
          case 'Home': e.preventDefault(); this.go(0); break;
          case 'End': e.preventDefault(); this.go(this.scenes.length - 1); break;
          case 'f': case 'F': this.fullscreen(); break;
          case 'e': case 'E': Edit.toggle(); break;
          case 'Escape': m.esc?.(); break;
        }
      });
      // swipe táctil (ignorado sobre zonas de arrastre)
      let sx = null, sy = 0;
      addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' && !e.target.closest('[data-nodrag]')) { sx = e.clientX; sy = e.clientY; } });
      addEventListener('pointerup', (e) => {
        if (sx === null) return;
        const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) dx < 0 ? this.next() : this.prev();
      });
      // rueda: una escena por gesto
      let lock = 0;
      addEventListener('wheel', (e) => {
        if (e.target.closest('[data-noscroll]')) return;
        const now = Date.now();
        if (now < lock || Math.abs(e.deltaY) < 30) return;
        lock = now + 1100;
        e.deltaY > 0 ? this.next() : this.prev();
      }, { passive: true });
    },
  };

  /* ===================================================================
     5. EDIT — edición inline (E). Los cambios se guardan en localStorage.
     =================================================================== */
  const Edit = {
    on: false, KEY: 'mb-edits-v1',
    targets() { return $$('.scene:not(.ghosting) [data-edit]'); },
    load() {
      let d = {};
      try { d = JSON.parse(localStorage.getItem(this.KEY) || '{}'); } catch (e) { /* sin storage */ }
      this.targets().forEach((el, i) => { if (d[i] != null) el.innerHTML = d[i]; });
    },
    save() {
      const d = {};
      this.targets().forEach((el, i) => { d[i] = el.innerHTML; });
      try { localStorage.setItem(this.KEY, JSON.stringify(d)); } catch (e) { /* sin storage */ }
    },
    toggle(force) {
      this.on = force ?? !this.on;
      document.body.classList.toggle('editing', this.on);
      this.targets().forEach((el) => el.setAttribute('contenteditable', this.on ? 'true' : 'false'));
      $('#editBadge').classList.toggle('show', this.on);
      if (!this.on) this.save();
    },
    init() {
      this.load();
      addEventListener('keydown', (e) => { if (this.on && (e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); this.save(); } });
      const hz = $('#editHot'), btn = $('#editBtn'); let t;
      const show = () => { clearTimeout(t); btn.classList.add('show'); };
      const hide = () => { t = setTimeout(() => { if (!this.on) btn.classList.remove('show'); }, 400); };
      hz.addEventListener('mouseenter', show); hz.addEventListener('mouseleave', hide);
      btn.addEventListener('mouseenter', show); btn.addEventListener('mouseleave', hide);
      btn.addEventListener('click', () => this.toggle());
    },
  };

  window.Stage = Stage; window.World = World; window.M = M; window.Deck = Deck; window.Edit = Edit;

  window.addEventListener('DOMContentLoaded', () => {
    Stage.init();
    World.init();
    Edit.init();
    Deck.init();
    document.documentElement.classList.add('ready');
  });
})();
