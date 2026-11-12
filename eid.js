/* eid.js : ثيم العيد (يشتغل بالتواريخ الي تكتبها بـ eid-config.js، أو للتجربة ?season=eid)
   يحتوي: قصاصات ملونة تتساقط + شريط رايات أعلى الصفحة + زينة مشهد القطة (رايات، بالونات، كليجة)
   + هيرو بكسل: مزرعة بخراف تقفز فوق السياج، حظيرة وأشجار وبالونات وشمس.
   إذا الموسم مو العيد هذا الملف ما يسوي شي. */
(function () {
  "use strict";
  if (!window.SJSeason) return;

  var NAME = "eid";
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FLAG = ["#e24a4a", "#f2b632", "#2fb3c9", "#7ac74f", "#ec6fb0", "#8a5fd6"];
  var GOLD = "#f2b632";

  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function isDark() { return document.documentElement.getAttribute("data-theme") === "dark"; }

  /* ================= مشهد القطة: رايات + بالونات + كليجة ================= */
  function bunting(c, x0, x1, y, t) {
    for (var x = x0; x <= x1; x++) rect(c, x, y + Math.round(Math.sin((x - x0) / (x1 - x0) * Math.PI * 3) * 1.2), 1, 1, "#5a4a3a");
    for (var i = 0, bx = x0 + 3; bx < x1 - 2; bx += 5, i++) {
      var by = y + 1 + Math.round(Math.sin((bx - x0) / (x1 - x0) * Math.PI * 3) * 1.2);
      var col = FLAG[i % FLAG.length];
      rect(c, bx, by, 4, 1, col); rect(c, bx + 1, by + 1, 2, 1, col); rect(c, bx + 1, by + 2, 1, 1, col);
    }
  }
  function balloon(c, x, y, col, t, ph) {
    var sw = Math.round(Math.sin(t * 1.3 + ph) * 1);
    var bob = Math.round(Math.sin(t * 1.7 + ph) * 1);
    rect(c, x + sw, y + bob, 5, 6, col); rect(c, x + 1 + sw, y - 1 + bob, 3, 1, col); rect(c, x + 1 + sw, y + 6 + bob, 3, 1, col);
    rect(c, x + 1 + sw, y + 1 + bob, 1, 2, "rgba(255,255,255,.7)");
    rect(c, x + 2 + sw, y + 7 + bob, 1, 1, "#7a5a3a");
    for (var k = 0; k < 8; k++) rect(c, x + 2 + Math.round(sw * (1 - k / 8)), y + 8 + bob + k * 2, 1, 2, "#8a7a66");
  }
  function scene(ctx, layer, t, FLOOR) {
    if (layer === "back") {
      bunting(ctx, 0, 74, 2, t);
      balloon(ctx, 3, FLOOR - 34, "#e24a4a", t, 0);
      balloon(ctx, 9, FLOOR - 31, "#2fb3c9", t, 1.7);
      /* صحن كليجة عراقية */
      rect(ctx, 62, FLOOR - 2, 11, 2, "#efe6d2"); rect(ctx, 63, FLOOR - 1, 9, 1, "#cdbf9f");
      rect(ctx, 63, FLOOR - 4, 3, 2, "#d8a24a"); rect(ctx, 67, FLOOR - 4, 3, 2, "#d8a24a"); rect(ctx, 65, FLOOR - 6, 3, 2, "#e0b060");
      rect(ctx, 64, FLOOR - 4, 1, 1, "#fff3d0"); rect(ctx, 68, FLOOR - 4, 1, 1, "#fff3d0"); rect(ctx, 66, FLOOR - 6, 1, 1, "#fff3d0");
      rect(ctx, 71, FLOOR - 4, 2, 2, "#d8a24a");
    } else if (layer === "front") {
      /* هلال ونجمة وشريط فوق الباب */
      for (var y = -3; y <= 3; y++) for (var x = -3; x <= 3; x++) {
        if (x * x + y * y > 9) continue;
        var dx = x - 1.4, dy = y + 0.6;
        if (dx * dx + dy * dy <= 7) continue;
        rect(ctx, 84 + x, 4 + y, 1, 1, GOLD);
      }
      rect(ctx, 89, 3, 1, 3, "#ffe28a"); rect(ctx, 88, 4, 3, 1, "#ffe28a");
    }
  }
  window.SJSeason.register(NAME, { scene: scene });
  if (!window.SJSeason.active(NAME)) return;

  /* ================= الهيرو: مزرعة وخراف تقفز فوق السياج ================= */
  var S = 3;
  var hero = null, hctx = null, card = null, hw = 0, hh = 0, stars = [];
  (function seed() {
    var r = 4242;
    function rnd() { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; }
    for (var i = 0; i < 30; i++) stars.push({ x: rnd(), y: rnd() * 0.7, p: rnd() * 6 });
  })();

  function groundTop() {
    var cs = document.getElementById("catScene");
    if (!cs || !card) return Math.round(hh * 0.72);
    var a = card.getBoundingClientRect(), b = cs.getBoundingClientRect();
    if (!b.height) return Math.round(hh * 0.72);
    return Math.round((b.bottom - a.top - 6) / S);
  }

  function sheep(c, x, y, o) {
    /* x = يسار الخروف، y = الأرض (تحت الحوافر). o: {wool, face, jump, f} */
    var W = o.wool, F = o.face, WS = "#d7d4c8";
    rect(c, x, y - 7, 1, 2, W);                                            /* ذيل */
    rect(c, x + 1, y - 8, 10, 5, W); rect(c, x + 2, y - 9, 3, 1, W); rect(c, x + 6, y - 9, 4, 1, W);
    rect(c, x, y - 6, 1, 3, W); rect(c, x + 11, y - 7, 1, 3, W);
    rect(c, x + 1, y - 4, 10, 1, WS);
    rect(c, x + 11, y - 9, 3, 1, W);                                       /* خصلة */
    rect(c, x + 11, y - 8, 4, 4, F); rect(c, x + 10, y - 8, 1, 2, F);      /* راس وأذن */
    rect(c, x + 13, y - 7, 1, 1, "#fff"); rect(c, x + 14, y - 5, 1, 1, "#2a2226");
    rect(c, x + 10, y - 5, 1, 2, "#e24a4a");                               /* شريط العيد */
    if (o.jump) {
      rect(c, x + 12, y - 4, 3, 1, F); rect(c, x + 14, y - 3, 1, 1, F);     /* أرجل أمامية ممدودة */
      rect(c, x - 2, y - 4, 3, 1, F); rect(c, x - 2, y - 3, 1, 1, F);       /* خلفية */
    } else if (o.f) {
      rect(c, x + 2, y - 3, 1, 3, F); rect(c, x + 5, y - 3, 1, 2, F); rect(c, x + 8, y - 3, 1, 2, F); rect(c, x + 10, y - 3, 1, 3, F);
    } else {
      rect(c, x + 3, y - 3, 1, 2, F); rect(c, x + 4, y - 3, 1, 3, F); rect(c, x + 9, y - 3, 1, 3, F); rect(c, x + 10, y - 3, 1, 2, F);
    }
  }
  function tree(c, x, y, h, dark) {
    rect(c, x, y - h + 4, 2, h - 4, "#6b4a2e");
    var g1 = dark ? "#2a8a55" : "#4fae5a", g2 = dark ? "#1f6e44" : "#3b8f4a";
    rect(c, x - 4, y - h, 10, 4, g1); rect(c, x - 5, y - h + 2, 12, 3, g1); rect(c, x - 3, y - h - 1, 6, 1, g1);
    rect(c, x - 1, y - h + 3, 6, 2, g2);
  }
  function cloud(c, x, y) { rect(c, x, y, 12, 3, "#fff"); rect(c, x + 2, y - 2, 6, 2, "#fff"); rect(c, x + 7, y - 1, 4, 1, "#fff"); }

  function draw(t) {
    var dark = isDark(), g = groundTop(), c = hctx;
    c.clearRect(0, 0, hw, hh);
    var y0 = 34, fx = Math.round(hw * 0.52);
    var bands = dark ? ["#0f2a4a", "#17406a", "#215a86", "#2f7aa0", "#3f93ad"] : ["#6fc3ee", "#8cd0f3", "#a9ddf6", "#c8eafa", "#e3f6ff"];
    var sky = Math.max(g, 10);
    for (var i = 0; i < bands.length; i++) rect(c, 0, Math.floor(i * sky / bands.length), hw, Math.ceil(sky / bands.length) + 1, bands[i]);
    /* نجوم + هلال (ليل) أو شمس وغيوم (نهار) */
    if (dark) {
      for (var s = 0; s < stars.length; s++) { var st = stars[s]; if (Math.sin(t * 1.5 + st.p) > -0.3) rect(c, Math.floor(st.x * hw), Math.floor(st.y * (g - 8)), 1, 1, "#fff6c8"); }
      var mx = Math.round(hw * 0.86), my = 9;
      for (var yy = -6; yy <= 6; yy++) for (var xx = -6; xx <= 6; xx++) {
        if (xx * xx + yy * yy > 36) continue; var dx = xx - 2.6, dy = yy + 1.2; if (dx * dx + dy * dy <= 28) continue;
        rect(c, mx + xx, my + yy, 1, 1, "#f6c453");
      }
    } else {
      var sx = Math.round(hw * 0.86), sy = 10, ray = ((t * 2) | 0) % 2;
      for (var y2 = -5; y2 <= 5; y2++) for (var x2 = -5; x2 <= 5; x2++) if (x2 * x2 + y2 * y2 <= 25) rect(c, sx + x2, sy + y2, 1, 1, "#ffd84a");
      [[0, -8], [0, 8], [-8, 0], [8, 0], [6, 6], [-6, -6], [6, -6], [-6, 6]].forEach(function (d, k) { if ((k + ray) % 2) rect(c, sx + d[0], sy + d[1], 1, 1, "#ffe98a"); });
      cloud(c, ((t * 2.2) % (hw + 40)) - 20, 12); cloud(c, ((t * 1.4 + 70) % (hw + 40)) - 20, 20);
    }
    /* رايات أعلى الهيرو */
    bunting(c, 0, hw, 2, t);
    /* بالونات صاعدة */
    for (var b = 0; b < 4; b++) {
      var bx = Math.round(hw * (0.1 + b * 0.09)) + Math.round(Math.sin(t * 0.8 + b) * 3);
      var by = 28 - ((t * 3 + b * 9) % 34);
      if (by > 4) balloon(c, bx, by, FLAG[(b * 2) % FLAG.length], t, b);
    }
    /* تلال بعيدة قرب الأرضية */
    for (var x = 0; x < hw; x++) {
      var h1 = g - 9 + Math.round(Math.sin(x * 0.06 + 2) * 3 + Math.sin(x * 0.15) * 1.2);
      rect(c, x, h1, 1, g - h1 + 2, dark ? "#1f6b5a" : "#8fd19a");
      var h2 = g - 4 + Math.round(Math.sin(x * 0.09) * 2);
      rect(c, x, h2, 1, g - h2 + 2, dark ? "#2a8a62" : "#6cc07a");
    }
    tree(c, Math.round(hw * 0.18), g + 1, 18, dark); tree(c, Math.round(hw * 0.84), g + 1, 22, dark);
    /* خراف صغيرة ترعى بعيد */
    [0.3, 0.63].forEach(function (p, k) { var gx = Math.round(hw * p); rect(c, gx, g - 4, 4, 2, "#fff"); rect(c, gx + 3, g - 4, 2, 2, "#3b3438"); rect(c, gx, g - 2, 1, 1, "#3b3438"); rect(c, gx + 3, g - 2, 1, 1, "#3b3438"); });
    /* أرض */
    rect(c, 0, g + 1, hw, hh - g, dark ? "#245f43" : "#59b86a");
    rect(c, 0, g + 1, hw, 2, dark ? "#2f7a55" : "#7ad18a");
    for (var px = 0; px < hw; px += 7) rect(c, px, g + 4 + (px % 3), 1, 1, dark ? "#1b4a34" : "#3e9a54");
    rect(c, 0, g + 9, hw, hh - g - 9, dark ? "#1b4a34" : "#46a85c");

    /* ===== المرعى العائم (فوق) ===== */
    var gr = dark ? "#4cc06a" : "#7ed957", grd = dark ? "#35964f" : "#5db846";
    rect(c, 0, y0 + 1, hw, 3, gr); rect(c, 0, y0 + 1, hw, 1, dark ? "#7be08e" : "#a6ec7a");
    rect(c, 0, y0 + 4, hw, 4, "#8a5a34");
    for (var sx2 = 0; sx2 < hw; sx2++) {
      var dep = 3 + Math.round(Math.sin(sx2 * 0.35) * 1.2 + Math.sin(sx2 * 0.11) * 2);
      rect(c, sx2, y0 + 8, 1, dep, "#6b4426");
      if (sx2 % 5 === 0) rect(c, sx2, y0 + 4, 1, 3, "#a0703f");
    }
    for (var gx2 = 2; gx2 < hw; gx2 += 6) { rect(c, gx2, y0 - 1, 1, 2, grd); rect(c, gx2 + 1, y0, 1, 1, grd); }
    /* زهور صغيرة */
    [0.08, 0.3, 0.74, 0.9].forEach(function (p, k) { var fx2 = Math.round(hw * p); rect(c, fx2, y0 - 1, 1, 1, FLAG[k + 1]); });
    /* حظيرة */
    var bx2 = hw - 24, red = "#c9433c", redD = "#9a2f2a";
    rect(c, bx2, y0 - 12, 17, 12, red); rect(c, bx2 - 1, y0 - 14, 19, 2, redD); rect(c, bx2 + 2, y0 - 16, 13, 2, redD); rect(c, bx2 + 5, y0 - 18, 7, 2, redD);
    rect(c, bx2 + 5, y0 - 8, 7, 8, "#f3ead6"); rect(c, bx2 + 5, y0 - 8, 7, 1, "#bda77a"); rect(c, bx2 + 8, y0 - 8, 1, 8, "#bda77a");
    for (var d2 = 0; d2 < 7; d2++) { rect(c, bx2 + 5 + d2, y0 - 8 + d2 * 1, 1, 1, "#bda77a"); rect(c, bx2 + 11 - d2, y0 - 8 + d2, 1, 1, "#bda77a"); }
    rect(c, bx2 + 7, y0 - 14, 3, 3, "#f3ead6");
    /* سياج خلفي طويل */
    for (var fp = 4; fp < hw - 28; fp += 10) { if (Math.abs(fp - fx) < 9) continue; rect(c, fp, y0 - 6, 2, 6, "#b98a54"); }
    rect(c, 0, y0 - 5, fx - 8, 1, "#d3a76d"); rect(c, 0, y0 - 3, fx - 8, 1, "#d3a76d");
    rect(c, fx + 8, y0 - 5, hw - 36 - fx, 1, "#d3a76d"); rect(c, fx + 8, y0 - 3, hw - 36 - fx, 1, "#d3a76d");
    /* السياج الي تقفز فوقه الخراف */
    rect(c, fx - 6, y0 - 9, 2, 9, "#a0703f"); rect(c, fx + 5, y0 - 9, 2, 9, "#a0703f"); rect(c, fx - 1, y0 - 9, 2, 9, "#b98a54");
    rect(c, fx - 7, y0 - 8, 15, 2, "#d3a76d"); rect(c, fx - 7, y0 - 4, 15, 2, "#d3a76d");
    rect(c, fx - 7, y0 - 8, 15, 1, "#ecc58c"); rect(c, fx - 7, y0 - 4, 15, 1, "#ecc58c");
    /* الخراف */
    var n = 4, v = 17, Lp = hw + 40;
    var woolC = ["#ffffff", "#f6eedb", "#ffffff", "#efe4cb"], faceC = ["#3b3438", "#4a3a30", "#3b3438", "#2f2a30"];
    for (var k2 = 0; k2 < n; k2++) {
      var pos = RM ? (hw * (0.15 + k2 * 0.22)) : (((t * v + k2 * Lp / n) % Lp) - 20);
      var dxc = (pos + 7) - fx, jump = 0, lift = 0;
      if (Math.abs(dxc) < 11) { jump = 1; lift = 12 * (1 - (dxc / 11) * (dxc / 11)); }
      sheep(c, Math.round(pos), Math.round(y0 - lift), { wool: woolC[k2], face: faceC[k2], jump: jump, f: ((t * 7 + k2) | 0) % 2 });
    }
  }

  function resize() {
    if (!card || !hero) return;
    var r = card.getBoundingClientRect();
    var w = Math.ceil(r.width / S), h = Math.ceil(r.height / S);
    if (w < 2 || h < 2) return;
    if (w !== hw || h !== hh) { hw = w; hh = h; hero.width = w; hero.height = h; }
  }
  var raf = 0, last = 0;
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (ts - last < 50) return;
    last = ts;
    if (document.hidden || !card || card.offsetParent === null) return;
    resize();
    if (hw > 1) draw(ts / 1000);
  }
  var GREET = { ar: "عيد مبارك ✦", en: "Eid Mubarak ✦", ckb: "جەژنتان پیرۆز بێت ✦" };
  var greetEl = null;
  function L() { try { return currentLanguage(); } catch (e) { return "ar"; } }
  function mountHero() {
    card = document.querySelector("#liveView .status-card");
    if (!card || hero) return;
    card.classList.add("ed-card");
    hero = document.createElement("canvas");
    hero.className = "ed-hero";
    hero.setAttribute("aria-hidden", "true");
    card.insertBefore(hero, card.firstChild);
    greetEl = document.createElement("div");
    greetEl.className = "ed-greet";
    card.appendChild(greetEl);
    hctx = hero.getContext("2d");
    if (window.ResizeObserver) new ResizeObserver(resize).observe(card);
    raf = requestAnimationFrame(loop);
  }
  setInterval(function () { if (greetEl) { var t = GREET[L()] || GREET.ar; if (greetEl.textContent !== t) greetEl.textContent = t; } }, 700);

  /* ================= رايات ملونة أعلى الصفحة ================= */
  function mountBunting() {
    if (document.querySelector(".ed-bunting")) return;
    var d = document.createElement("div");
    d.className = "ed-bunting"; d.setAttribute("aria-hidden", "true");
    var cols = FLAG, n = 22, svg = '<svg viewBox="0 0 100 12" preserveAspectRatio="none"><path d="M0 1 ';
    for (var j = 0; j < 4; j++) svg += "Q " + (j * 25 + 12.5) + " 5 " + (j * 25 + 25) + " 1 ";
    svg += '" fill="none" stroke="#6a5a48" stroke-width="0.6" vector-effect="non-scaling-stroke"/>';
    for (var i = 0; i < n; i++) {
      var x = 2 + i * (96 / n), seg = (x % 25) / 25, y = 1 + Math.sin(seg * Math.PI) * 2.2;
      svg += '<polygon points="' + x + "," + y + " " + (x + 3) + "," + y + " " + (x + 1.5) + "," + (y + 5) + '" fill="' + cols[i % cols.length] + '"/>';
    }
    d.innerHTML = svg + "</svg>";
    document.body.appendChild(d);
  }

  /* ================= قصاصات ملونة تتساقط ================= */
  function mountConfetti() {
    if (RM || document.getElementById("edConfetti")) return;
    var cv = document.createElement("canvas");
    cv.id = "edConfetti"; cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    var c = cv.getContext("2d"), W = 0, H = 0, p = [];
    function fit() { W = cv.width = innerWidth; H = cv.height = innerHeight; }
    fit(); addEventListener("resize", fit);
    var n = innerWidth < 600 ? 30 : 56;
    for (var i = 0; i < n; i++) p.push({ x: Math.random() * W, y: Math.random() * H, w: 3 + (Math.random() * 3 | 0), h: 5 + (Math.random() * 3 | 0), v: 14 + Math.random() * 20, ph: Math.random() * 6, col: FLAG[i % FLAG.length] });
    var lt = 0;
    (function tick(ts) {
      requestAnimationFrame(tick);
      if (document.hidden) return;
      var dt = Math.min((ts - lt) / 1000, 0.1); lt = ts;
      c.clearRect(0, 0, W, H);
      for (var i = 0; i < p.length; i++) {
        var q = p[i];
        q.y += q.v * dt; q.x += Math.sin(ts / 900 + q.ph) * 14 * dt;
        if (q.y > H + 8) { q.y = -8; q.x = Math.random() * W; }
        var sq = Math.abs(Math.sin(ts / 420 + q.ph));
        c.fillStyle = q.col; c.globalAlpha = 0.85;
        c.fillRect(Math.round(q.x), Math.round(q.y), q.w, Math.max(1, Math.round(q.h * (0.35 + sq * 0.65))));
      }
      c.globalAlpha = 1;
    })(0);
  }

  function boot() { mountBunting(); mountConfetti(); mountHero(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
