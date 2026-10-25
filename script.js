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
let activeView = "live";
let catInit = false;

/* ---------- اللغات ---------- */
const I18N = {
  ar: {
    welcome: "أهلاً بعودتك", subtitle: "سجّل دخولك لتكمل رحلتك الدراسية.",
    continue: "المتابعة عبر تيليجرام",
    loginNote: "سيُستخدم حساب تيليجرام الخاص بك للتحقق من هويتك بشكل آمن.",
    navLive: "السشن المباشر", navRank: "الترتيب", navAccount: "حسابي", navAdmin: "لوحة الأدمن", logout: "تسجيل الخروج",
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
  },
  en: {
    welcome: "Welcome back", subtitle: "Sign in to continue your study journey.",
    continue: "Continue with Telegram",
    loginNote: "Your Telegram account will be used to securely verify your identity.",
    navLive: "Live Session", navRank: "Rank", navAccount: "Account", navAdmin: "Admin", logout: "Log out",
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
  },
  ckb: {
    welcome: "بەخێربێیتەوە", subtitle: "بچۆ ژوورەوە بۆ بەردەوامبوون لە گەشتی خوێندنەکەت.",
    continue: "بەردەوامبوون بە تێلێگرام",
    loginNote: "ئەکاونتی تێلێگرامەکەت بۆ سەلماندنی ناسنامەکەت بە شێوەیەکی سەلامەت بەکاردێت.",
    navLive: "سیشنی ڕاستەوخۆ", navRank: "ڕیزبەندی", navAccount: "هەژمارەکەم", navAdmin: "بەڕێوەبەر", logout: "چوونەدەرەوە",
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
  if (window.SJSound) SJSound.refreshLang();
  if (window.SJTasks) SJTasks.refreshLang();
  if (me) {
    renderStatus();
    loadTop5();
    if (activeView === "rank") loadRank(null, $("rankList"));
    if (activeView === "account") loadAccount();
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
  loadTop5();
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
    JSON.stringify(rows.map((r) => [r.user_id, r.study_seconds, r.display_name, r.avatar_path]));
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
    const hrs = document.createElement("span");
    hrs.className = "hrs";
    hrs.textContent = fmtHours(r.study_seconds);
    li.append(pos, makeAvatar(r.avatar_path, r.display_name), name, hrs);
    el.appendChild(li);
  });
}
async function loadRank(limit, el) {
  const { data, error } = await supabaseClient.rpc("get_rank", limit ? { limit_count: limit } : {});
  if (!error && data) renderRank(el, data);
}
/* أعلى 5 للأسبوع الحالي */
async function loadTop5() {
  const { data, error } = await supabaseClient.rpc("get_week_rank", { limit_count: 5 });
  if (error || !data) return;
  renderRank($("top5"), data);
  $("top5Empty").hidden = data.length > 0;
}

/* ---------- صفحة الحساب ---------- */
async function loadAccount() {
  const name = myName();
  $("accAvatarBox").replaceChildren(makeAvatar(myProfile && myProfile.avatar_path, name, true));
  $("accName").textContent = name;
  $("accUser").textContent = myProfile && myProfile.username ? "@" + myProfile.username : "";

  const { data } = await supabaseClient.rpc("get_rank", {});
  const sorted = sortRows(data || []);
  const idx = sorted.findIndex((r) => r.user_id === me.id);
  const row = idx >= 0 ? sorted[idx] : null;
  $("accHours").textContent = fmtHours(row ? row.study_seconds : 0);
  $("accRank").textContent = row ? "#" + (idx + 1) : "-";

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
  activeView = name;
  $("liveView").hidden = name !== "live";
  $("rankView").hidden = name !== "rank";
  $("accountView").hidden = name !== "account";
  $("tasksView").hidden = name !== "tasks";
  document.querySelectorAll(".tab-item[data-view]").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === name));
  if (name === "rank") loadRank(null, $("rankList"));
  if (name === "account") loadAccount();
  if (name === "tasks" && window.SJTasks) SJTasks.open();
  window.scrollTo(0, 0);
}
document.querySelectorAll(".tab-item[data-view]").forEach((b) =>
  b.addEventListener("click", () => setView(b.dataset.view)));

$("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});
$("langSelect").addEventListener("change", (e) => {
  localStorage.setItem("lang", e.target.value);
  applyLang();
});

/* ---------- الدخول للموقع ---------- */
async function enterApp() {
  const { data } = await supabaseClient.auth.getSession();
  const user = data.session ? data.session.user : null;
  if (!user) return false;
  me = user;

  const { data: profile } = await supabaseClient
    .from("users").select("first_name, username, avatar_path")
    .eq("id", user.id).maybeSingle();
  myProfile = profile || null;

  const name = myName();
  $("meName").textContent = name;
  $("meAvatarBox").replaceChildren(makeAvatar(myProfile && myProfile.avatar_path, name));
    $("tabAvatarBox").replaceChildren(makeAvatar(myProfile && myProfile.avatar_path, name));
  

  $("loginView").hidden = true;
  $("appView").hidden = false;
  $("tabbar").hidden = false;

  const { data: isAdmin } = await supabaseClient.rpc("sj_is_admin");
  $("adminLink").hidden = !isAdmin;

  await Promise.all([loadSession(), loadTop5()]);

  clearInterval(tickTimer);
  clearInterval(pollTimer);
  updateClock();
  tickTimer = setInterval(() => { renderStatus(); updateClock(); }, 1000);
  pollTimer = setInterval(() => {
    loadSession();
    loadTop5();
    if (activeView === "rank") loadRank(null, $("rankList"));
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
applyLang();
Promise.all([enterApp().catch(() => false), sleep(2400)]).then(hideLoader);
setTimeout(hideLoader, 8000); // احتياط: ما ختى تبقى الشاشة عالقة
