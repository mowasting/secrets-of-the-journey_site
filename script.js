const telegramLoginButton = document.getElementById("telegramLogin");

const FUNCTIONS_URL = SUPABASE_URL + "/functions/v1";
let loginInProgress = false;

function currentLanguage() {
  const saved = localStorage.getItem("lang");
  return ["ar", "en", "ckb"].includes(saved) ? saved : "ar";
}

async function callFunction(name, body) {
  try {
    const res = await fetch(FUNCTIONS_URL + "/" + name, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    return { status: "error" };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// يسأل كل ثانيتين إذا أكدت الدخول بتيليجرام (لحد 10 دقايق)
async function pollLogin(token, pollSecret) {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    await sleep(2000);
    const result = await callFunction("login-status", { token, pollSecret });
    if (result.status !== "pending") return result;
  }
  return { status: "expired" };
}

// شاشة مؤقتة بعد الدخول (نستبدلها لاحقاً بالتصميم الحقيقي)
async function showLoggedIn() {
  const { data } = await supabaseClient.auth.getSession();
  const user = data.session ? data.session.user : null;
  if (!user) return false;

  const { data: profile } = await supabaseClient
    .from("users")
    .select("first_name, username, avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  const card = document.querySelector(".login-card");
  card.replaceChildren();

  if (profile && profile.avatar_path) {
    const img = document.createElement("img");
    img.src = supabaseClient.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl;
    img.alt = "";
    img.style.cssText = "width:96px;height:96px;border-radius:50%;object-fit:cover;margin-bottom:12px;";
    card.appendChild(img);
  }

  // textContent وليس innerHTML، لأن اسم تيليجرام يكتبه المستخدم
  const title = document.createElement("h2");
  title.textContent = "Welcome, " + ((profile && (profile.first_name || profile.username)) || "Student");
  card.appendChild(title);

  const logout = document.createElement("button");
  logout.textContent = "Log out";
  logout.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    location.reload();
  });
  card.appendChild(logout);
  return true;
}

telegramLoginButton.addEventListener("click", async function () {
  if (loginInProgress) return;
  loginInProgress = true;
  const originalHtml = telegramLoginButton.innerHTML;
  telegramLoginButton.disabled = true;
  telegramLoginButton.textContent = "Opening Telegram...";

  // نفتح التبويب فوراً حتى ما يمنعه المتصفح
  const tab = window.open("", "_blank");
  let tabUsed = false;

  try {
    const start = await callFunction("login-start", { language: currentLanguage() });
    if (!start.botUrl) throw new Error("start failed");

    if (tab) {
      tab.location.href = start.botUrl;
      tabUsed = true;
    } else {
      window.open(start.botUrl, "_blank");
    }

    telegramLoginButton.textContent = "Waiting for Telegram...";
    const result = await pollLogin(start.token, start.pollSecret);
    if (result.status !== "ok") throw new Error("login " + result.status);

    const { error } = await supabaseClient.auth.setSession({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    });
    if (error) throw error;
    await showLoggedIn();
  } catch (e) {
    if (tab && !tabUsed) tab.close();
    alert("Login failed or expired. Please try again.");
    telegramLoginButton.innerHTML = originalHtml;
    telegramLoginButton.disabled = false;
  }
  loginInProgress = false;
});

showLoggedIn();