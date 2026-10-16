/*
 * Ciclift — gestion du consentement (recommandations CNIL) et mesure d'audience.
 * - Rien n'est chargé avant le choix de l'internaute.
 * - « Tout refuser » est aussi simple et visible que « Tout accepter ».
 * - Le choix est conservé 6 mois, puis redemandé. Il est modifiable à tout moment (« Gérer mes cookies »).
 * - La mesure d'audience (GoatCounter) ne dépose aucun cookie et ne conserve pas les adresses IP ;
 *   elle n'est malgré tout activée qu'avec l'accord de l'internaute.
 */
(function () {
  "use strict";

  var KEY = "ciclift_consent";
  var VERSION = 1;
  var MAX_AGE_DAYS = 182;
  var I = window.CicliftI18n;
  var t = I.t;
  var banner = null;
  var listeners = [];
  var goatLoading = false;
  var queue = [];

  function readChoice() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!raw || raw.v !== VERSION) return null;
      if ((Date.now() - new Date(raw.date).getTime()) / 864e5 > MAX_AGE_DAYS) return null;
      return raw;
    } catch (e) { return null; }
  }

  function saveChoice(analytics) {
    var choice = { v: VERSION, analytics: !!analytics, date: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch (e) { /* stockage bloqué */ }
    return choice;
  }

  function hasAnalytics() { var c = readChoice(); return !!(c && c.analytics); }

  // ---------- Mesure d'audience (GoatCounter) ----------
  function loadGoat() {
    var code = (window.CICLIFT_CONFIG || {}).goatcounterCode;
    if (!code || goatLoading || window.goatcounter && window.goatcounter.count) return;
    goatLoading = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", "https://" + code + ".goatcounter.com/count");
    s.onload = flush;
    document.head.appendChild(s);
  }

  function flush() {
    if (!(window.goatcounter && window.goatcounter.count)) return;
    while (queue.length) {
      var ev = queue.shift();
      window.goatcounter.count({ path: ev, title: ev, event: true });
    }
  }

  // Enregistre un événement anonyme (vote, inscription…) si l'internaute a accepté
  function track(name) {
    if (!hasAnalytics()) return false;
    queue.push(name);
    if (window.goatcounter && window.goatcounter.count) flush(); else loadGoat();
    return true;
  }

  // ---------- Bandeau ----------
  function btn(cls, key, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn " + cls;
    b.setAttribute("data-ui", key);
    b.textContent = t(key);
    b.addEventListener("click", onClick);
    return b;
  }

  function decide(analytics) {
    var before = hasAnalytics();
    saveChoice(analytics);
    close();
    if (analytics) loadGoat();
    listeners.forEach(function (fn) { fn(analytics); });
    // Retirer un accord déjà donné : on recharge pour décharger le script de mesure
    if (before && !analytics && goatLoading) location.reload();
  }

  function render(showPrefs) {
    if (!banner) {
      banner = document.createElement("div");
      banner.className = "consent";
      banner.setAttribute("role", "dialog");
      banner.setAttribute("aria-modal", "false");
      banner.setAttribute("aria-labelledby", "consent-title");
      banner.setAttribute("aria-describedby", "consent-text");
      document.body.appendChild(banner);
    }
    var root = document.documentElement.getAttribute("data-root");
    var lang = I.lang();
    var cookiesUrl = root + "cookies.html" + (lang === "fr" ? "" : "?lang=" + lang);
    var current = readChoice();

    banner.innerHTML = "";
    var h = document.createElement("h2");
    h.id = "consent-title";
    h.textContent = t("consent.title");
    var p = document.createElement("p");
    p.id = "consent-text";
    p.textContent = t("consent.text") + " ";
    var a = document.createElement("a");
    a.href = cookiesUrl;
    a.textContent = t("consent.more");
    p.appendChild(a);
    banner.appendChild(h);
    banner.appendChild(p);

    var prefs = document.createElement("div");
    prefs.className = "consent-prefs";
    prefs.hidden = !showPrefs;
    prefs.innerHTML =
      '<div class="pref"><div><strong></strong><span></span></div>' +
      '<label class="switch"><input type="checkbox" checked disabled><span class="track"></span></label></div>' +
      '<div class="pref"><div><strong></strong><span></span></div>' +
      '<label class="switch"><input type="checkbox" id="consent-analytics"><span class="track"></span></label></div>';
    var strongs = prefs.querySelectorAll("strong"), spans = prefs.querySelectorAll(".pref > div > span");
    strongs[0].textContent = t("consent.necessary");
    spans[0].textContent = t("consent.necessaryDesc");
    strongs[1].textContent = t("consent.analytics");
    spans[1].textContent = t("consent.analyticsDesc");
    var inputs = prefs.querySelectorAll("input");
    inputs[0].setAttribute("aria-label", t("consent.necessary"));
    inputs[1].setAttribute("aria-label", t("consent.analytics"));
    inputs[1].checked = !!(current && current.analytics);
    banner.appendChild(prefs);

    var actions = document.createElement("div");
    actions.className = "consent-actions";
    actions.appendChild(btn("btn-outline", "consent.reject", function () { decide(false); }));
    actions.appendChild(btn("btn-outline", "consent.accept", function () { decide(true); }));
    if (showPrefs) {
      actions.appendChild(btn("btn-primary full", "consent.save", function () { decide(inputs[1].checked); }));
    } else {
      actions.appendChild(btn("btn-outline full", "consent.customize", function () { render(true); banner.querySelector("#consent-analytics").focus(); }));
    }
    banner.appendChild(actions);
    banner.hidden = false;
  }

  function open(showPrefs) { render(!!showPrefs); var first = banner.querySelector("button"); if (first) first.focus(); }
  function close() { if (banner) banner.hidden = true; }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && banner && !banner.hidden && readChoice()) close();
  });

  // Boutons « Gérer mes cookies » présents dans les pages
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-consent-open]");
    if (el) { e.preventDefault(); open(true); }
  });

  I.onChange(function () { if (banner && !banner.hidden) render(!banner.querySelector(".consent-prefs").hidden); });

  window.CicliftConsent = {
    hasAnalytics: hasAnalytics,
    accept: function () { decide(true); },
    open: open,
    track: track,
    onChange: function (fn) { listeners.push(fn); }
  };

  I.ready.then(function () {
    var choice = readChoice();
    if (!choice) render(false);
    else if (choice.analytics) loadGoat();
  });
})();
