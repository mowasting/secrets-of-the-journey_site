/* palette.js - The Secrets of the Journey
   -------------------------------------------------------------------
   The colour-palette button (gallery-style icon next to the language menu).

   - Each press switches to the next palette:  original -> blue -> pink -> original
   - A nice effect plays next to the button (ripple rings + a burst of
     flowers for pink, sparkles for blue, golden dots for the original),
     and a small bubble shows the palette name.
   - Pink also gets slowly falling petals and flowers.
   - The choice is saved on the device (localStorage key: palette) and is
     applied before the page paints (see the small script in <head>).
   - Works together with the sun/moon switch: every palette has a day
     look and a night look.

   Needs in index.html:  #paletteBtn  #palTip  #palFx  (+ palette.css)
   ------------------------------------------------------------------- */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var KEY = "palette";
  var ORDER = ["default", "blue", "pink"];

  var STR = {
    ar: { title: "تغيير ألوان الموقع", names: { default: "الأصلي", blue: "أزرق", pink: "وردي" } },
    en: { title: "Change colors", names: { default: "Original", blue: "Blue", pink: "Pink" } },
    ckb: { title: "گۆڕینی ڕەنگەکان", names: { default: "ئەسڵی", blue: "شین", pink: "پەمەیی" } },
  };

  function lang() {
    var l = "ar";
    try { l = localStorage.getItem("lang") || "ar"; } catch (e) {}
    return STR[l] ? l : "ar";
  }
  function current() {
    var p = "default";
    try { p = localStorage.getItem(KEY) || "default"; } catch (e) {}
    return ORDER.indexOf(p) >= 0 ? p : "default";
  }
  function apply(p) {
    var h = document.documentElement;
    if (p === "default") h.removeAttribute("data-palette");
    else h.setAttribute("data-palette", p);
    try { localStorage.setItem(KEY, p); } catch (e) {}
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var btn = null, tip = null, fx = null, tipTimer = 0, fxTimer = 0;

  /* ---------- label (3 languages) ---------- */
  function updateLabel() {
    if (!btn) return;
    var s = STR[lang()];
    var label = s.title + ": " + s.names[current()];
    btn.setAttribute("aria-label", label);
    btn.title = label;
  }

  /* ---------- the effect ---------- */
  function burst(p) {
    if (!fx) return;
    clearTimeout(fxTimer);
    fx.replaceChildren();

    for (var r = 0; r < 2; r++) {
      var ring = document.createElement("span");
      ring.className = "pal-ring";
      ring.style.animationDelay = r * 0.14 + "s";
      fx.appendChild(ring);
    }

    var n = p === "pink" ? 13 : 15;
    var sparkColors = ["#6fb1ff", "#a0cbff", "#ffffff", "#4d8df0"];
    var dotColors = ["#e6c27f", "#c9a27a", "#f3e6d3", "#8a5a2b"];
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + rnd(-0.25, 0.25);
      var dist = rnd(48, 96);
      var up = Math.sin(a) < 0;
      var el = document.createElement("span");
      el.className = "pal-p " + (p === "pink" ? "pf" + (1 + (i % 3)) : p === "blue" ? "ps" : "pd");
      el.style.setProperty("--dx", Math.cos(a) * dist + "px");
      el.style.setProperty("--dy", Math.sin(a) * dist * (up ? 0.7 : 1.2) + "px");
      el.style.setProperty("--r", rnd(-220, 220) + "deg");
      el.style.setProperty("--s", (p === "pink" ? rnd(15, 27) : rnd(8, 16)) + "px");
      el.style.setProperty("--d", rnd(0, 0.09) + "s");
      if (p === "blue") el.style.setProperty("--c", sparkColors[i % sparkColors.length]);
      if (p === "default") el.style.setProperty("--c", dotColors[i % dotColors.length]);
      fx.appendChild(el);
    }
    fxTimer = setTimeout(function () { fx.replaceChildren(); }, 1500);

    btn.classList.remove("pop");
    void btn.offsetWidth; // restart the animation
    btn.classList.add("pop");
    setTimeout(function () { btn.classList.remove("pop"); }, 700);
  }

  function showTip(p) {
    if (!tip) return;
    tip.textContent = STR[lang()].names[p];
    tip.classList.add("show");
    clearTimeout(tipTimer);
    tipTimer = setTimeout(function () { tip.classList.remove("show"); }, 1400);
  }

  /* ---------- falling petals (only visible with the pink palette) ---------- */
  function buildPetals() {
    var box = document.createElement("div");
    box.className = "pal-petals";
    box.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 11; i++) {
      var el = document.createElement("i");
      var flower = i % 4 === 0;
      el.className = flower ? "fl" : "pt";
      // only along the left / right edges, so petals never cross the timer or the text
      el.style.setProperty("--x", (i % 2 ? rnd(0, 9) : rnd(90, 98)) + "%");
      el.style.setProperty("--s", (flower ? rnd(16, 26) : rnd(9, 17)) + "px");
      el.style.setProperty("--t", rnd(12, 21) + "s");
      el.style.setProperty("--d", -rnd(0, 20) + "s"); // negative = already falling when the page opens
      el.style.setProperty("--sw", (Math.random() < 0.5 ? -1 : 1) * rnd(14, 34) + "px");
      box.appendChild(el);
    }
    document.body.appendChild(box);
  }

  /* ---------- start ---------- */
  function onClick() {
    var next = ORDER[(ORDER.indexOf(current()) + 1) % ORDER.length];
    apply(next);
    updateLabel();
    burst(next);
    showTip(next);
  }

  function mount() {
    btn = document.getElementById("paletteBtn");
    tip = document.getElementById("palTip");
    fx = document.getElementById("palFx");
    apply(current()); // make sure the attribute matches what is saved
    buildPetals();
    updateLabel();
    if (btn) btn.addEventListener("click", onClick);
    var sel = document.getElementById("langSelect");
    // script.js saves the new language in its own listener; wait until it has run
    if (sel) sel.addEventListener("change", function () { setTimeout(updateLabel, 0); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  window.SJPalette = { set: function (p) { if (ORDER.indexOf(p) >= 0) { apply(p); updateLabel(); } }, get: current };
})();
