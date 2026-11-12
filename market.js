/* market.js : المتجر (عملات + شراء أزياء/شعر/إكسسوارات/شارات/غابة + تجهيز الشارات)
   كل تبويب يفتح قائمة أقسام، وتضغط القسم ليطلعلك محتواه بشكل منفصل.
   الأسعار والرصيد من السيرفر (دالة get_shop). الشراء عن طريق buy_item. */
window.SJMarket = (function () {
  "use strict";

  var shop = { points: 0, streak: 0, owned: [], prices: {} };
  var tab = "outfit", subs = {}, loaded = false, busy = false, msg = "", msgTimer = null;

  var TXT = {
    ar: { title: "المتجر", pts: "عملاتي", tOutfit: "الأزياء", tHair: "الشعر", tExtra: "إكسسوارات", tBadge: "الشارات",
      buy: "شراء", owned: "مملوك ✅", equip: "تجهيز", unequip: "إلغاء", equipped: "مجهّزة ✓", pt: "عملة",
      goCz: "تخصيص الشخصية",
      nope: "عملاتك ما تكفي", fail: "تعذّر الشراء، حاول مرة ثانية", bought: "تم الشراء ✅", max: "أقصى شي 3 شارات",
      sHair: "الشعر", sColor: "ألوان الشعر", sHead: "الحجاب", sGlass: "النظارات", sHat: "القبعات", sBeard: "اللحية", sHeadc: "ألوان الحجاب", none: "لا يوجد شي للبيع هنا", tForest: "الغابة", sTrees: "الأشجار", sBench: "المقاعد", sFountain: "النوافير", sDecor: "ديكور", sBiome: "البيئات", forestLocked: "الغابة تنفتح بعد {h} ساعة دراسة 🔒", sCats: "القطط", sLake: "البحيرة", needLake: "يحتاج البحيرة الأكبر أولاً" },
    en: { title: "Market", pts: "My coins", tOutfit: "Outfits", tHair: "Hair", tExtra: "Extras", tBadge: "Badges",
      buy: "Buy", owned: "Owned ✅", equip: "Equip", unequip: "Remove", equipped: "Equipped ✓", pt: "coins",
      goCz: "Customize character",
      nope: "Not enough coins", fail: "Could not buy, try again", bought: "Purchased ✅", max: "Max 3 badges",
      sHair: "Hairstyles", sColor: "Hair colors", sHead: "Headscarves", sGlass: "Glasses", sHat: "Hats", sBeard: "Beards", sHeadc: "Headscarf colors", none: "Nothing for sale here", tForest: "Forest", sTrees: "Trees", sBench: "Benches", sFountain: "Fountains", sDecor: "Decor", sBiome: "Biomes", forestLocked: "The forest unlocks after {h} study hours 🔒", sCats: "Cats", sLake: "Lake", needLake: "Needs the bigger lake first" },
    ckb: { title: "بازاڕ", pts: "دراوەکانم", tOutfit: "جل و بەرگ", tHair: "قژ", tExtra: "ئاکسسوار", tBadge: "نیشانەکان",
      buy: "کڕین", owned: "هی منە ✅", equip: "لەبەرکردن", unequip: "لابردن", equipped: "لەبەرکراوە ✓", pt: "دراو",
      goCz: "دیزاینی کارەکتەر",
      nope: "دراوەکانت بەس نین", fail: "نەکڕدرا، دووبارە هەوڵبدەرەوە", bought: "کڕدرا ✅", max: "زۆرترین ٣ نیشانە",
      sHair: "شێوازی قژ", sColor: "ڕەنگی قژ", sHead: "حیجاب", sGlass: "چاویلکە", sHat: "کڵاو", sBeard: "ڕیش", sHeadc: "ڕەنگی حیجاب", none: "لێرە هیچ نییە", tForest: "دارستان", sTrees: "درەختەکان", sBench: "کورسییەکان", sFountain: "فوارەکان", sDecor: "ڕازاندنەوە", sBiome: "ژینگەکان", forestLocked: "دارستان دوای {h} کاتژمێری خوێندن دەکرێتەوە 🔒", sCats: "پشیلەکان", sLake: "گۆم", needLake: "سەرەتا گۆمی گەورەتر پێویستە" }
  };
  var NAMES = {
    ar: { doctor: "طبيب", scrubs: "جراحة", pharmacist: "صيدلي", nurse: "تمريض", chef: "طباخ", engineer: "مهندس", jersey: "قميص رياضي", suit: "بدلة",
      sundress: "فستان صيفي", dress_red: "فستان أحمر", skirt: "تنورة", thobe: "ثوب", abaya: "عباية", kurdish_m: "زي كردي", kurdish_f: "زي كردي", gown: "تخرج",
      slick: "مسحوب", afro: "أفرو", mohawk: "موهوك", m_long: "طويل", g_pony: "ذيل حصان", g_braid: "ضفيرة", g_hime: "هايم", g_space: "كعكتين", g_twin: "ضفيرتين",
      pink: "وردي", blue: "أزرق", purple: "بنفسجي", platinum: "بلاتيني", green: "أخضر", wrap: "لفة", long: "حجاب طويل",
      round: "دائرية", square: "مربعة", sun: "شمسية", cap: "كاب", beanie: "طاقية", headphones: "سماعات", bow: "فيونكة", crown: "تاج", denim: "جاكيت جينز", hoodie_red: "هودي أحمر", tee_green: "تيشيرت أخضر", suit_gray: "بدلة رمادية", dentist: "طبيب أسنان", thobe_gray: "ثوب رمادي", thobe_brown: "ثوب بني", kurdish_m2: "زي كردي أزرق", kurdish_m3: "زي كردي أسود", dress_blue: "فستان أزرق", dress_purple: "فستان بنفسجي", dress_black: "فستان أسود", skirt_blue: "تنورة زرقاء", maxi_pink: "فستان طويل", kurdish_f_red: "زي كردي أحمر", kurdish_f_blue: "زي كردي أزرق", kurdish_f_purple: "زي كردي بنفسجي", abaya_navy: "عباية كحلي", abaya_maroon: "عباية عنابي", abaya_green: "عباية أخضر", abaya_purple: "عباية بنفسجي", abaya_gray: "عباية رمادي", abaya_teal: "عباية تركوازي", abaya_rose: "عباية وردي", abaya_black_gold: "عباية ذهبية", quiff: "كوفة عالية", undercut: "أندركت", m_wavy: "مموج", fade: "فيد", g_curly: "كيرلي طويل", g_bangs: "غرّة", g_lowpony: "ذيل منخفض", g_halfup: "نصف مربوط", chinstrap: "لحية الذقن", handlebar: "شوارب مفتولة", bucket: "قبعة صيد", beret: "بيريه", tiara: "تاج أميرة", flowers: "إكليل ورد", cat: "عين القطة", aviator: "أفييتر", rose: "زهري", teal: "تركوازي", oil_engineer: "مهندس نفط", civil_engineer: "مهندس مدني", architect: "معماري", teacher: "معلم", pilot: "طيار", police: "ضابط", scrubs_blue: "جراح أزرق", researcher: "باحث", vet: "بيطري" },
    en: { doctor: "Doctor", scrubs: "Surgeon", pharmacist: "Pharmacist", nurse: "Nurse", chef: "Chef", engineer: "Engineer", jersey: "Jersey", suit: "Suit",
      sundress: "Sundress", dress_red: "Red dress", skirt: "Skirt", thobe: "Thobe", abaya: "Abaya", kurdish_m: "Kurdish outfit", kurdish_f: "Kurdish outfit", gown: "Graduation",
      slick: "Slicked", afro: "Afro", mohawk: "Mohawk", m_long: "Long", g_pony: "Ponytail", g_braid: "Braid", g_hime: "Hime", g_space: "Space buns", g_twin: "Twin tails",
      pink: "Pink", blue: "Blue", purple: "Purple", platinum: "Platinum", green: "Green", wrap: "Wrap", long: "Long scarf",
      round: "Round", square: "Square", sun: "Sunglasses", cap: "Cap", beanie: "Beanie", headphones: "Headphones", bow: "Bow", crown: "Crown", denim: "Denim jacket", hoodie_red: "Red hoodie", tee_green: "Green tee", suit_gray: "Gray suit", dentist: "Dentist", thobe_gray: "Gray thobe", thobe_brown: "Brown thobe", kurdish_m2: "Blue Kurdish outfit", kurdish_m3: "Black Kurdish outfit", dress_blue: "Blue dress", dress_purple: "Purple dress", dress_black: "Black dress", skirt_blue: "Blue skirt", maxi_pink: "Long dress", kurdish_f_red: "Red Kurdish dress", kurdish_f_blue: "Blue Kurdish dress", kurdish_f_purple: "Purple Kurdish dress", abaya_navy: "Navy abaya", abaya_maroon: "Maroon abaya", abaya_green: "Green abaya", abaya_purple: "Purple abaya", abaya_gray: "Gray abaya", abaya_teal: "Teal abaya", abaya_rose: "Rose abaya", abaya_black_gold: "Gold-trim abaya", quiff: "Quiff", undercut: "Undercut", m_wavy: "Wavy", fade: "Fade", g_curly: "Long curly", g_bangs: "Bangs", g_lowpony: "Low ponytail", g_halfup: "Half up", chinstrap: "Chin strap", handlebar: "Handlebar", bucket: "Bucket hat", beret: "Beret", tiara: "Tiara", flowers: "Flower crown", cat: "Cat-eye", aviator: "Aviator", rose: "Rose", teal: "Teal", oil_engineer: "Petroleum engineer", civil_engineer: "Civil engineer", architect: "Architect", teacher: "Teacher", pilot: "Pilot", police: "Officer", scrubs_blue: "Blue surgeon", researcher: "Researcher", vet: "Veterinarian" }
  };

  function L() { try { return currentLanguage(); } catch (e) { return "ar"; } }
  function tx(k) { var l = TXT[L()] || TXT.ar; return l[k] || TXT.en[k] || k; }
  function nm(id) { var l = L() === "ar" ? "ar" : "en"; return NAMES[l][id] || id; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function has(key) { return shop.owned.indexOf(key) >= 0; }
  function root() { return document.getElementById("marketRoot"); }
  function say(m) { msg = m; clearTimeout(msgTimer); msgTimer = setTimeout(function () { msg = ""; render(); }, 2600); }
  function backArrow() { return document.documentElement.dir === "rtl" ? "→ " : "← "; }

  function injectCss() {
    if (document.getElementById("mkCss")) return;
    var s = document.createElement("style");
    s.id = "mkCss";
    s.textContent =
      ".mk-head{display:flex;gap:10px;margin-bottom:10px}.mk-stat{flex:1;text-align:center;padding:10px;border-radius:14px;background:rgba(127,127,127,.12)}" +
      ".mk-stat b{display:block;font-size:1.5rem}.mk-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}" +
      ".mk-tab{padding:7px 14px;border-radius:999px;border:1px solid rgba(127,127,127,.35);background:transparent;color:inherit;font:inherit;cursor:pointer}" +
      ".mk-tab.on{background:#e0a526;color:#2b2027;border-color:#e0a526;font-weight:700}" +
      ".mk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:10px}" +
      ".mk-card{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px;border-radius:14px;background:rgba(127,127,127,.12);text-align:center}" +
      ".mk-card canvas{max-width:100%;height:auto}.mk-nm{font-size:.82rem}.mk-btn{width:100%;padding:6px;border-radius:10px;border:0;font:inherit;cursor:pointer;background:#e0a526;color:#2b2027;font-weight:700}" +
      ".mk-btn:disabled{opacity:.5;cursor:default}.mk-btn.ghost{background:rgba(127,127,127,.25);color:inherit}.mk-btn.on{background:#2f9e95;color:#fff}" +
      ".mk-msg{min-height:1.4em;text-align:center;margin:6px 0;font-weight:700}.mk-note{font-size:.85rem;opacity:.8;margin:8px 0}" +
      ".mk-dot{width:34px;height:34px;border-radius:50%;border:2px solid rgba(255,255,255,.6)}" +
      ".mk-cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-top:6px}" +
      ".mk-cat{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:84px;padding:12px 8px;border-radius:14px;border:1px solid rgba(127,127,127,.3);background:rgba(127,127,127,.12);color:inherit;font:inherit;font-weight:700;cursor:pointer;transition:transform .12s}" +
      ".mk-cat:active{transform:scale(.96)}.mk-cat canvas{max-width:100%;height:auto}" +
      ".mk-back{display:block;margin:4px 0 12px;padding:7px 14px;border-radius:999px;border:1px solid rgba(127,127,127,.35);background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer}";
    document.head.appendChild(s);
  }

  async function load() {
    var r = await supabaseClient.rpc("get_shop");
    if (r.error || !r.data) return false;
    shop = r.data;
    shop.owned = shop.owned || [];
    loaded = true;
    if (typeof updateCoinsBadge === "function") updateCoinsBadge(shop.points);
    if (window.SJAvatar) Object.keys(shop.prices || {}).forEach(function (k) { SJAvatar.PRICE[k] = shop.prices[k]; });
    if (window.SJAvatar) Object.keys(shop.prices || {}).forEach(function (k) { if (k.indexOf("badge:") !== 0) SJAvatar.PRICE[k] = shop.prices[k]; });
    if (window.SJAvatar) SJAvatar.setOwned(shop.owned.filter(function (k) { return k.indexOf("badge:") !== 0; }));
    return true;
  }

  async function buy(key) {
    if (busy) return;
    busy = true; render();
    var r = await supabaseClient.rpc("buy_item", { p_key: key });
    if (r.error) {
      var m = String(r.error.message || "");
      say(m.indexOf("not_enough") >= 0 ? tx("nope") : tx("fail"));
    } else {
      say(tx("bought"));
    }
    await load();
    busy = false; render();
  }

  async function toggleBadge(id) {
    if (busy) return;
    var cur = (typeof myFlair !== "undefined" && myFlair.equipped) ? myFlair.equipped.slice() : [];
    var i = cur.indexOf(id);
    if (i >= 0) cur.splice(i, 1); else { if (cur.length >= 3) { say(tx("max")); render(); return; } cur.push(id); }
    busy = true;
    var r = await supabaseClient.rpc("set_equipped_badges", { ids: cur });
    if (r.error) say(tx("fail")); else if (typeof myFlair !== "undefined") myFlair.equipped = cur;
    busy = false; render();
  }

  function myCfg() {
    return SJAvatar.normalize((typeof myProfile !== "undefined" && myProfile && myProfile.avatar_config) || SJAvatar.defaultFor(typeof me !== "undefined" && me ? me.id : "x"));
  }

  function buyBtn(key) {
    var price = shop.prices[key];
    if (has(key)) return el("button", "mk-btn ghost", tx("owned"));
    var b = el("button", "mk-btn", tx("buy") + " · " + (price != null ? price : "?") + " " + tx("pt"));
    b.disabled = busy || price == null;
    b.addEventListener("click", function () { buy(key); });
    return b;
  }

  /* ---------- قائمة الأقسام: تضغط القسم ليطلع محتواه لحاله ---------- */
  function menu(box, tabKey, list) {
    list = list.filter(function (x) { return x.count > 0; });
    if (!list.length) return;
    if (list.length === 1) { list[0].draw(box); return; }
    var cur = subs[tabKey], f = null;
    list.forEach(function (x) { if (x.id === cur) f = x; });
    if (!f) {
      var g = el("div", "mk-cats");
      list.forEach(function (x) {
        var b = el("button", "mk-cat");
        b.type = "button";
        if (x.prev) b.appendChild(x.prev());
        b.appendChild(el("span", null, x.label));
        b.addEventListener("click", function () { subs[tabKey] = x.id; render(); });
        g.appendChild(b);
      });
      box.appendChild(g);
      return;
    }
    var back = el("button", "mk-back", backArrow() + f.label);
    back.type = "button";
    back.addEventListener("click", function () { subs[tabKey] = null; render(); });
    box.appendChild(back);
    f.draw(box);
  }

  /* ---------- أزياء / شعر / إكسسوارات ---------- */
  function avList(k) {
    var cfg = myCfg();
    return SJAvatar.options(k, cfg).filter(function (o) { return !o.free && shop.prices[k + ":" + o.id] != null; });
  }
  function avDraw(k, swatch) {
    return function (box) {
      var cfg = myCfg();
      var grid = el("div", "mk-grid");
      avList(k).forEach(function (o) {
        var card = el("div", "mk-card");
        if (swatch) {
          var d = el("span", "mk-dot"); d.style.background = o.hex; card.appendChild(d);
        } else {
          var test = Object.assign({}, cfg); test[k] = o.id;
          if (k === "hair") { test.head = "none"; test.hat = "none"; }
          test = SJAvatar.normalize(test);
          card.appendChild(SJAvatar.make(test, 2));
        }
        card.appendChild(el("div", "mk-nm", nm(o.id)));
        card.appendChild(buyBtn(k + ":" + o.id));
        grid.appendChild(card);
      });
      box.appendChild(grid);
    };
  }
  function avSub(id, label, k, swatch) {
    return { id: id, label: label, count: avList(k).length, draw: avDraw(k, swatch) };
  }

  /* ---------- الشارات ---------- */
  function badgesMenu(box) {
    if (!window.SJBadges) return;
    var eq = (typeof myFlair !== "undefined" && myFlair.equipped) ? myFlair.equipped : [];
    var cats = {}, order = [];
    SJBadges.LIST.forEach(function (b) {
      if (b.id === "champion" || b.hidden) return;
      /* شارات المواسم: تظهر فقط خلال موسمها أو إذا مشتريها */
      if (b.season && !(window.SJSeason && SJSeason.active(b.season)) && !has("badge:" + b.id)) return;
      if (!cats[b.cat]) { cats[b.cat] = []; order.push(b.cat); }
      cats[b.cat].push(b);
    });
    menu(box, "badges", order.map(function (c) {
      return {
        id: c, label: SJBadges.catName(c), count: cats[c].length,
        prev: function () { return SJBadges.icon(cats[c][0].id, 34); },
        draw: function (bx) {
          var grid = el("div", "mk-grid");
          cats[c].forEach(function (b) {
            var key = "badge:" + b.id;
            var card = el("div", "mk-card");
            card.appendChild(SJBadges.icon(b.id, 40));
            card.appendChild(el("div", "mk-nm", SJBadges.name(b.id)));
            if (has(key)) {
              var on = eq.indexOf(b.id) >= 0;
              var e = el("button", "mk-btn" + (on ? " on" : ""), on ? tx("equipped") : tx("equip"));
              e.disabled = busy;
              e.addEventListener("click", function () { toggleBadge(b.id); });
              card.appendChild(e);
            } else {
              card.appendChild(buyBtn(key));
            }
            grid.appendChild(card);
          });
          bx.appendChild(grid);
        }
      };
    }));
  }

  /* ---------- الغابة ---------- */
  function forestDraw(keys, scale) {
    return function (box) {
      var grid = el("div", "mk-grid");
      keys.forEach(function (key) {
        var card = el("div", "mk-card");
        card.appendChild(SJForest.preview(key, scale));
        card.appendChild(el("div", "mk-nm", SJForest.name(key)));
        if (key === "lake:3" && !has("lake:2") && !has(key)) {
          var lk = el("button", "mk-btn ghost", tx("needLake"));
          lk.disabled = true;
          card.appendChild(lk);
        } else {
          card.appendChild(buyBtn(key));
        }
        grid.appendChild(card);
      });
      box.appendChild(grid);
    };
  }
  function forestSection(box) {
    if (!window.SJForest) return;
    if (typeof featureUnlocked === "function" && !featureUnlocked("forest")) {
      var need = typeof UNLOCK_HOURS !== "undefined" ? UNLOCK_HOURS.forest : 50;
      box.appendChild(el("div", "mk-note", tx("forestLocked").replace("{h}", need)));
      return;
    }
    var sh = SJForest.shop();
    var secs = [["trees", "sTrees", sh.trees, 3], ["bench", "sBench", sh.benches, 3], ["fountain", "sFountain", sh.fountains, 3],
      ["decor", "sDecor", sh.decor, 3], ["cats", "sCats", sh.cats, 2], ["biome", "sBiome", sh.biomes, 2], ["lake", "sLake", sh.lake, 1]];
    menu(box, "forest", secs.map(function (s) {
      return {
        id: s[0], label: tx(s[1]), count: s[2].length,
        prev: function () { return SJForest.preview(s[2][0], s[3] === 1 ? 1 : 2); },
        draw: forestDraw(s[2], s[3])
      };
    }));
    var gf = el("button", "primary", SJForest.label() + " ←");
    gf.type = "button";
    gf.style.marginTop = "14px";
    gf.addEventListener("click", function () { setView("forest"); });
    box.appendChild(gf);
  }

  function render() {
    var r = root();
    if (!r || !window.SJAvatar) return;
    injectCss();
    r.replaceChildren();
    var card = el("div", "card");
    card.appendChild(el("h3", null, tx("title")));

    var head = el("div", "mk-head");
    var s1 = el("div", "mk-stat"); s1.appendChild(el("span", "muted", tx("pts"))); s1.appendChild(el("b", null, String(shop.points || 0)));
    head.append(s1);
    card.appendChild(head);

    var tabs = el("div", "mk-tabs");
    [["outfit", "tOutfit"], ["hair", "tHair"], ["extras", "tExtra"], ["badges", "tBadge"], ["forest", "tForest"]].forEach(function (p) {
      var b = el("button", "mk-tab" + (tab === p[0] ? " on" : ""), tx(p[1]));
      b.type = "button";
      b.addEventListener("click", function () { tab = p[0]; subs[p[0]] = null; render(); });
      tabs.appendChild(b);
    });
    card.appendChild(tabs);
    card.appendChild(el("div", "mk-msg", msg));

    var box = el("div");
    if (!loaded) box.appendChild(el("div", "muted", "..."));
    else if (tab === "outfit") menu(box, "outfit", [avSub("outfit", tx("tOutfit"), "outfit")]);
    else if (tab === "hair") menu(box, "hair", [avSub("hair", tx("sHair"), "hair"), avSub("hairc", tx("sColor"), "hairc", true), avSub("head", tx("sHead"), "head"), avSub("headc", tx("sHeadc"), "headc", true), avSub("beard", tx("sBeard"), "beard")]);
    else if (tab === "extras") menu(box, "extras", [avSub("glasses", tx("sGlass"), "glasses"), avSub("hat", tx("sHat"), "hat")]);
    else if (tab === "forest") forestSection(box);
    else badgesMenu(box);
    if (!box.children.length) box.appendChild(el("div", "muted", tx("none")));
    card.appendChild(box);

    if (tab !== "badges" && tab !== "forest") {
      var go = el("button", "primary", tx("goCz"));
      go.type = "button";
      go.style.marginTop = "14px";
      go.addEventListener("click", function () { setView("customize"); });
      card.appendChild(go);
    }
    r.appendChild(card);
  }

  async function open(startTab) { if (startTab) { tab = startTab; subs[tab] = null; } render(); await load(); render(); }
  var TASKS_LBL = { ar: "مهامي", en: "Tasks", ckb: "ئەرکەکانم" };
  function refreshLang() {
    var m = document.getElementById("tabMarketLabel"); if (m) m.textContent = tx("title");
    var k = document.getElementById("tabTasksLabel"); if (k) k.textContent = TASKS_LBL[L()] || TASKS_LBL.ar;
    var v = document.getElementById("marketView");
    if (root() && v && !v.hidden) render();
  }

  return { open: open, load: load, refreshLang: refreshLang };
})();
