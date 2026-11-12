/* season.js : المنسّق العام للثيمات الموسمية (كريسماس، رمضان، عيد...)
   - يحدد الموسم الحالي تلقائياً حسب التاريخ (بتوقيت بغداد) ويضع data-season على <html>
   - كل موسم له ملفه (christmas.js, ramadan.js...) ويسجّل نفسه هنا بـ SJSeason.register
   - لحذف أي موسم: احذف سطور ملفاته من index.html وبس، الموقع يرجع طبيعي.

   ⚠️ تواريخ المواسم كلها هون (الصيغة YYYY-MM-DD، والنهاية تشمل ذلك اليوم):          */
window.SJSeason = (function () {
  "use strict";

  var SEASONS = [
    { id: "christmas", start: "2026-12-01", end: "2027-01-02" },
    /* رمضان: التواريخ تنكتب بملف ramadan-config.js (فاضية لحد ما يتحدد الموعد) */
    { id: "ramadan", start: (window.SJ_RAMADAN || {}).start || "", end: (window.SJ_RAMADAN || {}).end || "" },
    /* العيد: التواريخ تنكتب بملف eid-config.js (فاضية لحد ما يتحدد الموعد) */
    { id: "eid", start: (window.SJ_EID || {}).start || "", end: (window.SJ_EID || {}).end || "" }
  ];

  var mods = {};
  var forced = null;

  /* للتجربة فقط: افتح الموقع بـ ?season=christmas لتشوف الثيم، و ?season=off لتطفيه */
  try {
    var m = /[?&]season=([a-z]+)/.exec(location.search);
    if (m) sessionStorage.setItem("sj_season_test", m[1]);
    forced = sessionStorage.getItem("sj_season_test");
  } catch (e) {}

  function todayBaghdad() {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baghdad", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    } catch (e) {
      var d = new Date(Date.now() + 3 * 3600 * 1000);
      return d.toISOString().slice(0, 10);
    }
  }
  function compute() {
    if (forced === "off") return "";
    if (forced) { for (var i = 0; i < SEASONS.length; i++) if (SEASONS[i].id === forced) return forced; }
    var today = todayBaghdad();
    for (var j = 0; j < SEASONS.length; j++) {
      var s = SEASONS[j];
      if (s.start && s.end && today >= s.start && today <= s.end) return s.id;
    }
    return "";
  }

  var current = compute();
  var root = document.documentElement;
  if (current) root.setAttribute("data-season", current);

  /* أثناء الموسم نمنع ألوان البالِت (أزرق/وردي) حتى ما تخرّب لون الثيم */
  if (current && window.MutationObserver) {
    new MutationObserver(function () {
      if (root.hasAttribute("data-palette")) root.removeAttribute("data-palette");
    }).observe(root, { attributes: true, attributeFilter: ["data-palette"] });
    root.removeAttribute("data-palette");
  }

  /* إذا تغيّر الموسم والصفحة مفتوحة (مثلاً عند منتصف الليل) نعيد التحميل مرة وحدة */
  setInterval(function () {
    if (compute() !== current) location.reload();
  }, 10 * 60 * 1000);

  function register(id, mod) { mods[id] = mod; }
  function mod() { return current ? mods[current] : null; }

  /* خطافات القطة (cat.js ينادي عليها) */
  function catPart(ctx, part, b, floor) {
    var m = mod();
    if (m && m.catPart) m.catPart(ctx, part, b, floor);
  }
  function scene(ctx, layer, t, floor) {
    var m = mod();
    if (m && m.scene) m.scene(ctx, layer, t, floor);
  }

  return {
    id: function () { return current; },
    active: function (id) { return current === id; },
    register: register,
    catPart: catPart,
    scene: scene,
    SEASONS: SEASONS
  };
})();
