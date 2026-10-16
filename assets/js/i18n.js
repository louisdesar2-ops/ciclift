/*
 * Ciclift — traduction des pages.
 * Le français est écrit directement dans le HTML (lisible par Google et sans JavaScript).
 * Les autres langues sont dans assets/js/lang/xx.js et ne sont chargées que si on les choisit.
 * Repères dans le HTML :
 *   data-i18n="cle"                 → contenu remplacé par la traduction
 *   data-i18n-attr="attribut:cle"   → attribut traduit (plusieurs séparés par ;)
 *   data-cfg="ownerName"            → valeur reprise de config.js
 *   data-cfg-mailto                 → lien mailto vers l'email de contact
 */
(function () {
  "use strict";

  // Active les animations (sans JavaScript, tout reste visible)
  document.documentElement.classList.add("js");

  // Numéro de version des fichiers (anti-cache), repris de l'adresse de ce script : i18n.js?v=…
  var VER = ((document.currentScript && document.currentScript.src) || "").split("?v=")[1] || "";

  var LANGS = { fr: "Français", en: "English", de: "Deutsch", nl: "Nederlands", es: "Español" };
  var DEFAULT = "fr";
  var STORE_KEY = "ciclift_lang";
  var dicts = window.CICLIFT_I18N = window.CICLIFT_I18N || {};
  var originals = new Map();
  var originalAttrs = new Map();
  var originalMeta = {};
  var current = DEFAULT;
  var listeners = [];

  function store(key, value) {
    try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch (e) { /* stockage bloqué : sans conséquence */ }
  }
  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function pageId() { return document.body.getAttribute("data-page") || "index"; }

  function detect() {
    var fromUrl = new URLSearchParams(location.search).get("lang");
    if (fromUrl && LANGS[fromUrl]) return fromUrl;
    var saved = read(STORE_KEY);
    if (saved && LANGS[saved]) return saved;
    var nav = (navigator.languages || [navigator.language || ""]);
    for (var i = 0; i < nav.length; i++) {
      var code = String(nav[i]).slice(0, 2).toLowerCase();
      if (LANGS[code]) return code;
    }
    return DEFAULT;
  }

  function cacheOriginals() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) { originals.set(el, el.innerHTML); });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      var saved = {};
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var attr = pair.split(":")[0].trim();
        if (attr) saved[attr] = el.getAttribute(attr);
      });
      originalAttrs.set(el, saved);
    });
    var desc = document.querySelector('meta[name="description"]');
    originalMeta = { title: document.title, desc: desc ? desc.getAttribute("content") : "" };
  }

  function loadDict(lang) {
    return new Promise(function (resolve) {
      if (lang === DEFAULT || dicts[lang]) return resolve();
      var s = document.createElement("script");
      s.src = document.documentElement.getAttribute("data-root") + "assets/js/lang/" + lang + ".js" + (VER ? "?v=" + VER : "");
      s.onload = function () { resolve(); };
      s.onerror = function () { resolve(); };
      document.head.appendChild(s);
    });
  }

  // Typographie française : espace insécable avant ? ! : ; » et après «
  // (le signe ne passe jamais seul à la ligne, surtout sur téléphone)
  function nbsp(text) {
    return String(text).replace(/ ([?!:;»])/g, " $1").replace(/« /g, "« ");
  }
  function nbspPage() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var tag = n.parentNode && n.parentNode.nodeName;
        return tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      var fixed = nbsp(node.nodeValue);
      if (fixed !== node.nodeValue) node.nodeValue = fixed;
    }
  }

  // Texte d'interface (bandeau cookies, messages…) : langue courante, sinon français
  function t(key) {
    var d = dicts[current] && dicts[current].ui;
    var val;
    if (d && d[key] != null) val = d[key];
    else {
      var fr = dicts.fr && dicts.fr.ui;
      val = fr && fr[key] != null ? fr[key] : key;
    }
    return current === DEFAULT ? nbsp(val) : val;
  }

  function fillConfig(root) {
    var cfg = window.CICLIFT_CONFIG || {};
    var missing = t("cfg.missing");
    (root || document).querySelectorAll("[data-cfg]").forEach(function (el) {
      var key = el.getAttribute("data-cfg");
      var val = cfg[key];
      if (key === "legalUpdated" && val) {
        try { val = new Date(val + "T12:00:00").toLocaleDateString(current, { year: "numeric", month: "long", day: "numeric" }); } catch (e) { /* format brut */ }
      }
      el.textContent = val ? val : missing;
    });
    (root || document).querySelectorAll("[data-cfg-mailto]").forEach(function (el) {
      if (cfg.contactEmail) el.setAttribute("href", "mailto:" + cfg.contactEmail);
      else el.removeAttribute("href");
    });
  }

  function apply(lang) {
    var d = lang === DEFAULT ? null : (dicts[lang] && dicts[lang].t) || null;
    if (lang !== DEFAULT && !d) lang = DEFAULT;

    originals.forEach(function (html, el) {
      var key = el.getAttribute("data-i18n");
      el.innerHTML = d && d[key] != null ? d[key] : html;
    });
    originalAttrs.forEach(function (saved, el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var parts = pair.split(":");
        var attr = parts[0].trim(), key = (parts[1] || "").trim();
        if (!attr) return;
        var val = d && d[key] != null ? d[key] : saved[attr];
        if (val != null) el.setAttribute(attr, val);
      });
    });

    var meta = lang !== DEFAULT && dicts[lang].meta && dicts[lang].meta[pageId()];
    document.title = meta ? meta.title : originalMeta.title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", meta ? meta.desc : originalMeta.desc);

    current = lang;
    document.documentElement.setAttribute("lang", lang);
    document.querySelectorAll(".lang-switch button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === lang ? "true" : "false");
    });
    fillConfig();
    if (lang === DEFAULT) nbspPage();

    var url = new URL(location.href);
    if (lang === DEFAULT) url.searchParams.delete("lang"); else url.searchParams.set("lang", lang);
    history.replaceState(null, "", url.pathname + url.search + url.hash);

    // Les liens internes gardent la langue choisie
    document.querySelectorAll("a[data-keep-lang]").forEach(function (a) {
      var base = a.getAttribute("data-href") || a.getAttribute("href");
      a.setAttribute("data-href", base);
      var parts = base.split("#");
      a.setAttribute("href", parts[0] + (lang === DEFAULT ? "" : "?lang=" + lang) + (parts[1] ? "#" + parts[1] : ""));
    });

    listeners.forEach(function (fn) { fn(lang); });
  }

  function setLang(lang, remember) {
    if (!LANGS[lang]) lang = DEFAULT;
    if (remember) store(STORE_KEY, lang);
    return loadDict(lang).then(function () { apply(lang); });
  }

  function buildSwitch() {
    document.querySelectorAll(".lang-switch").forEach(function (box) {
      box.innerHTML = "";
      Object.keys(LANGS).forEach(function (code) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = code.toUpperCase();
        b.setAttribute("data-lang", code);
        b.setAttribute("lang", code);
        b.setAttribute("aria-label", LANGS[code]);
        b.setAttribute("title", LANGS[code]);
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () { setLang(code, true); });
        box.appendChild(b);
      });
    });
  }

  window.CicliftI18n = {
    t: t,
    lang: function () { return current; },
    onChange: function (fn) { listeners.push(fn); },
    fillConfig: fillConfig,
    ready: null
  };

  function init() {
    cacheOriginals();
    buildSwitch();
    window.CicliftI18n.ready = setLang(detect(), false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
