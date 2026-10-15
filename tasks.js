/* tasks.js - The Secrets of the Journey
   -------------------------------------------------------------------
   "My tasks" page (bottom tab bar, right next to Account).

   Three linked task lists, each with a real percentage:
     - Session : tasks of the CURRENT session only (a new session = a fresh list)
     - Week    : tasks of the current week (cleared every Sunday)
     - Month   : goals of the current month (cleared on the 1st of every month)

   Linking:  session task -> weekly task -> monthly goal
   Progress: a task WITHOUT linked tasks is 0% or 100% (the student ticks it);
             a task WITH linked tasks gets its % from them (average), so
             ticking session tasks automatically moves the weekly % and the
             monthly % too.

   The data lives in the Supabase table  tasks  (each student sees only
   his own rows - RLS). The reset days are decided by the database
   (Baghdad time): sj_task_periods().

   Needs in index.html:  #tasksView > #tasksRoot   #tabTasksLabel  (+ tasks.css)
   Needs from script.js: SJTasks.open() / setSession(id) / refreshLang()
   ------------------------------------------------------------------- */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STR = {
    ar: {
      tab: "مهامي",
      session: "السشن", week: "الأسبوع", month: "الشهر",
      title_session: "تقدّمي بهذا السشن", title_week: "تقدّمي هذا الأسبوع", title_month: "تقدّمي هذا الشهر",
      note_session: "تبدأ فاضية مع كل سشن جديد",
      note_week: "تنحذف كل يوم أحد",
      note_month: "تنحذف كل أول يوم من الشهر",
      ph_session: "مهمة لهذا السشن…", ph_week: "مهمة لهذا الأسبوع…", ph_month: "هدف لهذا الشهر…",
      link_session: "ربط بمهمة أسبوعية (اختياري)", link_week: "ربط بهدف شهري (اختياري)",
      add: "إضافة",
      empty: "ما في مهام بعد، أضف أول مهمة",
      noSession: "ما في سشن حالياً، انتظر السشن القادم لتضيف مهام",
      loading: "جارٍ التحميل…",
      loadFailed: "تعذّر تحميل المهام، حاول مرة ثانية",
      doneOf: "أنجزت {a} من {b}",
      kidsOf: "{a} من {b} مهام مرتبطة",
      linkedTo: "مرتبطة بـ",
      del: "حذف",
      confirmDelete: "في مهام ثانية مرتبطة بهذي المهمة. إذا حذفتها تنفك عنها، متأكد؟",
      error: "صار خطأ، حاول مرة ثانية",
    },
    en: {
      tab: "Tasks",
      session: "Session", week: "Week", month: "Month",
      title_session: "My progress this session", title_week: "My progress this week", title_month: "My progress this month",
      note_session: "Starts empty with every new session",
      note_week: "Cleared every Sunday",
      note_month: "Cleared on the 1st of every month",
      ph_session: "A task for this session…", ph_week: "A task for this week…", ph_month: "A goal for this month…",
      link_session: "Link to a weekly task (optional)", link_week: "Link to a monthly goal (optional)",
      add: "Add",
      empty: "No tasks yet, add your first one",
      noSession: "No session right now, wait for the next one to add tasks",
      loading: "Loading…",
      loadFailed: "Could not load tasks, please try again",
      doneOf: "{a} of {b} done",
      kidsOf: "{a} of {b} linked tasks",
      linkedTo: "Linked to",
      del: "Delete",
      confirmDelete: "Other tasks are linked to this one. If you delete it they will be unlinked. Are you sure?",
      error: "Something went wrong, please try again",
    },
    ckb: {
      tab: "ئەرکەکانم",
      session: "سیشن", week: "هەفتە", month: "مانگ",
      title_session: "پێشکەوتنم لەم سیشنە", title_week: "پێشکەوتنم لەم هەفتەیە", title_month: "پێشکەوتنم لەم مانگە",
      note_session: "لەگەڵ هەر سیشنێکی نوێ بەتاڵ دەبێتەوە",
      note_week: "هەموو یەکشەممەیەک دەسڕدرێتەوە",
      note_month: "لە یەکەمی هەر مانگێک دەسڕدرێتەوە",
      ph_session: "ئەرکێک بۆ ئەم سیشنە…", ph_week: "ئەرکێک بۆ ئەم هەفتەیە…", ph_month: "ئامانجێک بۆ ئەم مانگە…",
      link_session: "بیبەستەوە بە ئەرکێکی هەفتانە (ئارەزوومەندانە)", link_week: "بیبەستەوە بە ئامانجێکی مانگانە (ئارەزوومەندانە)",
      add: "زیادکردن",
      empty: "هێشتا ئەرکێک نییە، یەکەم ئەرک زیاد بکە",
      noSession: "ئێستا هیچ سیشنێک نییە، چاوەڕێی سیشنی داهاتوو بە بۆ زیادکردنی ئەرک",
      loading: "بار دەکرێت…",
      loadFailed: "نەتوانرا ئەرکەکان بار بکرێن، دووبارە هەوڵبدەرەوە",
      doneOf: "{a} لە {b} ئەنجامدرا",
      kidsOf: "{a} لە {b} ئەرکی بەستراو",
      linkedTo: "بەستراوەتەوە بە",
      del: "سڕینەوە",
      confirmDelete: "ئەرکی دیکە بەم ئەرکەوە بەستراوە. ئەگەر بیسڕیتەوە دەکرێنەوە. دڵنیایت؟",
      error: "هەڵەیەک ڕوویدا، دووبارە هەوڵبدەرەوە",
    },
  };

  var COLS = "id,kind,title,done,parent_id,session_id,week_start,month_start,created_at";
  var SCOPES = ["session", "week", "month"];
  var NS = "http://www.w3.org/2000/svg";
  var RING_C = 2 * Math.PI * 40;
  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var DEL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function lang() {
    var l = "ar";
    try { l = localStorage.getItem("lang") || "ar"; } catch (e) {}
    return STR[l] ? l : "ar";
  }
  function tr(key) { return STR[lang()][key] || STR.en[key] || key; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function client() { return typeof supabaseClient !== "undefined" ? supabaseClient : null; }

  /* ---------- state ---------- */
  var root = null, tabLabel = null;
  var ui = { seg: {} };
  var S = {
    scope: "session",
    sessionId: null,
    rows: [],
    periods: null,
    loaded: false,
    failed: false,
    loading: null,
    opened: false,
    adding: false,
    dayKey: "",
    draft: { session: "", week: "", month: "" },
    link: { session: "", week: "" },
  };

  /* ---------- data helpers ---------- */
  function byId(id) {
    for (var i = 0; i < S.rows.length; i++) if (S.rows[i].id === id) return S.rows[i];
    return null;
  }
  function kidsOf(id) {
    return S.rows.filter(function (r) { return r.parent_id === id; });
  }
  /* 0..1 : a task with linked tasks takes its % from them, otherwise done = 1 */
  function prog(row, depth) {
    depth = depth || 0;
    var k = depth < 4 ? kidsOf(row.id) : [];
    if (!k.length) return row.done ? 1 : 0;
    var sum = 0;
    k.forEach(function (c) { sum += prog(c, depth + 1); });
    return sum / k.length;
  }
  /* the tasks that belong to a tab right now */
  function listFor(scope) {
    var per = S.periods || {};
    return S.rows.filter(function (r) {
      if (r.kind !== scope) return false;
      if (scope === "month") return r.month_start === per.month_start;
      if (scope === "week") return r.week_start === per.week_start;
      return S.sessionId != null && String(r.session_id) === String(S.sessionId);
    });
  }
  function percent(scope) {
    var l = listFor(scope);
    if (!l.length) return 0;
    var s = 0;
    l.forEach(function (r) { s += prog(r); });
    return Math.round((s / l.length) * 100);
  }

  /* ---------- loading ---------- */
  function load() {
    var c = client();
    if (!c) return Promise.resolve();
    if (S.loading) return S.loading;
    S.dayKey = new Date().toDateString();
    S.loading = Promise.all([
      c.rpc("sj_task_periods"),
      c.from("tasks").select(COLS).order("created_at", { ascending: true }),
    ]).then(function (res) {
      var p = res[0], r = res[1];
      if (p.error || r.error) throw (p.error || r.error);
      S.periods = Array.isArray(p.data) ? p.data[0] : p.data;
      S.rows = r.data || [];
      S.loaded = true;
      S.failed = false;
    }).catch(function (e) {
      console.warn("tasks.js: could not load tasks", e);
      S.failed = true;
    }).then(function () {
      S.loading = null;
      renderAll();
    });
    return S.loading;
  }

  /* ---------- actions ---------- */
  function toggle(id) {
    var c = client(), r = byId(id);
    if (!c || !r) return;
    var prev = r.done;
    r.done = !prev;
    renderAll();
    c.from("tasks").update({ done: r.done }).eq("id", id).then(function (res) {
      if (res && res.error) { r.done = prev; renderAll(); alert(tr("error")); }
    });
  }

  function remove(id) {
    var c = client(), r = byId(id);
    if (!c || !r) return;
    if (kidsOf(id).length && !window.confirm(tr("confirmDelete"))) return;
    c.from("tasks").delete().eq("id", id).then(function (res) {
      if (res && res.error) { alert(tr("error")); return; }
      S.rows = S.rows.filter(function (x) { return x.id !== id; });
      S.rows.forEach(function (x) { if (x.parent_id === id) x.parent_id = null; }); // the database un-links them too
      renderAll();
    });
  }

  function add() {
    var c = client();
    if (!c || S.adding || !S.loaded) return;
    var title = ui.input.value.trim().slice(0, 120);
    if (!title) return;
    if (S.scope === "session" && S.sessionId == null) return;
    var row = { kind: S.scope, title: title };
    if (S.scope === "session") row.session_id = String(S.sessionId);
    if (S.scope !== "month" && ui.link.value) row.parent_id = ui.link.value;
    S.adding = true;
    renderForm();
    c.from("tasks").insert(row).select(COLS).single().then(function (res) {
      S.adding = false;
      if (!res || res.error || !res.data) { renderForm(); alert(tr("error")); return; }
      S.rows.push(res.data);
      ui.input.value = "";
      S.draft[S.scope] = "";
      renderAll();
      try { ui.input.focus(); } catch (e) {}
    });
  }

  function setScope(sc) {
    if (sc === S.scope) return;
    S.draft[S.scope] = ui.input.value;
    S.scope = sc;
    ui.input.value = S.draft[sc] || "";
    renderAll();
  }

  /* ---------- rendering ---------- */
  function applyStatic() {
    if (tabLabel) tabLabel.textContent = tr("tab");
  }

  function renderAll() {
    if (!root) return;
    renderSummary();
    renderList();
    renderForm();
  }

  function renderSummary() {
    SCOPES.forEach(function (sc) {
      var u = ui.seg[sc];
      u.label.textContent = tr(sc);
      u.pct.textContent = percent(sc) + "%";
      var on = sc === S.scope;
      u.btn.classList.toggle("active", on);
      u.btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    var l = listFor(S.scope);
    var pct = percent(S.scope);
    ui.ringFg.style.strokeDashoffset = String(RING_C * (1 - pct / 100));
    ui.ringTxt.textContent = pct + "%";
    var done = l.filter(function (r) { return prog(r) >= 1; }).length;
    ui.sumTitle.textContent = tr("title_" + S.scope);
    ui.sumSub.textContent = l.length ? tr("doneOf").replace("{a}", done).replace("{b}", l.length) : "";
    ui.sumNote.textContent = tr("note_" + S.scope);
  }

  function buildRow(r) {
    var k = kidsOf(r.id);
    var p = prog(r);
    var auto = k.length > 0;
    var li = el("li", "tk-item" + (p >= 1 ? " done" : ""));

    var lead;
    if (auto) {
      lead = el("span", "tk-auto", Math.round(p * 100) + "%");
    } else {
      lead = el("button", "tk-check");
      lead.type = "button";
      lead.setAttribute("role", "checkbox");
      lead.setAttribute("aria-checked", r.done ? "true" : "false");
      lead.setAttribute("aria-label", r.title);
      lead.innerHTML = CHECK_SVG;
      lead.addEventListener("click", function () { toggle(r.id); });
    }

    var body = el("div", "tk-body");
    body.appendChild(el("div", "tk-title", r.title));

    var meta = el("div", "tk-meta");
    var par = r.parent_id ? byId(r.parent_id) : null;
    if (par) meta.appendChild(el("span", "tk-chip", tr("linkedTo") + " " + par.title));
    if (auto) {
      var dn = k.filter(function (c) { return prog(c) >= 1; }).length;
      meta.appendChild(el("span", "", tr("kidsOf").replace("{a}", dn).replace("{b}", k.length)));
    }
    if (meta.childNodes.length) body.appendChild(meta);

    if (auto) {
      var bar = el("div", "tk-bar");
      var fill = el("i");
      fill.style.width = Math.round(p * 100) + "%";
      bar.appendChild(fill);
      body.appendChild(bar);
    }

    var del = el("button", "tk-del");
    del.type = "button";
    del.setAttribute("aria-label", tr("del"));
    del.title = tr("del");
    del.innerHTML = DEL_SVG;
    del.addEventListener("click", function () { remove(r.id); });

    li.append(lead, body, del);
    return li;
  }

  function renderList() {
    var l = listFor(S.scope);
    ui.list.replaceChildren();
    var msg = "";
    if (S.failed) msg = tr("loadFailed");
    else if (!S.loaded) msg = tr("loading");
    else if (S.scope === "session" && S.sessionId == null) msg = tr("noSession");
    else if (!l.length) msg = tr("empty");
    ui.empty.textContent = msg;
    ui.empty.hidden = !msg;
    if (S.failed || !S.loaded) return;
    l.forEach(function (r) { ui.list.appendChild(buildRow(r)); });
  }

  function renderForm() {
    var sc = S.scope;
    var locked = sc === "session" && S.sessionId == null;
    ui.input.placeholder = tr("ph_" + sc);
    ui.input.disabled = locked;
    ui.addBtn.textContent = tr("add");
    ui.addBtn.disabled = locked || !S.loaded || S.adding;
    var parentScope = sc === "session" ? "week" : sc === "week" ? "month" : null;
    ui.link.hidden = !parentScope;
    if (!parentScope) return;
    ui.link.replaceChildren();
    var o0 = el("option", "", tr("link_" + sc));
    o0.value = "";
    ui.link.appendChild(o0);
    listFor(parentScope).forEach(function (r) {
      if (r.done && !kidsOf(r.id).length) return; // a finished task cannot become a parent
      var o = el("option", "", r.title);
      o.value = r.id;
      ui.link.appendChild(o);
    });
    ui.link.value = S.link[sc] || "";
    if (ui.link.selectedIndex < 0) ui.link.selectedIndex = 0;
  }

  /* ---------- build the page once ---------- */
  function build() {
    /* summary card */
    var sumCard = el("div", "card tk-card");
    var seg = el("div", "tk-seg");
    seg.setAttribute("role", "tablist");
    SCOPES.forEach(function (sc) {
      var b = el("button", "tk-seg-btn");
      b.type = "button";
      b.setAttribute("role", "tab");
      var l = el("span");
      var p = el("b");
      b.append(l, p);
      b.addEventListener("click", function () { setScope(sc); });
      seg.appendChild(b);
      ui.seg[sc] = { btn: b, label: l, pct: p };
    });

    var sum = el("div", "tk-sum");
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 96 96");
    svg.setAttribute("class", "tk-ring");
    svg.setAttribute("aria-hidden", "true");
    function circ(cls) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", "48"); c.setAttribute("cy", "48"); c.setAttribute("r", "40");
      c.setAttribute("class", cls);
      return c;
    }
    var bg = circ("bg");
    var fg = circ("fg");
    fg.setAttribute("transform", "rotate(-90 48 48)");
    fg.style.strokeDasharray = String(RING_C);
    fg.style.strokeDashoffset = String(RING_C);
    var txt = document.createElementNS(NS, "text");
    txt.setAttribute("x", "48"); txt.setAttribute("y", "56"); txt.setAttribute("text-anchor", "middle");
    svg.append(bg, fg, txt);
    ui.ringFg = fg;
    ui.ringTxt = txt;

    var info = el("div", "tk-info");
    ui.sumTitle = el("div", "tk-sum-title");
    ui.sumSub = el("div", "tk-sum-sub");
    ui.sumNote = el("div", "muted tk-sum-note");
    info.append(ui.sumTitle, ui.sumSub, ui.sumNote);
    sum.append(svg, info);
    sumCard.append(seg, sum);

    /* list + add form card */
    var listCard = el("div", "card tk-card");
    ui.list = el("ul", "tk-list");
    ui.empty = el("div", "muted empty");
    ui.empty.hidden = true;

    var form = el("div", "tk-add");
    ui.link = el("select", "tk-link");
    ui.link.addEventListener("change", function () { S.link[S.scope] = ui.link.value; });
    var row = el("div", "tk-add-row");
    ui.input = el("input", "tk-input");
    ui.input.type = "text";
    ui.input.maxLength = 120;
    ui.input.autocomplete = "off";
    ui.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); add(); }
    });
    ui.addBtn = el("button", "tk-btn");
    ui.addBtn.type = "button";
    ui.addBtn.addEventListener("click", add);
    row.append(ui.input, ui.addBtn);
    form.append(ui.link, row);
    listCard.append(ui.list, ui.empty, form);

    root.replaceChildren(sumCard, listCard);
  }

  /* ---------- public ---------- */
  function open() {
    S.opened = true;
    load();
  }

  /* called by script.js every second with the id of the current / next session */
  function setSession(id) {
    id = id == null ? null : String(id);
    // the page stayed open across midnight: ask the database for the new week / month
    if (S.opened && S.dayKey && !S.loading && new Date().toDateString() !== S.dayKey) load();
    if (id === S.sessionId) return;
    S.sessionId = id;
    renderAll();
  }

  function refreshLang() {
    applyStatic();
    renderAll();
  }

  function mount() {
    tabLabel = document.getElementById("tabTasksLabel");
    root = document.getElementById("tasksRoot");
    applyStatic();
    if (!root) { console.warn("tasks.js: #tasksRoot not found in index.html"); return; }
    build();
    renderAll();
    var sel = document.getElementById("langSelect");
    // script.js saves the new language in its own listener; wait until it has run
    if (sel) sel.addEventListener("change", function () { setTimeout(refreshLang, 0); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  window.SJTasks = {
    open: open,
    setSession: setSession,
    refreshLang: refreshLang,
    _test: { S: S, prog: prog, percent: percent, listFor: listFor },
  };
})();
