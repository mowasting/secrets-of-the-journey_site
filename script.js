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

/* ---------- اللغات ---------- */
const I18N = {
  ar: {
    welcome: "أهلاً بعودتك", subtitle: "سجّل دخولك لتكمل رحلتك الدراسية.",
    continue: "المتابعة عبر تيليجرام",
    loginNote: "سيُستخدم حساب تيليجرام الخاص بك للتحقق من هويتك بشكل آمن.",
    navLive: "السشن المباشر", navRank: "الترتيب", navAccount: "حسابي", navAdmin: "لوحة الأدمن", logout: "تسجيل الخروج",
    hello: "أهلاً", noSession: "ما في سشن حالياً", startsIn: "السشن القادم يبدأ بعد",
    endsIn: "السشن ينتهي بعد", breakEndsIn: "الراحة تنتهي بعد",
    join: "انضمام للسشن", joined: "تم انضمامك ✅", joinedAt: "انضممت الساعة",
    top5: "أفضل 5 بساعات الدراسة", rankTitle: "الترتيب العام", hoursUnit: "س",
    statHours: "مجموع ساعات الدراسة", statRank: "ترتيبي", statSessions: "السشنات التي حضرتها",
    opening: "جارٍ فتح تيليجرام...", waiting: "بانتظار تيليجرام...",
    loginFailed: "فشل تسجيل الدخول أو انتهت المهلة. حاول مرة ثانية.",
    joinFailed: "تعذّر الانضمام. حاول مرة ثانية.", student: "طالب",
  },
  en: {
    welcome: "Welcome back", subtitle: "Sign in to continue your study journey.",
    continue: "Continue with Telegram",
    loginNote: "Your Telegram account will be used to securely verify your identity.",
    navLive: "Live Session", navRank: "Rank", navAccount: "Account", navAdmin: "Admin", logout: "Log out",
    hello: "Hello", noSession: "No session right now", startsIn: "Next session starts in",
    endsIn: "Session ends in", breakEndsIn: "Break ends in",
    join: "Join session", joined: "You joined ✅", joinedAt: "Joined at",
    top5: "Top 5 by study hours", rankTitle: "Overall ranking", hoursUnit: "h",
    statHours: "Total study hours", statRank: "My rank", statSessions: "Sessions attended",
    opening: "Opening Telegram...", waiting: "Waiting for Telegram...",
    loginFailed: "Login failed or expired. Please try again.",
    joinFailed: "Could not join. Please try again.", student: "Student",
  },
  ckb: {
    welcome: "بەخێربێیتەوە", subtitle: "بچۆ ژوورەوە بۆ بەردەوامبوون لە گەشتی خوێندنەکەت.",
    continue: "بەردەوامبوون بە تێلێگرام",
    loginNote: "ئەکاونتی تێلێگرامەکەت بۆ سەلماندنی ناسنامەکەت بە شێوەیەکی سەلامەت بەکاردێت.",
    navLive: "سیشنی ڕاستەوخۆ", navRank: "ڕیزبەندی", navAccount: "هەژمارەکەم", navAdmin: "بەڕێوەبەر", logout: "چوونەدەرەوە",
    hello: "سڵاو", noSession: "ئێستا هیچ سیشنێک نییە", startsIn: "سیشنی داهاتوو دەست پێدەکات دوای",
    endsIn: "سیشن کۆتایی دێت دوای", breakEndsIn: "پشوو کۆتایی دێت دوای",
    join: "بەشداربوون", joined: "بەشداریت کردووە ✅", joinedAt: "کاتی بەشداربوون",
    top5: "باشترین ٥ کەس بە کاتژمێری خوێندن", rankTitle: "ڕیزبەندی گشتی", hoursUnit: "کاتژمێر",
    statHours: "کۆی کاتژمێرەکانی خوێندن", statRank: "ڕیزبەندیم", statSessions: "ئەو سیشنانەی ئامادەبووم",
    opening: "تێلێگرام دەکرێتەوە...", waiting: "چاوەڕێی تێلێگرام...",
    loginFailed: "چوونەژوورەوە سەرکەوتوو نەبوو یان کاتەکەی تەواو بوو. دووبارە هەوڵبدەرەوە.",
    joinFailed: "بەشداریکردن سەرکەوتوو نەبوو. دووبارە هەوڵبدەرەوە.", student: "خوێندکار",
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
  if (me) {
    renderStatus();
    loadRank(5, $("top5"));
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
function pad(n) { return String(n).padStart(2, "0"); }
function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return pad(Math.floor(s / 3600)) + ":" + pad(Math.floor((s % 3600) / 60)) + ":" + pad(s % 60);
}
function fmtHours(secs) {
  const s = Number(secs) || 0;
  return Math.floor(s / 3600) + ":" + pad(Math.floor((s % 3600) / 60));
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
  currentSession = data || null;
  joinedAtMs = null;
  if (data && me) {
    const { data: a } = await supabaseClient
      .from("attendance").select("joined_at")
      .eq("session_id", data.id).eq("user_id", me.id).maybeSingle();
    if (a) joinedAtMs = new Date(a.joined_at).getTime();
  }
  renderStatus();
}

function renderStatus() {
  const s = currentSession;
  const now = Date.now();
  let label = t("noSession"), target = null, canJoin = false;

  if (s) {
    const st = +new Date(s.starts_at), en = +new Date(s.ends_at);
    const bs = s.break_starts_at ? +new Date(s.break_starts_at) : null;
    const be = s.break_ends_at ? +new Date(s.break_ends_at) : null;
    if (now >= en) {
      if (!reloading) { reloading = true; loadSession().finally(() => (reloading = false)); }
    } else if (now < st) {
      label = t("startsIn"); target = st;
    } else if (bs && be && now >= bs && now < be) {
      label = t("breakEndsIn"); target = be; canJoin = true;
    } else {
      label = t("endsIn"); target = en; canJoin = true;
    }
  }

  $("statusLabel").textContent = label;
  $("countdown").textContent = target ? fmtClock(target - now) : "--:--:--";

  const btn = $("joinBtn");
  if (joinedAtMs) {
    btn.textContent = t("joined");
    btn.disabled = true;
    $("joinedInfo").textContent = t("joinedAt") + " " +
      new Date(joinedAtMs).toLocaleTimeString(currentLanguage() === "en" ? "en" : "ar-IQ", { hour: "2-digit", minute: "2-digit" });
  } else {
    btn.textContent = t("join");
    btn.disabled = !canJoin;
    $("joinedInfo").textContent = "";
  }
}

$("joinBtn").addEventListener("click", async () => {
  $("joinBtn").disabled = true;
  const { error } = await supabaseClient.rpc("join_current_session");
  if (error) alert(t("joinFailed"));
  await loadSession();
  loadRank(5, $("top5"));
});

/* ---------- الترتيب ---------- */
function renderRank(el, rows) {
  el.replaceChildren();
  rows.forEach((r) => {
    const li = document.createElement("li");
    if (me && r.user_id === me.id) li.className = "me";
    const pos = document.createElement("span");
    pos.className = "pos";
    pos.textContent = r.rank_no;
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = r.display_name;
    const hrs = document.createElement("span");
    hrs.className = "hrs";
    hrs.textContent = fmtHours(r.study_seconds) + " " + t("hoursUnit");
    li.append(pos, makeAvatar(r.avatar_path, r.display_name), name, hrs);
    el.appendChild(li);
  });
}
async function loadRank(limit, el) {
  const { data, error } = await supabaseClient.rpc("get_rank", limit ? { limit_count: limit } : {});
  if (!error && data) renderRank(el, data);
}

/* ---------- صفحة الحساب ---------- */
async function loadAccount() {
  const name = myName();
  $("accAvatarBox").replaceChildren(makeAvatar(myProfile && myProfile.avatar_path, name, true));
  $("accName").textContent = name;
  $("accUser").textContent = myProfile && myProfile.username ? "@" + myProfile.username : "";

  const { data } = await supabaseClient.rpc("get_rank", {});
  const row = (data || []).find((r) => r.user_id === me.id);
  $("accHours").textContent = fmtHours(row ? row.study_seconds : 0) + " " + t("hoursUnit");
  $("accRank").textContent = row ? "#" + row.rank_no : "-";

  const { count } = await supabaseClient
    .from("attendance").select("id", { count: "exact", head: true }).eq("user_id", me.id);
  $("accSessions").textContent = count || 0;
}

/* ---------- القائمة الجانبية والتنقل ---------- */
function openMenu() { $("drawer").classList.add("open"); $("overlay").classList.add("show"); }
function closeMenu() { $("drawer").classList.remove("open"); $("overlay").classList.remove("show"); }
$("menuBtn").addEventListener("click", openMenu);
$("overlay").addEventListener("click", closeMenu);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

function setView(name) {
  activeView = name;
  $("liveView").hidden = name !== "live";
  $("rankView").hidden = name !== "rank";
  $("accountView").hidden = name !== "account";
  document.querySelectorAll(".drawer-item[data-view]").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === name));
  if (name === "rank") loadRank(null, $("rankList"));
  if (name === "account") loadAccount();
  closeMenu();
}
document.querySelectorAll(".drawer-item[data-view]").forEach((b) =>
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
  $("drawerName").textContent = name;
  $("drawerAvatarBox").replaceChildren(makeAvatar(myProfile && myProfile.avatar_path, name));

  $("loginView").hidden = true;
  $("appView").hidden = false;
  $("menuBtn").hidden = false;

  const { data: isAdmin } = await supabaseClient.rpc("sj_is_admin");
  $("adminLink").hidden = !isAdmin;

  await Promise.all([loadSession(), loadRank(5, $("top5"))]);

  clearInterval(tickTimer);
  clearInterval(pollTimer);
  tickTimer = setInterval(renderStatus, 1000);
  pollTimer = setInterval(() => {
    loadSession();
    loadRank(5, $("top5"));
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
applyLang();
enterApp();