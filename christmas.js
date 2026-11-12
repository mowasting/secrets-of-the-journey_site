/* christmas.js : ثيم الكريسماس (يشتغل تلقائياً من 1/12/2026 لـ 2/1/2027 عبر season.js)
   يحتوي: ثلج يتساقط + أضوية بأعلى الصفحة + بانر الهيرو (سانتا والغزلان والأشجار)
   + ملابس القطة (كنزة وقبعة سانتا) + زينة مشهد القطة (شجرة، هدايا، أضوية، إكليل الباب)
   إذا الموسم مو كريسماس هذا الملف ما يسوي شي. */
(function () {
  "use strict";
  if (!window.SJSeason) return;

  var NAME = "christmas";
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function isDark() { return document.documentElement.getAttribute("data-theme") === "dark"; }

  /* ================= القطة: كنزة + قبعة سانتا ================= */
  var RED = "#c8323c", RED_D = "#9a2430", WHITE = "#f7f7f7", GREEN = "#2f8f4e", GOLD = "#f0c24a";

  function catPart(ctx, part, b, f) {
    function r(x, y, w, h, c) { rect(ctx, x, f + y, w, h, c); }
    if (part === "standBody") {
      /* كنزة شتوية حمراء بخطوط بيضاء وياقة خضراء */
      r(9, -18 + b, 20, 11, RED); r(8, -16 + b, 22, 8, RED);
      r(8, -15 + b, 22, 1, WHITE); r(8, -11 + b, 22, 1, WHITE);
      r(12, -13 + b, 2, 2, GREEN); r(17, -13 + b, 2, 2, GREEN); r(22, -13 + b, 2, 2, GREEN); r(26, -13 + b, 2, 2, GREEN);
      r(9, -8 + b, 20, 1, RED_D);
      r(10, -19 + b, 6, 2, GREEN);                 /* ياقة */
    } else if (part === "standHead") {
      /* قبعة سانتا بين الأذنين */
      r(4, -29 + b, 8, 2, WHITE);
      r(5, -32 + b, 6, 3, RED); r(6, -35 + b, 5, 3, RED);
      r(9, -37 + b, 4, 2, RED); r(12, -36 + b, 2, 2, RED);
      r(12, -39 + b, 3, 3, WHITE);
      r(5, -30 + b, 1, 1, RED_D);
    } else if (part === "sleepBody") {
      r(13, -12 - b, 17, 11 + b, RED);
      r(13, -9, 17, 1, WHITE); r(13, -5, 17, 1, WHITE);
      r(15, -7, 2, 2, GREEN); r(20, -7, 2, 2, GREEN); r(25, -7, 2, 2, GREEN);
      r(13, -2, 17, 1, RED_D);
      r(12, -13 - b, 3, 3, GREEN);
    } else if (part === "sleepHead") {
      r(2, -16, 10, 2, WHITE);
      r(3, -19, 8, 3, RED); r(4, -22, 6, 3, RED);
      r(7, -24, 5, 2, RED); r(11, -23, 3, 3, RED);
      r(13, -22, 3, 3, WHITE);
    }
  }

  /* ================= مشهد القطة: شجرة، هدايا، أضوية، إكليل ================= */
  function tree(ctx, x, base, t) {
    /* x = منتصف الشجرة، base = الأرض */
    rect(ctx, x - 1, base - 3, 3, 3, "#6b4226");
    var tiers = [[13, 8], [9, 8], [5, 7]];
    var y = base - 3;
    for (var i = 0; i < 3; i++) {
      var w = tiers[i][0], h = tiers[i][1];
      for (var k = 0; k < h; k++) {
        var ww = Math.max(3, Math.round(w - (h - 1 - k) * 0 - (h - 1 - k) * (w / h) * 0.0));
        /* مثلث: العرض يزيد من فوق لتحت */
        ww = Math.round(3 + (w - 3) * (k / (h - 1)));
        rect(ctx, x - Math.floor(ww / 2), y - (h - k), ww, 1, k % 2 ? GREEN : "#3aa35c");
      }
      y -= h - 2;
    }
    /* نجمة */
    var star = ((t * 2) | 0) % 2 ? GOLD : "#fff3a8";
    rect(ctx, x - 1, y - 6, 3, 3, star); rect(ctx, x, y - 7, 1, 5, star); rect(ctx, x - 2, y - 5, 5, 1, star);
    /* زينة */
    var cols = ["#ff4d4d", "#4db5ff", GOLD, "#ff9be0"];
    var orn = [[-2, 4], [3, 6], [-4, 12], [0, 14], [4, 16], [-3, 20], [2, 21]];
    for (var o = 0; o < orn.length; o++) {
      var on = (((t * 1.6) | 0) + o) % 3 !== 0;
      rect(ctx, x + orn[o][0], base - 30 + orn[o][1] + 3, 2, 2, on ? cols[o % 4] : "#8a5a3a");
    }
  }
  function gift(ctx, x, y, w, h, c, rib) {
    rect(ctx, x, y, w, h, c);
    rect(ctx, x + Math.floor(w / 2), y, 1, h, rib);
    rect(ctx, x, y + Math.floor(h / 2) - 1, w, 1, rib);
    rect(ctx, x + Math.floor(w / 2) - 1, y - 1, 3, 1, rib);
  }
  function lights(ctx, t, W) {
    var cols = ["#ff4d4d", "#ffd34f", "#4dd0ff", "#7dff7d"];
    for (var x = 0; x <= W; x += 1) {
      var yy = 2 + Math.round(Math.sin(x / 72 * Math.PI * 3) * 1.5 + 1.5);
      rect(ctx, x, yy, 1, 1, "#1f3d2a");
    }
    for (var i = 0, bx = 3; bx < W - 2; bx += 6, i++) {
      var by = 3 + Math.round(Math.sin(bx / 72 * Math.PI * 3) * 1.5 + 1.5);
      var on = (((t * 2) | 0) + i) % 2 === 0;
      rect(ctx, bx, by, 2, 3, on ? cols[i % 4] : "#3b4b40");
    }
  }
  function scene(ctx, layer, t, FLOOR) {
    if (layer === "back") {
      lights(ctx, t, 74);
      tree(ctx, 66, FLOOR, t);
      gift(ctx, 3, FLOOR - 7, 8, 7, "#d93a3a", WHITE);
      gift(ctx, 5, FLOOR - 12, 6, 5, "#2f8f4e", GOLD);
      gift(ctx, 61, FLOOR - 4, 5, 4, "#4a78c9", GOLD);
      gift(ctx, 68, FLOOR - 5, 5, 5, GOLD, "#d93a3a");
    } else if (layer === "front") {
      /* إكليل فوق الباب */
      rect(ctx, 76, 5, 18, 3, GREEN); rect(ctx, 77, 4, 16, 1, "#3aa35c");
      rect(ctx, 81, 3, 3, 4, "#d93a3a"); rect(ctx, 87, 3, 3, 4, "#d93a3a"); rect(ctx, 84, 4, 3, 3, "#ff6b6b");
      rect(ctx, 79, 6, 1, 1, GOLD); rect(ctx, 91, 6, 1, 1, GOLD);
    }
  }

  window.SJSeason.register(NAME, { catPart: catPart, scene: scene });
  if (!window.SJSeason.active(NAME)) return;

  /* ================= بانر الهيرو (خلف بطاقة العد التنازلي) ================= */
  var S = 3;                       /* كل بكسل فني = 3 بكسل شاشة */
  var hero = null, hctx = null, card = null, hw = 0, hh = 0;
  var stars = [], trees = [];
  (function seed() {
    var r = 12345;
    function rnd() { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; }
    for (var i = 0; i < 26; i++) stars.push({ x: rnd(), y: rnd() * 0.9, p: rnd() * 6 });
    trees = [
      { x: 0.17, h: 18, l: 1, d: 5 }, { x: 0.27, h: 11, l: 0, d: 2 },
      { x: 0.72, h: 12, l: 0, d: 3 }, { x: 0.83, h: 18, l: 1, d: 5 }, { x: 0.94, h: 26, l: 1, d: 2 }
    ];
  })();

  function pine(c, cx, base, hgt, lit, t, idx) {
    var tiers = Math.max(3, Math.round(hgt / 6));
    var th = Math.round((hgt - 3) / tiers) + 1;
    rect(c, cx - 1, base - 3, 2, 3, "#5b3a21");
    var y = base - 3;
    for (var i = 0; i < tiers; i++) {
      var wMax = 4 + Math.round((i + 1) * (hgt / 3.2) / tiers * 1.2);
      for (var k = 0; k < th; k++) {
        var w = Math.round(2 + (wMax - 2) * (k / Math.max(1, th - 1)));
        var x0 = cx - Math.floor(w / 2);
        rect(c, x0, y - (th - k), w, 1, "#1f7a43");
        rect(c, cx + 1, y - (th - k), Math.max(0, Math.floor(w / 2) - 1), 1, "#175f35");
      }
      /* ثلج فوق الطبقة */
      var sw = Math.round(2 + (wMax - 2) * 0.55);
      rect(c, cx - Math.floor(sw / 2), y - th, sw, 1, "#ffffff");
      if (i === 0) rect(c, cx, y - th - 1, 1, 1, "#ffffff");
      y -= th - 2;
    }
    if (lit) {
      var cols = ["#ff4d4d", "#ffd34f", "#4dd0ff", "#ff9be0"];
      for (var j = 0; j < 6; j++) {
        var on = (((t * 1.5) | 0) + j + idx) % 3 !== 0;
        var ly = base - 6 - j * Math.round(hgt / 8);
        var lx = cx + ((j % 2) ? 2 : -2) * (1 + (j % 3));
        if (on) rect(c, lx, ly, 1, 1, cols[(j + idx) % 4]);
      }
    }
  }

  function reindeer(c, x, y, f) {
    var B = "#8a5a34", L = "#c9a27a", A = "#e0c08a";
    rect(c, x + 1, y + 5, 8, 3, B); rect(c, x + 2, y + 7, 6, 1, L);
    rect(c, x, y + 4, 1, 2, WHITE);
    rect(c, x + 8, y + 3, 2, 3, B); rect(c, x + 9, y + 2, 4, 3, B);
    rect(c, x + 12, y + 3, 2, 2, "#ff3b3b"); rect(c, x + 14, y + 3, 1, 1, "#ff9a9a");
    rect(c, x + 10, y + 3, 1, 1, "#241812"); rect(c, x + 9, y + 1, 1, 1, B);
    rect(c, x + 10, y - 2, 1, 3, A); rect(c, x + 9, y - 2, 1, 1, A);
    rect(c, x + 12, y - 3, 1, 4, A); rect(c, x + 13, y - 3, 1, 1, A);
    if (f) {
      rect(c, x + 8, y + 8, 1, 2, B); rect(c, x + 9, y + 9, 2, 1, B);
      rect(c, x + 1, y + 8, 1, 2, B); rect(c, x, y + 9, 2, 1, B);
      rect(c, x + 6, y + 8, 1, 2, "#6f4527"); rect(c, x + 3, y + 8, 1, 2, "#6f4527");
    } else {
      rect(c, x + 8, y + 8, 1, 3, B); rect(c, x + 10, y + 9, 1, 1, B);
      rect(c, x + 1, y + 8, 1, 3, B); rect(c, x - 1, y + 9, 1, 1, B);
      rect(c, x + 6, y + 8, 1, 2, "#6f4527"); rect(c, x + 3, y + 8, 1, 2, "#6f4527");
    }
  }

  function sleigh(c, x, y) {
    var R = "#c4282f", G = "#f0c24a";
    rect(c, x, y + 13, 25, 1, G); rect(c, x + 24, y + 11, 1, 3, G); rect(c, x + 25, y + 10, 1, 1, G);
    rect(c, x + 5, y + 11, 1, 2, G); rect(c, x + 16, y + 11, 1, 2, G);
    rect(c, x + 2, y + 7, 21, 4, R); rect(c, x + 21, y + 6, 3, 3, R); rect(c, x + 1, y + 8, 1, 2, R);
    rect(c, x + 2, y + 9, 21, 1, G); rect(c, x + 3, y + 10, 19, 1, "#8f1c22");
    /* كيس الهدايا */
    rect(c, x + 3, y + 3, 6, 5, "#a8743c"); rect(c, x + 4, y + 2, 4, 1, "#c99357");
    rect(c, x + 3, y + 0, 2, 2, "#4fb3ff"); rect(c, x + 6, y - 1, 2, 3, "#ffd34f"); rect(c, x + 5, y + 1, 1, 1, "#ff7bd0");
    /* سانتا */
    rect(c, x + 11, y + 3, 6, 5, "#d93a3a"); rect(c, x + 11, y + 6, 6, 1, "#2a1a10"); rect(c, x + 13, y + 6, 2, 1, G);
    rect(c, x + 12, y + 1, 4, 3, "#f3c9a0"); rect(c, x + 12, y + 3, 4, 2, WHITE);
    rect(c, x + 13, y + 2, 1, 1, "#222"); rect(c, x + 15, y + 2, 1, 1, "#222");
    rect(c, x + 12, y - 1, 4, 2, "#d93a3a"); rect(c, x + 13, y - 2, 3, 1, "#d93a3a");
    rect(c, x + 16, y - 2, 1, 2, "#d93a3a"); rect(c, x + 16, y - 3, 2, 2, WHITE); rect(c, x + 11, y, 6, 1, WHITE);
    rect(c, x + 17, y + 4, 4, 1, "#d93a3a"); rect(c, x + 21, y + 4, 1, 1, "#f3c9a0");
  }

  function groundTop() {
    var cs = document.getElementById("catScene");
    if (!cs || !card) return Math.round(hh * 0.72);
    var a = card.getBoundingClientRect(), b = cs.getBoundingClientRect();
    if (!b.height) return Math.round(hh * 0.72);
    return Math.round((b.bottom - a.top - 6) / S);
  }

  function draw(t) {
    var dark = isDark();
    var g = groundTop();
    var c = hctx;
    c.clearRect(0, 0, hw, hh);
    /* السماء (شرائط) */
    var skyTop = dark ? ["#071a2b", "#0b2a3c", "#103a47", "#17504f", "#1f6656"] : ["#8cc7e6", "#a9d8ec", "#c6e7ef", "#dcf1ee", "#eaf7ef"];
    var bands = skyTop.length, sky = Math.max(g, 10);
    for (var i = 0; i < bands; i++) rect(c, 0, Math.floor(i * sky / bands), hw, Math.ceil(sky / bands) + 1, skyTop[i]);
    /* نجوم + قمر (ليل) أو غيوم (نهار) */
    if (dark) {
      for (var s = 0; s < stars.length; s++) {
        var st = stars[s];
        if (st.y * g > g - 8) continue;
        var tw = Math.sin(t * 1.6 + st.p) > -0.3;
        if (tw) rect(c, Math.floor(st.x * hw), Math.floor(st.y * (g - 6)), 1, 1, "#fff6c8");
      }
      var mx = Math.round(hw * 0.12), my = 6;
      rect(c, mx, my, 6, 6, "#fff3b8"); rect(c, mx - 1, my + 1, 8, 4, "#fff3b8"); rect(c, mx + 3, my, 3, 5, "#0b2a3c"); rect(c, mx + 4, my - 1, 3, 7, "#0b2a3c");
    } else {
      var cx0 = ((t * 2) % (hw + 40)) - 20;
      rect(c, cx0, 7, 14, 3, "#ffffff"); rect(c, cx0 + 3, 5, 8, 2, "#ffffff");
      var cx1 = ((t * 1.3 + 60) % (hw + 40)) - 20;
      rect(c, cx1, 13, 10, 2, "#ffffff"); rect(c, cx1 + 2, 12, 6, 1, "#ffffff");
    }
    /* تلال بعيدة */
    for (var x = 0; x < hw; x++) {
      var hy = g - 7 + Math.round(Math.sin(x * 0.07 + 1) * 3 + Math.sin(x * 0.17) * 1.5);
      rect(c, x, hy, 1, g - hy + 2, dark ? "#1b4f5a" : "#b7d6e2");
      rect(c, x, hy, 1, 1, dark ? "#7fb6c4" : "#ffffff");
    }
    /* أشجار */
    for (var ti = 0; ti < trees.length; ti++) {
      var tr = trees[ti];
      pine(c, Math.round(tr.x * hw), g + tr.d, tr.h, tr.l, t, ti);
    }
    /* أرض الثلج */
    for (var gx = 0; gx < hw; gx++) {
      var gy = g + 1 + Math.round(Math.sin(gx * 0.12) * 0.8);
      rect(c, gx, gy, 1, hh - gy, dark ? "#d7e8f4" : "#ffffff");
      rect(c, gx, gy + 2 + (gx % 5 === 0 ? 1 : 0), 1, 1, dark ? "#b9d3e6" : "#dcecf6");
    }
    rect(c, 0, g + 7, hw, hh - g - 7, dark ? "#c3d9ea" : "#f1f8fd");
    /* سانتا + العربة + الغزلان (تعبر البانر من اليسار لليمين وتعيد) */
    var span = 66, cycle = (hw + span * 2) / 16 + 5;
    var ph = (t % cycle);
    var sx = ph * 16 - span;
    if (!RM && sx < hw + 4) {
      var bob = Math.round(Math.sin(t * 3) * 1.5);
      var sy = 4 + bob;
      var f = ((t * 6) | 0) % 2;
      for (var sp = 1; sp <= 7; sp++) {
        if (((t * 8 + sp) | 0) % 2) rect(c, Math.round(sx - sp * 4), sy + 6 + (sp % 3) * 3, 1, 1, sp % 2 ? "#fff6a8" : "#ffffff");
      }
      sleigh(c, Math.round(sx), sy);
      var rope = "#d8c08a";
      rect(c, Math.round(sx) + 23, sy + 8, 6, 1, rope);
      reindeer(c, Math.round(sx) + 28, sy + 2, f);
      rect(c, Math.round(sx) + 40, sy + 8, 4, 1, rope);
      reindeer(c, Math.round(sx) + 43, sy + 2, f ? 0 : 1);
    } else if (RM) {
      sleigh(c, Math.round(hw * 0.2), 5);
      reindeer(c, Math.round(hw * 0.2) + 28, 7, 0);
      reindeer(c, Math.round(hw * 0.2) + 43, 7, 1);
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
    if (ts - last < 60) return;
    last = ts;
    if (document.hidden || !card || card.offsetParent === null) return;
    resize();
    if (hw > 1) draw(ts / 1000);
  }

  function mountHero() {
    card = document.querySelector("#liveView .status-card");
    if (!card || hero) return;
    card.classList.add("xm-card");
    hero = document.createElement("canvas");
    hero.className = "xm-hero";
    hero.setAttribute("aria-hidden", "true");
    card.insertBefore(hero, card.firstChild);
    hctx = hero.getContext("2d");
    if (window.ResizeObserver) new ResizeObserver(resize).observe(card);
    raf = requestAnimationFrame(loop);
  }

  /* ================= أضوية أعلى الصفحة ================= */
  function mountLights() {
    if (document.querySelector(".xm-lights")) return;
    var d = document.createElement("div");
    d.className = "xm-lights";
    d.setAttribute("aria-hidden", "true");
    var svg = '<svg viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 1 ';
    for (var j = 0; j < 8; j++) svg += "Q " + (j * 12.5 + 6.25) + " 8 " + (j * 12.5 + 12.5) + " 1 ";
    svg += '" fill="none" stroke="#1f3d2a" stroke-width="0.6" vector-effect="non-scaling-stroke"/></svg>';
    var html = svg;
    for (var k = 0; k < 8; k++) {
      var b = k * 12.5;
      html += '<i class="xm-b c' + ((k * 3) % 4) + '" style="left:' + b + '%;top:0;animation-delay:' + (k * 0.27).toFixed(2) + 's"></i>';
      html += '<i class="xm-b c' + ((k * 3 + 1) % 4) + '" style="left:' + (b + 3.1) + '%;top:5px;animation-delay:' + (k * 0.27 + 0.2).toFixed(2) + 's"></i>';
      html += '<i class="xm-b c' + ((k * 3 + 2) % 4) + '" style="left:' + (b + 6.25) + '%;top:7px;animation-delay:' + (k * 0.27 + 0.4).toFixed(2) + 's"></i>';
      html += '<i class="xm-b c' + ((k * 3 + 3) % 4) + '" style="left:' + (b + 9.4) + '%;top:5px;animation-delay:' + (k * 0.27 + 0.6).toFixed(2) + 's"></i>';
    }
    d.innerHTML = html;
    document.body.appendChild(d);
  }

  /* ================= ثلج يتساقط على كل الصفحة ================= */
  function mountSnow() {
    if (RM || document.getElementById("xmSnow")) return;
    var cv = document.createElement("canvas");
    cv.id = "xmSnow";
    cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    var c = cv.getContext("2d"), W = 0, H = 0, fl = [];
    function fit() { W = cv.width = innerWidth; H = cv.height = innerHeight; }
    fit(); addEventListener("resize", fit);
    var n = innerWidth < 600 ? 38 : 70;
    for (var i = 0; i < n; i++) fl.push({ x: Math.random() * W, y: Math.random() * H, s: 2 + (Math.random() * 2 | 0), v: 12 + Math.random() * 22, p: Math.random() * 6 });
    var lt = 0;
    (function snow(ts) {
      requestAnimationFrame(snow);
      if (document.hidden) return;
      var dt = Math.min((ts - lt) / 1000, 0.1); lt = ts;
      c.clearRect(0, 0, W, H);
      for (var i = 0; i < fl.length; i++) {
        var f = fl[i];
        f.y += f.v * dt; f.x += Math.sin(ts / 1100 + f.p) * 10 * dt;
        if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; }
        c.fillStyle = "rgba(60,100,120,.28)"; c.fillRect(Math.round(f.x) + 1, Math.round(f.y) + 1, f.s, f.s);
        c.fillStyle = "#ffffff"; c.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s);
      }
    })(0);
  }

  function boot() { mountLights(); mountSnow(); mountHero(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
