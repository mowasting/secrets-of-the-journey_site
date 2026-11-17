const $ = (id) => document.getElementById(id);
const FUNCTIONS_URL = SUPABASE_URL + "/functions/v1";

let loginInProgress = false;
let me = null;
let myProfile = null;
let currentSession = null;
let joinedAtMs = null;
let reloading = false;
let tickTimer = null;
let pollTimer = null;
let coinsTimer = null;
let activeView = "live";
let catInit = false;
let myFlair = { is_gold: false, equipped: [] };

/* ---------- فتح الميزات حسب ساعات الدراسة ---------- */
const UNLOCK_HOURS = { forest: 50, tasks: 50, youtube: 70 };
const UNLOCK_BYPASS = false;   // true = يفتح كلشي للتجربة فقط
let myStudySecs = 0, hoursLoaded = false, hoursTimer = null;
let unlockAll = false;   // يتفعّل من قاعدة البيانات لحسابات معيّنة فقط (عمود users.unlock_all)
async function loadUnlockAll() {
  try {
    const { data, error } = await supabaseClient.rpc("my_unlock_all");
    unlockAll = !error && data === true;
  } catch (e) { unlockAll = false; }
}
function featureUnlocked(name) {
  if (UNLOCK_BYPASS || unlockAll) return true;
  return hoursLoaded && myStudySecs >= (UNLOCK_HOURS[name] || 0) * 3600;
}

