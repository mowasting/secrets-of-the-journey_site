/* avatar.js : محرك شخصيات البكسل لموقع Secrets Of The Journey
   يرسم الشخصية من إعدادات بسيطة (cfg) ولا يحتاج صور جاهزة. */
(function (global) {
  "use strict";

  var W = 26, H = 42, OX = 1, OY = 1, M = 23;
  var OUTLINE = "#2b2027";

  /* ---------- ألوان ---------- */
  function h2r(h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function x2(n) { n = Math.max(0, Math.min(255, Math.round(n))); return (n < 16 ? "0" : "") + n.toString(16); }
  function r2h(r, g, b) { return "#" + x2(r) + x2(g) + x2(b); }
  function shade(h, f) {
    var c = h2r(h);
    if (f <= 1) return r2h(c[0] * f, c[1] * f, c[2] * f);
    var k = f - 1;
    return r2h(c[0] + (255 - c[0]) * k, c[1] + (255 - c[1]) * k, c[2] + (255 - c[2]) * k);
  }
  function mix(a, b, t) {
    var p = h2r(a), q = h2r(b);
    return r2h(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t);
  }

  /* ---------- الكتالوج: أول 6 خيارات بكل فئة مجانية، الباقي بالنقاط ---------- */
  var SKINS = ["#fde7da", "#f6d2bd", "#e8b592", "#c98e68", "#a26a46", "#6d4226"];
  var HAIRC = { black: "#26232b", dbrown: "#4b3026", brown: "#7c4c2e", blond: "#d9b76f", ginger: "#c55a2b", gray: "#b9b9c3",
    pink: "#f090b7", blue: "#5d8ef0", purple: "#9067d8", platinum: "#f0e9d0", green: "#4db884" };
  var EYEC = { brown: "#7b4b2a", black: "#2b2731", hazel: "#8d6d30", blue: "#4f80d8", gray: "#7e8896", green: "#4f9b5c" };

  var HEADC = { black: "#2a2631", navy: "#2d3f6b", maroon: "#7a2f3f", beige: "#d8c3a5", gray: "#8c8c96", white: "#f1efe9",
    rose: "#e3a3bb", green: "#2f6b52", purple: "#6b4a9a", teal: "#2f8a8f" };

  function L(ids, nFree, hex) {
    return ids.map(function (id, i) { var o = { id: id, free: i < nFree }; if (hex) o.hex = hex[id]; return o; });
  }
  /* قوائم مشتركة بين الجنسين */
  var COMMON = {
    gender: L(["m", "f"], 2),
    skin: [0, 1, 2, 3, 4, 5].map(function (i) { return { id: i, free: true, hex: SKINS[i] }; }),
    eyes: L(["round", "big", "dot", "sleepy", "narrow", "happy"], 6),
    eyec: L(["brown", "black", "hazel", "blue", "gray", "green"], 6, EYEC),
    mouth: L(["smile", "open", "neutral"], 3),
    hairc: L(["black", "dbrown", "brown", "blond", "ginger", "gray", "pink", "blue", "purple", "platinum", "green"], 6, HAIRC),
    headc: L(["black", "navy", "maroon", "beige", "gray", "white", "rose", "green", "purple", "teal"], 6, HEADC),
    glasses: L(["none", "round", "square", "sun", "cat", "aviator"], 1),
    hat: L(["none", "cap", "beanie", "headphones", "bow", "crown", "bucket", "beret", "tiara", "flowers"], 1)
  };
  /* قوائم حسب الجنس: قصّات البنات منفصلة تماماً عن الأولاد (أسماء وأشكال مختلفة).
     أول nFree مجانية والباقي بالنقاط */
  var BYG = {
    hair: {
      m: L(["short", "spiky", "side", "buzz", "curly", "bun", "slick", "afro", "mohawk", "m_long", "quiff", "undercut", "m_wavy", "fade"], 6),
      f: L(["g_long", "g_bun", "g_wavy", "g_side", "g_pony", "g_braid", "g_hime", "g_space", "g_twin", "g_curly", "g_bangs", "g_lowpony", "g_halfup"], 6)
    },
    outfit: {
      m: L(["hoodie", "tee", "shirt", "sweater", "jacket", "polo",
        "doctor", "scrubs", "pharmacist", "chef", "engineer", "jersey", "suit", "thobe", "kurdish_m", "gown",
        "denim", "hoodie_red", "tee_green", "suit_gray", "dentist", "thobe_gray", "thobe_brown", "kurdish_m2", "kurdish_m3",
        "oil_engineer", "civil_engineer", "architect", "teacher", "pilot", "police", "scrubs_blue", "researcher", "vet"], 6),
      f: L(["dress", "tee", "shirt", "sweater", "hoodie", "jacket",
        "doctor", "scrubs", "pharmacist", "nurse", "chef", "engineer", "sundress", "dress_red", "skirt", "abaya", "kurdish_f", "gown",
        "denim", "hoodie_red", "tee_green", "dentist", "dress_blue", "dress_purple", "dress_black", "skirt_blue", "maxi_pink",
        "kurdish_f_red", "kurdish_f_blue", "kurdish_f_purple",
        "abaya_navy", "abaya_maroon", "abaya_green", "abaya_purple", "abaya_gray", "abaya_teal", "abaya_rose", "abaya_black_gold",
        "oil_engineer", "civil_engineer", "architect", "teacher", "pilot", "police", "scrubs_blue", "researcher", "vet"], 6)
    },
    beard: {
      m: L(["none", "stubble", "mustache", "goatee", "short", "full", "chinstrap", "handlebar"], 6),
      f: L(["none"], 1)
    },
    head: {                                   /* الحجاب: لفة وحدة مجانية، والباقي مدفوع */
      m: L(["none"], 1),
      f: L(["none", "hijab", "wrap", "long"], 2)
    }
  };
  /* أسعار مبدئية بالنقاط (نعدّلها بجولة النقاط) */
  var PRICE = {
    "hairc:pink": 20, "hairc:blue": 20, "hairc:purple": 20, "hairc:platinum": 20, "hairc:green": 20,
    "hair:slick": 30, "hair:afro": 30, "hair:mohawk": 30, "hair:m_long": 30,
    "hair:g_hime": 30, "hair:g_space": 30, "hair:g_twin": 30, "hair:g_curly": 30, "hair:g_bangs": 30, "hair:g_lowpony": 30, "hair:g_halfup": 30,
    "hair:quiff": 30, "hair:undercut": 30, "hair:m_wavy": 30, "hair:fade": 30,
    "beard:chinstrap": 30, "beard:handlebar": 30,
    "headc:rose": 20, "headc:green": 20, "headc:purple": 20, "headc:teal": 20,
    "head:wrap": 30, "head:long": 30,
    "outfit:doctor": 20, "outfit:scrubs": 20, "outfit:pharmacist": 20, "outfit:nurse": 20,
    "outfit:chef": 20, "outfit:engineer": 20, "outfit:jersey": 20, "outfit:suit": 20,
    "outfit:sundress": 20, "outfit:dress_red": 20, "outfit:skirt": 20,
    "outfit:thobe": 50, "outfit:abaya": 50, "outfit:kurdish_m": 50, "outfit:kurdish_f": 50, "outfit:gown": 50,
    "outfit:denim": 20, "outfit:oil_engineer": 20, "outfit:civil_engineer": 20, "outfit:architect": 20, "outfit:teacher": 20, "outfit:pilot": 20, "outfit:police": 20, "outfit:scrubs_blue": 20, "outfit:researcher": 20, "outfit:vet": 20, "outfit:hoodie_red": 20, "outfit:tee_green": 20, "outfit:suit_gray": 20, "outfit:dentist": 20,
    "outfit:dress_blue": 20, "outfit:dress_purple": 20, "outfit:dress_black": 20, "outfit:skirt_blue": 20, "outfit:maxi_pink": 20,
    "outfit:thobe_gray": 50, "outfit:thobe_brown": 50, "outfit:kurdish_m2": 50, "outfit:kurdish_m3": 50,
    "outfit:kurdish_f_red": 50, "outfit:kurdish_f_blue": 50, "outfit:kurdish_f_purple": 50,
    "outfit:abaya_navy": 50, "outfit:abaya_maroon": 50, "outfit:abaya_green": 50, "outfit:abaya_purple": 50, "outfit:abaya_gray": 50,
    "outfit:abaya_teal": 50, "outfit:abaya_rose": 50, "outfit:abaya_black_gold": 50,
    "glasses:round": 30, "glasses:square": 30, "glasses:sun": 30, "glasses:cat": 30, "glasses:aviator": 30,
    "hat:cap": 30, "hat:beanie": 30, "hat:headphones": 30, "hat:bow": 30, "hat:crown": 100,
    "hat:bucket": 30, "hat:beret": 30, "hat:tiara": 100, "hat:flowers": 30
  };
  var DEF = { gender: "m", skin: 1, eyes: "round", eyec: "brown", mouth: "smile", hair: "short", hairc: "black",
    beard: "none", head: "none", headc: "black", outfit: "hoodie", glasses: "none", hat: "none" };
  var DEFF = { hair: "g_long", outfit: "dress" };
  var KEYS = ["gender", "skin", "eyes", "eyec", "mouth", "hair", "hairc", "beard", "head", "headc", "outfit", "glasses", "hat"];

  function options(key, cfg) {
    if (BYG[key]) return BYG[key][(cfg && cfg.gender) === "f" ? "f" : "m"];
    return COMMON[key];
  }
  function find(key, id, g) {
    var a = options(key, { gender: g });
    for (var i = 0; i < a.length; i++) if (String(a[i].id) === String(id)) return a[i];
    return null;
  }
  function normalize(cfg) {
    cfg = cfg || {};
    var g = cfg.gender;
    if (g !== "m" && g !== "f") {
      g = (cfg.outfit === "dress" || String(cfg.hair || "").indexOf("g_") === 0 || cfg.hair === "long" || cfg.hair === "bob" || cfg.hair === "twin") ? "f" : "m";
    }
    var o = { gender: g };
    KEYS.forEach(function (k) {
      if (k === "gender") return;
      var f = find(k, cfg[k], g);
      o[k] = f ? f.id : ((g === "f" && DEFF[k]) || DEF[k]);
    });
    return o;
  }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  /* شخصية افتراضية ثابتة لكل مستخدم ما سوّى شخصيته بعد (من الخيارات المجانية فقط) */
  function defaultFor(seed) {
    var h = hash(String(seed || "x")), o = { gender: (h & 1) ? "f" : "m" };
    KEYS.forEach(function (k) {
      if (k === "gender") return;
      h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
      var free = options(k, o).filter(function (x) { return x.free; });
      o[k] = free[(h >>> 8) % free.length].id;
    });
    o.head = "none"; o.glasses = "none"; o.hat = "none";
    return o;
  }
  /* هل يكدر المستخدم يستعمل هذا العنصر؟ (owned يُملأ بجولة النقاط) */
  var owned = {};
  function canUse(key, id, cfg) {
    var f = find(key, id, cfg && cfg.gender);
    return !!f && (f.free || !!owned[key + ":" + id]);
  }
  function setOwned(list) { owned = {}; (list || []).forEach(function (s) { owned[s] = true; }); }
  function price(key, id) { return PRICE[key + ":" + id] || 0; }

  /* ---------- شبكة البكسل ---------- */
  function Grid() { this.c = new Array(W * H); for (var i = 0; i < W * H; i++) this.c[i] = null; }
  Grid.prototype.set = function (x, y, col) { x += OX; y += OY; if (x < 0 || y < 0 || x >= W || y >= H) return; this.c[y * W + x] = col; };
  Grid.prototype.get = function (x, y) { x += OX; y += OY; if (x < 0 || y < 0 || x >= W || y >= H) return null; return this.c[y * W + x]; };
  Grid.prototype.rect = function (x, y, w, h, col) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.set(x + i, y + j, col); };
  Grid.prototype.mrect = function (x, y, w, h, col) { this.rect(x, y, w, h, col); this.rect(M - (x + w - 1), y, w, h, col); };
  Grid.prototype.spans = function (rows, col) { for (var r = 0; r < rows.length; r++) for (var x = rows[r][1]; x <= rows[r][2]; x++) this.set(x, rows[r][0], col); };
  Grid.prototype.mspans = function (rows, col) {
    for (var r = 0; r < rows.length; r++) {
      var y = rows[r][0], a = rows[r][1], b = rows[r][2];
      for (var x = a; x <= b; x++) { this.set(x, y, col); this.set(M - x, y, col); }
    }
  };
  Grid.prototype.mset = function (x, y, col) { this.set(x, y, col); this.set(M - x, y, col); };
  Grid.prototype.carve = function (cover, open, col) {
    var op = {}; open.forEach(function (r) { op[r[0]] = r; });
    for (var r = 0; r < cover.length; r++) {
      var y = cover[r][0];
      for (var x = cover[r][1]; x <= cover[r][2]; x++) {
        if (op[y] && x >= op[y][1] && x <= op[y][2]) continue;
        this.set(x, y, col);
      }
    }
  };
  function range(y1, y2, x1, x2) { var a = []; for (var y = y1; y <= y2; y++) a.push([y, x1, x2]); return a; }

  /* ---------- الأزياء ---------- */
  var OUTFITS = {
    hoodie:    { top: "hoodie", c: "#33343b", cF: "#8b7bb0", legs: "pants", b: "#26262c", shoe: "#f2f2f5" },
    tee:       { top: "tee", c: "#eef2f8", cF: "#fff1f6", legs: "pants", b: "#4a6a96", shoe: "#8b5b3b" },
    polo:      { top: "tee", c: "#2f5f9e", legs: "pants", b: "#c9b79c", shoe: "#6b4a33" },
    shirt:     { top: "shirt", c: "#a8c6ea", cF: "#f0c6d6", legs: "pants", b: "#2c2f39", shoe: "#f2f2f5" },
    sweater:   { top: "sweater", c: "#8fae7e", cF: "#e9b8a2", legs: "pants", b: "#b8a28a", shoe: "#5b4737" },
    jacket:    { top: "jacket", c: "#6f7549", cF: "#b98f6a", inner: "#f4f4f4", legs: "pants", b: "#3d566f", shoe: "#ddd6c8" },
    dress:     { top: "dress", c: "#f4a8c0", legs: "dresslegs", shoe: "#f8ead2" },
    doctor:    { top: "coat", c: "#f6f8fb", inner: "#5bb5c9", legs: "pants", b: "#3e4a64", shoe: "#f2f2f5" },
    scrubs:    { top: "scrubs", c: "#3fa8a1", legs: "pants", b: "#359089", shoe: "#f2f2f5", head: "surgcap", mask: true },
    thobe:     { top: "robe", c: "#f4f2e9", legs: "none", shoe: "#6d4b30", head: "shemagh", placket: true },
    abaya:     { top: "robe", c: "#201d26", legs: "none", shoe: "#1a1820", fold: true },
    kurdish_m: { top: "chokha", c: "#8c7b64", sash: "#b4363f", legs: "wide", b: "#8c7b64", shoe: "#3b2d23", head: "turban" },
    kurdish_f: { top: "kdress", c: "#1f9b74", gold: "#f3c24f", legs: "none", shoe: "#f3c24f", head: "kband" },
    skirt:     { top: "tee", c: "#f7b6d0", legs: "skirt", b: "#2d2834", shoe: "#2a2530" },
    gown:      { top: "robe", c: "#27252e", legs: "none", shoe: "#1a1820", head: "mortar", stole: "#e6ba4b" },
    pharmacist:{ top: "coat", c: "#f6f8fb", inner: "#4fb37a", legs: "pants", b: "#3e4a64", shoe: "#f2f2f5", nost: true, cross: "#3fae6f" },
    nurse:     { top: "scrubs", c: "#f2a1b8", legs: "pants", b: "#e68ba5", shoe: "#f2f2f5", head: "ncap" },
    chef:      { top: "chef", c: "#fbfbfd", legs: "pants", b: "#3b3f4a", shoe: "#2f2a33", head: "toque" },
    engineer:  { top: "vest", c: "#e9edf3", legs: "pants", b: "#4a5a74", shoe: "#6b4a33", head: "hardhat" },
    jersey:    { top: "jersey", c: "#d9423b", legs: "pants", b: "#2f3442", shoe: "#f2f2f5" },
    suit:      { top: "suit", c: "#2b3550", legs: "pants", b: "#2b3550", shoe: "#1e1b22" },
    sundress:  { top: "dress", c: "#f6d365", legs: "dresslegs", shoe: "#8b5b3b" },
    dress_red: { top: "dress", c: "#d94b5d", legs: "dresslegs", shoe: "#2a2530" },
    /* ملابس جديدة */
    denim:     { top: "jacket", c: "#4f7cc0", inner: "#f4f4f4", legs: "pants", b: "#2f3a55", shoe: "#f2f2f5" },
    hoodie_red:{ top: "hoodie", c: "#c9424a", cF: "#e07a8a", legs: "pants", b: "#26262c", shoe: "#f2f2f5" },
    tee_green: { top: "tee", c: "#4aa86a", cF: "#8fd0a8", legs: "pants", b: "#3a4a6a", shoe: "#f2f2f5" },
    suit_gray: { top: "suit", c: "#6b7280", legs: "pants", b: "#6b7280", shoe: "#1e1b22" },
    dentist:   { top: "coat", c: "#f6f8fb", inner: "#8aa0ea", legs: "pants", b: "#3e4a64", shoe: "#f2f2f5", nost: true },
    thobe_gray:  { top: "robe", c: "#c9ccd2", legs: "none", shoe: "#6d4b30", head: "shemagh", placket: true },
    thobe_brown: { top: "robe", c: "#b79b78", legs: "none", shoe: "#4a3322", head: "shemagh", placket: true },
    kurdish_m2:  { top: "chokha", c: "#3d4f6b", sash: "#e0a526", legs: "wide", b: "#3d4f6b", shoe: "#3b2d23", head: "turban" },
    kurdish_m3:  { top: "chokha", c: "#2f2f35", sash: "#b4363f", legs: "wide", b: "#2f2f35", shoe: "#3b2d23", head: "turban" },
    dress_blue:   { top: "dress", c: "#5b8fd9", legs: "dresslegs", shoe: "#f8ead2" },
    dress_purple: { top: "dress", c: "#9a6ad8", legs: "dresslegs", shoe: "#f8ead2" },
    dress_black:  { top: "dress", c: "#2b2733", legs: "dresslegs", shoe: "#d9b45a" },
    skirt_blue:   { top: "tee", c: "#fff1f6", legs: "skirt", b: "#4a6fb0", shoe: "#2a2530" },
    maxi_pink:    { top: "robe", c: "#e8a0b8", legs: "none", shoe: "#a8708a" },
    kurdish_f_red:    { top: "kdress", c: "#c9323d", gold: "#f3c24f", legs: "none", shoe: "#f3c24f", head: "kband" },
    kurdish_f_blue:   { top: "kdress", c: "#2f6fc9", gold: "#f3c24f", legs: "none", shoe: "#f3c24f", head: "kband" },
    kurdish_f_purple: { top: "kdress", c: "#7a3fb0", gold: "#f3c24f", legs: "none", shoe: "#f3c24f", head: "kband" },
    /* مهن */
    oil_engineer:  { top: "tee", c: "#f08a24", legs: "pants", b: "#d9761a", shoe: "#4a3322", head: "hardhat", hatc: "#ffffff" },
    civil_engineer:{ top: "vest", c: "#cdd6e2", legs: "pants", b: "#5a4a3a", shoe: "#4a3a2a", head: "hardhat", hatc: "#ffffff" },
    architect:     { top: "sweater", c: "#2a2a30", legs: "pants", b: "#c9b79c", shoe: "#5b4737" },
    teacher:       { top: "shirt", c: "#e9e2cf", cF: "#e9c9d6", legs: "pants", b: "#5a4630", shoe: "#3b2d23" },
    pilot:         { top: "suit", c: "#1f2d55", legs: "pants", b: "#1f2d55", shoe: "#111114" },
    police:        { top: "shirt", c: "#3d5a80", legs: "pants", b: "#222831", shoe: "#111114" },
    scrubs_blue:   { top: "scrubs", c: "#4a78c9", legs: "pants", b: "#3d66ad", shoe: "#f2f2f5", head: "surgcap", mask: true },
    researcher:    { top: "coat", c: "#f6f8fb", inner: "#b48ad8", legs: "pants", b: "#3e4a64", shoe: "#f2f2f5", nost: true },
    vet:           { top: "coat", c: "#f6f8fb", inner: "#6aa84f", legs: "pants", b: "#3e4a64", shoe: "#f2f2f5" },
    /* عبايات متعددة الألوان */
    abaya_navy:   { top: "robe", c: "#1f2d55", legs: "none", shoe: "#1a1820", fold: true },
    abaya_maroon: { top: "robe", c: "#6e1f35", legs: "none", shoe: "#1a1820", fold: true },
    abaya_green:  { top: "robe", c: "#1f5a46", legs: "none", shoe: "#1a1820", fold: true },
    abaya_purple: { top: "robe", c: "#4b2a73", legs: "none", shoe: "#1a1820", fold: true },
    abaya_gray:   { top: "robe", c: "#5a5a66", legs: "none", shoe: "#1a1820", fold: true },
    abaya_teal:   { top: "robe", c: "#1f5f66", legs: "none", shoe: "#1a1820", fold: true },
    abaya_rose:   { top: "robe", c: "#a84a6a", legs: "none", shoe: "#1a1820", fold: true },
    abaya_black_gold: { top: "robe", c: "#201d26", legs: "none", shoe: "#1a1820", fold: true, stole: "#d9b45a" }
  };

  function legs(g, o, skin, skinD) {
    var b = o.b, sh = o.shoe;
    if (o.legs === "pants") {
      g.rect(8, 29, 4, 7, b); g.rect(12, 29, 4, 7, b);
      g.rect(11, 32, 2, 4, shade(b, 0.78));
      g.rect(8, 35, 8, 1, shade(b, 0.86));
    } else if (o.legs === "wide") {
      g.spans(range(28, 34, 7, 16), b); g.spans([[35, 8, 15]], shade(b, 0.8));
      g.rect(11, 31, 2, 4, shade(b, 0.8)); g.spans([[34, 7, 16]], shade(b, 0.88));
    } else if (o.legs === "skirt") {
      g.spans([[29, 8, 15]], b); g.spans(range(30, 32, 7, 16), b);
      [9, 12, 15].forEach(function (x) { g.rect(x, 30, 1, 3, shade(b, 0.8)); });
      g.rect(9, 33, 3, 3, skin); g.rect(12, 33, 3, 3, skin);
      for (var y = 33; y <= 35; y++) for (var x = 9; x <= 14; x++) if ((x + y) % 2 === 0) g.set(x, y, "#2a2430");
    } else if (o.legs === "dresslegs") {
      g.rect(9, 32, 3, 4, skin); g.rect(12, 32, 3, 4, skin);
      g.rect(9, 34, 3, 2, "#ffffff"); g.rect(12, 34, 3, 2, "#ffffff");
    }
    g.rect(7, 36, 5, 2, sh); g.rect(12, 36, 5, 2, sh);
    g.rect(7, 37, 5, 1, shade(sh, 0.72)); g.rect(12, 37, 5, 1, shade(sh, 0.72));
  }

  function arms(g, col, sleeveEnd, skin, skinD, cuff) {
    for (var y = 21; y <= 28; y++) {
      var c = y <= sleeveEnd ? col : skin;
      if (y === sleeveEnd && cuff) c = cuff;
      if (y === 28) c = skinD;
      g.mrect(6, y, 2, 1, c);
    }
  }

  function top(g, o, skin, skinD) {
    var c = o.c, t = o.top, i;
    if (t === "tee") {
      arms(g, c, 23, skin, skinD);
      g.rect(8, 20, 8, 9, c); g.rect(8, 28, 8, 1, shade(c, 0.85));
      g.rect(11, 20, 2, 1, skin);
    } else if (t === "hoodie") {
      arms(g, c, 26, skin, skinD, shade(c, 0.75));
      g.rect(8, 20, 8, 9, c);
      g.rect(9, 20, 6, 1, shade(c, 0.7)); g.mset(9, 21, shade(c, 0.75)); g.mset(10, 21, shade(c, 0.75));
      g.rect(11, 20, 2, 1, skinD);
      g.mset(10, 22, "#ececf1"); g.mset(10, 23, "#ececf1");
      g.rect(9, 25, 6, 3, shade(c, 0.86)); g.rect(9, 25, 6, 1, shade(c, 0.7));
      g.rect(8, 28, 8, 1, shade(c, 0.75));
    } else if (t === "shirt") {
      arms(g, c, 26, skin, skinD, "#ffffff");
      g.rect(8, 20, 8, 9, c);
      for (i = 8; i <= 15; i += 2) g.rect(i, 21, 1, 7, shade(c, 1.12));
      g.rect(9, 20, 6, 1, "#ffffff"); g.rect(11, 20, 2, 1, skin);
      g.rect(11, 21, 2, 8, shade(c, 0.9)); g.rect(11, 23, 1, 1, shade(c, 0.65)); g.rect(11, 26, 1, 1, shade(c, 0.65));
      g.rect(8, 28, 8, 1, shade(c, 0.85));
    } else if (t === "sweater") {
      arms(g, c, 26, skin, skinD, shade(c, 0.8));
      g.rect(8, 20, 8, 9, c); g.rect(9, 20, 6, 1, shade(c, 0.78)); g.rect(11, 20, 2, 1, skinD);
      g.rect(10, 21, 1, 7, shade(c, 0.9)); g.rect(13, 21, 1, 7, shade(c, 0.9));
      g.rect(8, 28, 8, 1, shade(c, 0.76));
    } else if (t === "jacket") {
      arms(g, c, 26, skin, skinD, shade(c, 0.8));
      g.rect(8, 20, 8, 9, o.inner);
      g.rect(8, 20, 3, 9, c); g.rect(13, 20, 3, 9, c);
      g.rect(10, 20, 1, 9, shade(c, 0.8)); g.rect(13, 20, 1, 9, shade(c, 0.8));
      g.rect(11, 20, 2, 1, skin);
      g.rect(8, 28, 8, 1, shade(c, 0.8));
    } else if (t === "dress") {
      arms(g, c, 22, skin, skinD);
      g.rect(8, 20, 8, 5, c); g.rect(11, 20, 2, 1, skin); g.rect(8, 24, 8, 1, shade(c, 0.8));
      g.spans([[25, 8, 15], [26, 7, 16], [27, 7, 16]], c);
      g.spans(range(28, 31, 6, 17), c);
      [8, 11, 14].forEach(function (x) { g.rect(x, 26, 1, 6, shade(c, 0.9)); });
      g.spans([[31, 6, 17]], shade(c, 0.8));
      g.mset(10, 20, "#ffffff");
    } else if (t === "coat") {
      arms(g, c, 26, skin, skinD, shade(c, 0.88));
      g.rect(8, 20, 8, 9, o.inner);
      g.spans(range(20, 28, 8, 10), c); g.spans(range(20, 28, 13, 15), c);
      g.spans(range(29, 31, 7, 10), c); g.spans(range(29, 31, 13, 16), c);
      g.rect(8, 20, 1, 12, shade(c, 0.9)); g.rect(15, 20, 1, 12, shade(c, 0.9));
      g.spans([[31, 7, 10], [31, 13, 16]], shade(c, 0.84));
      g.rect(10, 20, 1, 3, shade(c, 0.85)); g.rect(13, 20, 1, 3, shade(c, 0.85));
      g.rect(8, 25, 2, 2, shade(c, 0.88));
      g.set(14, 25, "#7fb3d5");
      var st = "#3b3f4a";
      if (!o.nost) {
        g.mset(9, 20, st); g.mset(9, 21, st); g.mset(10, 22, st); g.mset(10, 23, st); g.mset(11, 24, st);
        g.rect(11, 25, 2, 1, "#9aa1af"); g.set(11, 26, st); g.set(12, 26, st);
      }
      if (o.cross) { g.rect(13, 23, 3, 1, o.cross); g.rect(14, 22, 1, 3, o.cross); }
      g.set(11, 20, skin); g.set(12, 20, skin);
    } else if (t === "scrubs") {
      arms(g, c, 23, skin, skinD);
      g.rect(8, 20, 8, 9, c);
      g.rect(10, 20, 4, 1, skin); g.rect(11, 21, 2, 1, skin);
      g.mset(10, 20, shade(c, 0.75)); g.mset(10, 21, shade(c, 0.75)); g.mset(11, 22, shade(c, 0.75));
      g.rect(9, 25, 3, 2, shade(c, 0.86));
      g.rect(8, 28, 8, 1, shade(c, 0.85));
    } else if (t === "chef") {
      arms(g, c, 26, skin, skinD, shade(c, 0.88));
      g.rect(8, 20, 8, 9, c); g.rect(11, 20, 2, 1, skin);
      g.rect(9, 20, 6, 1, "#c9323d"); g.rect(11, 20, 2, 1, shade("#c9323d", 0.8));
      g.rect(11, 21, 2, 8, shade(c, 0.92));
      for (i = 21; i <= 27; i += 2) { g.set(10, i, "#aab2c2"); g.set(13, i, "#aab2c2"); }
      g.rect(8, 28, 8, 1, shade(c, 0.84));
    } else if (t === "vest") {
      arms(g, c, 23, skin, skinD);
      g.rect(8, 20, 8, 9, c); g.rect(11, 20, 2, 1, skin);
      var vo = "#f08a24";
      g.rect(8, 20, 3, 9, vo); g.rect(13, 20, 3, 9, vo);
      g.rect(8, 24, 3, 1, "#f1f1f1"); g.rect(13, 24, 3, 1, "#f1f1f1");
      g.rect(8, 27, 3, 1, "#f1f1f1"); g.rect(13, 27, 3, 1, "#f1f1f1");
      g.rect(10, 20, 1, 9, shade(vo, 0.8)); g.rect(13, 20, 1, 9, shade(vo, 0.8));
    } else if (t === "jersey") {
      arms(g, c, 23, skin, skinD);
      g.mrect(6, 22, 2, 1, "#ffffff"); g.mrect(6, 23, 2, 1, c);
      g.rect(8, 20, 8, 9, c); g.rect(10, 20, 4, 1, skin); g.rect(11, 21, 2, 1, skin);
      g.rect(10, 20, 1, 1, "#ffffff"); g.rect(13, 20, 1, 1, "#ffffff");
      g.rect(10, 23, 4, 1, "#ffffff"); g.rect(13, 24, 1, 1, "#ffffff"); g.rect(12, 25, 1, 1, "#ffffff");
      g.rect(11, 26, 1, 2, "#ffffff");
      g.rect(8, 28, 8, 1, shade(c, 0.8));
    } else if (t === "suit") {
      arms(g, c, 26, skin, skinD, "#ffffff");
      g.rect(8, 20, 8, 9, "#ffffff");
      g.rect(8, 20, 3, 9, c); g.rect(13, 20, 3, 9, c);
      g.rect(10, 20, 1, 6, shade(c, 1.35)); g.rect(13, 20, 1, 6, shade(c, 1.35));
      g.rect(11, 20, 2, 1, skin);
      g.rect(11, 21, 2, 1, "#b32c3a"); g.rect(11, 22, 2, 5, "#b32c3a"); g.rect(11, 24, 1, 2, shade("#b32c3a", 0.8));
      g.rect(8, 28, 8, 1, shade(c, 0.8));
    } else if (t === "robe") {
      arms(g, c, 26, skin, skinD, shade(c, 0.85));
      g.rect(8, 20, 8, 9, c);
      g.spans(range(29, 35, 7, 16), c);
      g.spans([[35, 7, 16]], shade(c, 0.82));
      g.rect(10, 20, 4, 1, shade(c, 0.8)); g.rect(11, 20, 2, 1, skinD);
      if (o.placket) {
        g.rect(11, 21, 2, 14, shade(c, 0.93));
        g.set(11, 22, shade(c, 0.7)); g.set(11, 25, shade(c, 0.7)); g.set(11, 28, shade(c, 0.7));
      }
      if (o.fold) {
        g.rect(9, 22, 1, 13, shade(c, 1.22)); g.rect(14, 24, 1, 11, shade(c, 1.15));
        g.rect(11, 21, 2, 14, shade(c, 0.88));
      }
      if (o.stole) {
        g.rect(9, 20, 2, 15, o.stole); g.rect(13, 20, 2, 15, o.stole);
        g.rect(9, 20, 1, 15, shade(o.stole, 0.85)); g.rect(14, 20, 1, 15, shade(o.stole, 0.85));
      }
    } else if (t === "chokha") {
      arms(g, c, 26, skin, skinD, shade(c, 0.78));
      g.rect(8, 20, 8, 6, c);
      g.rect(8, 20, 8, 1, shade(c, 0.85)); g.rect(11, 20, 2, 1, skin);
      g.rect(11, 21, 2, 5, shade(c, 0.82));
      g.rect(8, 21, 8, 1, shade(c, 1.15));
      g.rect(7, 26, 10, 2, o.sash);
      for (i = 7; i <= 16; i += 3) { g.set(i, 26, "#fbf3e4"); g.set(i + 1, 27, "#fbf3e4"); }
      g.rect(7, 28, 10, 1, shade(o.sash, 0.8));
    } else if (t === "kdress") {
      var gd = o.gold;
      arms(g, c, 27, skin, skinD, gd);
      g.mrect(5, 25, 1, 3, c);
      g.rect(8, 20, 8, 5, c); g.rect(11, 20, 2, 1, skin);
      g.mset(10, 20, gd); g.mset(10, 21, gd); g.mset(11, 22, gd);
      g.rect(8, 24, 8, 1, gd);
      g.spans([[25, 8, 15], [26, 8, 15], [27, 7, 16], [28, 7, 16]], c);
      g.spans(range(29, 34, 6, 17), c);
      g.spans([[35, 6, 17]], gd);
      for (var yy = 28; yy <= 33; yy++) for (var xx = 7; xx <= 16; xx++) if ((xx * 3 + yy * 5) % 7 === 0) g.set(xx, yy, shade(gd, 0.95));
      g.rect(11, 25, 2, 10, shade(c, 0.82));
    }
  }

  /* ---------- الرأس والوجه ---------- */
  var HEAD = [[4, 6, 17], [5, 5, 18]].concat(range(6, 16, 4, 19)).concat([[17, 5, 18], [18, 6, 17], [19, 8, 15]]);
  function head(g, skin, skinD) {
    g.spans(HEAD, skin);
    g.spans([[19, 8, 15]], skinD);
  }

  function face(g, cfg, skin, skinD, hairCol) {
    var D = "#2a2530", ec = EYEC[cfg.eyec] || EYEC.brown, st = cfg.eyes, brow = shade(hairCol, 0.85);
    if (st === "round") {
      g.mspans([[11, 7, 9]], D); g.mspans([[12, 7, 9]], ec); g.mspans([[13, 7, 9]], shade(ec, 0.78));
      g.mset(7, 12, "#ffffff");
    } else if (st === "big") {
      g.mspans([[10, 7, 9]], D); g.mspans([[11, 7, 9]], ec); g.mspans([[12, 7, 9]], ec); g.mspans([[13, 7, 9]], shade(ec, 0.72));
      g.mset(6, 11, D); g.mset(7, 11, "#ffffff"); g.mset(8, 11, "#ffffff");
    } else if (st === "dot") {
      g.mrect(8, 11, 2, 3, D); g.mset(8, 11, "#ffffff");
    } else if (st === "sleepy") {
      g.mspans([[12, 7, 9]], D); g.mset(8, 13, ec); g.mset(9, 13, ec); g.mset(6, 13, D);
    } else if (st === "narrow") {
      g.mspans([[12, 7, 9]], D); g.mspans([[13, 7, 9]], ec); g.mset(6, 12, D);
    } else if (st === "happy") {
      g.mset(7, 13, D); g.mset(8, 12, D); g.mset(9, 12, D); g.mset(10, 13, D);
    }
    if (st === "narrow") { g.mset(7, 10, brow); g.mset(8, 9, brow); g.mset(9, 9, brow); }
    else if (st === "big") { g.mspans([[8, 7, 9]], brow); }
    else { g.mspans([[9, 7, 9]], brow); }
    var fem = cfg.gender === "f";
    var bl = mix(skin, "#ff7f98", fem ? 0.55 : 0.42);
    g.mspans([[14, 5, 6], [15, 5, 6]], bl);
    if (fem) { g.mset(6, st === "happy" ? 12 : 11, D); g.mset(6, st === "happy" ? 11 : 10, D); }   /* رموش للأنثى */
  }

  function beard(g, style, skin, hairCol) {
    var b = shade(hairCol, 0.92), x, y;
    if (style === "none") return;
    if (style === "stubble") {
      var sc = mix(skin, hairCol, 0.4);
      for (y = 13; y <= 19; y++) for (x = 5; x <= 18; x++)
        if ((x + y) % 2 === 0 && g.get(x, y) === skin && !(y < 15 && x > 7 && x < 16)) g.set(x, y, sc);
      return;
    }
    if (style === "mustache") { g.spans([[15, 9, 14]], b); g.mset(8, 16, b); return; }
    if (style === "goatee") { g.spans([[15, 9, 14], [17, 10, 13], [18, 10, 13]], b); return; }
    if (style === "chinstrap") { g.mspans([[13, 4, 4], [14, 4, 4], [15, 4, 5], [16, 5, 6], [17, 6, 8]], b); g.spans([[18, 8, 15], [19, 9, 14]], b); return; }
    if (style === "handlebar") { g.spans([[15, 9, 14]], b); g.mset(8, 16, b); g.mset(7, 15, b); g.mset(6, 14, b); return; }
    var rows = [[13, 4, 5], [14, 4, 6], [15, 4, 7], [16, 4, 8], [17, 5, 9]];
    if (style === "full") rows = [[11, 4, 4], [12, 4, 5], [13, 4, 5]].concat(rows.slice(1));
    g.mspans(rows, b);
    g.spans([[17, 10, 13], [18, 6, 17], [19, 8, 15], [15, 9, 14]], b);
    if (style === "full") g.spans([[20, 9, 14], [21, 11, 12]], b);
  }

  function mouth(g, style, gender) {
    var m = gender === "f" ? "#d9566e" : "#b4545e";
    if (style === "open") { g.rect(11, 16, 2, 1, "#7a2f3a"); g.rect(11, 17, 2, 1, "#e58c97"); }
    else if (style === "neutral") { g.rect(11, 16, 2, 1, m); }
    else { g.set(10, 16, m); g.set(11, 17, m); g.set(12, 17, m); g.set(13, 16, m); }
  }

  /* ---------- الشعر ---------- */
  /* قصّات الأولاد: short spiky side buzz curly bun slick afro mohawk m_long
     قصّات البنات (أسماؤها تبدأ بـ g_): g_long g_bob g_bun g_pixie g_wavy g_side g_pony g_braid g_hime g_space g_twin */
  function hairBack(g, style, h) {
    var d = shade(h, 0.78);
    if (style === "g_long" || style === "g_hime" || style === "g_bangs" || style === "g_halfup") {
      g.rect(3, 6, 18, 19, d); g.spans([[25, 4, 19], [26, 5, 18], [27, 6, 17]], d);
    } else if (style === "g_bob") {
      g.rect(3, 6, 18, 14, d);
    } else if (style === "g_wavy") {
      g.rect(3, 6, 18, 17, d);
      g.spans([[23, 3, 7], [23, 10, 14], [23, 17, 20], [24, 4, 6], [24, 11, 13], [24, 18, 19]], d);
    } else if (style === "g_side") {
      g.rect(3, 6, 18, 15, d); g.spans([[21, 4, 19], [22, 5, 18]], d);
    } else if (style === "g_pony") {
      g.rect(3, 6, 18, 6, d);
      g.rect(19, 8, 4, 3, d); g.rect(20, 11, 3, 8, d); g.rect(20, 19, 2, 4, d); g.rect(21, 23, 1, 2, d);
    } else if (style === "g_braid") {
      g.rect(3, 6, 18, 12, d);
    } else if (style === "g_bun" || style === "g_lowpony") {
      g.rect(3, 6, 18, 8, d);
    } else if (style === "g_curly") {
      g.rect(2, 6, 20, 19, d); g.spans([[25, 3, 20], [26, 4, 19]], d);
    }
  }

  function hairFront(g, style, h) {
    var d = shade(h, 0.78), l = shade(h, 1.28), x, y;
    var base = [[2, 8, 15], [3, 6, 17], [4, 5, 18], [5, 4, 19], [6, 4, 19], [7, 4, 19], [8, 4, 19]];
    if (style === "short") {
      g.spans(base, h);
      g.mspans([[9, 4, 8], [10, 4, 5], [11, 4, 5], [12, 4, 4]], h);
      g.mspans([[8, 6, 8]], d); g.mset(9, 9, d);
      g.spans([[4, 8, 10], [5, 7, 8]], l);
    } else if (style === "spiky") {
      g.spans([[0, 11, 12], [1, 6, 7], [1, 11, 12], [1, 16, 17], [2, 5, 18], [3, 5, 18], [4, 4, 19], [5, 4, 19], [6, 4, 19], [7, 4, 19], [8, 4, 19]], h);
      g.spans([[9, 4, 6], [9, 9, 10], [9, 13, 14], [9, 17, 19], [10, 4, 5], [10, 18, 19], [11, 4, 4], [11, 19, 19]], h);
      g.spans([[3, 8, 9], [4, 7, 8]], l); g.mspans([[8, 4, 6]], d);
    } else if (style === "side") {
      g.spans([[2, 8, 16], [3, 6, 18], [4, 5, 19], [5, 4, 19], [6, 4, 19], [7, 4, 19], [8, 4, 19]], h);
      g.spans([[9, 4, 12], [10, 4, 10], [11, 4, 7], [12, 4, 5], [13, 4, 4]], h);
      g.spans([[9, 16, 19], [10, 18, 19], [11, 19, 19]], h);
      g.spans([[9, 8, 12], [10, 6, 10]], d); g.spans([[4, 9, 12], [5, 7, 9]], l);
    } else if (style === "curly") {
      g.spans([[0, 8, 15], [1, 5, 18], [2, 3, 20], [3, 2, 21]], h);
      g.spans(range(4, 9, 2, 21), h);
      g.mspans([[10, 2, 4], [11, 2, 4], [12, 2, 3], [13, 2, 3]], h);
      g.spans([[9, 4, 7], [9, 16, 19]], h);
      for (y = 0; y <= 13; y++) for (x = 2; x <= 21; x++)
        if (g.get(x, y) === h && (x * 7 + y * 3) % 5 === 0) g.set(x, y, d);
      g.spans([[2, 8, 11], [3, 6, 8]], l);
    } else if (style === "bun") {
      g.spans([[0, 10, 13], [1, 9, 14]], h); g.spans([[1, 10, 11]], l);
      g.spans([[2, 8, 15], [3, 6, 17], [4, 5, 18], [5, 4, 19], [6, 4, 19], [7, 4, 19], [8, 4, 19]], h);
      g.mspans([[9, 4, 9], [10, 4, 6], [11, 4, 5], [12, 4, 4]], h);
      g.mspans([[8, 6, 8]], d); g.spans([[4, 8, 10], [5, 7, 8]], l);
    } else if (style === "buzz") {
      g.spans([[3, 7, 16], [4, 5, 18], [5, 4, 19], [6, 4, 19]], d);
      g.mspans([[7, 4, 5], [8, 4, 4]], d);
      g.spans([[6, 4, 19]], shade(h, 0.7));
    } else if (style === "slick") {
      g.spans([[1, 8, 15], [2, 6, 17], [3, 5, 18], [4, 4, 19], [5, 4, 19], [6, 4, 19], [7, 4, 19], [8, 4, 19]], h);
      g.mspans([[9, 4, 5], [10, 4, 4], [11, 4, 4]], h);
      for (x = 6; x <= 15; x++) g.set(x, 3 + ((x - 6) >> 2), l);
      g.spans([[8, 5, 18]], d);
    } else if (style === "afro") {
      g.spans([[0, 8, 15], [1, 5, 18], [2, 3, 20], [3, 2, 21], [4, 1, 22], [5, 1, 22], [6, 1, 22], [7, 1, 22], [8, 1, 22]], h);
      g.mspans([[9, 1, 5], [10, 1, 4], [11, 1, 4], [12, 1, 3], [13, 1, 3]], h);
      for (y = 0; y <= 13; y++) for (x = 1; x <= 22; x++)
        if (g.get(x, y) === h && (x * 5 + y * 3) % 6 === 0) g.set(x, y, d);
      g.spans([[2, 8, 12], [3, 6, 9]], l);
    } else if (style === "mohawk") {
      g.spans([[4, 6, 8], [4, 15, 17], [5, 5, 8], [5, 15, 18], [6, 4, 19]], d);
      g.spans([[0, 10, 13], [1, 10, 13], [2, 9, 14], [3, 9, 14], [4, 9, 14], [5, 9, 14]], h);
      g.mspans([[7, 4, 5], [8, 4, 4]], d); g.spans([[1, 11, 12]], l);
    } else if (style === "m_long") {
      g.spans([[2, 8, 15], [3, 6, 17], [4, 5, 18], [5, 4, 19], [6, 3, 20], [7, 3, 20], [8, 3, 20]], h);
      g.spans([[9, 3, 8], [9, 15, 20], [10, 3, 6], [10, 17, 20]], h);
      g.rect(3, 11, 3, 9, h); g.rect(18, 11, 3, 9, h);
      g.spans([[8, 4, 8]], d); g.spans([[4, 8, 10], [5, 7, 8]], l);
      g.rect(4, 13, 1, 6, d); g.rect(19, 13, 1, 6, d);
      g.set(3, 19, null); g.set(5, 19, null); g.set(18, 19, null); g.set(20, 19, null); g.set(3, 17, null); g.set(20, 17, null);
    } else if (style === "quiff") {
      g.spans([[0, 9, 16], [1, 7, 17], [2, 6, 18], [3, 5, 18], [4, 4, 19], [5, 4, 19], [6, 4, 19], [7, 4, 19], [8, 4, 19]], h);
      g.mspans([[9, 4, 6], [10, 4, 5], [11, 4, 4]], h);
      g.mspans([[8, 5, 8]], d);
      g.spans([[1, 9, 13], [2, 8, 11], [3, 7, 9]], l);
      g.spans([[3, 15, 18]], d);
    } else if (style === "undercut") {
      var sv = shade(h, 0.55);
      g.spans([[1, 8, 15], [2, 6, 17], [3, 6, 17], [4, 6, 17], [5, 6, 17], [6, 6, 17], [7, 6, 17], [8, 6, 17]], h);
      g.mspans([[5, 4, 5], [6, 4, 5], [7, 4, 5], [8, 4, 5], [9, 4, 5], [10, 4, 4]], sv);
      g.spans([[8, 6, 17]], d);
      g.spans([[2, 9, 13], [3, 7, 9]], l);
    } else if (style === "m_wavy") {
      g.spans([[1, 8, 15], [2, 6, 17], [3, 5, 18], [4, 4, 19], [5, 3, 20], [6, 3, 20], [7, 3, 20], [8, 3, 20]], h);
      g.mspans([[9, 3, 7], [10, 3, 6], [11, 3, 5], [12, 3, 5], [13, 3, 4], [14, 3, 4]], h);
      for (y = 2; y <= 14; y++) for (x = 3; x <= 20; x++) if (g.get(x, y) === h && (x + y * 2) % 6 === 0) g.set(x, y, d);
      g.spans([[2, 8, 12], [3, 6, 9]], l);
    } else if (style === "fade") {
      g.spans([[2, 8, 15], [3, 6, 17], [4, 5, 18], [5, 5, 18], [6, 5, 18], [7, 5, 18]], h);
      g.mspans([[6, 4, 4], [7, 4, 4]], shade(h, 0.7));
      g.mspans([[8, 4, 5], [9, 4, 4]], shade(h, 0.5));
      g.mspans([[10, 4, 4], [11, 4, 4]], shade(h, 0.35));
      g.spans([[3, 8, 11]], l);
    /* ----- قصّات البنات ----- */
    } else if (style === "g_long") {
      g.spans([[2, 8, 15], [3, 6, 17], [4, 5, 18], [5, 4, 19], [6, 3, 20], [7, 3, 20], [8, 3, 20]], h);
      g.spans([[9, 3, 9], [9, 14, 20], [10, 3, 6], [10, 17, 20]], h);
      g.rect(3, 11, 3, 15, h); g.rect(18, 11, 3, 15, h);
      g.spans([[8, 4, 8]], d); g.spans([[4, 8, 10], [5, 7, 8]], l);
      g.rect(4, 14, 1, 10, d); g.rect(19, 14, 1, 10, d);
    } else if (style === "g_wavy") {
      g.spans([[2, 8, 15], [3, 6, 17], [4, 5, 18], [5, 4, 19], [6, 3, 20], [7, 3, 20], [8, 3, 20]], h);
      g.spans([[9, 3, 9], [9, 14, 20], [10, 3, 6], [10, 17, 20]], h);
      g.rect(3, 11, 3, 13, h); g.rect(18, 11, 3, 13, h);
      for (y = 11; y <= 23; y++) { if (y % 4 < 2) { g.set(4, y, d); g.set(19, y, d); } else { g.set(3, y, l); g.set(20, y, l); } }
      g.spans([[8, 4, 8]], d); g.spans([[4, 8, 10], [5, 7, 8]], l);
    } else if (style === "g_bob") {
      g.spans([[2, 8, 15], [3, 6, 17], [4, 5, 18], [5, 4, 19], [6, 3, 20], [7, 3, 20], [8, 3, 20], [9, 4, 19]], h);
      g.rect(3, 10, 3, 10, h); g.rect(18, 10, 3, 10, h);
      g.spans([[19, 5, 7], [19, 16, 18]], h);
      g.spans([[9, 4, 19]], d); g.spans([[4, 8, 10], [5, 7, 8]], l);
    } else if (style === "g_twin") {
      g.spans([[2, 8, 15], [3, 6, 17], [4, 5, 18], [5, 4, 19], [6, 3, 20], [7, 3, 20], [8, 3, 20], [9, 4, 19]], h);
      g.mrect(1, 10, 3, 14, h); g.mrect(1, 10, 3, 1, "#e85a7a");
      g.spans([[9, 4, 19]], d); g.spans([[4, 8, 10], [5, 7, 8]], l);
    } else if (style === "g_bun") {
      g.spans([[0, 10, 13], [1, 9, 14], [2, 9, 14]], h); g.spans([[1, 10, 11]], l);
      g.spans([[3, 7, 16], [4, 5, 18], [5, 4, 19], [6, 4, 19], [7, 4, 19], [8, 4, 19]], h);
      g.mspans([[9, 4, 9], [10, 4, 6], [11, 4, 5], [12, 4, 4], [13, 4, 4], [14, 4, 4], [15, 4, 4]], h);
      g.mspans([[8, 6, 8]], d); g.spans([[4, 8, 10], [5, 7, 8]], l);
      g.rect(9, 3, 6, 1, "#e85a7a");
    } else if (style === "g_pixie") {
      g.spans(base, h);
      g.spans([[9, 4, 12], [10, 4, 7], [11, 4, 5]], h);
      g.spans([[9, 18, 19], [10, 19, 19]], h);
      g.rect(4, 12, 1, 3, h); g.rect(19, 11, 1, 4, h);
      g.spans([[9, 6, 11], [10, 5, 7]], d); g.spans([[4, 8, 10], [5, 7, 8]], l);
    } else if (style === "g_side") {
      g.spans([[2, 8, 16], [3, 6, 18], [4, 5, 19], [5, 4, 19], [6, 4, 19], [7, 4, 19], [8, 4, 19]], h);
      g.spans([[9, 4, 14], [10, 4, 9], [11, 4, 6], [12, 4, 5]], h);
      g.spans([[9, 18, 19], [10, 19, 19]], h);
      g.rect(3, 9, 2, 12, h); g.rect(19, 9, 2, 12, h);
      g.spans([[9, 7, 12], [10, 5, 8]], d); g.spans([[4, 9, 13], [5, 7, 9]], l);
    } else if (style === "g_hime") {
      g.spans([[2, 8, 15], [3, 6, 17], [4, 5, 18], [5, 4, 19], [6, 3, 20], [7, 3, 20], [8, 3, 20], [9, 4, 19]], h);
      g.rect(3, 10, 2, 13, h); g.rect(19, 10, 2, 13, h);
      g.spans([[9, 4, 19]], d); g.spans([[4, 8, 10], [5, 7, 8]], l);
    } else if (style === "g_space") {
      g.mspans([[0, 4, 6], [1, 3, 7], [2, 3, 7], [3, 3, 7]], h);
      g.mset(5, 1, l); g.mset(5, 2, l);
      g.spans([[3, 8, 15], [4, 5, 18], [5, 4, 19], [6, 4, 19], [7, 4, 19], [8, 4, 19]], h);
      g.mspans([[9, 4, 7], [10, 4, 5], [11, 4, 4], [12, 4, 4]], h);
      g.mspans([[8, 6, 8]], d); g.spans([[4, 9, 11], [5, 8, 9]], l);
    } else if (style === "g_pony") {
      g.spans(base, h);
      g.mspans([[9, 4, 8], [10, 4, 5], [11, 4, 5], [12, 4, 4]], h);
      g.spans([[4, 8, 10], [5, 7, 8]], l); g.mspans([[8, 6, 8]], d);
      g.rect(19, 8, 3, 1, "#e85a7a");
    } else if (style === "g_braid") {
      g.spans(base, h);
      g.mspans([[9, 4, 8], [10, 4, 5], [11, 4, 5], [12, 4, 4]], h);
      g.spans([[4, 8, 10], [5, 7, 8]], l); g.mspans([[8, 6, 8]], d);
      g.rect(17, 14, 3, 5, h);
      for (y = 19; y <= 31; y++) g.rect(17, y, 3, 1, (y % 2) ? d : h);
      g.rect(17, 32, 3, 1, "#e85a7a");
    } else if (style === "g_curly") {
      g.spans([[1, 7, 16], [2, 5, 18], [3, 3, 20], [4, 2, 21], [5, 2, 21], [6, 2, 21], [7, 2, 21], [8, 2, 21]], h);
      g.spans([[9, 2, 8], [9, 15, 21], [10, 2, 6], [10, 17, 21]], h);
      g.rect(2, 11, 4, 14, h); g.rect(18, 11, 4, 14, h);
      for (y = 1; y <= 24; y++) for (x = 2; x <= 21; x++) if (g.get(x, y) === h && (x * 5 + y * 3) % 6 === 0) g.set(x, y, d);
      g.spans([[2, 8, 12], [3, 6, 9]], l);
    } else if (style === "g_bangs") {
      g.spans([[2, 8, 15], [3, 6, 17], [4, 5, 18], [5, 4, 19], [6, 3, 20], [7, 3, 20], [8, 3, 20], [9, 4, 19]], h);
      g.spans([[10, 4, 8], [10, 15, 19]], h);
      g.rect(3, 11, 3, 15, h); g.rect(18, 11, 3, 15, h);
      g.spans([[9, 4, 19]], d); g.spans([[4, 8, 10], [5, 7, 8]], l);
    } else if (style === "g_lowpony") {
      g.spans(base, h);
      g.mspans([[9, 4, 8], [10, 4, 5], [11, 4, 5], [12, 4, 4]], h);
      g.spans([[4, 8, 10], [5, 7, 8]], l); g.mspans([[8, 6, 8]], d);
      g.rect(17, 14, 3, 3, h); g.rect(17, 17, 3, 1, "#e85a7a");
      g.rect(16, 18, 4, 11, h); g.spans([[29, 17, 18]], h);
      g.rect(17, 20, 1, 8, d);
    } else if (style === "g_halfup") {
      g.spans([[0, 10, 13], [1, 9, 14], [2, 9, 14]], h); g.spans([[1, 10, 11]], l);
      g.spans([[3, 7, 16], [4, 5, 18], [5, 4, 19], [6, 3, 20], [7, 3, 20], [8, 3, 20]], h);
      g.spans([[9, 3, 9], [9, 14, 20], [10, 3, 6], [10, 17, 20]], h);
      g.rect(3, 11, 3, 15, h); g.rect(18, 11, 3, 15, h);
      g.spans([[8, 4, 8]], d); g.rect(4, 14, 1, 10, d); g.rect(19, 14, 1, 10, d);
      g.rect(9, 3, 6, 1, "#e85a7a");
    }
  }

  function headwear(g, kind, o, skin, hairCol) {
    var x, y;
    if (kind === "shemagh") {
      var cl = "#f6f3ea", rd = "#c9323d";
      g.spans([[1, 8, 15], [2, 6, 17], [3, 4, 19]].concat(range(4, 8, 3, 20)), cl);
      g.spans(range(9, 18, 3, 5), cl); g.spans(range(9, 18, 18, 20), cl);
      g.spans([[19, 4, 6], [19, 17, 19]], cl);
      for (y = 1; y <= 19; y++) for (x = 3; x <= 20; x++)
        if (g.get(x, y) === cl && (x + y) % 4 === 0) g.set(x, y, rd);
      g.spans([[6, 3, 20], [7, 3, 20]], "#1d1b21");
      g.spans([[6, 5, 8]], "#3a3740");
    } else if (kind === "hijab" || kind === "long") {
      var hc = o.hc;
      g.carve([[2, 8, 15], [3, 6, 17], [4, 5, 18]].concat(range(5, 18, 3, 20)).concat([[19, 4, 19], [20, 5, 18], [21, 6, 17], [22, 8, 15]]),
        [[8, 7, 16]].concat(range(9, 16, 6, 17)).concat([[17, 7, 16], [18, 8, 15]]), hc);
      g.spans([[4, 8, 10], [5, 6, 8]], shade(hc, 1.35));
      g.rect(3, 12, 1, 8, shade(hc, 0.8)); g.rect(20, 12, 1, 8, shade(hc, 0.8));
      if (kind === "long") {
        g.spans(range(23, 29, 7, 16), hc); g.spans([[30, 8, 15]], hc); g.spans([[31, 9, 14]], shade(hc, 0.8));
        g.rect(10, 24, 1, 6, shade(hc, 1.2)); g.rect(13, 25, 1, 5, shade(hc, 0.85));
      }
    } else if (kind === "wrap") {
      var wc = o.hc;
      g.spans([[0, 9, 14], [1, 7, 16], [2, 5, 18], [3, 4, 19]].concat(range(4, 8, 3, 20)), wc);
      g.spans(range(9, 13, 3, 5), wc); g.spans(range(9, 13, 18, 20), wc);
      for (y = 0; y <= 13; y++) for (x = 3; x <= 20; x++) if (g.get(x, y) === wc && (x + y) % 5 === 0) g.set(x, y, shade(wc, 1.3));
      g.spans([[8, 4, 19]], shade(wc, 0.8));
      g.rect(21, 5, 2, 2, wc); g.rect(22, 7, 1, 2, shade(wc, 0.8));
    } else if (kind === "turban") {
      var t1 = "#c9323d", t2 = "#f2ecdf";
      g.spans([[1, 7, 16], [2, 5, 18], [3, 4, 19]].concat(range(4, 7, 3, 20)).concat([[8, 4, 19]]), t1);
      for (y = 1; y <= 8; y++) for (x = 3; x <= 20; x++)
        if (g.get(x, y) === t1 && ((x + y) % 4 < 2)) g.set(x, y, t2);
      g.spans([[8, 4, 19]], shade(t1, 0.8));
      g.rect(20, 8, 2, 1, t1); g.rect(21, 9, 1, 3, t2);
    } else if (kind === "surgcap") {
      var sc = "#4cb8b1";
      g.spans([[2, 6, 17], [3, 4, 19]].concat(range(4, 7, 3, 20)).concat([[8, 4, 19]]), sc);
      g.spans([[8, 4, 19]], shade(sc, 0.82)); g.spans([[4, 7, 10]], shade(sc, 1.3));
      g.mset(3, 9, sc); g.mset(3, 10, sc);
    } else if (kind === "kband") {
      var gd = o.gold;
      g.spans([[6, 3, 20]], gd); g.spans([[7, 3, 20]], shade(gd, 0.82));
      for (x = 4; x <= 19; x += 3) g.set(x, 6, "#fff2c2");
      g.mset(4, 8, gd); g.mset(4, 9, gd); g.mset(3, 9, shade(gd, 0.8));
    } else if (kind === "toque") {
      var tw = "#fbfbfd";
      g.spans([[-1, 8, 15], [0, 6, 17], [1, 5, 18], [2, 5, 18], [3, 5, 18]], tw);
      g.spans([[4, 5, 18]], shade(tw, 0.86)); g.spans([[0, 8, 10]], shade(tw, 0.9));
      g.rect(7, 1, 1, 2, shade(tw, 0.92)); g.rect(12, 0, 1, 3, shade(tw, 0.92)); g.rect(16, 1, 1, 2, shade(tw, 0.92));
    } else if (kind === "hardhat") {
      var hy = o.hatc || "#f3c614";
      g.spans([[0, 9, 14], [1, 7, 16], [2, 5, 18], [3, 4, 19], [4, 4, 19]], hy);
      g.spans([[5, 3, 20]], shade(hy, 0.8));
      g.rect(10, 0, 4, 4, shade(hy, 1.15)); g.rect(11, 0, 2, 3, shade(hy, 0.9));
      g.spans([[2, 7, 9]], shade(hy, 1.3));
    } else if (kind === "ncap") {
      var nw = "#ffffff";
      g.spans([[0, 8, 15], [1, 6, 17], [2, 5, 18], [3, 5, 18], [4, 6, 17]], nw);
      g.spans([[4, 6, 17]], shade(nw, 0.88));
      g.rect(10, 1, 4, 1, "#d9423b"); g.rect(11, 0, 2, 4, "#d9423b");
    } else if (kind === "mortar") {
      var bk = "#2a2830";
      g.spans([[1, 3, 20], [2, 2, 21], [3, 3, 20]], bk);
      g.spans([[1, 5, 10]], "#4a4853");
      g.spans([[4, 6, 17]], shade(bk, 0.85));
      g.rect(21, 3, 1, 5, o.stole || "#e6ba4b"); g.rect(20, 8, 3, 2, o.stole || "#e6ba4b");
    }
  }

  /* ---------- نظارات وقبعات ---------- */
  function glasses(g, style) {
    var fr = (style === "round" || style === "aviator") ? "#d4a937" : style === "cat" ? "#c43d6a" : "#262129", x, y;
    for (x = 7; x <= 9; x++) { g.mset(x, 9, fr); g.mset(x, 14, fr); }
    for (y = 10; y <= 13; y++) { g.mset(6, y, fr); g.mset(10, y, fr); }
    if (style !== "round") { g.mset(6, 9, fr); g.mset(10, 9, fr); g.mset(6, 14, fr); g.mset(10, 14, fr); }
    g.set(11, 11, fr); g.set(12, 11, fr);
    g.mset(5, 11, fr); g.mset(4, 11, fr);
    if (style === "cat") { g.mset(5, 9, fr); g.mset(4, 8, fr); g.mset(6, 8, fr); }
    if (style === "aviator") {
      for (y = 10; y <= 13; y++) for (x = 7; x <= 9; x++) g.mset(x, y, "#5b6c82");
      g.mset(7, 10, "#9fb3cc"); g.mset(8, 11, "#7f93ae");
    }
    if (style === "sun") {
      for (y = 10; y <= 13; y++) for (x = 7; x <= 9; x++) g.mset(x, y, "#1f1c25");
      g.mset(7, 10, "#6e6c7a"); g.mset(8, 10, "#4a4855");
    }
  }
  function hat(g, style) {
    var x;
    if (style === "cap") {
      var rd = "#d9423b";
      g.spans([[1, 7, 16], [2, 5, 18], [3, 4, 19], [4, 4, 19]], rd);
      g.spans([[5, 3, 20], [6, 4, 19]], shade(rd, 0.78));
      g.spans([[2, 8, 10]], shade(rd, 1.25)); g.set(11, 1, shade(rd, 0.8)); g.set(12, 1, shade(rd, 0.8));
    } else if (style === "beanie") {
      var bl = "#4a6fa5";
      g.rect(10, -1, 4, 1, "#f2f2f5");
      g.spans([[0, 9, 14], [1, 6, 17], [2, 5, 18], [3, 4, 19], [4, 4, 19]], bl);
      g.spans([[5, 3, 20], [6, 3, 20]], shade(bl, 1.25));
      for (x = 4; x <= 19; x += 2) { g.set(x, 5, shade(bl, 0.85)); g.set(x + 1, 6, shade(bl, 0.85)); }
      for (x = 7; x <= 16; x += 3) g.rect(x, 1, 1, 3, shade(bl, 1.12));
    } else if (style === "crown") {
      var gd = "#f3c24f";
      g.set(6, 0, gd); g.set(6, 1, gd); g.rect(11, -1, 2, 3, gd); g.set(17, 0, gd); g.set(17, 1, gd);
      g.spans([[2, 6, 17], [3, 6, 17]], gd); g.spans([[3, 6, 17]], shade(gd, 0.84));
      g.set(8, 1, gd); g.set(9, 1, gd); g.set(14, 1, gd); g.set(15, 1, gd);
      g.set(8, 2, "#e8465a"); g.set(15, 2, "#4fa3e8"); g.set(11, 2, "#ffffff");
    } else if (style === "headphones") {
      var hp = "#2d2d35";
      g.spans([[1, 6, 17], [2, 4, 19]], hp);
      g.mrect(3, 3, 2, 7, hp);
      g.mrect(1, 10, 3, 5, hp);
      g.mrect(1, 11, 1, 3, "#e85a7a");
    } else if (style === "bow") {
      var pk = "#f06fa0";
      g.rect(3, 2, 3, 4, pk); g.rect(7, 2, 3, 4, pk);
      g.rect(6, 3, 1, 2, shade(pk, 0.75)); g.rect(3, 2, 1, 1, shade(pk, 1.3)); g.rect(9, 5, 1, 1, shade(pk, 0.8));
    } else if (style === "bucket") {
      var bc = "#c9b48a";
      g.spans([[0, 8, 15], [1, 6, 17], [2, 5, 18], [3, 5, 18]], bc);
      g.spans([[3, 5, 18]], shade(bc, 0.78));
      g.spans([[4, 3, 20], [5, 4, 19]], shade(bc, 0.88));
      g.spans([[1, 8, 11]], shade(bc, 1.2));
    } else if (style === "beret") {
      var br = "#8b2f3a";
      g.spans([[1, 7, 16], [2, 4, 18], [3, 4, 19], [4, 5, 19], [5, 6, 18]], br);
      g.rect(11, 0, 2, 1, shade(br, 0.7)); g.spans([[2, 8, 12]], shade(br, 1.3)); g.spans([[5, 6, 18]], shade(br, 0.8));
    } else if (style === "tiara") {
      var tg = "#f3c24f";
      g.spans([[3, 6, 17]], tg); g.spans([[4, 7, 16]], shade(tg, 0.84));
      g.rect(11, 1, 2, 2, tg); g.set(8, 2, tg); g.set(15, 2, tg); g.set(11, 2, "#8fd0ff"); g.set(12, 2, "#ff8fb1");
    } else if (style === "flowers") {
      var fc = ["#f090b7", "#ffe27a", "#ffffff", "#f090b7", "#ffe27a"], gr = "#4f9a5a";
      g.spans([[3, 5, 18]], gr);
      for (x = 5; x <= 17; x += 3) { g.rect(x, 2, 2, 2, fc[(x - 5) / 3]); g.set(x, 2, "#ffffff"); }
    }
  }

  /* ---------- التجميع ---------- */
  var cache = {};
  function build(cfgIn) {
    var cfg = normalize(cfgIn);
    var key = KEYS.map(function (k) { return cfg[k]; }).join("|");
    if (cache[key]) return cache[key];
    var g = new Grid();
    var skin = SKINS[cfg.skin], skinD = shade(skin, 0.86);
    var hair = HAIRC[cfg.hairc] || HAIRC.black;
    var o = OUTFITS[cfg.outfit] || OUTFITS.hoodie;
    if (cfg.gender === "f" && o.cF) o = Object.assign({}, o, { c: o.cF });
    var hj = cfg.head !== "none";
    var replace = hj || o.head === "shemagh" || o.head === "turban" || o.head === "surgcap";

    if (!replace) hairBack(g, cfg.hair, hair);
    legs(g, o, skin, skinD);
    top(g, o, skin, skinD);
    head(g, skin, skinD);
    face(g, cfg, skin, skinD, hair);
    if (!o.mask) beard(g, cfg.beard, skin, hair);
    mouth(g, cfg.mouth, cfg.gender);
    if (o.mask) {
      g.spans([[14, 6, 17], [15, 5, 18], [16, 5, 18], [17, 6, 17], [18, 7, 16]], "#c4e8f0");
      g.spans([[15, 6, 17], [17, 7, 16]], "#9fd0de");
    }
    if (!replace) hairFront(g, cfg.hair, hair);
    if (hj) headwear(g, cfg.head, { hc: HEADC[cfg.headc] || HEADC.black }, skin, hair);
    if (o.head && (!hj || o.head === "mortar")) headwear(g, o.head, o, skin, hair);
    if (cfg.glasses !== "none") glasses(g, cfg.glasses);
    if (!replace && !o.head && cfg.hat !== "none") hat(g, cfg.hat);

    /* إطار غامق حول الشكل كله */
    var out = g.c.slice(), i, x, y;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      if (g.c[i]) continue;
      if ((x > 0 && g.c[i - 1]) || (x < W - 1 && g.c[i + 1]) || (y > 0 && g.c[i - W]) || (y < H - 1 && g.c[i + W])) out[i] = OUTLINE;
    }
    g.c = out;
    cache[key] = g;
    return g;
  }

  /* ---------- الرسم على canvas ---------- */
  /* crop: {y0, y1} لعرض جزء من الشخصية (مثلاً الرأس فقط للصور المصغرة) */
  function draw(canvas, cfg, scale, crop) {
    var g = build(cfg), y0 = crop ? crop.y0 : 0, y1 = crop ? crop.y1 : H - 1;
    scale = scale || 3;
    canvas.width = W * scale; canvas.height = (y1 - y0 + 1) * scale;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    for (var y = y0; y <= y1; y++) {
      var x = 0;
      while (x < W) {
        var col = g.c[y * W + x];
        if (!col) { x++; continue; }
        var x2_ = x;
        while (x2_ + 1 < W && g.c[y * W + x2_ + 1] === col) x2_++;
        ctx.fillStyle = col;
        ctx.fillRect(x * scale, (y - y0) * scale, (x2_ - x + 1) * scale, scale);
        x = x2_ + 1;
      }
    }
    return canvas;
  }
  function make(cfg, scale, crop) { return draw(document.createElement("canvas"), cfg, scale, crop); }

  var api = {
    W: W, H: H, options: options, price: price, PRICE: PRICE, KEYS: KEYS, SKINS: SKINS, HAIRC: HAIRC, EYEC: EYEC, HEADC: HEADC,
    normalize: normalize, defaultFor: defaultFor, find: find, canUse: canUse, setOwned: setOwned,
    build: build, draw: draw, make: make
  };
  global.SJAvatar = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
