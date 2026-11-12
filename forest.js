/* forest.js : غابة "تقدّمي" (بكسل) لموقع Secrets Of The Journey
   - الأشجار والزهور (شتلات) تنحط بخانات الأشجار: 4 بالبداية + خانة كل 3 سشنات متتالية داخل الأسبوع (أقصى شي 16)، وتتصفّر كل أسبوع
   - المقاعد، النوافير، الديكور، القطط: كل نوع إله أماكن مخصصة (ثابتة وما تتصفّر أسبوعياً)، والنافورة تكدر تنحط حتى داخل البحيرة
   - كل عنصر مشترى يطلع بقائمة "تقدّمي": تضغطه ينحط بالخانة المحددة، أو بأول خانة فارغة. تكدر تكرره أكثر من مرة
   - ضغط مطوّل على أي عنصر بالغابة = ترفعه وتنقله لمكان ثاني (إذا المكان مشغول يتبادلون)
   - ضغطة وحدة على عنصر = يطلع اسمه. ضغط على قطة = تخرخر، وإذا تكمل تنام 5 ثواني
   يستعمل من script.js: currentLanguage, supabaseClient, setView */
window.SJForest = (function () {
  "use strict";

  var W = 192, H = 152, MAX_SLOTS = 16, BASE_SLOTS = 4, PER = 3;
  /* خانات الأشجار والزهور [x, y الأرض] بترتيب الفتح */
  var SLOTS = [
    [85, 30], [107, 30], [63, 30], [129, 30], [41, 30], [151, 30], [19, 30], [173, 30],
    [41, 56], [151, 56], [19, 56], [173, 56],
    [41, 82], [151, 82], [19, 82], [173, 82]
  ];
  /* أماكن الإضافات (ثابتة). k = نوع المكان، need = أقل حجم للبحيرة حتى يظهر */
  var EXTRA = [
    { x: 64, y: 58, k: "bench" }, { x: 80, y: 56, k: "decor" }, { x: 96, y: 56, k: "fountain" }, { x: 114, y: 56, k: "decor" }, { x: 130, y: 58, k: "bench" },
    { x: 72, y: 84, k: "fountain" }, { x: 96, y: 86, k: "bench" }, { x: 120, y: 84, k: "fountain" },
    { x: 20, y: 124, k: "cat" }, { x: 52, y: 124, k: "cat" }, { x: 140, y: 124, k: "cat" }, { x: 172, y: 124, k: "cat" },
    { x: 30, y: 98, k: "decor" }, { x: 54, y: 98, k: "decor" }, { x: 142, y: 98, k: "decor" }, { x: 166, y: 98, k: "decor" },
    { x: 96, y: 109, k: "water", need: 1 }, { x: 79, y: 110, k: "water", need: 2 }, { x: 113, y: 110, k: "water", need: 2 },
    { x: 24, y: 146, k: "cat" }, { x: 58, y: 146, k: "cat" }, { x: 96, y: 146, k: "decor" }, { x: 134, y: 146, k: "bench" }, { x: 168, y: 146, k: "bench" }
  ];
  /* ترتيب العناصر القديمة بالأماكن (حتى اللي مشتري قبل يبقى بمكانه) */
  var LEGACY = ["deco:bench", "deco:lamp", "deco:fountain", null, "deco:bench_stone",
    "deco:fountain_tier", "deco:bench_park", "deco:fountain_cat",
    "cat:white", "cat:orange", "cat:black", "cat:gray"];
  var LAKES = [{ rx: 14, ry: 7 }, { rx: 21, ry: 10 }, { rx: 28, ry: 13 }];
  var LAKE_CX = 96, LAKE_CY = 106;
  var BIOMES = ["autumn", "spring", "snow", "desert"];

  var st = {
    loaded: false, slots: BASE_SLOTS, streak: 0, owned: [], prices: {}, lake: 1, weekEnd: null, biome: "autumn",
    layout: { slots: { 0: "tree:oak" }, extras: {} },
    sel: null, busy: false, msg: "", msgTimer: null, drag: null, cats: {}
  };
  var canvas = null, ctx = null, bgCache = {}, built = false, snowOn = false, press = null, lastFrame = 0;

  /* ---------- نصوص ---------- */
  var TXT = {
    ar: { title: "تقدّمي", slots: "الخانات", streak: "السلسلة", lockedMsg: "تنفتح بعد {n} سشن", remove: "إزالة",
      saved: "تم الحفظ ✅", fail: "تعذّر الحفظ، حاول مرة ثانية", full: "ما في مكان فارغ", noswap: "ما يصير يتبادلون", more: "المتجر",
      dayU: "يوم", secTrees: "الأشجار والزهور", secBiome: "البيئة", secBench: "المقاعد", secFountain: "النوافير", secDecor: "ديكور", secCats: "القطط" },
    en: { title: "My progress", slots: "Slots", streak: "Streak", lockedMsg: "Unlocks after {n} more sessions", remove: "Remove",
      saved: "Saved ✅", fail: "Could not save, try again", full: "No free spot", noswap: "Can't swap these", more: "Market",
      dayU: "d", secTrees: "Trees & flowers", secBiome: "Biome", secBench: "Benches", secFountain: "Fountains", secDecor: "Decor", secCats: "Cats" },
    ckb: { title: "پێشکەوتنم", slots: "شوێنەکان", streak: "زنجیرە", lockedMsg: "دوای {n} سیشنی تر دەکرێتەوە", remove: "لابردن",
      saved: "پاشەکەوت کرا ✅", fail: "پاشەکەوت نەکرا، دووبارە هەوڵبدەرەوە", full: "شوێنی بەتاڵ نییە", noswap: "ناتوانرێت شوێنیان بگۆڕدرێت", more: "بازاڕ",
      dayU: "ڕۆژ", secTrees: "درەخت و گوڵ", secBiome: "ژینگە", secBench: "کورسییەکان", secFountain: "فوارەکان", secDecor: "ڕازاندنەوە", secCats: "پشیلەکان" }
  };
  var NAMES = {
    ar: { "tree:oak": "بلوط", "tree:pine": "صنوبر", "tree:birch": "بتولا", "tree:palm": "نخلة", "tree:maple": "قيقب", "tree:cherry": "كرز", "tree:willow": "صفصاف",
      "tree:cactus": "صبّار", "tree:acacia": "سنط", "tree:bamboo": "خيزران", "tree:cypress": "سرو", "tree:orange": "برتقال",
      "tree:olive": "زيتون", "tree:pomegranate": "رمان", "tree:hama": "محمد",
      "deco:bench": "بنش خشبي", "deco:bench_stone": "بنش حجري", "deco:bench_park": "بنش حديقة", "deco:bench_log": "بنش جذع",
      "deco:fountain": "نافورة", "deco:fountain_tier": "نافورة طبقات", "deco:fountain_cat": "نافورة القطة",
      "deco:lamp": "فانوس", "deco:flowers": "حوض ورد", "deco:sunflowers": "عباد الشمس", "deco:tulips": "توليب",
      "deco:tent": "خيمة", "deco:signpost": "لوحة إرشاد", "deco:campfire": "نار مخيّم", "deco:haystack": "كومة قش",
      "deco:well": "بئر", "deco:swing": "أرجوحة",
      "cat:white": "شيرو", "cat:orange": "تحسين", "cat:black": "قطة سوداء", "cat:gray": "قطة رمادية", "cat:mina": "مينا", "cat:zaboura": "زعبورة",
      "lake:2": "بحيرة أكبر", "lake:3": "بحيرة ضخمة",
      "biome:autumn": "خريف", "biome:spring": "ربيع", "biome:snow": "ثلج", "biome:desert": "صحراء" },
    en: { "tree:oak": "Oak", "tree:pine": "Pine", "tree:birch": "Birch", "tree:palm": "Palm", "tree:maple": "Maple", "tree:cherry": "Cherry", "tree:willow": "Willow",
      "tree:cactus": "Cactus", "tree:acacia": "Acacia", "tree:bamboo": "Bamboo", "tree:cypress": "Cypress", "tree:orange": "Orange tree",
      "tree:olive": "Olive tree", "tree:pomegranate": "Pomegranate", "tree:hama": "Mohammed",
      "deco:bench": "Wood bench", "deco:bench_stone": "Stone bench", "deco:bench_park": "Park bench", "deco:bench_log": "Log bench",
      "deco:fountain": "Fountain", "deco:fountain_tier": "Tiered fountain", "deco:fountain_cat": "Cat fountain",
      "deco:lamp": "Lamp", "deco:flowers": "Flower bed", "deco:sunflowers": "Sunflowers", "deco:tulips": "Tulips",
      "deco:tent": "Tent", "deco:signpost": "Signpost", "deco:campfire": "Campfire", "deco:haystack": "Haystack",
      "deco:well": "Well", "deco:swing": "Swing",
      "cat:white": "Shiro", "cat:orange": "Tahseen", "cat:black": "Black cat", "cat:gray": "Gray cat", "cat:mina": "Mina", "cat:zaboura": "Zaboura",
      "lake:2": "Bigger lake", "lake:3": "Huge lake",
      "biome:autumn": "Autumn", "biome:spring": "Spring", "biome:snow": "Snow", "biome:desert": "Desert" },
    ckb: { "tree:oak": "بەڕوو", "tree:pine": "سنەوبەر", "tree:birch": "بێتولا", "tree:palm": "خورما", "tree:maple": "مەیپڵ", "tree:cherry": "گیلاس", "tree:willow": "بید",
      "tree:cactus": "کاکتوس", "tree:acacia": "ئەکاسیا", "tree:bamboo": "بامبۆ", "tree:cypress": "سەرو", "tree:orange": "پرتەقاڵ",
      "tree:olive": "زەیتوون", "tree:pomegranate": "هەنار", "tree:hama": "حەمە",
      "deco:bench": "کورسی دار", "deco:bench_stone": "کورسی بەرد", "deco:bench_park": "کورسی پارک", "deco:bench_log": "کورسی کۆتە",
      "deco:fountain": "فوارە", "deco:fountain_tier": "فوارەی چین چین", "deco:fountain_cat": "فوارەی پشیلە",
      "deco:lamp": "چرا", "deco:flowers": "باخچەی گوڵ", "deco:sunflowers": "گوڵەبەڕۆژە", "deco:tulips": "لاڵە",
      "deco:tent": "چادر", "deco:signpost": "تابلۆ", "deco:campfire": "ئاگر", "deco:haystack": "کەلەکەی کا",
      "deco:well": "بیر", "deco:swing": "ئەرجوحە",
      "cat:white": "شیرۆ", "cat:orange": "تەحسین", "cat:black": "پشیلەی ڕەش", "cat:gray": "پشیلەی خۆڵەمێشی", "cat:mina": "مینا", "cat:zaboura": "زەعبورە",
      "lake:2": "گۆمی گەورەتر", "lake:3": "گۆمی زۆر گەورە",
      "biome:autumn": "پاییز", "biome:spring": "بەهار", "biome:snow": "بەفر", "biome:desert": "بیابان" }
  };
  function L() { try { return currentLanguage(); } catch (e) { return "ar"; } }
  function tr(k, n) {
    var l = TXT[L()] || TXT.ar;
    var s = l[k] || TXT.en[k] || k;
    return n != null ? s.replace("{n}", n) : s;
  }
  function itemName(key) {
    var l = NAMES[L()] || NAMES.ar;
    return l[key] || NAMES.en[key] || key;
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function root() { return document.getElementById("forestRoot"); }
  function viewVisible() { var v = document.getElementById("forestView"); return !!v && !v.hidden; }

  /* ---------- ألوان حسب البيئة والثيم ---------- */
  function night() { return document.documentElement.getAttribute("data-theme") === "dark"; }
  var PAL = {
    autumn: {
      d: { g1: "#86c35a", g2: "#78b44d", g3: "#9fd56f", dirt: "#b98f5a", lake: "#4a9ad8", lake2: "#66b5ec", hi: "#e2f5ff", shore: "#dcc794", sh: "rgba(0,0,0,.18)", leaf: ["#e0762a", "#d9a02e", "#a8582a"] },
      n: { g1: "#3a5f45", g2: "#315339", g3: "#477151", dirt: "#6b5238", lake: "#2c4f86", lake2: "#3b64a3", hi: "#8fb4ee", shore: "#7d6a4a", sh: "rgba(0,0,0,.30)", leaf: ["#a85a24", "#a8802a", "#7a4422"] }
    },
    spring: {
      d: { g1: "#9ee06c", g2: "#8ad05b", g3: "#bdf08c", dirt: "#c9a06a", lake: "#4fb0e8", lake2: "#7ac9f5", hi: "#ecfaff", shore: "#ecdcae", sh: "rgba(0,0,0,.16)", flower: ["#ff8fbf", "#fff2a0", "#ffffff", "#c9a0ff"] },
      n: { g1: "#3f7050", g2: "#376446", g3: "#4f8661", dirt: "#6b5238", lake: "#2f5e96", lake2: "#3f78b4", hi: "#9fc4f4", shore: "#7d6e50", sh: "rgba(0,0,0,.28)", flower: ["#b8648a", "#b8ad60", "#cfd6d0", "#8a6cb8"] }
    },
    snow: {
      d: { g1: "#f0f6fc", g2: "#dde8f4", g3: "#ffffff", dirt: "#cfdbe9", lake: "#b9e3f5", lake2: "#dcf4fd", hi: "#ffffff", shore: "#b4c5d8", sh: "rgba(40,70,110,.20)" },
      n: { g1: "#8ea4be", g2: "#7d93af", g3: "#a7bad2", dirt: "#6f829b", lake: "#5f89ab", lake2: "#7ba5c5", hi: "#d6e8f7", shore: "#6a7d97", sh: "rgba(10,20,40,.35)" }
    },
    desert: {
      d: { g1: "#ecd08f", g2: "#dcbc74", g3: "#f6e3b0", dirt: "#c59a58", lake: "#33a8c6", lake2: "#5bc6de", hi: "#e8fcff", shore: "#9db552", sh: "rgba(80,50,10,.20)" },
      n: { g1: "#6c6045", g2: "#5f5339", g3: "#827553", dirt: "#52432a", lake: "#1f6e87", lake2: "#2f8ca6", hi: "#a2e3f0", shore: "#53703a", sh: "rgba(0,0,0,.32)" }
    }
  };
  function pal(b) { return (PAL[b] || PAL.autumn)[night() ? "n" : "d"]; }

  /* ---------- أدوات الرسم ---------- */
  function R(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
  function blob(g, cx, cy, rx, ry, c) {
    for (var y = -ry; y <= ry; y++) {
      var tt = y / (ry + 0.5);
      var w = Math.round(rx * Math.sqrt(Math.max(0, 1 - tt * tt)));
      R(g, cx - w, cy + y, w * 2 + 1, 1, c);
    }
  }
  function hashn(x, y) {
    var h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  }
  function groundCanvas(biome, w, h) {
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var g = c.getContext("2d"), p = pal(biome), x, y, n, m, col;
    R(g, 0, 0, w, h, p.g1);
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      n = hashn(x, y) % 41;
      if (n === 0) R(g, x, y, 1, 1, p.g3);
      else if (n === 1 || n === 2) R(g, x, y, 1, 1, p.g2);
      else if (n === 3 && biome !== "snow" && biome !== "desert") { R(g, x, y, 1, 1, p.g2); R(g, x, y - 1, 1, 1, p.g2); }
      m = hashn(x * 7 + 3, y * 5 + 1) % 211;
      if (biome === "autumn") {
        if (m < 3) R(g, x, y, 2, 1, p.leaf[m]);
      } else if (biome === "spring") {
        if (m < 4) R(g, x, y, 1, 1, p.flower[m]);
        if (m === 4) { col = p.flower[(x + y) % 4]; R(g, x - 1, y, 3, 1, col); R(g, x, y - 1, 1, 3, col); R(g, x, y, 1, 1, "#ffd23f"); }
      } else if (biome === "snow") {
        if (m < 2) R(g, x, y, 1, 1, "#ffffff");
        if (m === 5 || m === 6) R(g, x, y, 3, 1, p.g2);
      } else if (biome === "desert") {
        if (m < 3) R(g, x, y, 4, 1, p.g2);
        if (m === 5) R(g, x, y, 2, 1, "#b8975a");
        if (m === 9) { R(g, x, y, 1, 1, "#9a8a3e"); R(g, x - 1, y - 1, 1, 1, "#9a8a3e"); R(g, x + 1, y - 1, 1, 1, "#9a8a3e"); }
      }
    }
    return c;
  }
  function bgFor(biome) {
    var key = biome + (night() ? "n" : "d");
    if (!bgCache[key]) bgCache[key] = groundCanvas(biome, W, H);
    return bgCache[key];
  }

  /* ---------- الأشجار ---------- */
  function trunk(g, x, by, h, c, c2) { R(g, x - 1, by - h, 3, h, c); R(g, x, by - h, 1, h, c2); R(g, x - 2, by - 1, 5, 1, c); }
  function falling(g, x, by, t, color, n) {
    for (var i = 0; i < n; i++) {
      var ph = (t * 0.45 + i / n + (x % 7) / 7) % 1;
      var px = x + Math.round(Math.sin(ph * 12.5 + i * 2) * 8);
      R(g, px, by - 16 + ph * 16, 1, 1, color);
    }
  }
  function oak(g, x, by, t) {
    var sw = Math.round(Math.sin(t * 1.4 + x * 0.3) * 0.7);
    trunk(g, x, by, 9, "#6b4a2f", "#8a6540");
    blob(g, x - 5 + sw, by - 13, 4, 4, "#2f7d3a"); blob(g, x + 5 + sw, by - 13, 4, 4, "#2f7d3a");
    blob(g, x + sw, by - 17, 7, 7, "#3f9a45");
    blob(g, x - 2 + sw, by - 19, 4, 4, "#5cbc55");
    R(g, x - 4 + sw, by - 21, 3, 1, "#8be06f"); R(g, x + sw, by - 20, 2, 1, "#8be06f");
    R(g, x - 6 + sw, by - 10, 13, 1, "#2a6e35");
  }
  function pine(g, x, by, t) {
    var sw = Math.round(Math.sin(t * 1.4 + x * 0.3) * 0.7);
    R(g, x - 1, by - 5, 3, 5, "#5a3d27");
    function tier(hw, ty, h, off) {
      for (var i = 0; i < h; i++) {
        var w = Math.round(hw * (i + 1) / h);
        R(g, x - w + off, ty + i, w * 2 + 1, 1, i === h - 1 ? "#1b5a3a" : "#2a8250");
        R(g, x - w + off, ty + i, w, 1, i === h - 1 ? "#1f6b45" : "#3fa365");
      }
    }
    tier(8, by - 13, 9, 0); tier(6, by - 19, 8, sw); tier(4, by - 25, 8, sw);
  }
  function birch(g, x, by, t) {
    var sw = Math.round(Math.sin(t * 1.4 + x * 0.3) * 0.7);
    R(g, x - 1, by - 12, 3, 12, "#efe9dc"); R(g, x + 1, by - 12, 1, 12, "#cfc8b8");
    R(g, x - 1, by - 9, 2, 1, "#3a3a3a"); R(g, x, by - 5, 2, 1, "#3a3a3a"); R(g, x - 1, by - 2, 1, 1, "#3a3a3a");
    blob(g, x - 3 + sw, by - 14, 4, 4, "#6ab142");
    blob(g, x + sw, by - 17, 6, 6, "#7cc04e");
    blob(g, x + 4 + sw, by - 19, 3, 3, "#9bdc67");
    R(g, x - 2 + sw, by - 20, 2, 1, "#c4f08a"); R(g, x + 3 + sw, by - 21, 2, 1, "#c4f08a");
  }
  function frond(g, cx, cy, dx, dy, len, sw) {
    for (var s = 1; s <= len; s++) {
      var px = cx + dx * s + sw * 0.3 * s / len, py = cy + dy * s + s * s * 0.07;
      R(g, px, py, 2, 1, (s % 2) ? "#2f9e44" : "#4cc15f");
    }
  }
  function palm(g, x, by, t) {
    var sw = Math.sin(t * 1.4 + x * 0.3), i;
    for (i = 0; i < 14; i++) {
      var tx = x + Math.round(i * i / 60);
      R(g, tx, by - i, 2, 1, (i % 3 === 0) ? "#8a5f35" : "#b58553");
    }
    R(g, x - 1, by - 1, 4, 1, "#8a5f35");
    var cx = x + 3, cy = by - 14;
    frond(g, cx, cy, -1, -0.15, 6, sw); frond(g, cx, cy, -0.7, -0.9, 6, sw);
    frond(g, cx, cy, 0, -1, 5, sw); frond(g, cx, cy, 0.7, -0.9, 6, sw); frond(g, cx, cy, 1, -0.15, 6, sw);
    R(g, cx - 1, cy + 1, 2, 2, "#6b4a2f"); R(g, cx + 1, cy + 2, 2, 2, "#6b4a2f");
  }
  function maple(g, x, by, t) {
    var sw = Math.round(Math.sin(t * 1.4 + x * 0.3) * 0.7);
    trunk(g, x, by, 9, "#5a3d27", "#7a5638");
    blob(g, x - 5 + sw, by - 13, 4, 4, "#b84a1c"); blob(g, x + 5 + sw, by - 13, 4, 4, "#b84a1c");
    blob(g, x + sw, by - 17, 7, 7, "#e06a2a");
    blob(g, x - 2 + sw, by - 19, 4, 4, "#f5a14a");
    R(g, x - 4 + sw, by - 21, 3, 1, "#ffd27a"); R(g, x + 2 + sw, by - 18, 2, 1, "#ffd27a");
    R(g, x - 6 + sw, by - 10, 13, 1, "#a53f17");
    falling(g, x, by, t, "#e06a2a", 3);
  }
  function cherry(g, x, by, t) {
    var sw = Math.round(Math.sin(t * 1.4 + x * 0.3) * 0.7);
    trunk(g, x, by, 9, "#5a3d27", "#7a5638");
    blob(g, x - 5 + sw, by - 13, 4, 4, "#d9739f"); blob(g, x + 5 + sw, by - 13, 4, 4, "#d9739f");
    blob(g, x + sw, by - 17, 7, 7, "#e58bb2");
    blob(g, x - 2 + sw, by - 19, 4, 3, "#f7bfd5");
    R(g, x + 3 + sw, by - 16, 1, 1, "#ffffff"); R(g, x - 4 + sw, by - 15, 1, 1, "#ffffff"); R(g, x + sw, by - 22, 1, 1, "#ffffff");
    R(g, x - 6 + sw, by - 10, 13, 1, "#c8608c");
    falling(g, x, by, t, "#ffd6e6", 4);
  }
  function willow(g, x, by, t) {
    trunk(g, x, by, 10, "#6b4a2f", "#8a6540");
    var xs = [-8, -5, -2, 1, 4, 7], ls = [10, 13, 9, 12, 10, 13], i, j;
    blob(g, x, by - 18, 8, 6, "#4f9a4a");
    blob(g, x - 2, by - 20, 5, 3, "#74bb63");
    for (i = 0; i < 6; i++) for (j = 0; j < ls[i]; j++) {
      var px = x + xs[i] + Math.round(Math.sin(t * 1.2 + j * 0.35 + i) * (j / 9));
      R(g, px, by - 16 + j, 1, 1, (j % 3 === 0) ? "#8fcf7a" : "#5fae55");
    }
  }
  function cactus(g, x, by) {
    R(g, x - 4, by - 1, 9, 1, "#c79a56");
    R(g, x - 2, by - 18, 5, 18, "#3a9a52"); R(g, x - 1, by - 19, 3, 1, "#3a9a52");
    R(g, x - 1, by - 18, 1, 17, "#5cc272"); R(g, x + 2, by - 18, 1, 17, "#2d7a41");
    R(g, x - 6, by - 15, 3, 7, "#3a9a52"); R(g, x - 5, by - 15, 1, 7, "#5cc272"); R(g, x - 5, by - 9, 4, 2, "#3a9a52");
    R(g, x + 4, by - 13, 3, 7, "#3a9a52"); R(g, x + 5, by - 13, 1, 7, "#5cc272"); R(g, x + 3, by - 8, 3, 2, "#3a9a52");
    R(g, x - 2, by - 11, 1, 1, "#e8f5d8"); R(g, x + 1, by - 6, 1, 1, "#e8f5d8"); R(g, x, by - 15, 1, 1, "#e8f5d8");
    R(g, x - 1, by - 21, 3, 2, "#ff6b8a"); R(g, x, by - 20, 1, 1, "#ffd23f");
  }
  function acacia(g, x, by, t) {
    var sw = Math.round(Math.sin(t * 1.2 + x * 0.3) * 0.6);
    R(g, x, by - 4, 2, 4, "#6b4a2f"); R(g, x - 1, by - 9, 2, 5, "#6b4a2f"); R(g, x - 2, by - 14, 2, 5, "#7a5638");
    R(g, x - 4, by - 17, 2, 3, "#6b4a2f"); R(g, x + 1, by - 11, 3, 2, "#6b4a2f");
    blob(g, x - 2 + sw, by - 18, 10, 2, "#5f9230");
    blob(g, x - 4 + sw, by - 19, 6, 1, "#8bc14c");
    R(g, x - 11 + sw, by - 16, 19, 1, "#4a7a26");
    R(g, x + 2 + sw, by - 19, 2, 1, "#76ab3c"); R(g, x - 8 + sw, by - 17, 2, 1, "#76ab3c");
  }
  function bamboo(g, x, by, t) {
    var sw = Math.round(Math.sin(t * 1.5 + x * 0.3) * 0.8), hs = [20, 26, 22], xs = [-5, 0, 5], i, y;
    for (i = 0; i < 3; i++) {
      var sx = x + xs[i], h = hs[i];
      for (y = 0; y < h; y++) {
        var off = y > h - 8 ? sw : 0, node = (y % 6 === 5);
        R(g, sx + off, by - y - 1, 2, 1, node ? "#3f7a2a" : "#7cc04e");
        R(g, sx + off + 1, by - y - 1, 1, 1, node ? "#2f6a20" : "#5a9a3a");
      }
      R(g, sx - 3 + sw, by - h, 3, 1, "#4cae4a"); R(g, sx + 2 + sw, by - h + 1, 3, 1, "#4cae4a");
      R(g, sx - 2 + sw, by - h - 1, 2, 1, "#6fcf5a"); R(g, sx + 1 + sw, by - h - 2, 2, 1, "#6fcf5a");
      R(g, sx + 2, by - 12, 3, 1, "#4cae4a");
    }
    R(g, x - 8, by - 1, 17, 1, "#4a7a2a");
  }
  function cypress(g, x, by, t) {
    var sw = Math.round(Math.sin(t * 1.3 + x * 0.3) * 0.6), r;
    R(g, x - 1, by - 5, 3, 5, "#5a3d27");
    for (r = 0; r < 22; r++) {
      var hw = r < 3 ? 1 : r < 8 ? 2 : r < 14 ? 3 : r < 19 ? 4 : 3, o = r < 12 ? sw : 0, y = by - 27 + r;
      R(g, x - hw + o, y, hw * 2 + 1, 1, "#1f6b45");
      R(g, x + o + Math.ceil(hw / 2), y, Math.floor(hw / 2) + 1, 1, "#17543a");
      R(g, x - hw + o, y, 1, 1, "#3fa365");
      if (r % 4 === 1 && hw > 1) R(g, x - 1 + o, y, 2, 1, "#2f8a5a");
    }
  }
  function orangeTree(g, x, by, t) {
    var sw = Math.round(Math.sin(t * 1.4 + x * 0.3) * 0.7);
    trunk(g, x, by, 8, "#6b4a2f", "#8a6540");
    blob(g, x - 5 + sw, by - 12, 4, 4, "#2f7d3a"); blob(g, x + 5 + sw, by - 12, 4, 4, "#2f7d3a");
    blob(g, x + sw, by - 16, 7, 7, "#3f9a45");
    blob(g, x - 2 + sw, by - 18, 4, 4, "#5cbc55");
    R(g, x - 4 + sw, by - 20, 3, 1, "#8be06f");
    R(g, x - 6 + sw, by - 9, 13, 1, "#2a6e35");
    var f = [[-5, -13], [3, -11], [-1, -17], [6, -15], [-4, -9]];
    f.forEach(function (p) { R(g, x + p[0] + sw, by + p[1], 2, 2, "#ff9a1f"); R(g, x + p[0] + sw, by + p[1], 1, 1, "#ffc24a"); });
  }
  /* جديد: زيتون */
  function olive(g, x, by, t) {
    var sw = Math.round(Math.sin(t * 1.3 + x * 0.3) * 0.7);
    R(g, x - 1, by - 6, 3, 6, "#6b5a45"); R(g, x - 2, by - 9, 2, 4, "#7d6a52"); R(g, x + 1, by - 10, 2, 5, "#6b5a45"); R(g, x - 2, by - 1, 5, 1, "#6b5a45");
    blob(g, x - 5 + sw, by - 13, 5, 3, "#7f9a63"); blob(g, x + 5 + sw, by - 14, 5, 3, "#8aa86d");
    blob(g, x + sw, by - 17, 7, 4, "#97b777"); blob(g, x - 2 + sw, by - 19, 4, 2, "#b4d08f");
    R(g, x - 7 + sw, by - 10, 13, 1, "#6d8452");
    R(g, x - 4 + sw, by - 12, 1, 1, "#2d3320"); R(g, x + 6 + sw, by - 13, 1, 1, "#2d3320"); R(g, x + 1 + sw, by - 15, 1, 1, "#2d3320"); R(g, x - 6 + sw, by - 15, 1, 1, "#2d3320");
    R(g, x + 3 + sw, by - 19, 2, 1, "#d6ebb2");
  }
  /* جديد: رمان */
  function pomegranate(g, x, by, t) {
    var sw = Math.round(Math.sin(t * 1.4 + x * 0.3) * 0.7);
    trunk(g, x, by, 8, "#6b4a2f", "#8a6540");
    blob(g, x - 5 + sw, by - 12, 4, 4, "#357a35"); blob(g, x + 5 + sw, by - 12, 4, 4, "#357a35");
    blob(g, x + sw, by - 16, 7, 7, "#44963f"); blob(g, x - 2 + sw, by - 18, 4, 4, "#62b653");
    R(g, x - 6 + sw, by - 9, 13, 1, "#2a6830");
    [[-5, -13], [3, -11], [-1, -17], [6, -15], [-3, -9]].forEach(function (p) {
      R(g, x + p[0] + sw, by + p[1], 3, 3, "#d63a2f"); R(g, x + p[0] + sw, by + p[1], 1, 1, "#ff8a7a"); R(g, x + p[0] + 1 + sw, by + p[1] - 1, 1, 1, "#8a1d17");
    });
  }
  /* جديد: حەمە (شجرة كلها ورد) */
  function hama(g, x, by, t) {
    var sw = Math.round(Math.sin(t * 1.4 + x * 0.3) * 0.7), i;
    var cols = ["#ff6b9a", "#ffd23f", "#ffffff", "#b78bff", "#ff7a45", "#ff4f6d"];
    trunk(g, x, by, 9, "#6b4a2f", "#8a6540");
    blob(g, x - 5 + sw, by - 13, 4, 4, "#3a8a44"); blob(g, x + 5 + sw, by - 13, 4, 4, "#3a8a44");
    blob(g, x + sw, by - 17, 7, 7, "#4aa04e");
    for (i = 0; i < 46; i++) {
      var dx = (hashn(i, 1) % 19) - 9, dy = (hashn(i, 2) % 19) - 9;
      if ((dx * dx) / 81 + (dy * dy) / 81 > 0.95) continue;
      var c = cols[hashn(i, 3) % 6], px = x + dx + sw, py = by - 17 + dy;
      R(g, px, py, 2, 2, c); R(g, px, py, 1, 1, "rgba(255,255,255,.55)");
      if (Math.floor(t * 2 + i) % 9 === 0) R(g, px, py - 1, 1, 1, "#ffffff");
    }
    R(g, x - 6 + sw, by - 10, 13, 1, "#2a6e35");
    falling(g, x, by, t, "#ffc2dc", 4);
  }
  function snowCap(g, key, x, by) {
    var id = key.split(":")[1], Wh = "#ffffff";
    if (id === "pine") { R(g, x - 1, by - 26, 3, 2, Wh); R(g, x - 4, by - 19, 9, 1, Wh); R(g, x - 6, by - 13, 13, 1, Wh); }
    else if (id === "palm") { R(g, x + 1, by - 17, 7, 1, Wh); R(g, x - 3, by - 15, 3, 1, Wh); }
    else if (id === "cactus") { R(g, x - 2, by - 19, 5, 1, Wh); R(g, x - 6, by - 15, 3, 1, Wh); R(g, x + 4, by - 13, 3, 1, Wh); }
    else if (id === "acacia") { R(g, x - 11, by - 19, 19, 1, Wh); R(g, x - 8, by - 20, 13, 1, Wh); }
    else if (id === "willow") { blob(g, x, by - 24, 6, 1, Wh); }
    else if (id === "cypress") { R(g, x - 1, by - 27, 3, 1, Wh); R(g, x - 2, by - 22, 5, 1, Wh); R(g, x - 3, by - 16, 7, 1, Wh); }
    else if (id === "bamboo") { R(g, x - 5, by - 21, 3, 1, Wh); R(g, x, by - 27, 3, 1, Wh); R(g, x + 5, by - 23, 3, 1, Wh); }
    else { blob(g, x, by - 24, 5, 1, Wh); R(g, x - 9, by - 18, 3, 1, Wh); R(g, x + 7, by - 18, 3, 1, Wh); R(g, x - 10, by - 14, 3, 1, Wh); R(g, x + 8, by - 14, 3, 1, Wh); }
  }

  /* ---------- الزهور (تاخذ خانة مثل الشجرة) ---------- */
  function planter(g, x, by) {
    R(g, x - 8, by - 4, 17, 4, "#9aa2ad"); R(g, x - 8, by - 4, 17, 1, "#c4cad2"); R(g, x - 8, by - 1, 17, 1, "#7d858f");
    R(g, x - 7, by - 6, 15, 2, "#6b4a2f");
  }
  function flowers(g, x, by, t) {
    var cols = ["#ff6b8a", "#ffd23f", "#ffffff", "#b78bff", "#ff9a4a"], xs = [-5, -2, 1, 4, 6], i;
    R(g, x - 7, by - 6, 15, 3, "#6b4a2f");
    for (i = 0; i < 5; i++) {
      var dx = Math.round(Math.sin(t * 1.6 + i) * 0.7), up = i % 2, hx = x + xs[i] + dx;
      R(g, x + xs[i], by - 9 - up, 1, 4 + up, "#3f8f45");
      R(g, hx - 1, by - 12 - up, 3, 2, cols[i]); R(g, hx, by - 13 - up, 1, 1, cols[i]);
      R(g, hx, by - 12 - up, 1, 1, cols[i] === "#ffd23f" ? "#ff9a4a" : "#ffd23f");
    }
    R(g, x - 8, by - 4, 17, 4, "#9aa2ad"); R(g, x - 8, by - 4, 17, 1, "#c4cad2"); R(g, x - 8, by - 1, 17, 1, "#7d858f");
  }
  function sunflowers(g, x, by, t) {
    var xs = [-5, 0, 5], hs = [13, 18, 15], i;
    planter(g, x, by);
    for (i = 0; i < 3; i++) {
      var dx = Math.round(Math.sin(t * 1.5 + i * 1.3) * 0.8), sx = x + xs[i], hy = by - 6 - hs[i], hx = sx + dx;
      R(g, sx, hy, 1, hs[i], "#3f8f45"); R(g, sx + 1, by - 10 - i, 2, 1, "#4fae55"); R(g, sx - 2, by - 12 - i, 2, 1, "#4fae55");
      R(g, hx - 2, hy - 2, 5, 5, "#ffd23f"); R(g, hx - 1, hy - 1, 3, 3, "#7a4a1e");
      R(g, hx - 3, hy, 1, 1, "#ffb81f"); R(g, hx + 3, hy, 1, 1, "#ffb81f"); R(g, hx, hy - 3, 1, 1, "#ffb81f"); R(g, hx, hy + 3, 1, 1, "#ffb81f");
    }
  }
  function tulips(g, x, by, t) {
    var cols = ["#ff5a7a", "#ffd23f", "#ff8fbf", "#b78bff", "#ff6b4a"], xs = [-6, -3, 0, 3, 6], hs = [8, 11, 9, 12, 8], i;
    planter(g, x, by);
    for (i = 0; i < 5; i++) {
      var dx = Math.round(Math.sin(t * 1.7 + i) * 0.7), sx = x + xs[i], hy = by - 6 - hs[i], hx = sx + dx, c = cols[i];
      R(g, sx, hy, 1, hs[i], "#3f8f45"); R(g, sx + (i % 2 ? 1 : -1), by - 8 - (i % 3), 1, 2, "#4fae55");
      R(g, hx - 1, hy - 2, 3, 3, c); R(g, hx - 2, hy - 3, 1, 2, c); R(g, hx + 2, hy - 3, 1, 2, c); R(g, hx, hy - 3, 1, 1, c);
      R(g, hx, hy - 1, 1, 1, "rgba(255,255,255,.5)");
    }
  }

  /* ---------- الديكور ---------- */
  function bench(g, x, by) {
    R(g, x - 6, by - 10, 2, 10, "#6b4a2f"); R(g, x + 4, by - 10, 2, 10, "#6b4a2f");
    R(g, x - 7, by - 10, 14, 2, "#c9955f"); R(g, x - 7, by - 8, 14, 1, "#a9784f");
    R(g, x - 7, by - 5, 14, 2, "#c9955f"); R(g, x - 7, by - 3, 14, 1, "#8a5e3a");
    R(g, x - 6, by - 1, 2, 1, "#4a3220"); R(g, x + 4, by - 1, 2, 1, "#4a3220");
  }
  function benchStone(g, x, by) {
    R(g, x - 6, by - 6, 3, 6, "#8d95a1"); R(g, x + 4, by - 6, 3, 6, "#8d95a1");
    R(g, x - 8, by - 9, 17, 3, "#b4bcc7"); R(g, x - 8, by - 9, 17, 1, "#d3d9e0"); R(g, x - 8, by - 7, 17, 1, "#8d95a1");
    R(g, x - 6, by - 8, 2, 1, "#6fa05a"); R(g, x + 3, by - 8, 3, 1, "#6fa05a");
    R(g, x - 5, by - 3, 1, 3, "#a3abb7"); R(g, x + 5, by - 4, 1, 4, "#a3abb7");
  }
  function benchPark(g, x, by) {
    var iron = "#2f3a3f", gr = "#4f9f5a", gl = "#7bc885", gd = "#3d8247";
    R(g, x - 7, by - 6, 2, 6, iron); R(g, x + 6, by - 6, 2, 6, iron);
    R(g, x - 8, by - 14, 1, 8, iron); R(g, x + 8, by - 14, 1, 8, iron);
    R(g, x - 8, by - 7, 17, 2, gr); R(g, x - 8, by - 7, 17, 1, gl); R(g, x - 8, by - 5, 17, 1, gd);
    R(g, x - 8, by - 14, 17, 2, gr); R(g, x - 8, by - 14, 17, 1, gl);
    R(g, x - 8, by - 11, 17, 2, gr); R(g, x - 8, by - 9, 17, 1, gd);
    R(g, x - 9, by - 9, 2, 1, iron); R(g, x + 8, by - 9, 2, 1, iron);
  }
  /* جديد: بنش جذع */
  function benchLog(g, x, by) {
    R(g, x - 8, by - 7, 17, 6, "#8a5e3a"); R(g, x - 8, by - 7, 17, 1, "#b58553"); R(g, x - 8, by - 2, 17, 1, "#5a3d27");
    R(g, x - 9, by - 6, 1, 4, "#d8b07a"); R(g, x + 9, by - 6, 1, 4, "#d8b07a"); R(g, x - 9, by - 5, 1, 2, "#a9784f"); R(g, x + 9, by - 5, 1, 2, "#a9784f");
    R(g, x - 5, by - 5, 3, 1, "#6b4a2f"); R(g, x + 1, by - 4, 4, 1, "#6b4a2f"); R(g, x - 1, by - 6, 2, 1, "#6b4a2f");
    R(g, x - 6, by - 1, 2, 1, "#4a3220"); R(g, x + 5, by - 1, 2, 1, "#4a3220");
    R(g, x + 4, by - 8, 3, 1, "#4a9a45"); R(g, x + 5, by - 9, 1, 1, "#ff6b8a");
  }
  function waterDrops(g, x, y0, y1, dx, t, n, seed) {
    for (var i = 0; i < n; i++) {
      var ph = (t * 1.3 + i / n + seed) % 1;
      R(g, x + dx * (0.4 + ph * 0.6), y0 + (y1 - y0) * ph * ph, 1, 1, "#cfeeff");
    }
  }
  function fountain(g, x, by, t) {
    blob(g, x, by - 2, 8, 3, "#8e97a3"); blob(g, x, by - 2, 6, 2, "#5fb0e6"); R(g, x - 5, by - 3, 3, 1, "#a8dcff");
    R(g, x - 1, by - 10, 3, 8, "#b9c0c8"); R(g, x, by - 10, 1, 8, "#d3d9df");
    blob(g, x, by - 11, 4, 1, "#8e97a3"); blob(g, x, by - 11, 3, 0, "#5fb0e6");
    for (var i = 0; i < 4; i++) {
      var ph = (t * 1.2 + i / 4) % 1, dx = (i - 1.5) * 3.2 * ph;
      R(g, x + dx, by - 13 + ph * ph * 11, 1, 1, "#cfeeff");
    }
    if (Math.floor(t * 2) % 2) R(g, x + 3, by - 3, 2, 1, "#cfeeff");
  }
  function fountainTier(g, x, by, t) {
    blob(g, x, by - 2, 9, 3, "#8e97a3"); blob(g, x, by - 2, 7, 2, "#5fb0e6"); R(g, x - 6, by - 3, 3, 1, "#a8dcff");
    R(g, x - 1, by - 9, 3, 7, "#b9c0c8"); R(g, x, by - 9, 1, 7, "#d3d9df");
    blob(g, x, by - 10, 6, 1, "#8e97a3"); blob(g, x, by - 10, 5, 0, "#5fb0e6");
    R(g, x - 1, by - 16, 3, 5, "#b9c0c8"); R(g, x, by - 16, 1, 5, "#d3d9df");
    blob(g, x, by - 17, 4, 1, "#8e97a3"); blob(g, x, by - 17, 3, 0, "#5fb0e6");
    R(g, x, by - 21, 1, 4, "#d3d9df"); R(g, x - 1, by - 21, 3, 1, "#b9c0c8");
    waterDrops(g, x, by - 17, by - 10, 5, t, 3, 0); waterDrops(g, x, by - 17, by - 10, -5, t, 3, 0.3);
    waterDrops(g, x, by - 10, by - 3, 7, t, 3, 0.1); waterDrops(g, x, by - 10, by - 3, -7, t, 3, 0.5);
    for (var i = 0; i < 3; i++) { var ph = (t * 1.4 + i / 3) % 1; R(g, x + (i - 1) * 2 * ph, by - 22 - (1 - ph) * 2 + ph * 4, 1, 1, "#cfeeff"); }
  }
  function fountainCat(g, x, by, t) {
    var st1 = "#c4cad2", st2 = "#e3e7ec", st3 = "#9aa2ad";
    blob(g, x, by - 2, 9, 3, "#8e97a3"); blob(g, x, by - 2, 7, 2, "#5fb0e6"); R(g, x - 6, by - 3, 3, 1, "#a8dcff");
    R(g, x - 5, by - 3, 11, 2, st3); R(g, x - 4, by - 9, 9, 6, "#b9c0c8"); R(g, x - 4, by - 9, 9, 1, "#d3d9df");
    R(g, x - 3, by - 15, 7, 6, st1); R(g, x - 3, by - 15, 1, 5, st2); R(g, x + 4, by - 13, 2, 4, st1);
    R(g, x - 3, by - 20, 7, 5, st1); R(g, x - 3, by - 22, 2, 2, st1); R(g, x + 2, by - 22, 2, 2, st1);
    R(g, x - 2, by - 18, 1, 1, "#6b7380"); R(g, x + 2, by - 18, 1, 1, "#6b7380"); R(g, x, by - 17, 1, 1, st3);
    waterDrops(g, x + 3, by - 8, by - 3, 6, t, 4, 0); waterDrops(g, x - 3, by - 8, by - 3, -6, t, 4, 0.4);
    R(g, x + 4, by - 8, 1, 1, "#cfeeff"); R(g, x - 4, by - 8, 1, 1, "#cfeeff");
  }
  function lamp(g, x, by, t) {
    var fl = 0.85 + Math.sin(t * 3 + x) * 0.1, ng = night();
    blob(g, x, by - 21, ng ? 10 : 6, ng ? 8 : 5, "rgba(255,226,110," + (ng ? 0.22 * fl : 0.12 * fl).toFixed(2) + ")");
    R(g, x - 2, by - 2, 5, 2, "#2b343c"); R(g, x - 1, by - 18, 3, 16, "#3a4650"); R(g, x, by - 18, 1, 16, "#526270");
    R(g, x - 3, by - 24, 7, 6, "#2b343c"); R(g, x - 2, by - 23, 5, 4, "#ffe98a"); R(g, x - 1, by - 22, 2, 2, "#fff8cc");
    R(g, x - 4, by - 26, 9, 2, "#2b343c"); R(g, x - 2, by - 27, 5, 1, "#2b343c"); R(g, x, by - 28, 1, 1, "#2b343c");
  }
  function tent(g, x, by) {
    var i, w, dw;
    R(g, x, by - 18, 1, 4, "#6b4a2f"); R(g, x + 1, by - 18, 3, 2, "#ffd23f");
    for (i = 0; i < 14; i++) {
      w = Math.round(10 * (i + 1) / 14);
      R(g, x - w, by - 14 + i, w, 1, (i % 5 === 4) ? "#f6d6a8" : "#e8644a");
      R(g, x, by - 14 + i, w + 1, 1, (i % 5 === 4) ? "#d9b98a" : "#c64a33");
    }
    for (i = 0; i < 8; i++) { dw = Math.round(3 * (i + 1) / 8); R(g, x - dw, by - 8 + i, dw * 2 + 1, 1, i < 2 ? "#4a2c1c" : "#3a2418"); }
  }
  function signpost(g, x, by) {
    R(g, x - 1, by - 20, 3, 20, "#6b4a2f"); R(g, x, by - 20, 1, 20, "#8a6540");
    R(g, x - 6, by - 18, 11, 4, "#c9955f"); R(g, x - 8, by - 17, 2, 2, "#c9955f"); R(g, x - 6, by - 18, 11, 1, "#e3b57c"); R(g, x - 6, by - 15, 11, 1, "#8a5e3a"); R(g, x - 4, by - 17, 5, 1, "#5a3d27");
    R(g, x - 1, by - 12, 11, 4, "#b8854f"); R(g, x + 10, by - 11, 2, 2, "#b8854f"); R(g, x - 1, by - 12, 11, 1, "#d8a56c"); R(g, x - 1, by - 9, 11, 1, "#8a5e3a"); R(g, x + 2, by - 11, 5, 1, "#5a3d27");
    R(g, x - 3, by - 1, 7, 1, "#5a3d27");
  }
  function campfire(g, x, by, t) {
    var f = Math.floor(t * 8) % 3;
    if (night()) blob(g, x, by - 6, 10, 6, "rgba(255,160,40,.14)");
    R(g, x - 7, by - 2, 3, 2, "#8d95a1"); R(g, x - 4, by - 1, 2, 1, "#a3abb7"); R(g, x + 3, by - 1, 2, 1, "#a3abb7"); R(g, x + 5, by - 2, 3, 2, "#8d95a1");
    R(g, x - 5, by - 3, 10, 2, "#6b4a2f"); R(g, x - 4, by - 4, 3, 1, "#5a3d27"); R(g, x + 2, by - 4, 3, 1, "#5a3d27"); R(g, x - 5, by - 3, 10, 1, "#8a6540");
    R(g, x - 3, by - 6, 7, 3, "#e8501a"); R(g, x - 2, by - 9, 5, 3, "#ff8a1f");
    R(g, x - 1, by - 12 - (f === 1 ? 1 : 0), 3, 3 + (f === 1 ? 1 : 0), "#ffd23f"); R(g, x, by - 13 - (f === 2 ? 1 : 0), 1, 2, "#fff3b0");
    if (f === 0) R(g, x - 4, by - 8, 1, 2, "#ff8a1f");
    if (f === 2) R(g, x + 4, by - 8, 1, 2, "#ff8a1f");
    var ph = (t * 1.5) % 1;
    R(g, x + Math.round(Math.sin(t * 3) * 3), by - 14 - Math.round(ph * 8), 1, 1, "#ffd23f");
  }
  function haystack(g, x, by) {
    var i;
    blob(g, x, by - 5, 9, 5, "#e0bb52");
    for (i = 0; i < 5; i++) R(g, x - 8 + i * 4, by - 7 + ((i * 3) % 4), 3, 1, "#bf9a36");
    R(g, x - 4, by - 9, 5, 1, "#f2d77f");
    R(g, x - 9, by - 4, 19, 1, "#a8832c");
    R(g, x - 8, by - 1, 17, 1, "#a8832c");
  }
  /* جديد: بئر */
  function well(g, x, by) {
    R(g, x - 7, by - 8, 15, 8, "#9aa2ad"); R(g, x - 7, by - 8, 15, 1, "#c4cad2"); R(g, x - 7, by - 1, 15, 1, "#7d858f");
    R(g, x - 5, by - 5, 3, 1, "#7d858f"); R(g, x + 1, by - 3, 3, 1, "#7d858f"); R(g, x - 2, by - 7, 3, 1, "#7d858f"); R(g, x + 4, by - 6, 2, 1, "#7d858f");
    R(g, x - 6, by - 18, 2, 10, "#6b4a2f"); R(g, x + 5, by - 18, 2, 10, "#6b4a2f");
    R(g, x - 8, by - 20, 17, 2, "#b5533c"); R(g, x - 6, by - 22, 13, 2, "#c9644a"); R(g, x - 3, by - 24, 7, 2, "#d9755a");
    R(g, x, by - 18, 1, 6, "#d8c28a"); R(g, x - 1, by - 12, 3, 3, "#8a5e3a"); R(g, x - 1, by - 12, 3, 1, "#b58553");
  }
  /* جديد: أرجوحة */
  function swing(g, x, by, t) {
    var s = Math.round(Math.sin(t * 2) * 2);
    R(g, x - 9, by - 18, 2, 18, "#6b4a2f"); R(g, x + 8, by - 18, 2, 18, "#6b4a2f"); R(g, x - 9, by - 19, 20, 2, "#8a6540");
    R(g, x - 4 + s, by - 17, 1, 10, "#d8c28a"); R(g, x + 4 + s, by - 17, 1, 10, "#d8c28a");
    R(g, x - 5 + s, by - 7, 11, 2, "#c9955f"); R(g, x - 5 + s, by - 5, 11, 1, "#8a5e3a");
    R(g, x - 10, by - 1, 4, 1, "#4a3220"); R(g, x + 7, by - 1, 4, 1, "#4a3220");
  }

  /* ---------- القطط ---------- */
  var CATS = {
    white: { bh: 8, hw: 8, c: "#ffffff", s: "#dde2ea", belly: null, top: "#c9a27a", tail: "#5e4636", mark: null,
      eye: "#e3a02e", blush: "#f6b3c0", style: "shiro" },
    orange: { bh: 11, hw: 9, c: "#ef9b3d", s: "#c2711f", belly: "#ffdca6", top: "#dc8528", tail: "#e58c2f", mark: "#b8601a",
      eye: "#6fc86f", blush: "#ffb98a", style: "tahseen" },
    black: { bh: 8, hw: 8, c: "#4a4552", s: "#2b2730", belly: null, top: "#3a3540", tail: "#4a4552", mark: null,
      eye: "#f2c94c", blush: "#7b5a6c", rim: "#6f697c", style: "plain" },
    gray: { bh: 8, hw: 8, c: "#aab0ba", s: "#7a808b", belly: "#cfd4db", top: "#8a909b", tail: "#8a909b", mark: "#6c727d",
      eye: "#6fc86f", blush: "#e6a6b4", style: "tabby" },
    /* مينا: بيضاء بالكامل، شعر كثيف، عيون زرقة، أنف وفم وردي */
    mina: { bh: 10, hw: 9, c: "#ffffff", s: "#d9e3f2", belly: "#f4f8ff", top: "#f6f9ff", tail: "#ffffff", mark: null,
      eye: "#3d9bff", blush: "#ffb8cc", nose: "#ff8fb1", mouth: "#ff8fb1", fluff: true, style: "mina" },
    /* زعبورة: قطة هملايا، جسم كريمي تبني، قناع وأذان وذيل بني غامق، عيون زرق فاتحة، شعر كثيف */
    zaboura: { bh: 10, hw: 9, c: "#cdaa84", s: "#a88660", belly: "#ecdcc2", top: "#4a2f22", tail: "#4f3326", mark: null,
      mask: "#5a3a2a", eye: "#9ccaf5", blush: "#6e4a36", nose: "#2a1a14", mouth: "#2a1a14", fluff: true, style: "point" }
  };
  function heart(g, hx, hy, c) { R(g, hx, hy, 1, 1, c); R(g, hx + 2, hy, 1, 1, c); R(g, hx, hy + 1, 3, 1, c); R(g, hx + 1, hy + 2, 1, 1, c); }
  function catSleep(g, x, by, t, k) {
    var bh = k.bh + 3, breath = Math.floor(t * 1.5) % 2, K = "#1b1410", i;
    var NS = k.nose || "#ec7f95";
    if (k.fluff) blob(g, x, by - 4, bh + 1, 5 + breath, k.s);
    blob(g, x, by - 4, bh, 4 + breath, k.c);
    R(g, x - bh + 3, by - 1, 2 * bh - 5, 1, k.s);
    if (k.belly) R(g, x - 3, by - 3, 7, 2, k.belly);
    if (k.mark) { R(g, x - 1, by - 9 - breath, 1, 3, k.mark); R(g, x + 3, by - 8 - breath, 1, 3, k.mark); R(g, x + 6, by - 7, 1, 2, k.mark); }
    var hx = x - bh + 3;
    if (k.fluff) blob(g, hx, by - 5, 7, 5, k.s);
    blob(g, hx, by - 5, 6, 4, k.c);
    R(g, hx - 5, by - 10, 2, 2, k.top); R(g, hx + 4, by - 10, 2, 2, k.top); R(g, hx - 5, by - 9, 1, 1, "#f3a1ae"); R(g, hx + 5, by - 9, 1, 1, "#f3a1ae");
    if (k.mask) blob(g, hx, by - 4, 4, 3, k.mask);
    R(g, hx - 3, by - 5, 2, 1, K); R(g, hx + 2, by - 5, 2, 1, K);
    R(g, hx - 1, by - 3, 2, 1, NS);
    R(g, hx - 7, by - 3, 1, 1, "#f4f6fa"); R(g, hx + 7, by - 3, 1, 1, "#f4f6fa");
    R(g, hx - 3, by - 1, 3, 1, k.c); R(g, hx + 1, by - 1, 3, 1, k.c);
    R(g, x + bh - 1, by - 4, 4, 2, k.tail); R(g, x + bh + 2, by - 6, 2, 3, k.tail);
    for (i = 0; i < 3; i++) {
      var ph = (t * 0.55 + i / 3) % 1, zx = hx + 6 + ph * 7, zy = by - 12 - ph * 10, zc = "rgba(235,242,255," + (1 - ph * 0.7).toFixed(2) + ")";
      R(g, zx, zy, 3, 1, zc); R(g, zx + 2, zy + 1, 1, 1, zc); R(g, zx + 1, zy + 2, 1, 1, zc); R(g, zx, zy + 3, 3, 1, zc);
    }
  }
  function cat(g, x, by, t, k, mode) {
    if (mode === "sleep") { catSleep(g, x, by, t, k); return; }
    var purr = mode === "purr";
    if (purr && Math.floor(t * 22) % 2) x += 1;
    var bh = k.bh, hw = k.hw, ex = hw - 3, i;
    var wag = Math.floor(t * (purr ? 7 : 2.2)) % 2, blink = purr || (t % 4.3) < 0.16, twitch = (t % 7) < 0.25 ? 1 : 0;
    var K = "#1b1410", WH = "#f2f4f8", PK = "#f3a1ae", NS = k.nose || "#ec7f95", MO = k.mouth || "#7a4a55";
    function r(dx, dy, w, h, c) { R(g, x + dx, by + dy, w, h, c); }
    function m(dx, dy, w, h, c) { R(g, x - dx - w + 1, by + dy, w, h, c); }
    r(bh - 1, -3, 4, 2, k.tail); r(bh + 2, -12 + wag, 2, 10 - wag, k.tail); r(bh + 1, -13 + wag, 2, 1, k.tail);
    if (k.mark && k.style === "tahseen") { r(bh + 2, -9 + wag, 2, 1, k.mark); r(bh + 2, -6, 2, 1, k.mark); r(bh + 1, -13 + wag, 2, 1, k.mark); }
    if (k.fluff) { blob(g, x, by - 6, bh + 1, 6, k.s); r(bh, -4 + wag, 3, 3, k.c); r(bh + 3, -13 + wag, 2, 3, k.c); }
    blob(g, x, by - 6, bh, 5, k.c);
    r(-(bh - 2), -1, 2 * (bh - 2) + 1, 1, k.s);
    if (k.belly) blob(g, x, by - 5, bh - 5, 3, k.belly);
    if (k.mark && k.style === "tahseen") {
      r(-bh + 1, -9, 3, 1, k.mark); r(-bh + 1, -6, 3, 1, k.mark); r(-bh + 1, -3, 2, 1, k.mark);
      m(-bh + 1, -9, 3, 1, k.mark); m(-bh + 1, -6, 3, 1, k.mark); m(-bh + 1, -3, 2, 1, k.mark);
    }
    if (k.fluff) {
      r(-bh - 1, -5, 2, 2, k.c); m(-bh - 1, -5, 2, 2, k.c); r(-bh + 1, 0, 2, 1, k.c); m(-bh + 1, 0, 2, 1, k.c);
      r(-4, -3, 1, 1, k.s); r(2, -4, 1, 1, k.s); r(-6, -7, 1, 2, k.s); m(-6, -8, 1, 2, k.s);
    }
    r(-5, -3, 4, 3, k.c); m(-5, -3, 4, 3, k.c);
    r(0, -4, 1, 3, k.s);
    r(-5, -1, 4, 1, k.s); m(-5, -1, 4, 1, k.s);
    r(-4, -2, 1, 1, k.s); r(-2, -2, 1, 1, k.s); m(-4, -2, 1, 1, k.s); m(-2, -2, 1, 1, k.s);
    for (i = 0; i < 5; i++) { r(-hw + 1, -23 + i, i + 1, 1, k.top); m(-hw + 1, -23 + i + twitch, i + 1, 1, k.top); }
    r(-hw + 2, -21, 1, 2, PK); m(-hw + 2, -21 + twitch, 1, 2, PK);
    if (k.fluff) { blob(g, x, by - 15, hw + 1, 7, k.s); r(-hw - 2, -14, 2, 4, k.c); m(-hw - 2, -14, 2, 4, k.c); r(-3, -23, 3, 1, k.c); r(1, -23, 2, 1, k.c); }
    blob(g, x, by - 15, hw, 6, k.c);
    r(-hw - 1, -14, 1, 4, k.c); m(-hw - 1, -14, 1, 4, k.c);
    if (k.rim) r(-4, -21, 9, 1, k.rim);
    if (k.style === "shiro") {
      r(-3, -21, 7, 1, k.top); r(-5, -20, 11, 1, k.top); r(-6, -19, 13, 1, k.top); r(-4, -18, 9, 1, k.top);
      r(3, -20, 3, 3, k.tail);
    } else if (k.style === "tahseen") {
      r(-3, -21, 7, 1, k.top); r(-5, -20, 11, 1, k.top);
      r(0, -21, 1, 4, k.mark); r(-3, -20, 1, 3, k.mark); r(3, -20, 1, 3, k.mark); r(-6, -18, 1, 2, k.mark); m(-6, -18, 1, 2, k.mark);
    } else if (k.style === "tabby") {
      r(0, -21, 1, 3, k.mark); r(-2, -20, 1, 2, k.mark); r(2, -20, 1, 2, k.mark);
    } else if (k.style === "point") {
      blob(g, x, by - 13, 6, 4, k.mask); r(-1, -20, 3, 3, k.mask); r(-2, -18, 5, 2, k.mask);
      blob(g, x, by - 9, 3, 1, "#7a5640");
    } else if (k.style === "mina") {
      r(-4, -21, 9, 1, k.top); r(-6, -19, 2, 1, k.s); r(5, -19, 2, 1, k.s); r(-2, -18, 1, 1, k.s); r(2, -18, 1, 1, k.s);
    }
    if (k.belly) blob(g, x, by - 11, 4, 2, k.belly);
    if (blink) {
      r(-ex, -15, 3, 1, K); m(-ex, -15, 3, 1, K);
      if (purr) { r(-ex, -16, 1, 1, K); r(-ex + 2, -16, 1, 1, K); m(-ex, -16, 1, 1, K); m(-ex + 2, -16, 1, 1, K); }
    } else {
      r(-ex, -16, 3, 3, k.eye); m(-ex, -16, 3, 3, k.eye);
      r(-ex + 1, -16, 1, 3, K); m(-ex + 1, -16, 1, 3, K);
      r(-ex, -16, 1, 1, WH); m(-ex, -16, 1, 1, WH);
    }
    r(-1, -12, 3, 1, NS); r(0, -11, 1, 1, NS);
    r(0, -10, 1, 1, MO); r(-1, -9, 1, 1, MO); r(1, -9, 1, 1, MO);
    r(-3, -11, 1, 1, k.s); m(-3, -11, 1, 1, k.s);
    r(-hw + 2, -12, 2, 1, k.blush); m(-hw + 2, -12, 2, 1, k.blush);
    var wh = "#f4f6fa";
    r(-hw - 4, -12, 4, 1, wh); m(-hw - 4, -12, 4, 1, wh);
    r(-hw - 3, -14, 3, 1, wh); m(-hw - 3, -14, 3, 1, wh); r(-hw - 4, -15, 1, 1, wh); m(-hw - 4, -15, 1, 1, wh);
    r(-hw - 3, -10, 3, 1, wh); m(-hw - 3, -10, 3, 1, wh); r(-hw - 4, -9, 1, 1, wh); m(-hw - 4, -9, 1, 1, wh);
    if (purr) {
      for (i = 0; i < 2; i++) {
        var ph = (t * 1.3 + i / 2) % 1;
        heart(g, x + (i ? 5 : -7) + Math.round(Math.sin(t * 4 + i) * 1), by - 26 - ph * 10, "rgba(255,110,150," + (1 - ph * 0.6).toFixed(2) + ")");
      }
    }
  }
  function catDraw(key) { return function (g, x, by, t, mode) { cat(g, x, by, t, CATS[key], mode); }; }

  var ITEMS = {
    "tree:oak": { draw: oak, free: true }, "tree:pine": { draw: pine }, "tree:birch": { draw: birch }, "tree:palm": { draw: palm },
    "tree:maple": { draw: maple }, "tree:cherry": { draw: cherry }, "tree:willow": { draw: willow },
    "tree:cactus": { draw: cactus }, "tree:acacia": { draw: acacia },
    "tree:bamboo": { draw: bamboo }, "tree:cypress": { draw: cypress }, "tree:orange": { draw: orangeTree },
    "tree:olive": { draw: olive }, "tree:pomegranate": { draw: pomegranate }, "tree:hama": { draw: hama },
    "deco:bench": { draw: bench }, "deco:bench_stone": { draw: benchStone }, "deco:bench_park": { draw: benchPark }, "deco:bench_log": { draw: benchLog },
    "deco:fountain": { draw: fountain }, "deco:fountain_tier": { draw: fountainTier }, "deco:fountain_cat": { draw: fountainCat },
    "deco:lamp": { draw: lamp }, "deco:flowers": { draw: flowers }, "deco:sunflowers": { draw: sunflowers }, "deco:tulips": { draw: tulips },
    "deco:tent": { draw: tent }, "deco:signpost": { draw: signpost }, "deco:campfire": { draw: campfire }, "deco:haystack": { draw: haystack },
    "deco:well": { draw: well }, "deco:swing": { draw: swing },
    "cat:white": { draw: catDraw("white") }, "cat:orange": { draw: catDraw("orange") }, "cat:black": { draw: catDraw("black") },
    "cat:gray": { draw: catDraw("gray") }, "cat:mina": { draw: catDraw("mina") }, "cat:zaboura": { draw: catDraw("zaboura") }
  };
  var TREE_KEYS = ["tree:oak", "tree:pine", "tree:birch", "tree:palm", "tree:maple", "tree:cherry", "tree:willow", "tree:cactus", "tree:acacia",
    "tree:bamboo", "tree:cypress", "tree:orange", "tree:olive", "tree:pomegranate", "tree:hama"];
  var FLOWER_KEYS = ["deco:flowers", "deco:sunflowers", "deco:tulips"];
  var BENCH_KEYS = ["deco:bench", "deco:bench_stone", "deco:bench_park", "deco:bench_log"];
  var FOUNTAIN_KEYS = ["deco:fountain", "deco:fountain_tier", "deco:fountain_cat"];
  var DECOR_KEYS = ["deco:lamp", "deco:tent", "deco:signpost", "deco:campfire", "deco:haystack", "deco:well", "deco:swing"];
  var CAT_KEYS = ["cat:white", "cat:orange", "cat:black", "cat:gray", "cat:mina", "cat:zaboura"];
  var BIOME_KEYS = ["biome:spring", "biome:snow", "biome:desert"];
  var LAKE_KEYS = ["lake:2", "lake:3"];

  /* نوع العنصر: t = خانة شجرة/زهور، bench، fountain، decor، cat */
  function kindOf(key) {
    if (key.indexOf("tree:") === 0 || FLOWER_KEYS.indexOf(key) >= 0) return "t";
    if (key.indexOf("cat:") === 0) return "cat";
    if (BENCH_KEYS.indexOf(key) >= 0) return "bench";
    if (FOUNTAIN_KEYS.indexOf(key) >= 0) return "fountain";
    return "decor";
  }
  function fits(spot, key) { var k = kindOf(key); return spot.k === k || (spot.k === "water" && k === "fountain"); }
  function isTree(key) { return key.indexOf("tree:") === 0; }
  function drawItem(g, key, x, by, t, mode) {
    if (!ITEMS[key]) return;
    ITEMS[key].draw(g, x, by, t, mode);
    if (snowOn && isTree(key)) snowCap(g, key, x, by);
  }
  function isFree(key) { return !!(ITEMS[key] && ITEMS[key].free); }
  function has(key) { return st.owned.indexOf(key) >= 0; }
  function allowed(key) { return isFree(key) || has(key); }
  function ownsKind(k) {
    if (k === "water") k = "fountain";
    return st.owned.some(function (o) { return ITEMS[o] && kindOf(o) === k; });
  }
  function spotVisible(i) {
    var s = EXTRA[i];
    if (s.need && st.lake < s.need) return false;
    return !!st.layout.extras[i] || ownsKind(s.k);
  }
  function mapOf(k) { return k === "t" ? st.layout.slots : st.layout.extras; }
  function itemAt(h) { return h ? (mapOf(h.k)[h.i] || null) : null; }
  function placedCount(key) {
    var m = mapOf(kindOf(key) === "t" ? "t" : "e"), n = 0;
    Object.keys(m).forEach(function (k) { if (m[k] === key) n++; });
    return n;
  }

  /* ---------- المعاينات (للماركت وأزرار البيئة) ---------- */
  function biomePreview(biome, w, h) {
    var c = groundCanvas(biome, w, h), g = c.getContext("2d"), p = pal(biome), prev = snowOn;
    lakeAt(g, w >> 1, h - 9, { rx: 8, ry: 3 }, 1.3, p, biome);
    snowOn = biome === "snow";
    var a = { autumn: ["tree:maple", "tree:oak"], spring: ["tree:cherry", "tree:oak"], snow: ["tree:pine", "tree:oak"], desert: ["tree:cactus", "tree:palm"] }[biome] || ["tree:oak", "tree:oak"];
    drawItem(g, a[0], 8, h - 3, 1.3); drawItem(g, a[1], w - 8, h - 3, 1.3);
    snowOn = prev;
    return c;
  }
  function preview(key, scale) {
    var parts = String(key).split(":"), kind = parts[0];
    var w = 26, h = 30, c = document.createElement("canvas"), g0;
    if (kind === "lake") { w = 64; h = 34; }
    else if (kind === "cat") w = 36;
    else if (kind === "biome") { w = 44; h = 30; }
    if (kind === "biome") c = biomePreview(parts[1], w, h);
    else {
      c.width = w; c.height = h;
      g0 = c.getContext("2d");
      if (kind === "lake") lakeAt(g0, 32, 17, LAKES[Number(parts[1]) - 1], 1.3, pal("autumn"), "autumn");
      else drawItem(g0, key, w >> 1, 28, 1.3);
    }
    var b = document.createElement("canvas");
    b.width = w * scale; b.height = h * scale;
    var g = b.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(c, 0, 0, b.width, b.height);
    b.style.imageRendering = "pixelated";
    return b;
  }

  /* ---------- المشهد ---------- */
  function lakeAt(g, cx, cy, Lk, t, p, biome) {
    var y, tt, w, i;
    for (y = -Lk.ry - 1; y <= Lk.ry + 1; y++) {
      tt = y / (Lk.ry + 1.5);
      w = Math.round((Lk.rx + 2) * Math.sqrt(Math.max(0, 1 - tt * tt)));
      R(g, cx - w, cy + y, w * 2 + 1, 1, p.shore);
    }
    for (y = -Lk.ry; y <= Lk.ry; y++) {
      tt = y / (Lk.ry + 0.5);
      w = Math.round(Lk.rx * Math.sqrt(Math.max(0, 1 - tt * tt)));
      R(g, cx - w, cy + y, w * 2 + 1, 1, y < -Lk.ry * 0.3 ? p.lake2 : p.lake);
    }
    for (i = 0; i < 6; i++) {
      var sx = cx + Math.round((((i * 37) % 100) / 100 - 0.5) * Lk.rx * 1.3);
      var sy = cy + Math.round((((i * 53) % 100) / 100 - 0.5) * Lk.ry * 1.0);
      if (Math.floor(t * 1.5 + i) % 3 === 0) R(g, sx, sy, 2, 1, p.hi);
    }
    if (biome === "snow") {
      var rx = Lk.rx, c2 = "#ffffff";
      R(g, cx - Math.round(rx * 0.5), cy - 1, Math.round(rx * 0.4), 1, c2); R(g, cx - Math.round(rx * 0.2), cy, 1, 2, c2);
      R(g, cx + 2, cy - 2, Math.round(rx * 0.45), 1, c2); R(g, cx + Math.round(rx * 0.45) + 2, cy - 1, 1, 2, c2);
    } else if (biome === "desert") {
      var rx0 = cx + Lk.rx - 3, ry0 = cy + Math.round(Lk.ry * 0.5);
      R(g, rx0, ry0 - 4, 1, 4, "#5f8a2e"); R(g, rx0 + 1, ry0 - 5, 1, 5, "#7ca83a"); R(g, rx0 + 2, ry0 - 3, 1, 3, "#5f8a2e"); R(g, rx0 + 1, ry0 - 6, 1, 1, "#8a5a2a");
    } else {
      var lx = cx + Math.round(Lk.rx * 0.4), ly = cy + 1;
      blob(g, lx, ly, 3, 1, "#3f9a45"); R(g, lx + 1, ly - 1, 1, 1, biome === "autumn" ? "#f5a14a" : "#f7bfd5");
    }
  }
  function curLake() { return LAKES[Math.max(1, Math.min(3, st.lake || 1)) - 1]; }
  function drawLake(t, p) { lakeAt(ctx, LAKE_CX, LAKE_CY, curLake(), t, p, st.biome); }
  /* سمك يسبح بالبحيرة */
  function drawFish(t) {
    if (st.biome === "snow") return;
    var Lk = curLake(), cols = ["#ff9a3d", "#ffd23f", "#ffffff", "#ff6b6b", "#ffa94d"], n = 3 + (st.lake || 1), i;
    for (i = 0; i < n; i++) {
      var ang = t * (0.32 + i * 0.07) + i * 1.9, k = 0.5 + (i % 3) * 0.14;
      var fx = LAKE_CX + Math.cos(ang) * (Lk.rx - 4) * k, fy = LAKE_CY + Math.sin(ang) * (Lk.ry - 2) * k;
      var dir = -Math.sin(ang) >= 0 ? 1 : -1, c = cols[i % cols.length];
      R(ctx, fx - 1, fy, 3, 1, c); R(ctx, fx - 2 * dir, fy - 1, 1, 3, c); R(ctx, fx + dir, fy, 1, 1, "#222222");
      if (i % 2 === 0) R(ctx, fx, fy - 1, 1, 1, c);
    }
  }
  function drawLock(x, by) {
    blob(ctx, x, by, 6, 2, "rgba(0,0,0,.2)");
    R(ctx, x - 2, by - 10, 5, 1, "#6f6f78"); R(ctx, x - 2, by - 9, 1, 3, "#6f6f78"); R(ctx, x + 2, by - 9, 1, 3, "#6f6f78");
    R(ctx, x - 3, by - 7, 7, 5, "#8a8a95"); R(ctx, x - 3, by - 7, 7, 1, "#a8a8b3"); R(ctx, x, by - 5, 1, 2, "#4a4a52");
  }
  function drawDots(x, by) { R(ctx, x - 1, by - 1, 3, 1, "rgba(0,0,0,.16)"); R(ctx, x, by - 2, 1, 3, "rgba(0,0,0,.16)"); }
  function drawSel(x, by, t) {
    if (Math.floor(t * 3) % 2) return;
    var c = "#ffd23f", x0 = x - 10, x1 = x + 10, y0 = by - 27, y1 = by + 4;
    R(ctx, x0, y0, 4, 1, c); R(ctx, x0, y0, 1, 4, c); R(ctx, x1 - 3, y0, 4, 1, c); R(ctx, x1, y0, 1, 4, c);
    R(ctx, x0, y1, 4, 1, c); R(ctx, x0, y1 - 3, 1, 4, c); R(ctx, x1 - 3, y1, 4, 1, c); R(ctx, x1, y1 - 3, 1, 4, c);
  }
  function drawTarget(x, by, t) {
    var c = Math.floor(t * 5) % 2 ? "rgba(255,210,63,.95)" : "rgba(255,255,255,.9)";
    R(ctx, x - 7, by, 15, 1, c); R(ctx, x - 5, by + 1, 11, 1, c); R(ctx, x - 5, by - 1, 11, 1, c);
  }
  function selIs(k, i) { return !!st.sel && st.sel.k === k && st.sel.i === i; }
  function selItem() { return st.sel ? itemAt(st.sel) : null; }
  function isDragFrom(k, i) { return !!st.drag && st.drag.from.k === k && st.drag.from.i === i; }
  function sceneList() {
    var list = [];
    SLOTS.forEach(function (sl, i) { list.push({ y: sl[1], x: sl[0], slot: i }); });
    EXTRA.forEach(function (sp, i) { list.push({ y: sp.y, x: sp.x, ex: i }); });
    list.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
    return list;
  }
  var SHADOW = { "deco:lamp": 4, "deco:signpost": 5, "deco:campfire": 7, "deco:haystack": 9, "deco:tent": 11, "deco:well": 9, "deco:swing": 11 };
  function shadowR(key) {
    if (key.indexOf("cat:") === 0) return CATS[key.split(":")[1]].bh + 2;
    if (SHADOW[key]) return SHADOW[key];
    if (key.indexOf("fountain") > 0) return 10;
    return 9;
  }
  /* حالة القطة: تخرخر أو نايمة */
  function catMode(i, now) {
    var a = st.cats[i];
    if (!a) return null;
    if (a.sleepUntil > now) return "sleep";
    if (a.purrUntil > now) return "purr";
    return null;
  }
  function petCat(i) {
    var now = performance.now() / 1000, a = st.cats[i] || (st.cats[i] = { taps: 0, last: 0, purrUntil: 0, sleepUntil: 0 });
    if (a.sleepUntil > now) return;
    if (now - a.last > 3) a.taps = 0;
    a.last = now; a.taps++;
    if (a.taps >= 5) { a.sleepUntil = now + 5; a.purrUntil = 0; a.taps = 0; }
    else a.purrUntil = now + 2.5;
  }
  function particles(t, b) {
    var i, x, y, sp, c;
    if (b === "snow") {
      for (i = 0; i < 48; i++) {
        sp = 5 + hashn(i, 11) % 7;
        y = (t * sp + hashn(i, 13) % H) % H;
        x = (hashn(i, 7) % W) + Math.sin(t * 0.7 + i) * 3;
        c = i % 6 === 0 ? 2 : 1;
        R(ctx, x, y, c, c, "#ffffff");
      }
    } else if (b === "spring") {
      for (i = 0; i < 12; i++) {
        sp = 3 + hashn(i, 5) % 4;
        y = (t * sp + hashn(i, 9) % H) % H;
        x = (hashn(i, 3) % W) + Math.sin(t * 0.9 + i * 1.7) * 6;
        R(ctx, x, y, 2, 1, i % 2 ? "#ffc2dc" : "#ffffff");
      }
      for (i = 0; i < 3; i++) {
        var bx = W / 2 + Math.sin(t * 0.35 + i * 2.1) * 70, by = 28 + i * 30 + Math.sin(t * 0.9 + i) * 9;
        var col = ["#ff8fbf", "#ffd23f", "#8fd0ff"][i];
        R(ctx, bx, by, 1, 2, "#3a2a30");
        if (Math.floor(t * 7 + i) % 2) { R(ctx, bx - 2, by - 1, 2, 2, col); R(ctx, bx + 1, by - 1, 2, 2, col); }
        else { R(ctx, bx - 1, by, 1, 1, col); R(ctx, bx + 1, by, 1, 1, col); }
      }
    } else if (b === "desert") {
      for (i = 0; i < 14; i++) {
        x = ((t * (7 + hashn(i, 3) % 6) + hashn(i, 9) % W) % (W + 10)) - 5;
        y = 20 + hashn(i, 5) % (H - 30) + Math.sin(t * 1.3 + i) * 2;
        R(ctx, x, y, 2, 1, "rgba(255,238,190,.75)");
      }
    } else {
      var lc = pal("autumn").leaf;
      for (i = 0; i < 9; i++) {
        sp = 4 + hashn(i, 5) % 4;
        y = (t * sp + hashn(i, 9) % H) % H;
        x = (hashn(i, 3) % W) + Math.sin(t * 1.1 + i * 1.9) * 7;
        R(ctx, x, y, 2, 1, lc[i % 3]);
        if (i % 2) R(ctx, x + 1, y + 1, 1, 1, lc[(i + 1) % 3]);
      }
    }
  }
  /* أماكن الإفلات الصالحة للعنصر اللي ينسحب */
  function validTargets(d) {
    var kind = kindOf(d.key), out = [];
    if (kind === "t") SLOTS.forEach(function (s, i) { if (i < st.slots) out.push({ k: "t", i: i, x: s[0], y: s[1] }); });
    else EXTRA.forEach(function (s, i) { if (spotVisible(i) && fits(s, d.key)) out.push({ k: "e", i: i, x: s.x, y: s.y }); });
    return out;
  }
  function drawScene(t) {
    if (!ctx) return;
    var p = pal(st.biome), now = performance.now() / 1000;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bgFor(st.biome), 0, 0);
    drawLake(t, p);
    drawFish(t);
    snowOn = st.biome === "snow";
    sceneList().forEach(function (e) {
      var x = e.x, by = e.y;
      if (e.ex !== undefined) {
        var sp = EXTRA[e.ex];
        if (!spotVisible(e.ex)) return;
        var key = isDragFrom("e", e.ex) ? null : st.layout.extras[e.ex];
        if (key) {
          if (sp.k === "water") {
            R(ctx, x - 10, by, 21, 1, "rgba(255,255,255,.28)");
            if (Math.floor(t * 2) % 2) R(ctx, x - 7, by + 2, 15, 1, "rgba(255,255,255,.22)");
          } else blob(ctx, x, by, shadowR(key), 2, p.sh);
          drawItem(ctx, key, x, by, t, catMode(e.ex, now));
        } else if (sp.k === "water") R(ctx, x - 3, by, 7, 1, Math.floor(t * 2) % 2 ? p.hi : p.lake2);
        else blob(ctx, x, by, 4, 1, p.dirt);
        if (selIs("e", e.ex)) drawSel(x, by, t);
        return;
      }
      var i = e.slot;
      if (i > st.slots) { drawDots(x, by); return; }
      if (i === st.slots) { drawLock(x, by); return; }
      var it = isDragFrom("t", i) ? null : st.layout.slots[i];
      if (it) { blob(ctx, x, by, 7, 2, p.sh); drawItem(ctx, it, x, by, t); }
      else { blob(ctx, x, by, 6, 2, p.dirt); blob(ctx, x, by - 1, 3, 1, "rgba(255,255,255,.18)"); }
      if (selIs("t", i)) drawSel(x, by, t);
    });
    if (st.drag) {
      var d = st.drag;
      validTargets(d).forEach(function (c) { drawTarget(c.x, c.y, t); });
      blob(ctx, d.x, d.y + 12, 8, 2, "rgba(0,0,0,.3)");
      drawItem(ctx, d.key, d.x, d.y + 6, t, null);
    }
    snowOn = false;
    particles(t, st.biome);
  }
  /* حلقة الرسم: تشتغل بس إذا صفحة الغابة ظاهرة (حوالي 30 صورة بالثانية) */
  function loop(ts) {
    requestAnimationFrame(loop);
    if (!ctx || !viewVisible()) return;
    if (ts - lastFrame < 32) return;
    lastFrame = ts;
    drawScene(performance.now() / 1000);
  }

  /* ---------- واجهة ---------- */
  function injectCss() {
    if (document.getElementById("frCss")) return;
    var s = document.createElement("style");
    s.id = "frCss";
    s.textContent =
      ".fr-wrap{border-radius:16px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.18)}" +
      ".fr-cv{display:block;width:100%;height:auto;image-rendering:pixelated;image-rendering:crisp-edges;cursor:pointer;touch-action:pan-y;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}" +
      ".fr-info{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:12px 0 4px;font-size:.9rem}" +
      ".fr-info b{font-variant-numeric:tabular-nums}.fr-msg{min-height:1.4em;text-align:center;margin:6px 0;font-weight:700}" +
      ".fr-bar{height:6px;border-radius:99px;background:rgba(127,127,127,.25);overflow:hidden;margin:6px 0 2px}" +
      ".fr-bar i{display:block;height:100%;background:#e0a526;border-radius:99px;transition:width .4s}" +
      ".fr-sec{margin:12px 0 6px;font-weight:700}" +
      ".fr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px}" +
      ".fr-chip{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px;border-radius:12px;border:1px solid rgba(127,127,127,.3);background:rgba(127,127,127,.12);color:inherit;font:inherit;font-size:.8rem;cursor:pointer;transition:transform .12s}" +
      ".fr-chip:active{transform:scale(.95)}.fr-chip canvas{max-width:100%;height:auto}.fr-chip.on{outline:2px solid #e0a526}" +
      ".fr-chip:disabled{opacity:.45;cursor:default}.fr-chip.rm{background:rgba(220,38,38,.15);color:#f87171}";
    document.head.appendChild(s);
  }
  function say(m) {
    st.msg = m;
    var e = document.getElementById("frMsg"); if (e) e.textContent = m;
    clearTimeout(st.msgTimer);
    st.msgTimer = setTimeout(function () { st.msg = ""; var e2 = document.getElementById("frMsg"); if (e2) e2.textContent = ""; }, 2600);
  }
  function remaining() { return PER - (st.streak % PER); }
  function renderInfo() {
    var box = document.getElementById("frInfo"); if (!box) return;
    box.replaceChildren();
    var a = el("div"); a.appendChild(document.createTextNode(tr("slots") + ": "));
    a.appendChild(el("b", null, st.slots + "/" + MAX_SLOTS));
    var b = el("div");
    b.appendChild(document.createTextNode(tr("streak") + ": "));
    b.appendChild(el("b", null, String(st.streak)));
    box.append(a, b);
    if (st.weekEnd) box.appendChild(el("div", "muted", "⏳ " + Math.max(1, Math.ceil((new Date(st.weekEnd) - Date.now()) / 86400000)) + " " + tr("dayU")));
    var bar = document.getElementById("frBar");
    if (bar) bar.firstChild.style.width = (st.slots >= MAX_SLOTS ? 100 : ((PER - remaining()) / PER * 100)) + "%";
  }
  function renderPanel() {
    var p = document.getElementById("frPanel"); if (!p) return;
    p.replaceChildren();
    var owned = BIOMES.filter(function (b) { return b === "autumn" || has("biome:" + b); });
    if (owned.length > 1) {
      p.appendChild(el("div", "fr-sec", tr("secBiome")));
      var bg = el("div", "fr-grid");
      owned.forEach(function (b) {
        var c = el("button", "fr-chip" + (st.biome === b ? " on" : ""));
        c.type = "button";
        c.appendChild(preview("biome:" + b, 1));
        c.appendChild(el("span", null, itemName("biome:" + b)));
        c.disabled = st.busy;
        c.addEventListener("click", function () { setBiome(b); });
        bg.appendChild(c);
      });
      p.appendChild(bg);
    }
    if (selItem()) {
      var rmg = el("div", "fr-grid");
      rmg.style.marginTop = "10px";
      var rm = el("button", "fr-chip rm", "✕ " + tr("remove"));
      rm.type = "button"; rm.disabled = st.busy;
      rm.addEventListener("click", function () { place(null); });
      rmg.appendChild(rm);
      p.appendChild(rmg);
    }
    [["secTrees", TREE_KEYS.concat(FLOWER_KEYS)], ["secBench", BENCH_KEYS], ["secFountain", FOUNTAIN_KEYS], ["secDecor", DECOR_KEYS], ["secCats", CAT_KEYS]].forEach(function (sec) {
      var keys = sec[1].filter(allowed);
      if (!keys.length) return;
      p.appendChild(el("div", "fr-sec", tr(sec[0])));
      var grid = el("div", "fr-grid");
      keys.forEach(function (key) {
        var b = el("button", "fr-chip");
        b.type = "button";
        b.appendChild(preview(key, 2));
        var n = placedCount(key);
        b.appendChild(el("span", null, itemName(key) + (n ? " ×" + n : "")));
        b.disabled = st.busy;
        b.addEventListener("click", function () { place(key); });
        grid.appendChild(b);
      });
      p.appendChild(grid);
    });
    var go = el("button", "primary", tr("more") + " ←");
    go.type = "button"; go.style.marginTop = "14px";
    go.addEventListener("click", function () {
      setView("market");
      if (window.SJMarket) SJMarket.open("forest");
    });
    p.appendChild(go);
  }
  function renderAll() {
    var h = document.getElementById("frTitle"); if (h) h.textContent = tr("title");
    renderInfo(); renderPanel();
    var m = document.getElementById("frMsg"); if (m) m.textContent = st.msg;
  }

  /* أقرب مكان للضغطة (يشمل أماكن الأشجار والإضافات الظاهرة) */
  function pick(px, py) {
    var best = null, bd = 1e9;
    SLOTS.forEach(function (s, i) {
      var dx = Math.abs(px - s[0]);
      if (dx > 9 || py < s[1] - 26 || py > s[1] + 5) return;
      var d = dx + Math.abs(py - (s[1] - 8));
      if (d < bd) { bd = d; best = { k: "t", i: i }; }
    });
    EXTRA.forEach(function (s, i) {
      if (!spotVisible(i)) return;
      var dx = Math.abs(px - s.x);
      if (dx > 12 || py < s.y - 26 || py > s.y + 4) return;
      var d = dx + Math.abs(py - (s.y - 8));
      if (d < bd) { bd = d; best = { k: "e", i: i }; }
    });
    return best;
  }
  function toLogical(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }
  function tap(h) {
    if (!h) st.sel = null;
    else if (h.k === "t" && h.i >= st.slots) { st.sel = null; say(tr("lockedMsg", Math.max(1, (h.i - st.slots) * PER + remaining()))); }
    else {
      st.sel = h;
      var key = itemAt(h);
      if (key) {
        say(itemName(key));
        if (kindOf(key) === "cat") petCat(h.i);
      }
    }
    renderPanel();
    drawScene(performance.now() / 1000);
  }
  /* ---- الضغط المطوّل: رفع ونقل ---- */
  function onDown(e) {
    if (st.busy || (e.pointerType === "mouse" && e.button !== 0)) return;
    var p = toLogical(e), h = pick(p.x, p.y);
    press = { x: e.clientX, y: e.clientY, hit: h, drag: false, moved: false, t: null, id: e.pointerId };
    if (h && itemAt(h)) {
      press.t = setTimeout(function () {
        if (!press || press.moved) return;
        var key = itemAt(press.hit);
        if (!key) return;
        press.drag = true;
        st.sel = null;
        st.drag = { from: press.hit, key: key, x: p.x, y: p.y };
        try { canvas.setPointerCapture(press.id); } catch (err) { }
        try { if (navigator.vibrate) navigator.vibrate(18); } catch (err2) { }
        say(itemName(key));
        drawScene(performance.now() / 1000);
      }, 380);
    }
  }
  function onMove(e) {
    if (!press) return;
    if (press.drag) {
      var p = toLogical(e);
      st.drag.x = p.x; st.drag.y = p.y;
      e.preventDefault();
      return;
    }
    if (Math.abs(e.clientX - press.x) > 8 || Math.abs(e.clientY - press.y) > 8) {
      press.moved = true;
      clearTimeout(press.t);
    }
  }
  function onUp(e) {
    if (!press) return;
    clearTimeout(press.t);
    var was = press;
    press = null;
    if (was.drag) { finishDrag(toLogical(e)); return; }
    if (!was.moved) tap(was.hit);
  }
  function onCancel() {
    if (!press) return;
    clearTimeout(press.t);
    press = null;
    if (st.drag) { st.drag = null; drawScene(performance.now() / 1000); }
  }
  function finishDrag(p) {
    var d = st.drag; st.drag = null;
    if (!d) return;
    var best = null, bd = 1e9, bx = p.x, by = p.y + 10;
    validTargets(d).forEach(function (c) {
      var dd = Math.sqrt((c.x - bx) * (c.x - bx) + (c.y - by) * (c.y - by));
      if (dd < bd) { bd = dd; best = c; }
    });
    if (!best || bd > 30 || (best.k === d.from.k && best.i === d.from.i)) { drawScene(performance.now() / 1000); return; }
    var fromMap = mapOf(d.from.k), toMap = mapOf(best.k), other = toMap[best.i];
    if (other) {
      var okSwap = d.from.k === "t" ? true : fits(EXTRA[d.from.i], other);
      if (!okSwap) { say(tr("noswap")); drawScene(performance.now() / 1000); return; }
      fromMap[d.from.i] = other;
    } else delete fromMap[d.from.i];
    toMap[best.i] = d.key;
    st.sel = null;
    drawScene(performance.now() / 1000);
    save();
  }

  async function save() {
    st.busy = true; renderPanel();
    var r = await supabaseClient.rpc("save_forest", { p_layout: st.layout });
    st.busy = false;
    if (r.error) { say(tr("fail")); await load(); }
    else say(tr("saved"));
    renderAll();
    drawScene(performance.now() / 1000);
  }
  /* place(مفتاح): ينحط بالمكان المحدد (إذا مناسب) أو بأول مكان فارغ من نوعه. place(null): يشيل العنصر من المكان المحدد */
  function place(key) {
    if (st.busy) return;
    if (key === null) {
      if (!st.sel) return;
      delete mapOf(st.sel.k)[st.sel.i];
      st.sel = null;
      drawScene(performance.now() / 1000);
      save();
      return;
    }
    if (!allowed(key)) return;
    var tree = kindOf(key) === "t", map = mapOf(tree ? "t" : "e"), idx = null, i;
    if (st.sel) {
      if (tree && st.sel.k === "t" && st.sel.i < st.slots) idx = st.sel.i;
      else if (!tree && st.sel.k === "e" && spotVisible(st.sel.i) && fits(EXTRA[st.sel.i], key)) idx = st.sel.i;
    }
    if (idx === null) {
      if (tree) { for (i = 0; i < st.slots; i++) if (!map[i]) { idx = i; break; } }
      else {
        for (i = 0; i < EXTRA.length; i++) if (!map[i] && EXTRA[i].k !== "water" && spotVisible(i) && fits(EXTRA[i], key)) { idx = i; break; }
        if (idx === null) for (i = 0; i < EXTRA.length; i++) if (!map[i] && spotVisible(i) && fits(EXTRA[i], key)) { idx = i; break; }
      }
    }
    if (idx === null) { say(tr("full")); return; }
    map[idx] = key;
    st.sel = null;
    drawScene(performance.now() / 1000);
    save();
  }
  async function setBiome(b) {
    if (st.busy || st.biome === b) return;
    var prev = st.biome;
    st.busy = true; st.biome = b;
    drawScene(performance.now() / 1000); renderPanel();
    var r = await supabaseClient.rpc("set_forest_biome", { p_biome: b });
    st.busy = false;
    if (r.error) { st.biome = prev; say(tr("fail")); }
    renderAll();
    drawScene(performance.now() / 1000);
  }

  async function load() {
    var r = await supabaseClient.rpc("get_forest");
    if (r.error || !r.data) return false;
    var d = r.data;
    st.slots = Math.min(MAX_SLOTS, d.slots || BASE_SLOTS);
    st.streak = d.streak || 0;
    st.owned = d.owned || [];
    st.prices = d.prices || {};
    var lay = d.layout || {};
    st.lake = d.lake || 1;
    st.weekEnd = d.week_end || null;
    st.biome = BIOMES.indexOf(d.biome) >= 0 && (d.biome === "autumn" || has("biome:" + d.biome)) ? d.biome : "autumn";
    var clean = {};
    Object.keys(lay.slots || {}).forEach(function (k) {
      var v = lay.slots[k];
      if (Number(k) < MAX_SLOTS && ITEMS[v] && kindOf(v) === "t") clean[k] = v;
    });
    /* الإضافات: إذا ما انحفظت قبل، نحط العناصر القديمة بأماكنها السابقة */
    var ex = d.extras;
    if (!ex || typeof ex !== "object") {
      ex = {};
      LEGACY.forEach(function (k, i) { if (k && has(k)) ex[i] = k; });
    }
    var cleanEx = {};
    Object.keys(ex).forEach(function (k) {
      var v = ex[k];
      if (Number(k) < EXTRA.length && ITEMS[v] && kindOf(v) !== "t" && has(v)) cleanEx[k] = v;
    });
    st.layout = { slots: lay.slots ? clean : { 0: "tree:oak" }, extras: cleanEx };
    st.loaded = true;
    if (st.sel && st.sel.k === "t" && st.sel.i >= st.slots) st.sel = null;
    return true;
  }

  function build() {
    var r = root();
    if (!r) return;
    injectCss();
    r.replaceChildren();
    var card = el("div", "card");
    var h = el("h3", null, tr("title")); h.id = "frTitle";
    card.appendChild(h);
    var wrap = el("div", "fr-wrap");
    canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    canvas.className = "fr-cv";
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onCancel);
    canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    canvas.addEventListener("touchmove", function (e) { if (st.drag && e.cancelable) e.preventDefault(); }, { passive: false });
    wrap.appendChild(canvas);
    ctx = canvas.getContext("2d");
    card.appendChild(wrap);
    var info = el("div", "fr-info"); info.id = "frInfo"; card.appendChild(info);
    var bar = el("div", "fr-bar"); bar.id = "frBar"; bar.appendChild(document.createElement("i")); card.appendChild(bar);
    var msg = el("div", "fr-msg"); msg.id = "frMsg"; card.appendChild(msg);
    var panel = el("div"); panel.id = "frPanel"; card.appendChild(panel);
    r.appendChild(card);
    if (!built) { built = true; requestAnimationFrame(loop); }
  }

  async function open() {
    build();
    renderAll();
    drawScene(performance.now() / 1000);
    await load();
    renderAll();
    drawScene(performance.now() / 1000);
  }
  function refreshLang() {
    var lbl = document.getElementById("tabForestLabel");
    if (lbl) lbl.textContent = tr("title");
    if (viewVisible() && canvas) renderAll();
  }

  return {
    open: open, load: load, refreshLang: refreshLang, preview: preview,
    shop: function () {
      return {
        trees: TREE_KEYS.filter(function (k) { return !isFree(k); }), benches: BENCH_KEYS, fountains: FOUNTAIN_KEYS, decor: DECOR_KEYS.concat(FLOWER_KEYS),
        cats: CAT_KEYS, biomes: BIOME_KEYS, lake: LAKE_KEYS
      };
    },
    name: itemName,
    label: function () { return tr("title"); },
    _drawItem: drawItem,
    _state: st
  };
})();