/* ---------- اللغات ---------- */
const I18N = {
  ar: {
    welcome: "أهلاً بعودتك", subtitle: "سجّل دخولك لتكمل رحلتك الدراسية.",
    continue: "المتابعة عبر تيليجرام",
    loginNote: "سيُستخدم حساب تيليجرام الخاص بك للتحقق من هويتك بشكل آمن.",
    navLive: "السشن المباشر", navRank: "أفضل 10", navAccount: "حسابي", navAdmin: "لوحة الأدمن", logout: "تسجيل الخروج",
    hello: "أهلاً", noSession: "ما في سشن حالياً", startsIn: "السشن القادم يبدأ بعد",
    endsIn: "السشن ينتهي بعد", studyEndsIn: "وقت الدراسة ينتهي بعد", breakEndsIn: "الراحة تنتهي بعد",
    join: "انضمام للسشن", joined: "تم انضمامك ✅", joinedAt: "انضممت الساعة", sessionEnded: "انتهى السشن الحالي",
    top5: "أفضل 5 هذا الأسبوع", top5Empty: "لا أحد درس هذا الأسبوع بعد، كن الأول!",
    rankTitle: "الترتيب العام", hoursUnit: "س",
    hUnit: "ساعة", mUnit: "دقيقة", and: "و",
    statHours: "مجموع ساعات الدراسة", statRank: "ترتيبي", statSessions: "السشنات التي حضرتها",
    opening: "جارٍ فتح تيليجرام...", waiting: "بانتظار تيليجرام...",
    loginFailed: "فشل تسجيل الدخول أو انتهت المهلة. حاول مرة ثانية.",
    joinFailed: "تعذّر الانضمام. حاول مرة ثانية.", student: "طالب",
    progressTitle: "تقدّمي", periodWeek: "أسبوعي", periodMonth: "شهري", progTotal: "المجموع",
    top10: "أفضل 10 هذا الأسبوع",
    czOpen: "تخصيص الشخصية", czTitle: "تخصيص الشخصية", czSave: "حفظ الشخصية", czSaved: "تم الحفظ ✅",
    czSaveFail: "تعذّر الحفظ، حاول مرة ثانية.", czLocked: "هذا العنصر يُفتح بالعملات 🔒",
    czTab_extras: "إكسسوارات", czSec_glasses: "النظارات", czSec_hat: "القبعات", czTab_body: "الجسم", czTab_skin: "البشرة", czTab_face: "الوجه", czTab_hair: "الشعر", czTab_beard: "اللحية", czTab_outfit: "الأزياء",
    czSec_gender: "الجنس", czSec_head: "الحجاب", czSec_headc: "لون الحجاب", czSec_skin: "لون البشرة", czSec_eyes: "العيون", czSec_eyec: "لون العين", czSec_mouth: "الفم",
    czSec_hair: "الشكل", czSec_hairc: "لون الشعر", czSec_beard: "اللحية", czSec_outfit: "الأزياء",
    lockNeed: "تنفتح بعد {h} ساعة دراسة", lockHave: "ساعاتك", lockLeft: "الباقي", lockOk: "تمام",
    lockFeat_forest: "تقدّمي", lockFeat_tasks: "مهامي", lockFeat_youtube: "YouTube",
    coinsTitle: "عملاتي", coinsRule1: "كل سشن تنضم له = عملتين", coinsRule2: "5 سشنات متتالية = 20 عملة إضافية",
    accSettings: "الإعدادات", accLang: "اللغة", accPalette: "الألوان", accTheme: "الثيم",
    creditLead: "تم تصميم وبرمجة هذا الموقع بواسطة", creditName: "محمد",
    creditHint: "اضغط على الاسم للاقتراحات أو الإبلاغ عن مشكلة",
  },
  en: {
    welcome: "Welcome back", subtitle: "Sign in to continue your study journey.",
    continue: "Continue with Telegram",
    loginNote: "Your Telegram account will be used to securely verify your identity.",
    navLive: "Live Session", navRank: "Top 10", navAccount: "Account", navAdmin: "Admin", logout: "Log out",
    hello: "Hello", noSession: "No session right now", startsIn: "Next session starts in",
    endsIn: "Session ends in", studyEndsIn: "Study time ends in", breakEndsIn: "Break ends in",
    join: "Join session", joined: "You joined ✅", joinedAt: "Joined at", sessionEnded: "The current session has ended",
    top5: "Top 5 this week", top5Empty: "No one has studied this week yet. Be the first!",
    rankTitle: "Overall ranking", hoursUnit: "h",
    hUnit: "h", mUnit: "min", and: "",
    statHours: "Total study hours", statRank: "My rank", statSessions: "Sessions attended",
    opening: "Opening Telegram...", waiting: "Waiting for Telegram...",
    loginFailed: "Login failed or expired. Please try again.",
    joinFailed: "Could not join. Please try again.", student: "Student",
    progressTitle: "My progress", periodWeek: "Weekly", periodMonth: "Monthly", progTotal: "Total",
    top10: "Top 10 this week",
    czOpen: "Customize character", czTitle: "Customize character", czSave: "Save character", czSaved: "Saved ✅",
    czSaveFail: "Could not save. Please try again.", czLocked: "Unlocks with coins 🔒",
    czTab_extras: "Extras", czSec_glasses: "Glasses", czSec_hat: "Hats", czTab_body: "Body", czTab_skin: "Skin", czTab_face: "Face", czTab_hair: "Hair", czTab_beard: "Beard", czTab_outfit: "Outfits",
    czSec_gender: "Gender", czSec_head: "Headscarf", czSec_headc: "Headscarf color", czSec_skin: "Skin tone", czSec_eyes: "Eyes", czSec_eyec: "Eye color", czSec_mouth: "Mouth",
    czSec_hair: "Style", czSec_hairc: "Hair color", czSec_beard: "Beard", czSec_outfit: "Outfits",
    lockNeed: "Unlocks after {h} study hours", lockHave: "Your hours", lockLeft: "Left", lockOk: "OK",
    lockFeat_forest: "My progress", lockFeat_tasks: "Tasks", lockFeat_youtube: "YouTube",
    coinsTitle: "My coins", coinsRule1: "Every session you join = 2 coins", coinsRule2: "5 sessions in a row = 20 bonus coins",
    accSettings: "Settings", accLang: "Language", accPalette: "Colors", accTheme: "Theme",
    creditLead: "This site was designed and developed by", creditName: "Mohammed",
    creditHint: "Tap the name for suggestions or to report a problem",
  },
  ckb: {
    welcome: "بەخێربێیتەوە", subtitle: "بچۆ ژوورەوە بۆ بەردەوامبوون لە گەشتی خوێندنەکەت.",
    continue: "بەردەوامبوون بە تێلێگرام",
    loginNote: "ئەکاونتی تێلێگرامەکەت بۆ سەلماندنی ناسنامەکەت بە شێوەیەکی سەلامەت بەکاردێت.",
    navLive: "سیشنی ڕاستەوخۆ", navRank: "باشترین ١٠", navAccount: "هەژمارەکەم", navAdmin: "بەڕێوەبەر", logout: "چوونەدەرەوە",
    hello: "سڵاو", noSession: "ئێستا هیچ سیشنێک نییە", startsIn: "سیشنی داهاتوو دەست پێدەکات دوای",
    endsIn: "سیشن کۆتایی دێت دوای", studyEndsIn: "کاتی خوێندن کۆتایی دێت دوای", breakEndsIn: "پشوو کۆتایی دێت دوای",
    join: "بەشداربوون", joined: "بەشداریت کردووە ✅", joinedAt: "کاتی بەشداربوون", sessionEnded: "سیشنی ئێستا کۆتایی هات",
    top5: "باشترین ٥ ئەم هەفتەیە", top5Empty: "هێشتا کەس ئەم هەفتەیە نەخوێندووە. یەکەم کەس بە!",
    rankTitle: "ڕیزبەندی گشتی", hoursUnit: "کاتژمێر",
    hUnit: "کاتژمێر", mUnit: "خولەک", and: "و",
    statHours: "کۆی کاتژمێرەکانی خوێندن", statRank: "ڕیزبەندیم", statSessions: "ئەو سیشنانەی ئامادەبووم",
    opening: "تێلێگرام دەکرێتەوە...", waiting: "چاوەڕێی تێلێگرام...",
    loginFailed: "چوونەژوورەوە سەرکەوتوو نەبوو یان کاتەکەی تەواو بوو. دووبارە هەوڵبدەرەوە.",
    joinFailed: "بەشداریکردن سەرکەوتوو نەبوو. دووبارە هەوڵبدەرەوە.", student: "خوێندکار",
    progressTitle: "پێشکەوتنم", periodWeek: "هەفتانە", periodMonth: "مانگانە", progTotal: "کۆی گشتی",
    top10: "باشترین ١٠ ئەم هەفتەیە",
    czOpen: "دیزاینی کارەکتەر", czTitle: "دیزاینی کارەکتەر", czSave: "پاشەکەوتکردنی کارەکتەر", czSaved: "پاشەکەوت کرا ✅",
    czSaveFail: "پاشەکەوت نەکرا. دووبارە هەوڵبدەرەوە.", czLocked: "بە دراو دەکرێتەوە 🔒",
    czTab_extras: "ئاکسسوار", czSec_glasses: "چاویلکە", czSec_hat: "کڵاو", czTab_body: "جەستە", czTab_skin: "پێست", czTab_face: "ڕوخسار", czTab_hair: "قژ", czTab_beard: "ڕیش", czTab_outfit: "جل و بەرگ",
    czSec_gender: "ڕەگەز", czSec_head: "حیجاب", czSec_headc: "ڕەنگی حیجاب", czSec_skin: "ڕەنگی پێست", czSec_eyes: "چاو", czSec_eyec: "ڕەنگی چاو", czSec_mouth: "دەم",
    czSec_hair: "شێواز", czSec_hairc: "ڕەنگی قژ", czSec_beard: "ڕیش", czSec_outfit: "جل و بەرگ",
    lockNeed: "دوای {h} کاتژمێری خوێندن دەکرێتەوە", lockHave: "کاتژمێرەکانت", lockLeft: "ماوە", lockOk: "باشە",
    lockFeat_forest: "پێشکەوتنم", lockFeat_tasks: "ئەرکەکانم", lockFeat_youtube: "YouTube",
    coinsTitle: "دراوەکانم", coinsRule1: "هەر سیشنێک بەشداری تێدا بکەیت = ٢ دراو", coinsRule2: "٥ سیشنی بەدوای یەک = ٢٠ دراوی زیادە",
    accSettings: "ڕێکخستنەکان", accLang: "زمان", accPalette: "ڕەنگەکان", accTheme: "ڕووکار",
    creditLead: "ئەم ماڵپەڕە دیزاین و پڕۆگرام کراوە لەلایەن", creditName: "محەمەد",
    creditHint: "کرتە لە ناوەکە بکە بۆ پێشنیار یان ڕاپۆرتکردنی کێشە",
  },
};

