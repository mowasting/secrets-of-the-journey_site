/* cat.js - The Secrets of the Journey
   Pixel-art cat + door beside the session timer.
   Usage:  SJCat.set('break')  -> door opens, cat walks out and sleeps
           SJCat.set('study')  -> cat wakes, walks back into the door and disappears
   Safe to call every second: it only reacts when the phase changes. */
(function () {
  var W = 96, H = 52, FLOOR = 46, REST_X = 20, SPEED = 22;
  var C = {
    W: '#ffffff', S: '#dde2ea', T: '#c9a27a', D: '#5e4636',
    E: '#e3a02e', K: '#1b1410', P: '#f3a1ae',
    frame: '#6b4a32', inside: '#2a1b12', leaf: '#a9784f', leafDark: '#8a5e3a', knob: '#e8c46a',
    floor: 'rgba(160,130,95,0.55)', z: '#9ec1ff', wh: '#b4bdcb', N: '#ec7f95'
  };

  function R(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  /* ---------- cat poses (local coords, y is relative to the floor) ---------- */
  var CW = 36;
  function drawStand(ctx, ox, f, flip) {
    ctx.save();
    if (flip) { ctx.translate(ox + CW, 0); ctx.scale(-1, 1); } else { ctx.translate(ox, 0); }
    /* HALLOWEEN hook (does nothing unless halloween.js is on): the cat in the abaya */
    if (window.SJHalloween && SJHalloween.drawCatStand && SJHalloween.drawCatStand(ctx, f, FLOOR)) { ctx.restore(); return; }
    var a = f % 2 === 0, b = a ? 0 : -1, g = FLOOR;
    function r(x, y, w, h, c) { R(ctx, x, g + y, w, h, c); }
    function leg(x, lift, c) { r(x, -6, 4, 6 - lift, c); r(x, -1 - lift, 4, 1, '#cfd5de'); }
    // tail (dark brown like the real cat)
    r(30, -12 + b, 3, 3, C.D); r(32, -24 + b, 3, 14, C.D);
    // far legs
    leg(15, a ? 1 : 0, C.S); leg(22, a ? 0 : 1, C.S);
    // chubby body
    r(10, -19 + b, 18, 14, C.W); r(8, -17 + b, 22, 10, C.W); r(9, -7 + b, 20, 1, C.S);
    // near legs
    leg(11, a ? 0 : 1, C.W); leg(25, a ? 1 : 0, C.W);
    // big fluffy head
    r(1, -26 + b, 13, 13, C.W); r(0, -23 + b, 15, 8, C.W); r(2, -13 + b, 11, 1, C.S);
    r(2, -26 + b, 11, 3, C.T); r(3, -23 + b, 9, 1, C.T); r(11, -24 + b, 3, 4, C.D);
    // ears
    r(1, -30 + b, 4, 4, C.T); r(2, -31 + b, 2, 1, C.T); r(3, -29 + b, 1, 2, C.P);
    r(10, -30 + b, 4, 4, C.T); r(11, -31 + b, 2, 1, C.T);
    // honey eyes + nose
    r(3, -22 + b, 4, 4, C.E); r(4, -21 + b, 2, 3, C.K);
    r(9, -22 + b, 4, 4, C.E); r(10, -21 + b, 2, 3, C.K);
    r(6, -18 + b, 3, 1, C.N); r(7, -17 + b, 1, 1, C.N);
    r(-5, -17 + b, 6, 1, C.wh); r(-4, -15 + b, 5, 1, C.wh);
    r(14, -17 + b, 6, 1, C.wh); r(14, -15 + b, 5, 1, C.wh);
    ctx.restore();
  }

  function drawSleep(ctx, ox, breathe) {
    ctx.save(); ctx.translate(ox, 0);
    var g = FLOOR, b = breathe ? 1 : 0;
    /* HALLOWEEN hook (does nothing unless halloween.js is on): the sleeping cat in the abaya */
    if (window.SJHalloween && SJHalloween.drawCatSleep && SJHalloween.drawCatSleep(ctx, breathe, FLOOR)) { ctx.restore(); return; }
    function r(x, y, w, h, c) { R(ctx, x, g + y, w, h, c); }
    // tail curled
    r(30, -4, 8, 4, C.D); r(35, -8, 3, 5, C.D);
    // round chubby body
    r(6, -13 - b, 24, 13 + b, C.W); r(5, -10, 26, 9, C.W); r(6, -1, 24, 1, C.S);
    // head resting
    r(1, -14, 12, 13, C.W); r(0, -11, 14, 9, C.W);
    r(2, -14, 10, 3, C.T); r(3, -11, 8, 1, C.T); r(11, -13, 2, 3, C.D);
    r(1, -18, 4, 4, C.T); r(10, -18, 4, 4, C.T); r(2, -16, 1, 1, C.P);
    // closed eyes + nose + paw
    r(3, -7, 4, 1, C.D); r(9, -7, 4, 1, C.D);
    r(6, -5, 3, 1, C.N); r(7, -4, 1, 1, C.N);
    r(-5, -5, 6, 1, C.wh); r(-4, -3, 5, 1, C.wh);
    r(14, -5, 6, 1, C.wh); r(14, -3, 5, 1, C.wh);
    r(0, -1, 7, 1, C.S);
    ctx.restore();
  }

  function drawZ(ctx, x, y, a, sz) {
    ctx.globalAlpha = a;
    if (sz === 4) {
      R(ctx, x, y, 4, 1, C.z); R(ctx, x + 2, y + 1, 1, 1, C.z); R(ctx, x + 1, y + 2, 1, 1, C.z); R(ctx, x, y + 3, 4, 1, C.z);
    } else {
      R(ctx, x, y, 5, 1, C.z); R(ctx, x + 3, y + 1, 1, 1, C.z); R(ctx, x + 2, y + 2, 1, 1, C.z);
      R(ctx, x + 1, y + 3, 1, 1, C.z); R(ctx, x, y + 4, 5, 1, C.z);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- scene ---------- */
  function drawScene(ctx, st, t) {
    ctx.clearRect(0, 0, W, H);
    R(ctx, 0, FLOOR, W, 2, C.floor);
    // doorway interior
    R(ctx, 76, 10, 18, 36, C.inside);
    // cat (clipped at the far side of the doorway so it really goes "inside")
    if (st.mode !== 'hidden') {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 94, H); ctx.clip();
      if (st.mode === 'sleep') {
        drawSleep(ctx, st.x, Math.sin(t * 2) > 0);
      } else if (st.mode === 'wake') {
        drawStand(ctx, st.x, 0, false);
      } else {
        drawStand(ctx, st.x, st.f, st.mode === 'walkR');
      }
      ctx.restore();
    }
    // darkness inside the doorway (cat fades into the dark)
    var gr = ctx.createLinearGradient(76, 0, 94, 0);
    gr.addColorStop(0, 'rgba(25,15,9,0)'); gr.addColorStop(1, 'rgba(25,15,9,0.9)');
    ctx.fillStyle = gr; ctx.fillRect(76, 10, 18, 36);
    // frame
    R(ctx, 74, 8, 22, 2, C.frame); R(ctx, 74, 10, 2, 36, C.frame); R(ctx, 94, 10, 2, 36, C.frame);
    // door leaf (hinged on the right)
    var w = Math.round(18 * (1 - st.open));
    if (w > 0) {
      R(ctx, 94 - w, 10, w, 36, C.leaf);
      R(ctx, 94 - w, 10, 1, 36, C.leafDark);
      if (w > 6) R(ctx, 94 - w + 2, 28, 2, 2, C.knob);
    }
    // sleeping Zzz
    if (st.mode === 'sleep') {
      for (var i = 0; i < 3; i++) {
        var ph = (t * 0.45 + i / 3) % 1;
        drawZ(ctx, st.x + 4 + i * 6, FLOOR - 22 - ph * 12, 1 - ph, i === 0 ? 4 : 5);
      }
    }
  }

  /* ---------- state machine ---------- */
  var st = { mode: 'hidden', x: 94, open: 0, f: 0, ft: 0, wake: 0, target: 'study' };
  var ctx = null, canvas = null, raf = 0, last = 0;

  function update(dt) {
    var want = 0;
    if (st.mode === 'opening' || st.mode === 'walkR') want = 1;
    if (st.mode === 'walkL' && st.x > 40) want = 1;
    st.open += (want ? 1 : -1) * dt / 0.5;
    st.open = Math.max(0, Math.min(1, st.open));

    st.ft += dt; if (st.ft > 0.16) { st.ft = 0; st.f++; }

    if (st.mode === 'opening' && st.open >= 1) {
      st.mode = st.target === 'break' ? 'walkL' : 'hidden';
    } else if (st.mode === 'walkL') {
      st.x -= SPEED * dt;
      if (st.x <= REST_X) { st.x = REST_X; st.mode = 'sleep'; }
    } else if (st.mode === 'wake') {
      st.wake += dt;
      if (st.wake >= 0.8) st.mode = 'walkR';
    } else if (st.mode === 'walkR') {
      st.x += SPEED * dt;
      if (st.x >= 94) { st.x = 94; st.mode = 'hidden'; }
    }
  }

  function loop(ts) {
    var dt = last ? Math.min((ts - last) / 1000, 0.1) : 0.016; last = ts;
    update(dt);
    drawScene(ctx, st, ts / 1000);
    if (st.mode !== 'hidden' || st.open > 0) raf = requestAnimationFrame(loop);
    else { raf = 0; last = 0; }
  }
  function kick() { if (!raf && ctx) raf = requestAnimationFrame(loop); }

  function set(phase, instant) {
    if (phase !== 'break' && phase !== 'study') return;
    if (phase === st.target && !instant) return;
    st.target = phase;
    if (instant) {
      if (phase === 'break') { st.mode = 'sleep'; st.x = REST_X; } else { st.mode = 'hidden'; st.x = 94; }
      st.open = 0; if (ctx) drawScene(ctx, st, Date.now() / 1000);
      if (phase === 'break') kick();
      return;
    }
    if (phase === 'break') {
      if (st.mode === 'hidden') st.mode = 'opening';
      else if (st.mode === 'walkR') st.mode = 'walkL';
      else if (st.mode === 'wake') { st.mode = 'sleep'; }
    } else {
      if (st.mode === 'sleep') { st.mode = 'wake'; st.wake = 0; }
      else if (st.mode === 'walkL') st.mode = 'walkR';
    }
    kick();
  }

  function mount() {
    var box = document.getElementById('catScene');
    if (!box) { console.warn('cat.js: add <div id="catScene"></div> next to the timer'); return; }
    canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = 'width:100%;max-width:420px;height:auto;display:block;margin:0 auto;image-rendering:pixelated;image-rendering:crisp-edges;';
    box.appendChild(canvas);
    ctx = canvas.getContext('2d');
    drawScene(ctx, st, 0);
    kick();
    if (/cattest/.test(location.search)) {
      var bar = document.createElement('div');
      bar.style.cssText = 'text-align:center;margin-top:6px';
      ['break', 'study'].forEach(function (p) {
        var bt = document.createElement('button'); bt.textContent = p; bt.style.margin = '0 4px';
        bt.onclick = function () { set(p); }; bar.appendChild(bt);
      });
      box.appendChild(bar);
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
    window.SJCat = { set: set };
  }
  if (typeof module !== 'undefined') module.exports = { drawStand: drawStand, drawSleep: drawSleep, drawScene: drawScene, W: W, H: H, state: st };
})();
