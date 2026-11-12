/* ramadan.js : ثيم رمضان (يشتغل بالموسم الي تحدده بـ ramadan-config.js، أو للتجربة ?season=ramadan)
   يحتوي: أضوية ذهبية + فوانيس معلّقة، زينة مشهد القطة (فوانيس، فمتو، تمر، نبتة)،
   هيرو بكسل (مسجد ونخيل وسطح مزيّن وشخصيات تطبخ قبل الإفطار وتاكل وقت الإفطار وتدرس بعده)،
   وبانر من فوق بفوانيس "اترك كل شي وروح افطر" وقت الإفطار (يتحدد من لوحة الأدمن).
   إذا الموسم مو رمضان هذا الملف ما يسوي شي. */
(function () {
  "use strict";
  if (!window.SJSeason) return;

  var NAME = "ramadan";
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GOLD = "#f0b84a", GOLD_D = "#b8822a", CREAM = "#fff1cf";

  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function isDark() { return document.documentElement.getAttribute("data-theme") === "dark"; }

  /* ---------- رسومات مشتركة ---------- */
  function crescent(c, cx, cy, r, col, hl) {
    for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      var dx = x - r * 0.45, dy = y + r * 0.2;
      if (dx * dx + dy * dy <= r * 0.85 * (r * 0.85)) continue;
      rect(c, cx + x, cy + y, 1, 1, (hl && x < -r * 0.55) ? hl : col);
    }
  }
  function lantern(c, cx, y, flick, scale) {
    var glow = flick ? "#ffd987" : "#ffb84a";
    rect(c, cx, y, 1, 2, GOLD_D);
    rect(c, cx - 1, y + 2, 3, 1, GOLD); rect(c, cx - 2, y + 3, 5, 1, GOLD);
    rect(c, cx - 2, y + 4, 5, 5, glow);
    rect(c, cx - 2, y + 4, 1, 5, GOLD_D); rect(c, cx + 2, y + 4, 1, 5, GOLD_D); rect(c, cx, y + 4, 1, 5, "#fff0c2");
    rect(c, cx - 2, y + 9, 5, 1, GOLD); rect(c, cx - 1, y + 10, 3, 1, GOLD_D);
  }
  function bulbs(c, x0, x1, y, sag, t, seed) {
    var cols = ["#ffd27a", "#ffb84a", "#ff8fb3", "#b99bff"];
    var span = Math.max(1, x1 - x0), i = 0;
    for (var x = x0; x <= x1; x++) {
      var yy = y + Math.round(Math.sin((x - x0) / span * Math.PI) * sag);
      rect(c, x, yy, 1, 1, "#3a2a18");
    }
    for (var bx = x0 + 3; bx < x1 - 1; bx += 6, i++) {
      var by = y + Math.round(Math.sin((bx - x0) / span * Math.PI) * sag) + 1;
      var on = (((t * 2) | 0) + i + (seed || 0)) % 2 === 0;
      rect(c, bx, by, 2, 3, on ? cols[i % 4] : "#4a3a2a");
      if (on) rect(c, bx, by + 3, 2, 1, "rgba(255,210,120,.35)");
    }
  }

  /* ================= مشهد القطة: فوانيس + فمتو + تمر + نبتة ================= */
  function scene(ctx, layer, t, FLOOR) {
    if (layer === "back") {
      bulbs(ctx, 0, 74, 2, 3, t, 0);
      lantern(ctx, 28, 6, ((t * 1.5) | 0) % 2, 1);
      lantern(ctx, 52, 6, ((t * 1.5 + 1) | 0) % 2, 1);
      /* نبتة بالزاوية */
      rect(ctx, 3, FLOOR - 5, 8, 5, "#8a5a34"); rect(ctx, 2, FLOOR - 6, 10, 2, "#a06b3e"); rect(ctx, 4, FLOOR - 1, 4, 1, "#6e4526");
      rect(ctx, 6, FLOOR - 13, 2, 7, "#2f8f4e"); rect(ctx, 3, FLOOR - 12, 3, 2, "#3aa35c"); rect(ctx, 8, FLOOR - 15, 3, 2, "#3aa35c");
      rect(ctx, 4, FLOOR - 9, 2, 2, "#2f8f4e"); rect(ctx, 8, FLOOR - 10, 3, 2, "#2f8f4e"); rect(ctx, 5, FLOOR - 16, 2, 3, "#3aa35c");
      /* قنينة فمتو (بنفسجية بدون أي علامة تجارية) + كاس + صحن تمر */
      rect(ctx, 61, FLOOR - 12, 2, 1, GOLD);
      rect(ctx, 61, FLOOR - 11, 2, 3, "#7b3fc4");
      rect(ctx, 60, FLOOR - 8, 4, 8, "#7b3fc4"); rect(ctx, 60, FLOOR - 8, 1, 6, "#a874e8");
      rect(ctx, 60, FLOOR - 6, 4, 2, "#f2d9ff"); rect(ctx, 61, FLOOR - 5, 2, 1, "#c23a8a");
      rect(ctx, 66, FLOOR - 5, 3, 5, "#7b3fc4"); rect(ctx, 66, FLOOR - 5, 3, 1, "#cfa8ff"); rect(ctx, 67, FLOOR - 7, 1, 3, "#ffd27a");
      rect(ctx, 69, FLOOR - 2, 5, 2, "#d9c8a0"); rect(ctx, 70, FLOOR - 3, 1, 1, "#5a3320"); rect(ctx, 72, FLOOR - 3, 1, 1, "#5a3320"); rect(ctx, 71, FLOOR - 4, 1, 1, "#5a3320");
    } else if (layer === "front") {
      /* هلال ونجمة معلّقين فوق الباب */
      crescent(ctx, 84, 4, 3, GOLD, "#ffe08a");
      rect(ctx, 89, 3, 1, 1, "#ffe08a"); rect(ctx, 88, 4, 3, 1, "#ffe08a"); rect(ctx, 89, 5, 1, 1, "#ffe08a");
    }
  }
  window.SJSeason.register(NAME, { scene: scene });
  if (!window.SJSeason.active(NAME)) return;

  /* ================= حالة الإفطار (من السيرفر get_iftar) ================= */
  var iftar = null;   /* { start: ms, end: ms } أو null إذا غير محدد */
  var TEST = /[?&]iftartest=1/.test(location.search);
  var T0 = Date.now();
  if (TEST) iftar = { start: T0 + 20000, end: T0 + 80000 };

  function fetchIftar() {
    if (TEST) return;
    try {
      if (!window.supabaseClient) return;
      supabaseClient.auth.getSession().then(function (r) {
        if (!r.data || !r.data.session) return;
        supabaseClient.rpc("get_iftar").then(function (x) {
          if (x.error || !x.data) return;
          iftar = x.data.enabled ? { start: Date.parse(x.data.start), end: Date.parse(x.data.end) } : null;
        });
      });
    } catch (e) {}
  }
  [2000, 8000, 20000, 45000, 90000].forEach(function (ms) { setTimeout(fetchIftar, ms); });
  setInterval(fetchIftar, 3 * 60 * 1000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) fetchIftar(); });

  /* قبل الإفطار بـ6 ساعات تبدأ الطبخة، وقت الإفطار ياكلون، وبعده يدرسون */
  function phase() {
    var now = Date.now();
    if (!iftar) return "cook";
    if (now < iftar.start - 6 * 3600e3) return "study";
    if (now < iftar.start) return "cook";
    if (now < iftar.end) return "eat";
    return "study";
  }

  /* ================= الهيرو (خلف بطاقة العد التنازلي) ================= */
  var S = 3;
  var hero = null, hctx = null, card = null, hw = 0, hh = 0;
  var stars = [];
  (function seed() {
    var r = 777;
    function rnd() { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; }
    for (var i = 0; i < 34; i++) stars.push({ x: rnd(), y: rnd() * 0.85, p: rnd() * 6 });
  })();

  function groundTop() {
    var cs = document.getElementById("catScene");
    if (!cs || !card) return Math.round(hh * 0.72);
    var a = card.getBoundingClientRect(), b = cs.getBoundingClientRect();
    if (!b.height) return Math.round(hh * 0.72);
    return Math.round((b.bottom - a.top - 6) / S);
  }

  function palm(c, x, base, h, col) {
    var i, tx = 0;
    for (i = 0; i <= h; i++) {
      var px = x + Math.round(Math.sin(i / h * 1.2) * 2);
      rect(c, px, base - i, 2, 1, col);
      tx = px;
    }
    var ty = base - h, ang = [-3.0, -2.5, -1.9, -1.2, -0.6, -0.1];
    for (var a = 0; a < ang.length; a++) for (var k = 1; k <= 8; k++) {
      rect(c, tx + Math.cos(ang[a]) * k * 1.6, ty + Math.sin(ang[a]) * k * 0.9 + k * k * 0.07, 2, 1, col);
    }
  }
  function mosque(c, mx, base, t, dark) {
    var body = dark ? "#2a1f4f" : "#8d78b5", edge = dark ? "#3b2d66" : "#a894cc";
    var w1 = ((t * 0.7) | 0) % 2;
    rect(c, mx - 13, base - 10, 27, 10, body);
    function dome(cx, cy, r) {
      for (var y = -r; y <= 0; y++) for (var x = -r; x <= r; x++) if (x * x + y * y <= r * r) rect(c, cx + x, cy + y, 1, 1, body);
      rect(c, cx, cy - r - 3, 1, 3, body); rect(c, cx - 1, cy - r - 2, 3, 1, body);
    }
    dome(mx, base - 10, 9);
    dome(mx - 9, base - 10, 4); dome(mx + 9, base - 10, 4);
    [mx - 19, mx + 19].forEach(function (x) {
      rect(c, x, base - 27, 3, 27, body); rect(c, x - 1, base - 21, 5, 1, edge);
      rect(c, x - 1, base - 29, 5, 2, body); rect(c, x, base - 31, 3, 2, body); rect(c, x + 1, base - 34, 1, 3, body);
      rect(c, x + 1, base - 25, 1, 2, "#ffc857"); rect(c, x + 1, base - 15, 1, 2, w1 ? "#ffc857" : "#c98f2a");
    });
    [-9, -4, 4, 9].forEach(function (d, i) {
      var on = (i + w1) % 3 !== 0;
      rect(c, mx + d - 1, base - 7, 2, 4, on ? "#ffc857" : "#c98f2a"); rect(c, mx + d - 1, base - 8, 2, 1, on ? "#ffc857" : "#c98f2a");
    });
    rect(c, mx - 1, base - 6, 3, 6, "#ffb84a");
  }
  function skyline(c, g, hw, t, dark) {
    var col = dark ? "#1c1436" : "#a58cc8";
    for (var i = 0, x = 3; x < hw + 12; i++, x += 15) {
      var ty = i % 3;
      if (ty === 0) {
        for (var yy = -5; yy <= 0; yy++) for (var xx = -5; xx <= 5; xx++) if (xx * xx + yy * yy <= 25) rect(c, x + xx, g - 5 + yy, 1, 1, col);
        rect(c, x - 5, g - 5, 11, 5, col); rect(c, x, g - 12, 1, 3, col);
        rect(c, x - 1, g - 3, 2, 2, ((i + (t | 0)) % 4) ? "#ffc857" : "#c98f2a");
      } else if (ty === 1) {
        rect(c, x, g - 16, 3, 16, col); rect(c, x - 1, g - 17, 5, 2, col); rect(c, x + 1, g - 20, 1, 3, col);
        rect(c, x + 1, g - 11, 1, 2, "#ffc857");
      } else {
        rect(c, x - 4, g - 7, 9, 7, col);
        rect(c, x - 2, g - 5, 2, 2, ((i + (t * 0.8 | 0)) % 3) ? "#ffc857" : "#c98f2a"); rect(c, x + 2, g - 5, 2, 2, "#ffc857");
      }
    }
  }

  /* ----- شخصية بكسل صغيرة (8 عرض × 13 طول، القدم عند y) ----- */
  function person(c, x, y, o) {
    var d = o.dir || 1;
    function P(dx, dy, w, h, col) { rect(c, d > 0 ? x + dx : x + (7 - dx - w + 1), y + dy, w, h, col); }
    var f = o.f || 0, hd = o.down ? 1 : 0, kid = o.kid;
    var lh = kid ? 2 : 4, tTop = kid ? -5 : -8, tH = kid ? 3 : 4, hy = kid ? -10 : -13;
    var l1 = 0, l2 = 0;
    if (o.walk) { l1 = f ? -1 : 0; l2 = f ? 0 : -1; }
    /* أرجل */
    P(2, -lh, 2, lh + l1, o.pants || "#33304a"); P(4, -lh, 2, lh + l2, o.pants || "#33304a");
    P(2, -1 + l1, 2, 1, "#2a1b14"); P(4, -1 + l2, 2, 1, "#2a1b14");
    /* جسم وأذرع */
    P(1, tTop, 6, tH, o.shirt); P(0, tTop, 1, tH, o.shirt); P(7, tTop, 1, tH, o.shirt);
    P(1, tTop + tH - 1, 6, 1, o.trim || o.shirt);
    var pose = o.pose;
    if (pose === "stir") {
      P(7, tTop - 1, 1, 1, o.skin); P(8, tTop - 3 + (f ? 0 : 1), 1, 5, "#b8a07a");
    } else if (pose === "carry") {
      P(6, tTop + 1, 3, 1, o.skin); P(5, tTop, 5, 1, GOLD); P(6, tTop - 1, 2, 1, "#fff"); P(8, tTop - 1, 1, 1, "#5a3320");
    } else if (pose === "eat") {
      if (f) { P(6, tTop - 1, 2, 2, o.skin); P(8, tTop - 2, 1, 1, "#8a5a34"); } else { P(6, tTop + 2, 2, 1, o.skin); }
    } else if (pose === "write") {
      P(2, tTop + 3, 4, 1, o.skin); if (f) P(6, tTop + 3, 1, 1, "#ffd27a");
    } else if (pose === "pour") {
      P(6, tTop, 2, 1, o.skin); P(8, tTop - 1 + (f ? 0 : 1), 1, 3, "#7b3fc4");
    }
    P(0, tTop + tH - 2, 1, 1, o.skin); if (pose !== "stir" && pose !== "carry" && pose !== "eat" && pose !== "pour") P(7, tTop + tH - 2, 1, 1, o.skin);
    /* رأس */
    P(1, hy + hd, 6, 5, o.skin);
    if (o.hijab) { P(0, hy + hd - 1, 8, 7, o.hijab); P(2, hy + hd + 1, 4, 3, o.skin); }
    else { P(1, hy + hd, 6, 2, o.hair); P(1, hy + hd + 1, 1, 2, o.hair); if (o.cap) P(2, hy + hd - 1, 4, 1, o.cap); }
    P(2, hy + hd + 2, 1, 1, "#241812"); P(5, hy + hd + 2, 1, 1, "#241812");
    if (o.beard) P(2, hy + hd + 4, 4, 1, o.hair);
  }

  var C0 = { skin: "#e8b592", shirt: "#f1eee3", trim: "#d9d4c4", hair: "#2a1b14", cap: "#ffffff", beard: true };
  var C1 = { skin: "#c98e68", shirt: "#4a78c9", trim: "#35599b", hair: "#26232b" };
  var C2 = { skin: "#f6d2bd", shirt: "#c9323d", trim: "#9a2430", hair: "#2a1b14", hijab: "#f1efe9" };
  var C3 = { skin: "#a26a46", shirt: "#2f9e95", trim: "#247a73", hair: "#26232b", kid: true };
  function mk(base, over) { var o = {}, k; for (k in base) o[k] = base[k]; for (k in over) o[k] = over[k]; return o; }

  function tri(t, period) { var p = (t % period) / period; return p < 0.5 ? p * 2 : 2 - p * 2; }

  function draw(t) {
    var dark = isDark(), g = groundTop(), c = hctx, ph = phase();
    c.clearRect(0, 0, hw, hh);
    var cx = Math.round(hw / 2), y0 = 36, tt = y0 - 6;
    /* سماء */
    var bands = dark ? ["#120d2b", "#1a1238", "#2a1b4a", "#3b2557", "#4e2f60"] : ["#bfa8e8", "#d7b8e6", "#efc5d6", "#f8d3c1", "#fbe2c0"];
    var sky = Math.max(g, 10);
    for (var i = 0; i < bands.length; i++) rect(c, 0, Math.floor(i * sky / bands.length), hw, Math.ceil(sky / bands.length) + 1, bands[i]);
    for (var s = 0; s < stars.length; s++) {
      var st = stars[s];
      if (!dark && s % 3) continue;
      if (Math.sin(t * 1.4 + st.p) > -0.3) rect(c, Math.floor(st.x * hw), Math.floor(st.y * (g - 6)), 1, 1, dark ? "#fff1c8" : "#ffffff");
    }
    crescent(c, Math.round(hw * 0.86), 10, 7, "#f6c453", "#ffe08a");
    mosque(c, Math.round(hw * 0.15), y0 + 1, t, dark);
    skyline(c, g, hw, t, dark);
    palm(c, 3, g + 2, 26, dark ? "#150f26" : "#6b5a8f");
    palm(c, hw - 6, g + 2, 22, dark ? "#150f26" : "#6b5a8f");
    /* أرض */
    rect(c, 0, g + 1, hw, hh - g, dark ? "#1e1536" : "#cdb6e6");
    rect(c, 0, g + 1, hw, 4, "#7a5230"); rect(c, 0, g + 1, hw, 1, "#a0713f");
    for (var px = 0; px < hw; px += 9) rect(c, px, g + 2, 1, 3, "#5a3a20");
    /* السطح المزيّن (تراس) */
    rect(c, 0, y0 + 1, hw, 2, "#b68a55"); rect(c, 0, y0 + 3, hw, 1, "#5a4128");
    for (var cr = 0; cr < hw; cr += 6) rect(c, cr, y0 + 4, 3, 2, "#5a4128");
    /* عمودين وأضوية وفوانيس */
    var pl = cx - 46, pr = cx + 46;
    rect(c, pl, 12, 2, y0 - 11, "#6b4e30"); rect(c, pr, 12, 2, y0 - 11, "#6b4e30");
    bulbs(c, pl + 2, pr, 12, 4, t, 1);
    [cx - 24, cx, cx + 24].forEach(function (lx, i2) { lantern(c, lx, 17, ((t * 1.3 + i2) | 0) % 2, 1); });
    /* طاولة */
    var cloth = "#6a3aa8", clothD = "#4d2a80";
    /* الشخصيات (خلف الطاولة إذا جالسين) */
    var sitX = [cx - 15, cx - 5, cx + 5, cx + 15];
    var sit = ph === "eat" || ph === "study";
    var f2 = ((t * 2) | 0) % 2;
    if (sit) {
      [C0, C1, C2, C3].forEach(function (cc, i3) {
        var fr = (((t * 1.6) | 0) + i3) % 2;
        if (ph === "eat") person(c, sitX[i3] - 4, tt + 4, mk(cc, { dir: i3 < 2 ? 1 : -1, pose: "eat", f: fr, pants: "#2a2840" }));
        else person(c, sitX[i3] - 4, tt + 4, mk(cc, { dir: i3 < 2 ? 1 : -1, pose: "write", f: fr, down: 1, pants: "#2a2840" }));
      });
    }
    /* الطاولة */
    rect(c, cx - 18, tt, 37, 2, "#8a55d0"); rect(c, cx - 17, tt + 2, 35, 4, cloth); rect(c, cx - 17, tt + 5, 35, 1, GOLD);
    for (var fx = cx - 16; fx < cx + 18; fx += 4) rect(c, fx, tt + 3, 1, 2, clothD);
    /* مواد الطاولة حسب الحالة */
    if (ph === "study") {
      [-15, -5, 5, 15].forEach(function (d) { rect(c, cx + d - 3, tt - 2, 6, 2, "#f5ecd5"); rect(c, cx + d, tt - 2, 1, 2, "#b0863a"); });
      rect(c, cx - 1, tt - 6, 3, 1, GOLD); rect(c, cx, tt - 5, 1, 4, GOLD_D); rect(c, cx - 2, tt - 8, 5, 3, "#ffd987");
      rect(c, cx + 8, tt - 3, 2, 3, "#7b3fc4");
    } else {
      [-14, -4, 6, 16].forEach(function (d, i4) {
        rect(c, cx + d - 2, tt - 1, 5, 1, "#ffffff");
        if (ph === "eat") rect(c, cx + d - 1, tt - 2, 3, 1, i4 % 2 ? "#c9733a" : "#e4b04a");
        else if (i4 % 2 === 0) rect(c, cx + d - 1, tt - 2, 3, 1, "#5a3320");
      });
      rect(c, cx - 1, tt - 5, 3, 4, "#7b3fc4"); rect(c, cx - 1, tt - 6, 3, 1, GOLD); rect(c, cx - 1, tt - 3, 3, 1, "#f2d9ff");
      rect(c, cx + 9, tt - 2, 6, 2, "#d9c8a0"); rect(c, cx + 10, tt - 3, 1, 1, "#5a3320"); rect(c, cx + 12, tt - 3, 1, 1, "#5a3320");
      if (ph === "eat") for (var sp = 0; sp < 3; sp++) {
        var sy = ((t * 6 + sp * 4) % 10);
        rect(c, cx - 8 + sp * 8, tt - 3 - sy, 1, 1, "rgba(255,255,255," + (0.7 - sy / 16).toFixed(2) + ")");
      }
    }
    /* الموقد والطباخين (قبل الإفطار) */
    var stX = cx - 36;
    rect(c, stX, y0 - 6, 9, 6, "#3a3a46"); rect(c, stX, y0 - 6, 9, 1, "#55556a");
    if (ph === "cook") {
      rect(c, stX + 2, y0 - 4, 5, 2, f2 ? "#ffb02e" : "#ff7a1f"); rect(c, stX + 3, y0 - 5, 3, 1, f2 ? "#ffe27a" : "#ffb02e");
    }
    rect(c, stX + 1, y0 - 11, 7, 5, "#6a6a78"); rect(c, stX, y0 - 11, 9, 1, "#9a9aa8"); rect(c, stX + 1, y0 - 10, 7, 1, "#c9733a");
    for (var sm = 0; sm < 3; sm++) {
      var q = ((t * 4 + sm * 3.3) % 10);
      rect(c, stX + 2 + sm * 2 + Math.round(Math.sin(t * 2 + sm) * 1), y0 - 13 - q, 2, 1, "rgba(255,255,255," + (0.8 - q / 13).toFixed(2) + ")");
    }
    if (ph === "cook") {
      person(c, stX + 11, y0, mk(C0, { dir: -1, pose: "stir", f: f2 }));
      var wp = tri(t, 7), wx = stX + 12 + wp * (cx - 22 - (stX + 12));
      person(c, Math.round(wx), y0, mk(C2, { dir: (((t % 7) / 7) < 0.5) ? 1 : -1, pose: "carry", walk: 1, f: ((t * 5) | 0) % 2 }));
      person(c, cx + 22, y0, mk(C1, { dir: -1, pose: "pour", f: f2 }));
      var jump = Math.abs(Math.sin(t * 3)) * 3;
      person(c, cx + 38 + Math.round(Math.sin(t * 1.2) * 4), Math.round(y0 - jump), mk(C3, { dir: 1, walk: 1, f: f2 }));
    }
    /* مدفع الإفطار */
    var cn = cx + 36;
    {
      rect(c, cn, y0 - 7, 10, 3, "#454553"); rect(c, cn + 9, y0 - 8, 2, 5, "#5a5a6c"); rect(c, cn, y0 - 8, 3, 1, "#5a5a6c");
      rect(c, cn + 1, y0 - 5, 6, 5, "#7a5230"); rect(c, cn + 2, y0 - 4, 4, 3, "#3a2a18"); rect(c, cn + 3, y0 - 3, 2, 1, "#7a5230");
      if (ph === "eat" && iftar) {
        var since = (Date.now() - iftar.start) / 1000;
        if (since >= 0 && since < 9) {
          if (since < 0.6) { rect(c, cn + 11, y0 - 9, 5, 7, "#fff3a8"); rect(c, cn + 13, y0 - 11, 4, 11, "#ffb02e"); }
          for (var pf = 0; pf < 6; pf++) {
            var age = since - pf * 0.25; if (age < 0) continue;
            var rr = 2 + age * 3;
            rect(c, cn + 12 + age * 5 + pf, y0 - 8 - age * 3, Math.round(rr), Math.round(rr * 0.8), "rgba(235,235,245," + Math.max(0, 0.8 - age / 7).toFixed(2) + ")");
          }
        }
      }
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
    if (ts - last < 66) return;
    last = ts;
    if (document.hidden || !card || card.offsetParent === null) return;
    resize();
    if (hw > 1) draw(ts / 1000);
  }
  function mountHero() {
    card = document.querySelector("#liveView .status-card");
    if (!card || hero) return;
    card.classList.add("rm-card");
    hero = document.createElement("canvas");
    hero.className = "rm-hero";
    hero.setAttribute("aria-hidden", "true");
    card.insertBefore(hero, card.firstChild);
    hctx = hero.getContext("2d");
    if (window.ResizeObserver) new ResizeObserver(resize).observe(card);
    raf = requestAnimationFrame(loop);
  }

  /* ================= أضوية ذهبية + فوانيس معلّقة أعلى الصفحة ================= */
  var LANT_SVG = '<svg viewBox="0 0 28 60" width="28" height="60"><line x1="14" y1="0" x2="14" y2="14" stroke="#b8822a" stroke-width="1.5"/>' +
    '<path d="M10 14h8l2 4H8z" fill="#f0b84a"/><path d="M8 18h12l2 20-3 8H9l-3-8z" fill="#ffc857" stroke="#b8822a" stroke-width="1.5"/>' +
    '<path d="M14 18v28M10 28h8" stroke="#b8822a" stroke-width="1"/><path d="M9 46h10l-1 4h-8z" fill="#f0b84a"/><circle cx="14" cy="32" r="14" fill="#ffd27a" opacity=".18"/></svg>';
  function mountLights() {
    if (document.querySelector(".rm-lights")) return;
    var d = document.createElement("div");
    d.className = "rm-lights"; d.setAttribute("aria-hidden", "true");
    var html = '<svg viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 1 ';
    for (var j = 0; j < 8; j++) html += "Q " + (j * 12.5 + 6.25) + " 8 " + (j * 12.5 + 12.5) + " 1 ";
    html += '" fill="none" stroke="#5a4128" stroke-width="0.6" vector-effect="non-scaling-stroke"/></svg>';
    for (var k = 0; k < 8; k++) {
      var b = k * 12.5;
      [[0, 0], [3.1, 5], [6.25, 7], [9.4, 5]].forEach(function (p, i) {
        html += '<i class="rm-b c' + ((k + i) % 4) + '" style="left:' + (b + p[0]) + '%;top:' + p[1] + 'px;animation-delay:' + ((k * 0.3 + i * 0.2) % 1.6).toFixed(2) + 's"></i>';
      });
    }
    html += '<div class="rm-hang l">' + LANT_SVG + '</div><div class="rm-hang r">' + LANT_SVG + "</div>";
    d.innerHTML = html;
    document.body.appendChild(d);
  }

  /* ================= بانر الإفطار (من فوق بفوانيس) ================= */
  var TXT = {
    ar: { t: "اترك كل شي وروح افطر", s: "السشنات متوقفة وترجع بعد الإفطار", back: "ترجع بعد" },
    en: { t: "Leave everything and go break your fast", s: "Sessions are paused and will resume after iftar", back: "Back in" },
    ckb: { t: "هەموو شتێک بەجێبهێڵە و بڕۆ بەربانگ بکە", s: "سیشنەکان وەستاون و دوای بەربانگ دەگەڕێنەوە", back: "دەگەڕێتەوە دوای" }
  };
  var banner = null, dismissedFor = 0;
  function L() { try { return currentLanguage(); } catch (e) { return "ar"; } }
  function clock(ms) {
    var s = Math.max(0, Math.floor(ms / 1000)), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(Math.floor(s / 3600)) + ":" + p(Math.floor((s % 3600) / 60)) + ":" + p(s % 60);
  }
  function buildBanner() {
    var b = document.createElement("div");
    b.className = "rm-banner"; b.setAttribute("role", "alert");
    b.innerHTML = '<div class="rm-bl">' + LANT_SVG + '</div><div class="rm-bt"><b></b><span class="rm-s"></span><span class="rm-c"></span></div><div class="rm-bl r">' + LANT_SVG + '</div><button class="rm-x" type="button" aria-label="Close">✕</button>';
    b.querySelector(".rm-x").addEventListener("click", function () { dismissedFor = iftar ? iftar.start : 1; hideBanner(); });
    document.body.appendChild(b);
    return b;
  }
  function hideBanner() { if (banner) banner.classList.remove("show"); }
  function bannerTick() {
    var show = phase() === "eat" && iftar && dismissedFor !== iftar.start;
    if (show) {
      if (!banner) banner = buildBanner();
      var tx = TXT[L()] || TXT.ar;
      banner.querySelector("b").textContent = tx.t;
      banner.querySelector(".rm-s").textContent = tx.s;
      banner.querySelector(".rm-c").textContent = tx.back + " " + clock(iftar.end - Date.now());
      if (!banner.classList.contains("show")) requestAnimationFrame(function () { banner.classList.add("show"); });
    } else hideBanner();
  }
  setInterval(bannerTick, 1000);

  /* خط البكسل للأرقام */
  function loadFont() {
    if (document.getElementById("rmFont")) return;
    var l = document.createElement("link");
    l.id = "rmFont"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap";
    document.head.appendChild(l);
  }

  function boot() { loadFont(); mountLights(); mountHero(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