function currentLanguage() {
  const saved = localStorage.getItem("lang");
  return ["ar", "en", "ckb"].includes(saved) ? saved : "ar";
}
function t(key) {
  const l = I18N[currentLanguage()];
  return l[key] || I18N.en[key] || key;
}
function applyLang() {
  const l = currentLanguage();
  document.documentElement.lang = l;
  document.documentElement.dir = l === "en" ? "ltr" : "rtl";
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  $("langSelect").value = l;
  if ($("langSelectLogin")) $("langSelectLogin").value = l;
  if (window.SJSound) SJSound.refreshLang();
  if (window.SJTasks) SJTasks.refreshLang();
  if (window.SJMarket) SJMarket.refreshLang();
  if (window.SJForest) SJForest.refreshLang();
  if (me) {
    renderStatus();
    if (activeView === "rank") { loadPodium(); loadRank(null, $("rankList")); }
    if (activeView === "account") loadAccount();
    if (activeView === "customize" && window.SJAvatarUI) SJAvatarUI.open(true);
  }
}

/* ---------- أدوات ---------- */
function callFunction(name, body) {
  return fetch(FUNCTIONS_URL + "/" + name, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json()).catch(() => ({ status: "error" }));
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/* ---------- ستايل الواجهة الجديدة (العملات + الإعدادات + معلومات المطوّر) ---------- */
function injectUiCss() {
  if (document.getElementById("sjUiCss")) return;
  const s = document.createElement("style");
  s.id = "sjUiCss";
  s.textContent =
    ".coins-btn{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;border:1px solid rgba(224,165,38,.7);background:rgba(224,165,38,.16);color:inherit;font:inherit;font-weight:800;cursor:pointer;transition:transform .15s}" +
    ".coins-btn[hidden]{display:none}.coins-btn:active{transform:scale(.94)}.coins-btn svg{width:20px;height:20px;flex:0 0 auto}" +
    ".coins-big{font-size:2.2rem;font-weight:800;margin:6px 0 10px}" +
    ".gear-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;padding:0;border-radius:10px;border:1px solid rgba(0,0,0,.18);background:linear-gradient(145deg,#e6e8ec,#a3a8b0);box-shadow:0 1px 3px rgba(0,0,0,.3);cursor:pointer;transition:transform .2s}" +
    ".gear-btn[hidden]{display:none}.gear-btn svg{width:22px;height:22px}.gear-btn:hover svg{animation:sjGear 1.2s linear infinite}.gear-btn:active{transform:scale(.92)}" +
    "@keyframes sjGear{to{transform:rotate(360deg)}}" +
    "@keyframes sjFlash{0%,100%{box-shadow:none}50%{box-shadow:0 0 0 3px rgba(224,165,38,.8)}}.flash-card{animation:sjFlash 1s ease 2}" +
    ".topbar .top-actions{display:flex;align-items:center;gap:10px}" +
    ".set-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid rgba(127,127,127,.2)}" +
    ".set-row:last-child{border-bottom:0}" +
    ".set-row select,.login-lang{background:transparent;color:inherit;border:1px solid rgba(127,127,127,.45);border-radius:10px;padding:7px 12px;font:inherit;cursor:pointer}" +
    ".set-row select option,.login-lang option{color:#222;background:#fff}" +
    ".login-lang{display:block;margin:16px auto 0}" +
    ".set-ctl{margin:0 !important;flex:0 0 auto;position:relative}" +
    ".credit-card{text-align:center}.credit-line{font-weight:600;line-height:1.9}" +
    ".credit-link{color:#2b8cff !important;font-weight:800;text-decoration:none;margin-inline-start:4px}" +
    ".credit-link:hover{text-decoration:underline}.credit-hint{margin-top:6px;font-size:.85rem}";
  document.head.appendChild(s);
}

/* ---------- العملات (فوق بكل الصفحات) ---------- */
function updateCoinsBadge(n) {
  const e = $("coinsNum");
  if (e) e.textContent = String(Number(n) || 0);
}
async function refreshCoins() {
  if (!me) return;
  const { data, error } = await supabaseClient.rpc("get_shop");
  if (!error && data) updateCoinsBadge(data.points);
}
function openCoinsModal() {
  injectLockCss();
  const ov = document.createElement("div");
  ov.className = "sj-lock-ov";
  const box = document.createElement("div");
  box.className = "sj-lock-box";
  const h = document.createElement("h3");
  const big = document.createElement("div");
  big.className = "coins-big";
  const r1 = document.createElement("p");
  const r2 = document.createElement("p");
  const ok = document.createElement("button");
  ok.className = "primary";
  ok.type = "button";
  box.append(h, big, r1, r2, ok);
  ov.appendChild(box);
  h.textContent = t("coinsTitle");
  big.textContent = $("coinsNum").textContent;
  r1.textContent = "🪙 " + t("coinsRule1");
  r2.textContent = "🔥 " + t("coinsRule2");
  ok.textContent = t("lockOk");
  ok.addEventListener("click", () => ov.remove());
  ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
  document.body.appendChild(ov);
  refreshCoins().then(() => { big.textContent = $("coinsNum").textContent; });
}
$("coinsBtn").addEventListener("click", openCoinsModal);
$("settingsBtn").addEventListener("click", () => {
  setView("account");
  setTimeout(() => {
    const c = $("settingsCard");
    if (!c) return;
    c.scrollIntoView({ behavior: "smooth", block: "center" });
    c.classList.remove("flash-card");
    void c.offsetWidth;
    c.classList.add("flash-card");
  }, 80);
});

/* ---------- ساعات الدراسة وقفل الميزات ---------- */
function injectLockCss() {
  if (document.getElementById("sjLockCss")) return;
  const s = document.createElement("style");
  s.id = "sjLockCss";
  s.textContent =
    ".tab-item{position:relative}.tab-lock{position:absolute;top:2px;inset-inline-end:calc(50% - 22px);font-size:10px;line-height:1}" +
    ".tab-item:not(.locked) .tab-lock{display:none}.tab-item.locked svg{opacity:.45}" +
    ".sj-lock-ov{position:fixed;inset:0;z-index:2147483100;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,12,28,.72)}" +
    ".sj-lock-box{width:min(360px,100%);background:var(--card,#fff);color:var(--text,#17233d);border-radius:20px;padding:22px;text-align:center;box-shadow:0 20px 70px #0006}" +
    ".sj-lock-box h3{margin:0 0 8px;font-size:1.15rem}.sj-lock-box p{margin:6px 0}" +
    ".sj-lock-bar{height:10px;border-radius:99px;background:rgba(127,127,127,.25);overflow:hidden;margin:14px 0}" +
    ".sj-lock-bar i{display:block;height:100%;background:var(--accent,#b8955a);border-radius:99px;transition:width .5s}" +
    ".sj-lock-box button{margin-top:12px}";
  document.head.appendChild(s);
}
async function refreshHours() {
  if (!me) return;
  const { data, error } = await supabaseClient.rpc("get_rank", {});
  if (error || !data) return;
  const row = data.find((r) => r.user_id === me.id);
  myStudySecs = row ? Number(row.study_seconds) || 0 : 0;
  hoursLoaded = true;
  applyLocks();
}
function applyLocks() {
  injectLockCss();
  [["forest", '.tab-item[data-view="forest"]'], ["tasks", '.tab-item[data-view="tasks"]'], ["youtube", "#youtubeNavBtn"]].forEach((p) => {
    const b = document.querySelector(p[1]);
    if (!b) return;
    if (!b.querySelector(".tab-lock")) {
      const badge = document.createElement("span");
      badge.className = "tab-lock";
      badge.textContent = "🔒";
      b.appendChild(badge);
    }
    b.classList.toggle("locked", !featureUnlocked(p[0]));
  });
}
function openLockModal(name, onUnlocked) {
  injectLockCss();
  const need = UNLOCK_HOURS[name];
  const ov = document.createElement("div");
  ov.className = "sj-lock-ov";
  const box = document.createElement("div");
  box.className = "sj-lock-box";
  const h = document.createElement("h3");
  const l1 = document.createElement("p");
  const bar = document.createElement("div");
  bar.className = "sj-lock-bar";
  const fill = document.createElement("i");
  bar.appendChild(fill);
  const l2 = document.createElement("p");
  const l3 = document.createElement("p");
  const ok = document.createElement("button");
  ok.className = "primary";
  ok.type = "button";
  box.append(h, l1, bar, l2, l3, ok);
  ov.appendChild(box);
  function paint() {
    h.textContent = t("lockFeat_" + name) + " 🔒";
    l1.textContent = t("lockNeed").replace("{h}", need);
    fill.style.width = Math.min(100, (myStudySecs / (need * 3600)) * 100) + "%";
    l2.textContent = t("lockHave") + ": " + fmtHours(myStudySecs);
    l3.textContent = t("lockLeft") + ": " + fmtHours(Math.max(0, need * 3600 - myStudySecs));
    ok.textContent = t("lockOk");
  }
  ok.addEventListener("click", () => ov.remove());
  ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
  paint();
  document.body.appendChild(ov);
  refreshHours().then(() => {
    if (featureUnlocked(name)) { ov.remove(); if (onUnlocked) onUnlocked(); } else paint();
  });
}

async function pollLogin(token, pollSecret) {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    await sleep(2000);
    const result = await callFunction("login-status", { token, pollSecret });
    if (result.status !== "pending") return result;
  }
  return { status: "expired" };
}

