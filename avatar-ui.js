/* avatar-ui.js : مدرج Top 10 + صفحة تخصيص الشخصية
   يعتمد على avatar.js ويستعمل دوال script.js (t, me, myProfile, supabaseClient, fmtHours, currentLanguage) وقت التشغيل */
window.SJAvatarUI = (function () {
  "use strict";

  var TABS = {
    body:   [{ k: "gender", type: "thumb", crop: 0 }, { k: "skin", type: "swatch" }],
    face:   [{ k: "eyes", type: "thumb", crop: 24 }, { k: "eyec", type: "swatch" }, { k: "mouth", type: "thumb", crop: 24 }],
    hair:   [{ k: "hair", type: "thumb", crop: 33 }, { k: "hairc", type: "swatch" },
             { k: "head", type: "thumb", crop: 0 }, { k: "headc", type: "swatch" }],
    beard:  [{ k: "beard", type: "thumb", crop: 26 }],
    extras: [{ k: "glasses", type: "thumb", crop: 24 }, { k: "hat", type: "thumb", crop: 24 }],
    outfit: [{ k: "outfit", type: "thumb", crop: 0 }]
  };
  var TAB_ORDER = ["body", "face", "hair", "beard", "extras", "outfit"];
  var tab = "body", draft = null, msgTimer = null, saving = false;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function cfgFor(row) {
    return SJAvatar.normalize((row && row.avatar_config) || SJAvatar.defaultFor(row && row.user_id));
  }

  /* ---------- المدرج ---------- */
  function figure(row, scale) {
    var c = SJAvatar.make(cfgFor(row), scale);
    c.className = "pod-fig";
    return c;
  }
  function tag(row) {
    var s = el("span", "pod-tag");
    var dev = !!(window.SJBadges && SJBadges.isDev(row.user_id));
    var gold = row.is_gold && !dev;   /* المطوّر: اسم أزرق مبرق بدل الذهبي */
    s.appendChild(el("span", gold ? "gold-txt" : "pod-name" + (dev ? " sj-devname" : ""), row.display_name || "?"));
    var b = window.SJBadges ? SJBadges.chips(row, 16) : null;
    if (b) s.appendChild(b);
    if (me && row.user_id === me.id) s.classList.add(gold ? "me-gold" : "me");
    return s;
  }
  function renderPodium(box, rows) {
    if (!box) return;
    rows = rows || [];
    var sig = currentLanguage() + "|" + (me ? me.id : "") + "|" + JSON.stringify(rows.map(function (r) {
      return [r.user_id, r.study_seconds, r.display_name, r.avatar_config, r.is_gold, r.badges];
    }));
    if (box._sig === sig) return;
    box._sig = sig;
    box.replaceChildren();
    if (!rows.length) return;

    var topRow = el("div", "pod-top");
    [1, 0, 2].forEach(function (i) {          // 2 - 1 - 3
      var r = rows[i];
      var col = el("div", "pod-col place-" + (i + 1));
      if (r) {
        col.appendChild(tag(r));
        col.appendChild(figure(r, i === 0 ? 4 : 3));
      } else {
        col.appendChild(el("div", "pod-gap"));
      }
      var step = el("div", "pod-step");
      step.appendChild(el("div", "pod-num", String(i + 1)));
      if (r) step.appendChild(el("div", "pod-hrs", fmtHours(r.study_seconds)));
      col.appendChild(step);
      topRow.appendChild(col);
    });
    box.appendChild(topRow);

    if (rows.length > 3) {
      var rest = el("div", "pod-rest");
      for (var i = 3; i < Math.min(rows.length, 10); i++) {
        var r = rows[i];
        var tile = el("div", "pod-tile");
        tile.appendChild(tag(r));
        tile.appendChild(figure(r, 2));
        var plat = el("div", "pod-plat");
        plat.appendChild(el("b", "pod-pnum", String(i + 1)));
        plat.appendChild(el("span", "pod-phrs", fmtHours(r.study_seconds)));
        tile.appendChild(plat);
        rest.appendChild(tile);
      }
      box.appendChild(rest);
    }
  }

  /* ---------- صفحة التخصيص ---------- */
  function say(txt) {
    var m = document.getElementById("czMsg");
    if (!m) return;
    m.textContent = txt;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(function () { m.textContent = ""; }, 2600);
  }
  function pick(k, id) {
    if (!SJAvatar.canUse(k, id, draft)) { say(t("czLocked")); return; }
    var next = Object.assign({}, draft);
    next[k] = id;
    draft = SJAvatar.normalize(next);   // عند تغيير الجنس ترجع القصّة والزي وغيرها لخيارات تناسبه
    render();
  }
  /* الأقسام الظاهرة: نخفي القسم إذا ما عنده غير خيار واحد (مثل اللحية للبنات) */
  function sections(name) {
    return TABS[name].filter(function (sec) {
      if (sec.k === "headc" && SJAvatar.options("head", draft).length < 2) return false;   // لون الحجاب للبنات فقط
      return SJAvatar.options(sec.k, draft).length > 1;
    });
  }
  function item(k, o, type, crop) {
    var locked = !SJAvatar.canUse(k, o.id, draft);
    var b = el("button", "cz-item" + (draft[k] === o.id ? " sel" : "") + (locked ? " locked" : ""));
    b.type = "button";
    if (type === "swatch") {
      b.classList.add("cz-sw");
      var dot = el("span", "cz-dot");
      dot.style.background = o.hex;
      b.appendChild(dot);
    } else {
      var test = Object.assign({}, draft);
      test[k] = o.id;
      if (k === "hair") { test.head = "none"; test.hat = "none"; }   // حتى تبين القصّة بدون حجاب أو قبعة فوقها
      if (k === "head" && o.id !== "none") test.hair = draft.hair;
      test = SJAvatar.normalize(test);
      b.appendChild(crop ? SJAvatar.make(test, 3, { y0: 0, y1: crop - 1 }) : SJAvatar.make(test, 2));
    }
    if (locked) { var pr = SJAvatar.price(k, o.id); b.appendChild(el("span", "cz-lock", "🔒" + (pr ? " " + pr : ""))); }
    b.addEventListener("click", function () { pick(k, o.id); });
    return b;
  }
  function render() {
    var stage = document.getElementById("czStage");
    var tabs = document.getElementById("czTabs");
    var opts = document.getElementById("czOptions");
    if (!stage || !draft) return;
    stage.replaceChildren(SJAvatar.make(draft, 6));

    tabs.replaceChildren();
    TAB_ORDER.forEach(function (name) {
      if (!sections(name).length) return;
      var b = el("button", "cz-tab" + (name === tab ? " active" : ""), t("czTab_" + name));
      b.type = "button";
      b.addEventListener("click", function () { tab = name; render(); });
      tabs.appendChild(b);
    });

    opts.replaceChildren();
    if (!sections(tab).length) tab = "body";
    sections(tab).forEach(function (sec) {
      opts.appendChild(el("div", "cz-sec", t("czSec_" + sec.k)));
      var grid = el("div", "cz-grid");
      SJAvatar.options(sec.k, draft).forEach(function (o) { grid.appendChild(item(sec.k, o, sec.type, sec.crop)); });
      opts.appendChild(grid);
    });
  }
  function open(keepDraft) {
    if (!keepDraft || !draft) {
      draft = SJAvatar.normalize((myProfile && myProfile.avatar_config) || SJAvatar.defaultFor(me && me.id));
      tab = "body";
    }
    render();
  }
  async function save() {
    if (saving || !draft) return;
    saving = true;
    var btn = document.getElementById("czSave");
    btn.disabled = true;
    var res = await supabaseClient.rpc("save_avatar", { cfg: draft });
    if (res.error) {
      say(t("czSaveFail"));
    } else {
      myProfile = myProfile || {};
      myProfile.avatar_config = Object.assign({}, draft);
      say(t("czSaved"));
    }
    btn.disabled = false;
    saving = false;
  }
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.getElementById("czSave");
    if (b) b.addEventListener("click", save);
  });

  return { renderPodium: renderPodium, open: open };
})();
