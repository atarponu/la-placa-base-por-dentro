/* =====================================================================
   MUSIC — ambient generativo con Web Audio (sin archivos de audio)
   ---------------------------------------------------------------------
   · Pad de acordes lentos (Am9 → Fmaj7 → Cmaj7 → Em7), bajo suave,
     destellos tipo "señal de laboratorio" y reverb sintética.
   · Activada por defecto. Intenta sonar al abrir; si el navegador
     lo bloquea, arranca con el primer clic o tecla. Botón ♪ o
     tecla M para silenciar/activar.
   · Volumen general: MASTER_VOL.
   ===================================================================== */
(function () {
  'use strict';
  const MASTER_VOL = 0.16;
  const CHORD_SECS = 9;
  // frecuencias MIDI → Hz
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const CHORDS = [
    { root: 45, notes: [57, 60, 64, 67, 71] },   // Am9
    { root: 41, notes: [53, 57, 60, 64, 67] },   // Fmaj7(9)
    { root: 48, notes: [55, 60, 64, 67, 71] },   // Cmaj7
    { root: 40, notes: [55, 59, 62, 64, 67] },   // Em7(11)
  ];
  const BLIPS = [69, 72, 74, 76, 79, 81, 84];    // pentatónica de La menor, registro alto

  let ctx = null, master, bus, verb, delay, timer = null, step = 0, on = false;

  function impulse(secs = 5, decay = 2.6) {
    const len = ctx.sampleRate * secs, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    // reverb larga + eco sutil
    verb = ctx.createConvolver(); verb.buffer = impulse();
    const wet = ctx.createGain(); wet.gain.value = .55;
    verb.connect(wet).connect(master);
    delay = ctx.createDelay(2); delay.delayTime.value = .48;
    const fb = ctx.createGain(); fb.gain.value = .38;
    const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2400;
    delay.connect(dl).connect(fb).connect(delay);
    dl.connect(verb); dl.connect(master);
    // bus principal filtrado con un "respirar" muy lento
    bus = ctx.createBiquadFilter(); bus.type = 'lowpass'; bus.frequency.value = 1100; bus.Q.value = .4;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = .05; lfoG.gain.value = 450;
    lfo.connect(lfoG).connect(bus.frequency); lfo.start();
    const dry = ctx.createGain(); dry.gain.value = .6;
    bus.connect(dry).connect(master); bus.connect(verb);
  }

  function pad(freq, t, dur, vol) {
    [-6, 6].forEach((det) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = freq; o.detune.value = det;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + dur * .35);
      g.gain.linearRampToValueAtTime(vol * .8, t + dur * .75);
      g.gain.linearRampToValueAtTime(0, t + dur + 2.5);
      o.connect(g).connect(bus);
      o.start(t); o.stop(t + dur + 3);
    });
  }

  function bass(freq, t, dur) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.22, t + 2);
    g.gain.linearRampToValueAtTime(0, t + dur + 1.5);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 2);
  }

  function blip(freq, t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.07, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + 1.4);
    o.connect(g); g.connect(delay); g.connect(verb);
    o.start(t); o.stop(t + 1.6);
  }

  /* ---- efectos de sonido de interfaz (misma tecla M silencia todo) ----
     Sonidos suaves y finos, distintos según el tipo de elemento:
       tick   · botón genérico            select · pestañas, opciones, nodos, puertos
       part   · zona de la placa          nav    · pasar de escena
       open   · abrir / simular / encender  close · cerrar panel
       pick   · coger pieza (Construye tu PC)
       ok     · acierto (campanita)       bad    · error (tono grave suave)
       snap / seat / plug · encajes mecánicos (RAM, CPU, GPU, M.2, SATA…)
       power  · la corriente empieza a fluir (zumbido que sube)
       zap · arco corto   surge · carga que sube   buzz · zumbido de standby
       flow · pulsos que aceleran   spark · chisporroteo
       trickle · corriente por un cable   pulse · latido eléctrico   bits · datos   hum · zumbido estable
       qin / qok / qbad / qstep / qcount / qfinal · sonidos del quiz
       trail / lightline · estela de luz (estilo moto de luz)
       ratchet · servo · latch · switch · slide · mecánicos
     Volumen general de efectos: SFX_VOL. */
  const SFX_VOL = 0.7;
  let sfxBus = null;
  const vary = (f) => f * (1 + (Math.random() - .5) * .04);   // ±2 %: nunca suena idéntico
  function ensureSfxBus() {
    if (sfxBus) return;
    sfxBus = ctx.createGain(); sfxBus.gain.value = SFX_VOL;
    const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 5200; soft.Q.value = .3;
    sfxBus.connect(soft).connect(ctx.destination);
    const send = ctx.createGain(); send.gain.value = .35;
    soft.connect(send).connect(verb);
    Music._an = ctx.createAnalyser(); Music._an.fftSize = 2048; soft.connect(Music._an);
  }
  // nota con ataque corto (sin chasquido) y caída exponencial
  function tone(f0, f1, t, dur, vol, type = 'sine', atk = .012) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * .8);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(sfxBus);
    o.start(t); o.stop(t + dur + .05);
  }
  // soplo de aire filtrado (para pasar de escena)
  function air(t, dur, vol, from, to) {
    const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const n = ctx.createBufferSource(); n.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .35); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    n.connect(f).connect(g).connect(sfxBus); n.start(t); n.stop(t + dur);
  }
  const CLACK = .5;   // intensidad de los encajes (snap / seat / plug)
  // chasquido mecánico: ráfaga de ruido muy corta y filtrada
  function clk(t, freq, vol, dur = .02, q = 2.2) {
    const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const n = ctx.createBufferSource(); n.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = vol * CLACK;
    n.connect(f).connect(g).connect(sfxBus); n.start(t);
  }
  // zumbido eléctrico: la corriente "arranca" (filtro que se abre + tono que se carga)
  function power(t) {
    const hum = ctx.createOscillator(), hum2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    hum.type = 'sawtooth'; hum.frequency.value = 55; hum2.type = 'sine'; hum2.frequency.value = 110;
    lp.type = 'lowpass'; lp.Q.value = 3;
    lp.frequency.setValueAtTime(70, t); lp.frequency.exponentialRampToValueAtTime(950, t + .45); lp.frequency.exponentialRampToValueAtTime(380, t + 1.2);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.09, t + .18); g.gain.exponentialRampToValueAtTime(.03, t + .6); g.gain.exponentialRampToValueAtTime(.0001, t + 1.3);
    hum.connect(lp); hum2.connect(lp); lp.connect(g).connect(sfxBus);
    hum.start(t); hum2.start(t); hum.stop(t + 1.35); hum2.stop(t + 1.35);
    tone(180, 760, t + .02, .55, .045, 'sine', .12);          // carga que sube
    tone(vary(1520), vary(1520), t + .42, .5, .02, 'sine', .02); // "listo"
    for (let i = 0; i < 4; i++) clk(t + .08 + Math.random() * .5, vary(5200), .35, .006, 3); // chispitas
  }
  // ruido blanco reutilizable
  let noiseBuf = null;
  function noise(t, dur) {
    if (!noiseBuf) { const len = ctx.sampleRate * 2; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; }
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.start(t, Math.random()); n.stop(t + dur + .05); return n;
  }
  // ZAP · arco eléctrico corto: zumbido cuadrado + chisporroteo
  function zap(t) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(vary(140), t); o.frequency.exponentialRampToValueAtTime(90, t + .3);
    f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.05, t + .01);
    for (let i = 1; i < 7; i++) g.gain.setValueAtTime(i % 2 ? .012 : .05, t + i * .03);   // parpadeo del arco
    g.gain.exponentialRampToValueAtTime(.0001, t + .32);
    o.connect(f).connect(g).connect(sfxBus); o.start(t); o.stop(t + .35);
    const n = noise(t, .2), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
    nf.type = 'highpass'; nf.frequency.value = 3500;
    ng.gain.setValueAtTime(.12, t); ng.gain.exponentialRampToValueAtTime(.0001, t + .18);
    n.connect(nf).connect(ng).connect(sfxBus);
  }
  // SURGE · condensador cargándose: silbido que sube con vibrato + zumbido de fondo
  function surge(t) {
    const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(vary(1650), t + .75);
    lfo.frequency.value = 18; lg.gain.value = 14; lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.045, t + .5); g.gain.exponentialRampToValueAtTime(.0001, t + .95);
    o.connect(g).connect(sfxBus); o.start(t); lfo.start(t); o.stop(t + 1); lfo.stop(t + 1);
    const h = ctx.createOscillator(), hg = ctx.createGain(); h.type = 'triangle'; h.frequency.value = 100;
    hg.gain.setValueAtTime(0.0001, t); hg.gain.linearRampToValueAtTime(.05, t + .3); hg.gain.exponentialRampToValueAtTime(.0001, t + 1);
    h.connect(hg).connect(sfxBus); h.start(t); h.stop(t + 1.05);
    clk(t + .78, vary(4200), .45, .008, 3);   // "tic" de carga completa
  }
  // BUZZ · zumbido de transformador (standby): 50 Hz con armónicos que respira
  function buzz(t) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = 50;
    f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 6;
    lfo.frequency.value = 3.5; lg.gain.value = 160; lfo.connect(lg).connect(f.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.08, t + .15); g.gain.setValueAtTime(.08, t + .55); g.gain.exponentialRampToValueAtTime(.0001, t + 1.1);
    o.connect(f).connect(g).connect(sfxBus); o.start(t); lfo.start(t); o.stop(t + 1.15); lfo.stop(t + 1.15);
  }
  // FLOW · pulsos de corriente que aceleran a lo largo del camino
  function flow(t) {
    let at = t, gap = .11;
    for (let i = 0; i < 9; i++) { tone(vary(900 + i * 90), vary(700 + i * 90), at, .05, .035 + i * .004, 'triangle', .004); at += gap; gap *= .82; }
    const h = ctx.createOscillator(), hg = ctx.createGain(); h.type = 'sine'; h.frequency.value = 120;
    hg.gain.setValueAtTime(0.0001, t); hg.gain.linearRampToValueAtTime(.06, at); hg.gain.exponentialRampToValueAtTime(.0001, at + .45);
    h.connect(hg).connect(sfxBus); h.start(t); h.stop(at + .5);
  }
  // SPARK · chisporroteo breve (varias chispas al azar)
  function spark(t) {
    for (let i = 0; i < 7; i++) clk(t + Math.random() * .22, vary(3000 + Math.random() * 4000), .3 + Math.random() * .4, .005 + Math.random() * .01, 2.5);
  }
  // TRICKLE · corriente recorriendo un cable: siseo que se desplaza + micro-chispas
  function trickle(t) {
    const n = noise(t, 1.1), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'bandpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(vary(600), t); f.frequency.exponentialRampToValueAtTime(vary(3200), t + .9);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.09, t + .25); g.gain.exponentialRampToValueAtTime(.0001, t + 1.05);
    n.connect(f).connect(g).connect(sfxBus);
    for (let i = 0; i < 6; i++) clk(t + .1 + i * .13 + Math.random() * .05, vary(2400 + i * 450), .22, .006, 3);
  }
  // PULSE · latido eléctrico: golpe grave + "zing" metálico
  function pulse(t, a = 0) {
    const k = Math.pow(2, (a || 0) / 12);
    tone(90 * k, 45 * k, t, .18, .16, 'sine', .004);
    tone(vary(2200 * k), vary(3300 * k), t + .01, .16, .03, 'sine', .005);
    clk(t, vary(1800 * k), .35, .01, 2);
  }
  // BITS · datos viajando: ráfaga de micro-pitidos digitales
  function bits(t) {
    const n = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++) { const f = [1760, 2093, 2349, 2637, 3136][Math.floor(Math.random() * 5)]; tone(f, f, t + i * .028, .03, .05, 'square', .002); }
  }
  // HUM · zumbido estable que crece y se apaga (energía "presente")
  function hum(t) {
    [100, 200, 300].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.05 / (i + 1), t + .35); g.gain.exponentialRampToValueAtTime(.0001, t + 1.3);
      o.connect(g).connect(sfxBus); o.start(t); o.stop(t + 1.35); });
    trickle(t + .1);
  }

  /* ---- QUIZ: sonidos propios de "hardware lab" ---- */
  const MAJ = [0, 4, 7, 12, 16], note = (base, st) => base * Math.pow(2, st / 12);
  // aparece una pregunta: barrido de escáner + blip
  function qin(t) { air(t, .18, .06, 400, 2400); tone(1320, 1760, t + .14, .08, .05); }
  // aciertos: tres variantes + racha (cada acierto seguido sube de tono)
  function qok(t, streak = 0) {
    const base = 1046.5 * Math.pow(2, Math.min(streak, 5) / 12);   // C6 y sube con la racha
    const v = Math.floor(Math.random() * 3);
    if (v === 0) [0, 4, 7].forEach((st, i) => tone(note(base, st), note(base, st), t + i * .07, .4, .07));
    if (v === 1) { SOUNDS.snap(t); [7, 12].forEach((st, i) => tone(note(base, st), note(base, st), t + .1 + i * .08, .45, .07)); }
    if (v === 2) { tone(note(base, 12), note(base, 12), t, .9, .06); tone(note(base, 19), note(base, 19), t + .005, .6, .025); tone(note(base, 7), note(base, 7), t + .09, .5, .05); }
    if (streak >= 2) spark(t + .25);
  }
  // fallos: tres variantes suaves (nunca un buzzer agresivo)
  function qbad(t) {
    const v = Math.floor(Math.random() * 3);
    if (v === 0) { tone(392, 392, t, .2, .1, 'triangle', .02); tone(311, 311, t + .12, .3, .09, 'triangle', .02); }
    if (v === 1) { tone(330, 220, t, .38, .1, 'triangle', .02); }
    if (v === 2) { [0, .09].forEach((d) => tone(233, 233, t + d, .07, .1, 'square', .004)); zap(t + .2); }
  }
  // paso bien colocado en "ordena" / pareja unida en "asocia": sube de tono en cada paso
  function qstep(t, i = 0) { clk(t, vary(2200), .35, .018, 1.6); tone(note(784, MAJ[i % 5]), note(784, MAJ[i % 5]), t + .03, .22, .05); }
  // la puntuación sube: un tic por punto
  function qcount(t, i = 0) { tone(note(880, i), note(880, i), t, .06, .05); }
  // resultado final según la nota
  function qfinal(t, score = 0) {
    if (score >= 9) { power(t); [0, 4, 7, 12, 16].forEach((st, i) => tone(note(523.25, st), note(523.25, st), t + .35 + i * .09, .9, .06)); spark(t + .9); }
    else if (score >= 6) { surge(t); [0, 4, 7].forEach((st) => tone(note(523.25, st), note(523.25, st), t + .7, 1.1, .045)); }
    else { [7, 3, 0].forEach((st, i) => tone(note(392, st), note(392, st), t + i * .16, .5, .06, 'triangle')); }
  }

  /* ---- ESTELAS DE LUZ (estilo moto de luz de Tron) ----
     Sierras desafinadas que se deslizan de tono, filtro resonante que se abre
     y se cierra ("vuuum") y paso de un altavoz a otro según la dirección. */
  function lightTrail(t, dir = 1, o = {}) {
    const dur = o.dur || .95, base = o.base || 82, peak = o.peak || 2600, vol = o.vol || .08;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const out = ctx.createGain(); out.gain.value = 1;
    if (pan) { pan.pan.setValueAtTime(-.85 * dir, t); pan.pan.linearRampToValueAtTime(.85 * dir, t + dur); out.connect(pan).connect(sfxBus); } else out.connect(sfxBus);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 9;
    lp.frequency.setValueAtTime(220, t); lp.frequency.exponentialRampToValueAtTime(peak, t + dur * .32); lp.frequency.exponentialRampToValueAtTime(520, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + .07); g.gain.exponentialRampToValueAtTime(vol * .5, t + dur * .55); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    lp.connect(g).connect(out);
    [[0, 'sawtooth'], [14, 'sawtooth'], [-1200, 'square']].forEach(([det, type]) => {
      const osc = ctx.createOscillator(); osc.type = type; osc.detune.value = det;
      osc.frequency.setValueAtTime(base, t); osc.frequency.exponentialRampToValueAtTime(base * 2, t + dur * .35); osc.frequency.exponentialRampToValueAtTime(base * 1.45, t + dur);
      osc.connect(lp); osc.start(t); osc.stop(t + dur + .05);
    });
    // brillo agudo de la estela
    const sh = ctx.createOscillator(), sg = ctx.createGain(); sh.frequency.setValueAtTime(base * 21, t); sh.frequency.exponentialRampToValueAtTime(base * 32, t + dur * .6);
    sg.gain.setValueAtTime(0.0001, t); sg.gain.linearRampToValueAtTime(vol * .18, t + .05); sg.gain.exponentialRampToValueAtTime(.0001, t + dur * .8);
    sh.connect(sg).connect(out); sh.start(t); sh.stop(t + dur);
    // aire desplazado
    const n = noise(t, dur), nf = ctx.createBiquadFilter(), ng = ctx.createGain(); nf.type = 'bandpass'; nf.Q.value = 2;
    nf.frequency.setValueAtTime(700, t); nf.frequency.exponentialRampToValueAtTime(3200, t + dur * .4); nf.frequency.exponentialRampToValueAtTime(900, t + dur);
    ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(vol * .45, t + dur * .3); ng.gain.exponentialRampToValueAtTime(.0001, t + dur);
    n.connect(nf).connect(ng).connect(out);
  }
  const trail = (t, dir) => lightTrail(t, dir || 1);
  const lightline = (t, dir) => lightTrail(t, dir || 1, { dur: .5, base: 165, peak: 4200, vol: .07 });

  /* ---- MECÁNICOS ---- */
  // trinquete: clics que se aceleran + golpe final
  function ratchet(t, n = 9) {
    let at = t, gap = .065;
    for (let i = 0; i < n; i++) { clk(at, vary(i % 2 ? 1900 : 2500), .45, .012, 2.4); at += gap; gap *= .86; }
    tone(150, 70, at, .12, .12, 'sine', .004); clk(at, 1300, .6, .03, 1.2);
  }
  // servomotor: zumbido que sube (o baja) con engranajes que chasquean
  function servo(t, dir = 1) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'square'; const a = dir > 0 ? 170 : 330, b = dir > 0 ? 330 : 170;
    o.frequency.setValueAtTime(a, t); o.frequency.exponentialRampToValueAtTime(b, t + .42);
    f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 2.5;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.11, t + .05); g.gain.setValueAtTime(.11, t + .36); g.gain.exponentialRampToValueAtTime(.0001, t + .5);
    o.connect(f).connect(g).connect(sfxBus); o.start(t); o.stop(t + .55);
    for (let i = 0; i < 10; i++) clk(t + .03 + i * .042, vary(3200), .4, .005, 4);
  }
  // cierre metálico pesado: golpe grave + chasquido + timbre del metal
  function latch(t) {
    tone(150, 58, t, .16, .15, 'sine', .003);
    clk(t + .002, vary(1150), .55, .035, 1.1);
    clk(t + .045, vary(2600), .32, .015, 2);
    [2093, 3136, 4699].forEach((fq, i) => tone(vary(fq), vary(fq), t + .01, .45 - i * .1, .022 / (i + 1), 'sine', .002));
  }
  // interruptor con muelle
  function toggleSw(t) {
    clk(t, vary(3300), .9, .008, 3); clk(t + .028, vary(1800), .85, .014, 2);
    const o = ctx.createOscillator(), l = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
    o.frequency.value = vary(880); l.frequency.value = 38; lg.gain.value = 60; l.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t + .03); g.gain.linearRampToValueAtTime(.018, t + .04); g.gain.exponentialRampToValueAtTime(.0001, t + .17);
    o.connect(g).connect(sfxBus); o.start(t + .03); l.start(t + .03); o.stop(t + .2); l.stop(t + .2);
  }
  // corredera: deslizamiento + tope
  function slide(t) {
    const n = noise(t, .32), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(450, t); f.frequency.exponentialRampToValueAtTime(1600, t + .28);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.09, t + .12); g.gain.exponentialRampToValueAtTime(.0001, t + .3);
    n.connect(f).connect(g).connect(sfxBus);
    tone(170, 80, t + .29, .12, .14, 'sine', .003); clk(t + .29, vary(1400), .6, .02, 1.5);
  }

  /* ---- ENCAJES DE "CONSTRUYE TU PC": uno distinto para cada pieza ---- */
  function friction(t, dur, f0, f1, vol) {   // roce de plástico/metal al deslizar
    const n = noise(t, dur), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.Q.value = 2.5;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .4); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    n.connect(f).connect(g).connect(sfxBus);
  }
  const PLACE = {
    // CPU: se posa sobre los contactos, la palanca baja con trinquete y la placa metálica cierra
    cpu: (t) => { tone(330, 250, t, .07, .06, 'sine', .004); clk(t + .06, vary(2700), .35, .01, 2.5);
      for (let i = 0; i < 4; i++) clk(t + .2 + i * .045, vary(i % 2 ? 2000 : 2600), .4, .01, 2.4); latch(t + .4); },
    // RAM: clic estilo mando Joy-Con (fijo)
    ram: (t) => joycon(t),
    // GPU: encaje pesado, el clip de retención de la ranura y los tornillos del soporte
    gpu: (t) => { SOUNDS.seat(t); clk(t + .22, vary(3000), .55, .01, 2.6); clk(t + .25, vary(2400), .45, .012, 2.2);
      for (let i = 0; i < 6; i++) clk(t + .5 + i * .05, vary(4300), .22, .005, 4); },
    // SSD M.2: entra inclinado, baja con un clic y se atornilla
    nvme: (t) => { friction(t, .16, 900, 2400, .05); clk(t + .2, vary(2100), .6, .015, 2);
      let at = t + .35, gap = .06; for (let i = 0; i < 9; i++) { clk(at, vary(4600), .26, .004, 5); at += gap; gap *= .88; }
      tone(vary(990), vary(990), at, .2, .025); },
    // SSD SATA: roce del conector y clic con pestaña
    sata: (t) => { friction(t, .12, 1800, 3200, .05); clk(t + .12, vary(2200), .65, .015, 1.8); tone(300, 150, t + .12, .08, .09, 'sine', .003); },
    // Tarjeta x1: clic fino de la ranura y el soporte metálico que vibra
    wifi: (t) => { clk(t, vary(2800), .65, .01, 2.6); tone(260, 130, t, .1, .08, 'sine', .003); clk(t + .04, vary(3400), .4, .008, 3);
      tone(vary(1760), vary(1760), t + .05, .35, .018); tone(vary(2640), vary(2640), t + .05, .25, .008); },
    // EPS 8 pines: deslizamiento y pinza que engancha
    eps: (t) => { friction(t, .15, 1100, 2000, .06); tone(120, 50, t + .15, .14, .16, 'sine', .003); clk(t + .15, vary(900), .7, .03, 1.2); clk(t + .2, vary(2000), .4, .012, 2.2); },
    // ATX 24 pines: empujón largo y duro y un cierre contundente
    atx: (t) => { friction(t, .3, 700, 1300, .07); tone(100, 45, t + .3, .22, .2, 'sine', .003); clk(t + .3, vary(700), .8, .045, 1);
      clk(t + .36, vary(1600), .5, .015, 2); tone(vary(1568), vary(1568), t + .32, .4, .02); },
    // Ventilador: clic del conector de 4 pines y el ventilador arranca
    fan: (t) => { clk(t, vary(2500), .55, .012, 2.4); tone(260, 130, t, .06, .07, 'sine', .003);
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(35, t + .1); o.frequency.exponentialRampToValueAtTime(150, t + .9); f.type = 'lowpass'; f.frequency.setValueAtTime(200, t + .1); f.frequency.exponentialRampToValueAtTime(900, t + .9);
      g.gain.setValueAtTime(0.0001, t + .1); g.gain.linearRampToValueAtTime(.05, t + .5); g.gain.exponentialRampToValueAtTime(.0001, t + 1.2);
      o.connect(f).connect(g).connect(sfxBus); o.start(t + .1); o.stop(t + 1.25); friction(t + .15, 1, 300, 1400, .04); },
    // Panel frontal: cinco cables finos, cinco clics pequeños y un "led encendido"
    fp: (t) => { for (let i = 0; i < 5; i++) clk(t + i * .075, vary(3000 + i * 250), .7, .007, 3.2); tone(1320, 1320, t + .42, .18, .045); },
  };

  // clic estilo mando Joy-Con al encajar: "tic-TAC" nítido y resonante (no ruido),
  // como el raíl que engancha y el pestillo que cierra
  function snapPing(t, f, vol, dur) {   // transitorio muy corto y afinado (plástico duro)
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle';
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .9, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + .0008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(sfxBus); o.start(t); o.stop(t + dur + .01);
  }
  function joycon(t) {
    snapPing(t, vary(3600), .09, .018);                 // "tic": el raíl engancha
    snapPing(t + .002, vary(7200), .03, .008);
    snapPing(t + .07, vary(2500), .16, .03);            // "TAC": el pestillo cierra
    snapPing(t + .071, vary(5000), .07, .014);
    tone(vary(2900), vary(2850), t + .072, .09, .022, 'sine', .001);   // resonancia del plástico
    tone(520, 260, t + .07, .03, .06, 'sine', .001);                    // cuerpo
  }

  // "tap" estilo menú HOME de Switch: "pop" suave y redondo con caída rápida de tono.
  // Como en la consola, el tono depende del tamaño de lo que tocas (más grande → más grave).
  function swtap(t, k = 1) {
    const f = 1150 * k;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .62, t + .03);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.11, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + .09);
    o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .1);
    tone(f * 2.01, f * 1.3, t, .035, .018, 'triangle', .002);   // brillo de la "burbuja"
  }

  const SOUNDS = {
    swtap,
    joycon,
    trail, lightline, ratchet, servo, latch, switch: toggleSw, slide,
    power, zap, surge, buzz, flow, spark, trickle, pulse, bits, hum,
    qin, qok, qbad, qstep, qcount, qfinal,
    // «clic-clac» de encaje: roce + golpe con cuerpo + pestillo que se cierra
    snap:   (t) => { clk(t, vary(2600), .55, .012); tone(170, 70, t + .012, .09, .15, 'sine', .004); clk(t + .014, vary(1400), .8, .03, 1.2);
                     clk(t + .062, vary(3400), .5, .018); tone(vary(3900), vary(3900), t + .062, .06, .025); },
    // encaje pesado (tarjeta gráfica): más grave y con más cuerpo
    seat:   (t) => { clk(t, vary(1800), .5, .015); tone(120, 50, t + .01, .14, .2, 'sine', .004); clk(t + .012, vary(900), .9, .045, 1);
                     clk(t + .085, vary(2600), .55, .02); },
    // conector que entra (SATA, pasos del quiz): un solo clic firme
    plug:   (t) => { tone(220, 110, t, .06, .11, 'sine', .003); clk(t + .004, vary(2200), .6, .02, 1.6); },
    tick:   (t) => tone(vary(2600), vary(2300), t, .045, .10),
    select: (t) => { const f = vary(1760); tone(f, f, t, .16, .09); tone(f * 1.5, f * 1.5, t, .1, .035); },
    part:   (t) => { tone(vary(980), vary(1480), t, .11, .09); tone(vary(2960), vary(2960), t + .015, .05, .025); },
    nav:    (t) => air(t, .22, .10, 900, 2600),
    open:   (t) => { tone(660, 660, t, .32, .07, 'sine', .04); tone(990, 990, t + .05, .36, .05, 'sine', .04); },
    close:  (t) => { tone(1320, 880, t, .14, .07); },
    pick:   (t) => tone(vary(620), vary(930), t, .09, .10, 'triangle'),
    ok:     (t) => [1568, 1976, 2349].forEach((f, i) => tone(f, f, t + i * .075, .42, .075)),   // G6 B6 D7
    bad:    (t) => { tone(392, 392, t, .2, .10, 'triangle', .02); tone(311, 311, t + .12, .3, .09, 'triangle', .02); },
  };
  // variedad: algunos sonidos alternan, de vez en cuando, con una variante del mismo "tipo"
  const VARIANTS = {
    snap:   ['snap', 'snap', 'latch'],       // encaje ↔ cierre metálico
    plug:   ['plug', 'plug', 'switch'],      // conector ↔ interruptor con muelle
    pulse:  ['pulse', 'pulse', 'ratchet'],   // latido ↔ trinquete corto
  };
  function play(kind, arg) {
    ensureSfxBus();
    const v = VARIANTS[kind]; if (v) kind = v[Math.floor(Math.random() * v.length)];
    if (kind === 'ratchet' && arg == null) arg = 4;
    (SOUNDS[kind] || SOUNDS.tick)(ctx.currentTime + .01, kind === 'ratchet' ? 4 : arg);
  }
  function sfx(kind = 'tick', fromUser = false, arg) {
    if (!on || !ctx) return;
    if (ctx.state === 'running') play(kind, arg);
    else if (fromUser) ctx.resume().then(() => play(kind, arg));   // el primer clic también suena
  }
  // éxito "satisfactorio": encaje + campanita
  function placed(heavy) { sfx(heavy ? 'seat' : 'snap'); setTimeout(() => sfx('ok'), 150); }
  // pieza de "Construye tu PC": su encaje propio y, al terminar, la campanita
  const PLACE_LEN = { cpu: 650, ram: 200, gpu: 850, nvme: 900, sata: 300, wifi: 300, eps: 350, atx: 550, fan: 500, fp: 550 };
  function place(k, chime = true) {
    if (!on || !ctx || ctx.state !== 'running') return;
    ensureSfxBus(); (PLACE[k] || SOUNDS.snap)(ctx.currentTime + .01);
    if (chime) setTimeout(() => sfx('ok'), PLACE_LEN[k] || 200);
  }
  // clic en cualquier elemento interactivo → sonido según su tipo
  const INTERACTIVE = 'button, [role="button"], [role="tab"], .part, .tick, a[href]';
  function kindOf(el) {
    if (el.matches('#btnNext, #btnPrev, .tick')) return 'nav';
    if (el.matches('.part')) return 'part';
    if (el.matches('.p-close')) return 'close';
    if (el.matches('.it, .qopts button')) return 'swtap';
    if (el.matches('.mp-go, .btn.solid, #bootPower, #uefiPower, .qnext, .rr-go')) return 'open';
    if (el.matches('[role="tab"], .seg button, .lg, .node, .hd, .port, .blk, .pc, .bn, .en-btns button, .data-btns button, .qopts button')) return 'select';
    return 'tick';
  }
  function onClick(e) {
    const el = e.target.closest && e.target.closest(INTERACTIVE);
    if (!el || el.disabled || el.id === 'btnMusic') return;
    const k = kindOf(el);
    if (k === 'swtap') {   // como en la Switch: superficie más grande → tono más grave
      const r = el.getBoundingClientRect(), s = (window.Stage && Stage.scale) || 1;
      const area = (r.width / s) * (r.height / s);
      sfx('swtap', true, Math.max(.7, Math.min(1.4, Math.pow(26000 / area, .25))));
    } else if (k) sfx(k, true);
  }

  /* ---- SONIDO DE LA PLACA (escena "La placa en vivo") ----
     Tres fuentes continuas cuyo volumen depende de lo cerca que esté el ratón:
       fan  · ventiladores (siseo de aire + zumbido del motor)
       coil · bobinas del VRM (pitido agudo muy suave, "coil whine")
       hum  · zumbido eléctrico de la fuente / chipset
     La carga de trabajo (0–1) sube velocidad y volumen. */
  let prox = null;
  function proxInit() {
    ensureSfxBus();
    const g = () => { const n = ctx.createGain(); n.gain.value = 0; n.connect(sfxBus); return n; };
    prox = { fan: g(), coil: g(), hum: g() };
    // ventilador: ruido de aire filtrado + motor
    const n = ctx.createBufferSource(); const len = ctx.sampleRate * 2, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b; n.loop = true;
    prox.fanBp = ctx.createBiquadFilter(); prox.fanBp.type = 'bandpass'; prox.fanBp.frequency.value = 420; prox.fanBp.Q.value = .8;
    n.connect(prox.fanBp).connect(prox.fan); n.start();
    prox.motor = ctx.createOscillator(); prox.motor.type = 'triangle'; prox.motor.frequency.value = 110;
    const mg = ctx.createGain(); mg.gain.value = .25; prox.motor.connect(mg).connect(prox.fan); prox.motor.start();
    // bobinas: dos senos cercanos que "baten"
    [3150, 3195].forEach((f) => { const o = ctx.createOscillator(); o.frequency.value = f; o.connect(prox.coil); o.start(); });
    // zumbido de red
    [100, 200, 300].forEach((f, i) => { const o = ctx.createOscillator(); o.frequency.value = f; const og = ctx.createGain(); og.gain.value = 1 / (i + 1); o.connect(og).connect(prox.hum); o.start(); });
  }
  function proxSet(lv, load = .3) {
    if (!ctx || !on || ctx.state !== 'running') return;
    if (!prox) proxInit();
    const t = ctx.currentTime, k = .12;
    prox.fan.gain.setTargetAtTime(lv.fan * (.05 + load * .09), t, k);
    prox.fanBp.frequency.setTargetAtTime(320 + load * 520, t, .3);
    prox.motor.frequency.setTargetAtTime(90 + load * 120, t, .3);
    prox.coil.gain.setTargetAtTime(lv.coil * (.002 + load * .007), t, k);
    prox.hum.gain.setTargetAtTime(lv.hum * .05, t, k);
  }
  function proxStop() { if (prox && ctx) ['fan', 'coil', 'hum'].forEach((k) => prox[k].gain.setTargetAtTime(0, ctx.currentTime, .15)); }

  function schedule() {
    const t = ctx.currentTime + .1, c = CHORDS[step % CHORDS.length];
    c.notes.forEach((n, i) => pad(hz(n), t + i * .12, CHORD_SECS, i === 0 ? .05 : .035));
    bass(hz(c.root), t, CHORD_SECS);
    // 2–4 destellos por acorde, en momentos aleatorios
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) blip(hz(BLIPS[Math.floor(Math.random() * BLIPS.length)]), t + 1 + Math.random() * (CHORD_SECS - 2));
    step++;
  }

  function start() {
    if (!ctx) build();
    ctx.resume();
    if (!timer) { schedule(); timer = setInterval(schedule, CHORD_SECS * 1000); }
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(MASTER_VOL, ctx.currentTime, 1.5);
    on = true; ui();
  }
  function stop() {
    proxStop();
    if (ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, .4);
      setTimeout(() => { if (!on) { clearInterval(timer); timer = null; ctx.suspend(); } }, 1800);
    }
    on = false; ui();
  }
  let muted = false;   // sólo cambia cuando el usuario la silencia a mano
  function toggle() { on ? stop() : start(); muted = !on; toast(on ? 'Música activada · M para silenciar' : 'Música silenciada · M para activar'); }
  function toast(msg) {
    const t = document.getElementById('musicToast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function ui() {
    const b = document.getElementById('btnMusic');
    if (!b) return;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', on ? 'Silenciar música (M)' : 'Activar música (M)');
    b.title = on ? 'Silenciar música (M)' : 'Activar música (M)';
  }

  window.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', onClick, true);
    const b = document.getElementById('btnMusic');
    b.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    ui();
    // activada por defecto: intenta sonar ya; si el navegador lo bloquea,
    // arranca con la primera interacción (clic, tecla o toque)
    try { start(); } catch (e) { /* sin Web Audio */ }
    const first = (e) => {
      if (e.target.closest && e.target.closest('#btnMusic')) return;
      if (e.key === 'm' || e.key === 'M') return;
      if (!muted) { start(); toast('Música activada · M para silenciar'); }
      removeEventListener('pointerdown', first, true); removeEventListener('keydown', first, true);
    };
    addEventListener('pointerdown', first, true);
    addEventListener('keydown', first, true);
    addEventListener('keydown', (e) => {
      if ((e.key === 'm' || e.key === 'M') && !e.target.matches('input, textarea, [contenteditable="true"]') && !(window.Edit && Edit.on)) toggle();
    });
  });
  window.Music = { start, stop, toggle, sfx, placed, place, proxSet, proxStop };
})();