function avatarUrl(path) {
  return supabaseClient.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}
function makeAvatar(path, name, big) {
  const box = document.createElement("div");
  box.className = "avatar" + (big ? " big" : "");
  if (path) {
    const img = document.createElement("img");
    img.alt = "";
    img.src = avatarUrl(path);
    box.appendChild(img);
  } else {
    box.textContent = (name || "?").trim().charAt(0).toUpperCase();
  }
  return box;
}
function myName() {
  return (myProfile && (myProfile.first_name || myProfile.username)) || t("student");
}
function setText(el, txt) { if (el && el.textContent !== txt) el.textContent = txt; }
function pad(n) { return String(n).padStart(2, "0"); }
function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return pad(Math.floor(s / 3600)) + ":" + pad(Math.floor((s % 3600) / 60)) + ":" + pad(s % 60);
}
/* مدة الدراسة بالساعات والدقائق: "1 ساعة و 12 دقيقة" (بدون أرقام عشرية) */
function fmtHours(secs) {
  const totalMin = Math.floor((Number(secs) || 0) / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const parts = [];
  if (h > 0) parts.push(h + " " + t("hUnit"));
  if (m > 0 || h === 0) parts.push(m + " " + t("mUnit"));
  const glue = t("and") ? " " + t("and") + " " : " ";
  return parts.join(glue);
}

/* ---------- الساعة الحقيقية ---------- */
function updateClock() {
  const el = $("clock");
  if (el) el.textContent = new Date().toLocaleTimeString("en-GB", { hour12: false });
}

/* ---------- السشن المباشر ---------- */
async function loadSession() {
  const { data } = await supabaseClient
    .from("sessions")
    .select("id, starts_at, ends_at, break_starts_at, break_ends_at")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  // نبقي حالة الانضمام القديمة لحد ما يرجع الرد الجديد (حتى ما يومض الزر)
  let joined = (data && currentSession && data.id === currentSession.id) ? joinedAtMs : null;
  if (data && me) {
    const { data: a, error } = await supabaseClient
      .from("attendance").select("joined_at")
      .eq("session_id", data.id).eq("user_id", me.id).maybeSingle();
    if (!error) joined = a ? new Date(a.joined_at).getTime() : null;
  }
  currentSession = data || null;
  joinedAtMs = data ? joined : null;
  renderStatus();
}

function renderStatus() {
  const s = currentSession;
  const now = Date.now();
  let label = t("noSession"), target = null, canJoin = false, phase = "study";
  let soundPhase = "none"; // للصوت: none | wait | study | break | ended

  if (s) {
    const st = +new Date(s.starts_at), en = +new Date(s.ends_at);
    const bs = s.break_starts_at ? +new Date(s.break_starts_at) : null;
    const be = s.break_ends_at ? +new Date(s.break_ends_at) : null;
    if (now >= en) {
      soundPhase = "ended";
      if (!reloading) { reloading = true; loadSession().finally(() => (reloading = false)); }
    } else if (now < st) {
      soundPhase = "wait";
      label = t("startsIn"); target = st;
    } else if (bs && be && now >= bs && now < be) {
      // وقت الراحة (بنهاية السشن): العد التنازلي لحد ما تخلص الراحة
      soundPhase = "break";
      label = t("breakEndsIn"); target = be; canJoin = false; phase = "break";
    } else if (bs && be) {
      // وقت الدراسة: العد التنازلي لحد ما تبدأ الراحة
      soundPhase = "study";
      label = t("studyEndsIn"); target = bs; canJoin = true;
    } else {
      soundPhase = "study";
      label = t("endsIn"); target = en; canJoin = true;
    }
  }

  if (window.SJCat) { SJCat.set(phase, !catInit); catInit = true; }
  // صوت بداية السشن ونهايته (sound.js)
  if (window.SJSound) SJSound.watch(soundPhase, s ? s.id : null);
  // مهام السشن الحالي (tasks.js)
  if (window.SJTasks) SJTasks.setSession(s ? s.id : null);

  setText($("statusLabel"), label);
  setText($("countdown"), target ? fmtClock(target - now) : "--:--:--");

  const btn = $("joinBtn");
  if (joinedAtMs) {
    setText(btn, phase === "break" ? t("sessionEnded") : t("joined"));
    btn.disabled = true;
    setText($("joinedInfo"), t("joinedAt") + " " +
      new Date(joinedAtMs).toLocaleTimeString(currentLanguage() === "en" ? "en" : "ar-IQ", { hour: "2-digit", minute: "2-digit" }));
  } else {
    setText(btn, phase === "break" ? t("sessionEnded") : t("join"));
    btn.disabled = !canJoin;
    setText($("joinedInfo"), "");
  }
}

$("joinBtn").addEventListener("click", async () => {
  $("joinBtn").disabled = true;
  const { error } = await supabaseClient.rpc("join_current_session");
  if (error) alert(t("joinFailed"));
  await loadSession();
  refreshCoins();
});

/* ---------- الترتيب ---------- */
/* ترتيب ثابت: الأكثر وقتاً أولاً، وعند التعادل بالاسم */
function sortRows(rows) {
  return [...rows].sort((a, b) =>
    (Number(b.study_seconds) || 0) - (Number(a.study_seconds) || 0) ||
    String(a.display_name || "").localeCompare(String(b.display_name || "")));
}
function renderRank(el, rows) {
  const sig = currentLanguage() + "|" + (me ? me.id : "") + "|" +
    JSON.stringify(rows.map((r) => [r.user_id, r.study_seconds, r.display_name, r.avatar_path, r.is_gold, r.badges]));
  if (el._sig === sig) return;
  el._sig = sig;
  el.replaceChildren();
  sortRows(rows).forEach((r, i) => {
    const place = i + 1;
    const li = document.createElement("li");
    if (me && r.user_id === me.id) li.classList.add("me");
    if (place <= 3) li.classList.add("rank-" + place);
    const pos = document.createElement("span");
    pos.className = "pos";
    pos.textContent = place;
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = r.display_name;
    const isDev = window.SJBadges && SJBadges.isDev(r.user_id);
    if (isDev) name.classList.add("sj-devname");
    else if (r.is_gold) name.classList.add("gold-name");
    const bdg = window.SJBadges ? SJBadges.chips(r, 20) : null;
    const hrs = document.createElement("span");
    hrs.className = "hrs";
    hrs.textContent = fmtHours(r.study_seconds);
    li.append(pos, makeAvatar(r.avatar_path, r.display_name), name);
    if (bdg) li.appendChild(bdg);
    li.appendChild(hrs);
    el.appendChild(li);
  });
}
async function loadRank(limit, el) {
  const args = limit ? { limit_count: limit } : {};
  let { data, error } = await supabaseClient.rpc("get_rank_v2", args);
  if (error) ({ data, error } = await supabaseClient.rpc("get_rank", args));   // احتياط إذا SQL الشارات ما انشغّل بعد
  if (!error && data) renderRank(el, data);
}
/* مدرج أفضل 10 للأسبوع الحالي */
async function loadPodium() {
  const { data, error } = await supabaseClient.rpc("get_week_rank_v2", { limit_count: 10 });
  if (error || !data) return;
  if (window.SJAvatarUI) SJAvatarUI.renderPodium($("podium"), sortRows(data).slice(0, 10));
  $("top10Empty").hidden = data.length > 0;
}

/* ---------- اسمي الذهبي (إذا كنت بطل أسبوع سابق) ---------- */
function applyFlair() {
  ["meName", "accName"].forEach((id) => {
    const e = $(id);
    if (!e) return;
    const dev = !!(me && window.SJBadges && SJBadges.isDev(me.id));
    e.classList.toggle("sj-devname", dev);
    e.classList.toggle("gold-name", !!myFlair.is_gold && !dev);
  });
}
async function loadFlair() {
  const { data, error } = await supabaseClient.rpc("get_my_flair");
  if (!error && data && data[0]) myFlair = data[0];
  applyFlair();
}

/* ---------- صفحة الحساب ---------- */
async function loadAccount() {
  const name = myName();
  $("accAvatarBox").replaceChildren(makeAvatar(myProfile && myProfile.avatar_path, name, true));
  $("accName").textContent = name;
  $("accUser").textContent = myProfile && myProfile.username ? "@" + myProfile.username : "";
  applyFlair();

  const { data } = await supabaseClient.rpc("get_rank", {});
  const sorted = sortRows(data || []);
  const idx = sorted.findIndex((r) => r.user_id === me.id);
  const row = idx >= 0 ? sorted[idx] : null;
  $("accHours").textContent = fmtHours(row ? row.study_seconds : 0);
  $("accRank").textContent = row ? "#" + (idx + 1) : "-";
  myStudySecs = row ? Number(row.study_seconds) || 0 : 0; hoursLoaded = true; applyLocks();

  const { count } = await supabaseClient
    .from("attendance").select("id", { count: "exact", head: true }).eq("user_id", me.id);
  $("accSessions").textContent = count || 0;
  loadProgress();
}

/* ---------- مخطط التقدّم ---------- */
let progressPeriod = "week";
function chartLocale() {
  return { ar: "ar-IQ", en: "en", ckb: "ckb" }[currentLanguage()] || "ar-IQ";
}
function dayLabel(dateStr, period) {
  const d = new Date(dateStr + "T12:00:00");
  if (period === "month") return String(d.getDate());
  try { return d.toLocaleDateString(chartLocale(), { weekday: "short" }); }
  catch (e) { return d.toLocaleDateString("ar-IQ", { weekday: "short" }); }
}
async function loadProgress() {
  const period = progressPeriod;
  const { data, error } = await supabaseClient.rpc("get_my_progress", { period });
  if (error || !data) return;
  const values = data.map((r) => Number(r.total_secs));
  const max = Math.max(0, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  $("progTotal").textContent = t("progTotal") + ": " + fmtHours(total);
  const chart = $("progChart");
  chart.replaceChildren();
  chart.classList.toggle("month", period === "month");
  data.forEach((r, i) => {
    const secs = values[i];
    const col = document.createElement("div");
    col.className = "prog-col";
    col.title = fmtHours(secs);
    const track = document.createElement("div");
    track.className = "prog-track";
    const bar = document.createElement("div");
    bar.className = "prog-bar";
    bar.style.height = (max > 0 ? Math.max(3, (secs / max) * 100) : 3) + "%";
    track.appendChild(bar);
    const lab = document.createElement("div");
    lab.className = "prog-label";
    const show = period === "week" || i === 0 || (i + 1) % 5 === 0;
    lab.textContent = show ? dayLabel(r.study_day, period) : "";
    col.append(track, lab);
    chart.appendChild(col);
  });
}
function setPeriod(p) {
  progressPeriod = p;
  $("progWeek").classList.toggle("active", p === "week");
  $("progMonth").classList.toggle("active", p === "month");
  loadProgress();
}
$("progWeek").addEventListener("click", () => setPeriod("week"));
$("progMonth").addEventListener("click", () => setPeriod("month"));

/* ---------- التنقل (الشريط السفلي) ---------- */
function setView(name) {
  if ((name === "forest" || name === "tasks") && !featureUnlocked(name)) { openLockModal(name, () => setView(name)); return; }
  activeView = name;
  $("liveView").hidden = name !== "live";
  $("rankView").hidden = name !== "rank";
  $("accountView").hidden = name !== "account";
  $("tasksView").hidden = name !== "tasks";
  $("customizeView").hidden = name !== "customize";
  $("marketView").hidden = name !== "market";
  $("forestView").hidden = name !== "forest";
  document.querySelectorAll(".tab-item[data-view]").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === (name === "customize" ? "account" : name)));
  if (name === "rank") { loadPodium(); loadRank(null, $("rankList")); }
  if (name === "customize" && window.SJAvatarUI) SJAvatarUI.open();
  if (name === "market" && window.SJMarket) SJMarket.open();
  if (name === "forest" && window.SJForest) SJForest.open();
  if (name === "account") loadAccount();
  if (name === "tasks" && window.SJTasks) SJTasks.open();
  window.scrollTo(0, 0);
}
document.querySelectorAll(".tab-item[data-view]").forEach((b) =>
  b.addEventListener("click", () => setView(b.dataset.view)));
