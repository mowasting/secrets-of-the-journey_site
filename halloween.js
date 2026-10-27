/* halloween.js - The Secrets of the Journey                      (HALLOWEEN MODE)
   -------------------------------------------------------------------
   What it adds (only while the Halloween palette is selected):
     - the cat wears a black abaya like a ghost: only its eyes and whiskers show
     - a pixel scene on top of the Live page: moon, stars, ghost, candles,
       jack-o'-lanterns, a skeleton cat and a tombstone
     - a spider hanging from the cobweb of the timer card
     - BATS: they come out every 15 minutes, fly for 5 minutes, then hide
       (:00-:05, :15-:20, :30-:35, :45-:50 of every hour, same for everybody)
     - (halloween.css) cobwebs, small pumpkins, autumn leaves, orange glow

   How it is switched on
     - It is the 4th palette of the palette button (palette.js).
     - From FROM to TO (below) it is switched on automatically the first time
       a device opens the site. After TO it disappears by itself and the
       site is normal again (the palette button goes back to 3 palettes).
     - Test outside the dates:  open the site with  ?hw=1  at the end of the
       address.  Force it off:  ?hw=0   Bats all the time (test):  ?hw=1&hwbats=1

   REMOVE it for good (everything returns to the normal site)
     1) delete the files  halloween.js  and  halloween.css
     2) delete every line / block that contains the word  HALLOWEEN  in:
        index.html, cat.js, palette.js
        (or just run  git revert  on the Halloween commit - see the notes)
   ------------------------------------------------------------------- */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  /* ============ SETTINGS (change here) ============ */
  var FROM = new Date(2026, 9, 25).getTime();   // 25 Oct 2026, 00:00  (month 9 = October)
  var TO = new Date(2026, 10, 2).getTime();     // 2 Nov 2026, 00:00   -> last day = 1 Nov
  var BAT_EVERY = 15;   // minutes between two bat flights
  var BAT_FLY = 5;      // minutes the bats stay out
  var BAT_COUNT = 6;    // how many bats
  var SEEN_KEY = "sj_hw_2026";

  var root = document.documentElement;
  var qs = "";
  try { qs = location.search || ""; } catch (e) {}
  var forceOn = /[?&]hw=1(&|$)/.test(qs), forceOff = /[?&]hw=0(&|$)/.test(qs);
  var forceBats = /[?&]hwbats=1(&|$)/.test(qs);   // test: bats fly all the time
  var nowMs = Date.now();
  var active = !forceOff && (forceOn || (nowMs >= FROM && nowMs < TO));
  var reduce = false;
  try { reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) {}

  function isOn() { return active && root.getAttribute("data-palette") === "halloween"; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ============ small drawing helpers (pixel art) ============ */
  function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); }
  function ell(c, cx, cy, rx, ry, col) {
    c.fillStyle = col;
    for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) c.fillRect(x, y, 1, 1);
      }
    }
  }
  function line(c, x0, y0, x1, y1, col) {
    c.fillStyle = col;
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (;;) {
      c.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  function sprite(c, rows, x, y, map) {
    for (var j = 0; j < rows.length; j++) {
      for (var i = 0; i < rows[j].length; i++) {
        var ch = rows[j].charAt(i);
        if (ch !== "." && map[ch]) R(c, x + i, y + j, 1, 1, map[ch]);
      }
    }
  }

  /* =====================================================================
     1) THE CAT IN THE ABAYA   (called by the small HALLOWEEN hook in cat.js)
        A black cloak over the whole cat, cat ears under the cloth, two holes
        for the glowing eyes and two small holes where the whiskers come out.
     ===================================================================== */
  var K = {
    base: "#0b0712", fold: "#1b1330", rim: "#6f5aa6", trim: "#d99a2b", hole: "#030108",
    eye: "#e3a02e", pupil: "#1b1410", glint: "#fff3c4", wh: "#aaa1d3"
  };
  var STAND_TOP = { "-2": -5, "-1": -9, "0": -23, "1": -27, "2": -30, "3": -31, "4": -30, "5": -28, "6": -27, "7": -27, "8": -27, "9": -27,
    "10": -28, "11": -30, "12": -31, "13": -30, "14": -28, "15": -26, "16": -23, "17": -21, "18": -20,
    "28": -17, "29": -15, "30": -13, "31": -10, "32": -7, "33": -4, "34": -2, "35": -1 };
  var SLEEP_TOP = { "-2": -2, "-1": -4, "0": -9, "1": -15, "2": -18, "3": -19, "4": -18, "5": -15, "6": -14, "7": -14, "8": -14, "9": -14,
    "10": -15, "11": -18, "12": -19, "13": -18, "14": -15, "15": -14, "16": -13,
    "28": -12, "29": -11, "30": -9, "31": -7, "32": -6, "33": -5, "34": -4, "35": -3, "36": -2, "37": -1 };

  /* draws the cloak: tops[x] .. bottoms[x] for x in [x0..x1]; edges get a light rim, the hem a gold trim */
  function cloak(ctx, FLOOR, TOP, defTop, x0, x1, hemFn, dy, foldX, foldFrom) {
    var tt = {}, bb = {}, x, y;
    for (x = x0; x <= x1; x++) {
      tt[x] = TOP[x] === undefined ? defTop : TOP[x];
      bb[x] = -1 - hemFn(x);
    }
    function filled(px, py) { return px >= x0 && px <= x1 && py >= tt[px] && py <= bb[px]; }
    for (x = x0; x <= x1; x++) {
      for (y = tt[x]; y <= bb[x]; y++) {
        var col = K.base;
        var up = !filled(x, y - 1), lf = !filled(x - 1, y), rt = !filled(x + 1, y), dn = !filled(x, y + 1);
        if (dn && y > -9) col = K.trim;
        else if (up || lf || rt) col = K.rim;
        else if (foldX.indexOf(x) >= 0 && y > foldFrom && y < bb[x] - 1) col = K.fold;
        R(ctx, x, FLOOR + y + dy, 1, 1, col);
      }
    }
  }
  function hole(ctx, FLOOR, x, y, w, h) { // a hole with cut corners
    R(ctx, x + 1, FLOOR + y, w - 2, h, K.hole);
    R(ctx, x, FLOOR + y + 1, w, h - 2, K.hole);
  }
  function whiskers(ctx, FLOOR, y1, y2, dy) {
    R(ctx, -5, FLOOR + y1 + dy, 6, 1, K.wh); R(ctx, -4, FLOOR + y2 + dy, 5, 1, K.wh);
    R(ctx, 14, FLOOR + y1 + dy, 6, 1, K.wh); R(ctx, 14, FLOOR + y2 + dy, 5, 1, K.wh);
  }

  function drawCatStand(ctx, f, FLOOR) {
    if (!isOn()) return false;
    var dy = f % 2 === 0 ? 0 : -1, ph = f * 1.7;
    cloak(ctx, FLOOR, STAND_TOP, -19, -2, 35,
      function (x) { return Math.max(0, Math.round(1 + 1.2 * Math.sin(x * 0.85 + ph))); },
      dy, [16, 20, 24, 28], -13);
    // eye holes + glowing honey eyes
    [2, 9].forEach(function (ex) {
      hole(ctx, FLOOR, ex, -24 + dy, 6, 6);
      R(ctx, ex + 1, FLOOR - 23 + dy, 4, 4, K.eye);
      R(ctx, ex + 2, FLOOR - 22 + dy, 2, 3, K.pupil);
      R(ctx, ex + 1, FLOOR - 23 + dy, 1, 1, K.glint);
    });
    // small holes where the whiskers come out
    hole(ctx, FLOOR, 0, -17 + dy, 2, 5);
    hole(ctx, FLOOR, 14, -17 + dy, 2, 5);
    whiskers(ctx, FLOOR, -16, -14, dy);
    return true;
  }

  function drawCatSleep(ctx, breathe, FLOOR) {
    if (!isOn()) return false;
    var b = breathe ? 1 : 0;
    var top = {}, k;
    for (k in SLEEP_TOP) { top[k] = SLEEP_TOP[k] - (b && +k >= 6 && +k <= 30 ? 1 : 0); }
    cloak(ctx, FLOOR, top, -13 - b, -2, 37,
      function (x) { return Math.round(0.5 + 0.5 * Math.sin(x * 0.9)); },
      0, [19, 23, 27], -9);
    // closed eyes: thin glowing slits
    [2, 9].forEach(function (ex) {
      hole(ctx, FLOOR, ex, -10, 6, 4);
      R(ctx, ex + 1, FLOOR - 9, 4, 1, K.eye);
    });
    hole(ctx, FLOOR, 0, -6, 2, 5);
    hole(ctx, FLOOR, 14, -6, 2, 5);
    whiskers(ctx, FLOOR, -5, -3, 0);
    return true;
  }

  window.SJHalloween = { active: active, isOn: isOn, drawCatStand: drawCatStand, drawCatSleep: drawCatSleep };

  /* ---------- switch on automatically (once per device) ---------- */
  if (active) {
    try {
      if (!localStorage.getItem(SEEN_KEY)) {
        localStorage.setItem(SEEN_KEY, "1");
        localStorage.setItem("palette", "halloween");
      }
      if (localStorage.getItem("palette") === "halloween") root.setAttribute("data-palette", "halloween");
    } catch (e) {}
  }

  /* =====================================================================
     2) THE PIXEL SCENE on top of the Live page
     ===================================================================== */
  var SW = 128, SH = 46, GY = 39;      // scene size, ground line
  var scene = { wrap: null, cv: null, cx: null, timer: 0, stars: [] };

  var SKY = ["#0c0618", "#0f081e", "#130a25", "#170c2b", "#1c0f33", "#21133b", "#271644", "#2e194b", "#371c52", "#431f57", "#52235a", "#62285a"];

  var SKEL = [
    "......................",
    ".....B..........B.....",
    ".....BB........BB.....",
    ".....BBB......BBB.....",
    ".....BBBBBBBBBBBB.....",
    ".....BBBBBBBBBBBB.....",
    ".....BDDDBBBBDDDB.....",
    ".....BDEDBBBBDEDB.....",
    ".....BDDDBBBBDDDB.....",
    ".....BBBBBDDBBBBB.....",
    "......BBBBDDBBBB......",
    "......BDBDBDBDBD......",
    ".......BBBBBBBB.......",
    "..........BB..........",
    "......BBBBBBBBBB......",
    ".....BDDDDBBDDDDB.....",
    ".....BBBBBBBBBBBB.....",
    ".....BDDDDBBDDDDB.....",
    ".....BBBBBBBBBBBB.....",
    ".....BDDDDBBDDDDB.....",
    "......BBBBBBBBBB......",
    ".......BDDBBDDB.......",
    ".......BBBBBBBB.......",
    ".......BB....BB.......",
    ".......BB....BB.......",
    "......BBB....BBB......",
    "......BBBB..BBBB......"
  ];
  var GHOST = [
    "..WWWWW..",
    ".WWWWWWW.",
    "WWWWWWWWW",
    "WKKWWWKKW",
    "WKKWWWKKW",
    "WWWWWWWWW",
    "WWWWKWWWW",
    "WWWWKWWWW",
    "WWWWWWWWW",
    "WWWWWWWWW"
  ];

  function glowAt(c, x, y, r, a, col) {
    var g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(" + col + "," + a + ")");
    g.addColorStop(1, "rgba(" + col + ",0)");
    c.fillStyle = g;
    c.fillRect(Math.floor(x - r), Math.floor(y - r), r * 2 + 1, r * 2 + 1);
  }

  function candle(c, x, h, t, seed, glows) {
    R(c, x - 1, GY - 1, 5, 1, "#b98d2c");
    R(c, x, GY - 1 - h, 3, h, "#efe3c4");
    R(c, x + 2, GY - 1 - h, 1, h, "#cdbb92");
    R(c, x, GY - 1 - h, 1, h, "#fff6dc");
    R(c, x + 2, GY - h + 1, 1, 3, "#f7edd2");           // wax drip
    R(c, x + 1, GY - 2 - h, 1, 1, "#2b2118");           // wick
    var fl = Math.sin(t * 9 + seed * 2.1) + Math.sin(t * 5.7 + seed);
    var sway = fl > 1.0 ? 1 : (fl < -1.0 ? -1 : 0);
    var fx = x + 1, fy = GY - 4 - h;
    R(c, fx + sway, fy - 2, 1, 1, "#ffb347");
    R(c, fx - 1, fy - 1, 3, 2, "#ff9d2e");
    R(c, fx, fy - 1, 1, 2, "#fff1a0");
    glows.push({ x: fx + 0.5, y: fy, r: 15, a: 0.22 + 0.06 * fl, col: "255,170,70" });
  }

  function pumpkin(c, cx, t, glows) {
    var cy = GY - 7;
    R(c, cx - 1, GY - 15, 3, 3, "#5f8a2e"); R(c, cx + 1, GY - 16, 2, 2, "#4a6e22");
    ell(c, cx - 5, cy, 5.2, 6.6, "#b94d08"); ell(c, cx + 5, cy, 5.2, 6.6, "#b94d08"); ell(c, cx, cy, 5.6, 7, "#c85709");
    ell(c, cx - 5, cy, 4.2, 5.6, "#ff8a1f"); ell(c, cx + 5, cy, 4.2, 5.6, "#ff8a1f"); ell(c, cx, cy, 4.6, 6, "#ff9a2e");
    R(c, cx - 8, cy - 3, 2, 2, "#ffc067");
    var gc = Math.sin(t * 7 + cx) > 0.55 ? "#fff0a0" : "#ffd24a";
    R(c, cx - 4, cy - 3, 1, 1, gc); R(c, cx - 5, cy - 2, 3, 1, gc); R(c, cx - 6, cy - 1, 5, 1, gc);
    R(c, cx + 4, cy - 3, 1, 1, gc); R(c, cx + 3, cy - 2, 3, 1, gc); R(c, cx + 2, cy - 1, 5, 1, gc);
    R(c, cx - 6, cy + 2, 13, 1, gc); R(c, cx - 5, cy + 3, 11, 1, gc); R(c, cx - 3, cy + 4, 7, 1, gc);
    R(c, cx - 3, cy + 2, 1, 1, "#ff9a2e"); R(c, cx + 3, cy + 2, 1, 1, "#ff9a2e"); R(c, cx, cy + 4, 1, 1, "#ff9a2e");
    glows.push({ x: cx, y: cy, r: 17, a: 0.26 + 0.05 * Math.sin(t * 7 + cx), col: "255,150,40" });
  }

  function pumpkinSmall(c, cx, t, glows) {
    var cy = GY - 5;
    R(c, cx - 1, GY - 11, 2, 2, "#5f8a2e");
    ell(c, cx - 3, cy, 3.4, 4.4, "#b94d08"); ell(c, cx + 3, cy, 3.4, 4.4, "#b94d08"); ell(c, cx, cy, 3.7, 4.9, "#c85709");
    ell(c, cx - 3, cy, 2.5, 3.5, "#ff8a1f"); ell(c, cx + 3, cy, 2.5, 3.5, "#ff8a1f"); ell(c, cx, cy, 2.8, 4, "#ff9a2e");
    var gc = Math.sin(t * 8 + cx) > 0.5 ? "#fff0a0" : "#ffd24a";
    R(c, cx - 3, cy - 2, 2, 1, gc); R(c, cx + 2, cy - 2, 2, 1, gc);
    R(c, cx - 3, cy + 1, 7, 1, gc); R(c, cx - 2, cy + 2, 5, 1, gc);
    glows.push({ x: cx, y: cy, r: 12, a: 0.2, col: "255,150,40" });
  }

  function skeleton(c, x0, t, glows) {
    var y0 = GY - 27;
    var M = { B: "#eee7d2", D: "#12081d", E: (Math.sin(t * 4) > 0 ? "#ff9a1a" : "#ffd24a") };
    // haunches (sitting) behind the ribcage
    ell(c, x0 + 3.5, y0 + 22, 3, 4, "#c8be9f"); ell(c, x0 + 18.5, y0 + 22, 3, 4, "#c8be9f");
    ell(c, x0 + 3.5, y0 + 22, 1.8, 2.8, "#eee7d2"); ell(c, x0 + 18.5, y0 + 22, 1.8, 2.8, "#eee7d2");
    // tail (bones) swaying a little
    var sw = Math.round(Math.sin(t * 1.7));
    R(c, x0 + 18, y0 + 25, 2, 2, "#eee7d2"); R(c, x0 + 20, y0 + 23, 2, 2, "#eee7d2");
    R(c, x0 + 21, y0 + 21, 2, 2, "#eee7d2"); R(c, x0 + 21 + sw, y0 + 19, 2, 2, "#eee7d2");
    R(c, x0 + 20 + sw, y0 + 17, 2, 2, "#c8be9f");
    sprite(c, SKEL, x0, y0, M);
    glows.push({ x: x0 + 7.5, y: y0 + 7.5, r: 6, a: 0.28, col: "255,150,30" });
    glows.push({ x: x0 + 14.5, y: y0 + 7.5, r: 6, a: 0.28, col: "255,150,30" });
  }

  function drawScene(t) {
    var c = scene.cx, i;
    var glows = [];
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
    // sky
    for (i = 0; i < SKY.length; i++) R(c, 0, i * 4, SW, 4, SKY[i]);
    // stars
    for (i = 0; i < scene.stars.length; i++) {
      var s = scene.stars[i];
      c.globalAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7));
      R(c, s[0], s[1], 1, 1, "#fff8e0");
      if (i % 5 === 0) { R(c, s[0] - 1, s[1], 3, 1, "#fff8e0"); R(c, s[0], s[1] - 1, 1, 3, "#fff8e0"); }
    }
    c.globalAlpha = 1;
    // moon + halo
    glowAt(c, 106, 13, 26, 0.3, "255,225,140");
    ell(c, 106, 13, 8, 8, "#e9d58f");
    ell(c, 104.5, 11.5, 6.4, 6.4, "#f7edbd");
    R(c, 102, 16, 2, 1, "#d3bd78"); R(c, 108, 9, 3, 2, "#d6c07c"); R(c, 110, 15, 2, 2, "#d3bd78"); R(c, 103, 8, 2, 1, "#e3cf8c");
    // bare tree (left) and tombstone (right)
    R(c, 7, GY - 24, 3, 24, "#140a21");
    line(c, 8, GY - 14, 2, GY - 21, "#140a21"); line(c, 9, GY - 18, 18, GY - 28, "#140a21");
    line(c, 8, GY - 23, 4, GY - 31, "#140a21"); line(c, 9, GY - 24, 13, GY - 33, "#140a21");
    line(c, 15, GY - 25, 20, GY - 24, "#140a21"); line(c, 5, GY - 28, 1, GY - 28, "#140a21");
    R(c, 118, GY - 12, 9, 12, "#2c1f42"); R(c, 119, GY - 14, 7, 2, "#2c1f42"); R(c, 120, GY - 15, 5, 1, "#2c1f42");
    R(c, 122, GY - 11, 1, 6, "#56457a"); R(c, 120, GY - 9, 5, 1, "#56457a");
    // ghost
    var gy = Math.round(7 + Math.sin(t * 1.4) * 2.5), gx = 80 + Math.round(Math.sin(t * 0.7) * 3);
    c.globalAlpha = 0.82;
    sprite(c, GHOST, gx, gy, { W: "#ece7ff", K: "#2a1a44" });
    var wave = Math.floor(t * 2) % 2 === 0;
    R(c, gx + (wave ? 0 : 1), gy + 10, 1, 1, "#ece7ff"); R(c, gx + (wave ? 2 : 3), gy + 10, 1, 1, "#ece7ff");
    R(c, gx + (wave ? 4 : 5), gy + 10, 1, 1, "#ece7ff"); R(c, gx + (wave ? 6 : 7), gy + 10, 1, 1, "#ece7ff");
    c.globalAlpha = 1;
    // wooden ledge
    R(c, 0, GY, SW, SH - GY, "#4a2c14"); R(c, 0, GY, SW, 1, "#8b5a2b"); R(c, 0, GY + 1, SW, 1, "#6e4521");
    for (i = 30; i < SW; i += 31) R(c, i, GY + 1, 1, SH - GY - 1, "#2a170a");
    R(c, 14, GY + 4, 3, 1, "#3a2210"); R(c, 70, GY + 3, 4, 1, "#3a2210"); R(c, 101, GY + 5, 3, 1, "#3a2210");
    // things standing on it
    candle(c, 14, 10, t, 1, glows); candle(c, 18, 15, t, 2, glows); candle(c, 22, 8, t, 3, glows);
    pumpkin(c, 39, t, glows);
    skeleton(c, 56, t, glows);
    pumpkinSmall(c, 92, t, glows);
    candle(c, 104, 12, t, 4, glows); candle(c, 109, 7, t, 5, glows);
    // low fog drifting by
    c.globalAlpha = 0.13;
    for (i = 0; i < 2; i++) {
      var fx = (t * (4 + 3 * i)) % (SW + 70) - 35;
      ell(c, fx, GY - 1 - i * 2, 30, 3, "#cdb8ff");
      ell(c, fx - (SW + 70), GY - 1 - i * 2, 30, 3, "#cdb8ff");
    }
    c.globalAlpha = 1;
    // candle / pumpkin light
    c.globalCompositeOperation = "lighter";
    for (i = 0; i < glows.length; i++) glowAt(c, glows[i].x, glows[i].y, glows[i].r, Math.max(0.05, glows[i].a), glows[i].col);
    c.globalCompositeOperation = "source-over";
  }

  function sceneVisible() {
    return scene.wrap && !document.hidden && scene.wrap.offsetParent !== null;
  }
  function sceneTick() {
    if (!sceneVisible()) return;
    drawScene(Date.now() / 1000);
  }
  function buildScene() {
    if (scene.wrap) return;
    var live = document.getElementById("liveView");
    if (!live) return;
    var seed = 7;
    scene.stars = [];
    for (var i = 0; i < 18; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      var sx = 2 + Math.floor(seed / 233280 * 124);
      seed = (seed * 9301 + 49297) % 233280;
      var sy = 1 + Math.floor(seed / 233280 * 25);
      if (sx > 90 && sx < 124 && sy < 28) continue; // keep the moon clear
      scene.stars.push([sx, sy]);
    }
    scene.wrap = document.createElement("div");
    scene.wrap.className = "hw-shelf";
    scene.wrap.setAttribute("aria-hidden", "true");
    scene.cv = document.createElement("canvas");
    scene.cv.width = SW; scene.cv.height = SH;
    scene.wrap.appendChild(scene.cv);
    live.insertBefore(scene.wrap, live.firstChild);
    scene.cx = scene.cv.getContext("2d");
    drawScene(Date.now() / 1000);
    if (!reduce) scene.timer = setInterval(sceneTick, 100);
  }
  function removeScene() {
    clearInterval(scene.timer);
    scene.timer = 0;
    if (scene.wrap && scene.wrap.parentNode) scene.wrap.parentNode.removeChild(scene.wrap);
    scene.wrap = null; scene.cv = null; scene.cx = null;
  }

  /* ---------- the spider on the timer card ---------- */
  var spider = null;
  function buildSpider() {
    if (spider) return;
    var card = document.querySelector(".status-card");
    if (!card) return;
    spider = document.createElement("div");
    spider.className = "hw-spider";
    spider.setAttribute("aria-hidden", "true");
    spider.innerHTML =
      '<i class="thr"></i>' +
      '<svg viewBox="0 0 22 20" xmlns="http://www.w3.org/2000/svg">' +
      '<g fill="none" stroke="#150b22" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M8 10 3 6 1 9M8 11.5 2 12 1 16M9 13 5 18 3 19M10.5 13.5 9 19"/>' +
      '<path d="M14 10 19 6 21 9M14 11.5 20 12 21 16M13 13 17 18 19 19M11.5 13.5 13 19"/></g>' +
      '<ellipse cx="11" cy="12" rx="4.6" ry="5.4" fill="#150b22"/><circle cx="11" cy="6.6" r="3" fill="#150b22"/>' +
      '<circle cx="9.7" cy="6" r="1" fill="#ff4a4a"/><circle cx="12.3" cy="6" r="1" fill="#ff4a4a"/>' +
      '<path d="M11 9.6v5" stroke="#ff7a2a" stroke-width="1.2" stroke-linecap="round"/></svg>';
    card.appendChild(spider);
  }
  function removeSpider() {
    if (spider && spider.parentNode) spider.parentNode.removeChild(spider);
    spider = null;
  }

  /* =====================================================================
     3) BATS - every BAT_EVERY minutes they fly for BAT_FLY minutes, then hide
     ===================================================================== */
  var B = { cv: null, cx: null, list: [], raf: 0, last: 0, spawning: false, spr: null, w: 0, h: 0, dpr: 1, timer: 0 };
  var SEQ = [0, 1, 2, 1];

  function makeBatSprites() {
    var frames = [{ tx: 17.6, ty: 0.8 }, { tx: 18.4, ty: 4.0 }, { tx: 16.4, ty: 7.6 }], out = [];
    frames.forEach(function (fr) {
      var cv = document.createElement("canvas");
      cv.width = 19; cv.height = 12;
      var c = cv.getContext("2d");
      function wing(mirror) {
        var tx = fr.tx, ty = fr.ty;
        var pts = [[10.6, 3.8], [tx, ty], [tx - 1.6, ty + 2.2], [tx - 2.8, ty + 4.4], [tx - 4.6, ty + 3.4], [tx - 6.0, ty + 5.8], [10.6, 7.6]];
        c.beginPath();
        pts.forEach(function (p, i) {
          var x = mirror ? 19 - p[0] : p[0];
          if (i === 0) c.moveTo(x, p[1]); else c.lineTo(x, p[1]);
        });
        c.closePath(); c.fill();
      }
      c.fillStyle = "#150a24";
      wing(false); wing(true);
      c.beginPath(); c.ellipse(9.5, 6, 1.9, 3.3, 0, 0, 6.2832); c.fill();
      c.beginPath(); c.arc(9.5, 3.4, 1.9, 0, 6.2832); c.fill();
      c.beginPath(); c.moveTo(7.7, 3); c.lineTo(7.9, 0.6); c.lineTo(9.1, 1.8); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(11.3, 3); c.lineTo(11.1, 0.6); c.lineTo(9.9, 1.8); c.closePath(); c.fill();
      // crisp pixels (no soft edges)
      var d = c.getImageData(0, 0, 19, 12);
      for (var i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 120 ? 255 : 0;
      c.putImageData(d, 0, 0);
      c.fillStyle = "#ff4a4a";
      c.fillRect(8, 3, 1, 1); c.fillRect(10, 3, 1, 1);
      out.push(cv);
    });
    return out;
  }

  function sizeBats() {
    if (!B.cv) return;
    B.w = window.innerWidth; B.h = window.innerHeight;
    B.dpr = Math.min(window.devicePixelRatio || 1, 2);
    B.cv.width = Math.round(B.w * B.dpr); B.cv.height = Math.round(B.h * B.dpr);
  }
  function placeBat(bat, initial) {
    var bw = 19 * bat.sc;
    bat.dir = Math.random() < 0.5 ? 1 : -1;
    bat.y0 = rnd(0.07, 0.7) * B.h;
    bat.x = initial ? rnd(0, B.w) : (bat.dir > 0 ? -bw - rnd(0, 260) : B.w + rnd(0, 260));
  }
  function newBat(initial) {
    var bat = { sc: 2 + Math.floor(Math.random() * 3), speed: rnd(55, 105), amp: rnd(14, 46), wf: rnd(0.9, 1.7),
      ph: rnd(0, 6.28), ff: rnd(9, 13), fp: rnd(0, 4), t: rnd(0, 20) };
    placeBat(bat, initial);
    return bat;
  }

  function batLoop(ts) {
    B.raf = 0;
    if (!B.cv) return;
    var dt = B.last ? Math.min((ts - B.last) / 1000, 0.05) : 0.016;
    B.last = ts;
    var c = B.cx, i;
    c.setTransform(B.dpr, 0, 0, B.dpr, 0, 0);
    c.clearRect(0, 0, B.w, B.h);
    c.imageSmoothingEnabled = false;
    for (i = B.list.length - 1; i >= 0; i--) {
      var b = B.list[i], bw = 19 * b.sc, bh = 12 * b.sc;
      b.t += dt;
      b.x += b.dir * b.speed * dt;
      var out = b.dir > 0 ? b.x > B.w + 40 : b.x < -bw - 40;
      if (out) {
        if (B.spawning) placeBat(b, false); else { B.list.splice(i, 1); continue; }
      }
      var y = b.y0 + Math.sin(b.t * b.wf + b.ph) * b.amp;
      var spr = B.spr[SEQ[Math.floor(b.t * b.ff + b.fp) % 4]];
      var px = Math.round(b.x * B.dpr) / B.dpr, py = Math.round(y * B.dpr) / B.dpr;
      c.save();
      c.shadowColor = "rgba(160,100,255,.9)";
      c.shadowBlur = 7;
      if (b.dir < 0) { c.translate(px + bw, py); c.scale(-1, 1); c.drawImage(spr, 0, 0, bw, bh); }
      else c.drawImage(spr, px, py, bw, bh);
      c.restore();
    }
    if (!B.list.length && !B.spawning) { killBats(); return; }
    B.raf = requestAnimationFrame(batLoop);
  }

  function startBats() {
    if (B.cv || reduce) return;
    B.cv = document.createElement("canvas");
    B.cv.className = "hw-bats";
    B.cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(B.cv);
    B.cx = B.cv.getContext("2d");
    B.spr = B.spr || makeBatSprites();
    sizeBats();
    var d = new Date(), s = (d.getMinutes() % BAT_EVERY) * 60 + d.getSeconds();
    B.list = [];
    for (var i = 0; i < BAT_COUNT; i++) B.list.push(newBat(s > 5));   // page opened mid-flight: they are already in the sky
    B.last = 0;
    B.raf = requestAnimationFrame(batLoop);
  }
  function killBats() {
    if (B.raf) cancelAnimationFrame(B.raf);
    B.raf = 0; B.list = [];
    if (B.cv && B.cv.parentNode) B.cv.parentNode.removeChild(B.cv);
    B.cv = null; B.cx = null;
  }
  function batTick() {
    if (!isOn() || reduce) { killBats(); return; }
    var d = new Date(), s = (d.getMinutes() % BAT_EVERY) * 60 + d.getSeconds();
    B.spawning = forceBats || s < BAT_FLY * 60;
    if (B.spawning && !B.cv) startBats();
  }
  window.addEventListener("resize", function () { if (B.cv) sizeBats(); });

  /* =====================================================================
     4) switch everything on / off with the palette
     ===================================================================== */
  var running = false;
  function sync() {
    if (isOn()) {
      if (!running) {
        running = true;
        buildScene(); buildSpider();
        B.timer = setInterval(batTick, 1000);
      }
      batTick();
    } else if (running) {
      running = false;
      clearInterval(B.timer);
      removeScene(); removeSpider(); killBats();
    }
  }
  function mount() {
    sync();
    try { new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["data-palette"] }); } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