$("customizeBtn").addEventListener("click", () => setView("customize"));
$("czBack").addEventListener("click", () => setView("account"));

$("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});
["langSelect", "langSelectLogin"].forEach((id) => {
  const sel = $(id);
  if (!sel) return;
  sel.addEventListener("change", (e) => {
    localStorage.setItem("lang", e.target.value);
    applyLang();
  });
});

/* ---------- الدخول للموقع ---------- */
async function enterApp() {
  const { data } = await supabaseClient.auth.getSession();
  const user = data.session ? data.session.user : null;
  if (!user) return false;
  me = user;

  let { data: profile, error: profErr } = await supabaseClient
    .from("users").select("first_name, username, avatar_path, avatar_config")
    .eq("id", user.id).maybeSingle();
  if (profErr) {
    // احتياط: إذا عمود avatar_config ما انضاف بعد بقاعدة البيانات
    ({ data: profile } = await supabaseClient
      .from("users").select("first_name, username, avatar_path")
      .eq("id", user.id).maybeSingle());
  }
  myProfile = profile || null;

  const name = myName();
  $("meName").textContent = name;
  $("meAvatarBox").replaceChildren(makeAvatar(myProfile && myProfile.avatar_path, name));
  $("tabAvatarBox").replaceChildren(makeAvatar(myProfile && myProfile.avatar_path, name));

  if (window.SJMarket) { SJMarket.refreshLang(); SJMarket.load(); }
  loadFlair();

  $("loginView").hidden = true;
  $("appView").hidden = false;
  $("tabbar").hidden = false;
  $("coinsBtn").hidden = false;
  $("settingsBtn").hidden = false;
  refreshCoins();
  clearInterval(coinsTimer);
  coinsTimer = setInterval(refreshCoins, 60000);

  const { data: isAdmin } = await supabaseClient.rpc("sj_is_admin");
  $("adminLink").hidden = !isAdmin;

  await loadSession();
  await loadUnlockAll();
  applyLocks();
  refreshHours();
  clearInterval(hoursTimer);
  hoursTimer = setInterval(refreshHours, 5 * 60 * 1000);

  clearInterval(tickTimer);
  clearInterval(pollTimer);
  updateClock();
  tickTimer = setInterval(() => { renderStatus(); updateClock(); }, 1000);
  pollTimer = setInterval(() => {
    loadSession();
    if (activeView === "rank") { loadPodium(); loadRank(null, $("rankList")); }
  }, 15000);
  return true;
}

/* ---------- زر تيليجرام ---------- */
const telegramLoginButton = $("telegramLogin");
telegramLoginButton.addEventListener("click", async function () {
  if (loginInProgress) return;
  loginInProgress = true;
  const originalHtml = telegramLoginButton.innerHTML;
  telegramLoginButton.disabled = true;
  telegramLoginButton.textContent = t("opening");

  const tab = window.open("", "_blank");
  let tabUsed = false;
  try {
    const start = await callFunction("login-start", { language: currentLanguage() });
    if (!start.botUrl) throw new Error("start failed");
    if (tab) { tab.location.href = start.botUrl; tabUsed = true; }
    else window.open(start.botUrl, "_blank");

    telegramLoginButton.textContent = t("waiting");
    const result = await pollLogin(start.token, start.pollSecret);
    if (result.status !== "ok") throw new Error("login " + result.status);

    const { error } = await supabaseClient.auth.setSession({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    });
    if (error) throw error;
    await enterApp();
  } catch (e) {
    if (tab && !tabUsed) tab.close();
    alert(t("loginFailed"));
    telegramLoginButton.innerHTML = originalHtml;
    applyLang();
    telegramLoginButton.disabled = false;
  }
  loginInProgress = false;
});

/* ---------- قفل اليوتيوب (70 ساعة) ---------- */
$("youtubeNavBtn").addEventListener("click", (e) => {
  if (featureUnlocked("youtube")) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  openLockModal("youtube", () => $("youtubeNavBtn").click());
}, true);

/* ---------- الثيم ---------- */
(function () {
  const toggle = $("themeToggle");
  const saved = localStorage.getItem("theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", saved);
  toggle.checked = saved === "dark";
  toggle.addEventListener("change", () => {
    const th = toggle.checked ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", th);
    localStorage.setItem("theme", th);
  });
})();

/* ---------- تشغيل ---------- */
function hideLoader() {
  const l = $("loader");
  if (!l) return;
  l.classList.add("done");
  setTimeout(() => l.remove(), 600);
}
injectUiCss();
applyLang();
Promise.all([enterApp().catch(() => false), sleep(2400)]).then(hideLoader);
setTimeout(hideLoader, 8000); // احتياط: ما ختى تبقى الشاشة عالقة
