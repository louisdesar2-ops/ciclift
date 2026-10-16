/*
 * Ciclift — interactions : bouton d'intérêt, mini-sondage, formulaire d'inscription.
 * Les réponses au sondage sont anonymes : elles ne sont jamais liées à l'adresse email.
 */
(function () {
  "use strict";

  var I = window.CicliftI18n;
  var C = window.CicliftConsent;
  var t = I.t;
  var VOTES_KEY = "ciclift_votes";

  function getVotes() {
    try { return JSON.parse(localStorage.getItem(VOTES_KEY) || "{}"); } catch (e) { return {}; }
  }
  function saveVote(q, v) {
    var votes = getVotes();
    votes[q] = v;
    try { localStorage.setItem(VOTES_KEY, JSON.stringify(votes)); } catch (e) { /* stockage bloqué */ }
  }

  // ---------- Sondage + bouton « ça m'intéresse » ----------
  function lock(group, value) {
    group.querySelectorAll("button[data-value]").forEach(function (b) {
      b.disabled = true;
      b.setAttribute("aria-pressed", b.getAttribute("data-value") === value ? "true" : "false");
    });
    var input = group.querySelector("[data-poll-input]");
    if (input) {
      input.disabled = true;
      var send = group.querySelector("[data-poll-send]");
      if (send) send.disabled = true;
      var m = /^(\d+\.\d+)m$/.exec(value || "");
      if (m) input.value = m[1].replace(".", I.lang() === "en" ? "." : ",");
    }
  }

  // Saisie d'une mesure en mètres (ex. « 2,55 ») → « 2.55m », arrondi aux 5 cm, entre 1,50 et 8 m
  function readMeters(raw) {
    var n = parseFloat(String(raw).trim().replace(",", ".").replace(/\s*m$/i, ""));
    if (!isFinite(n)) return null;
    if (n > 15 && n < 800) n = n / 100; // saisie en centimètres (ex. 255)
    if (n < 1.5 || n > 8) return null;
    return (Math.round(n * 20) / 20).toFixed(2) + "m";
  }

  function showThanks(group) {
    var fb = group.querySelector(".poll-feedback");
    if (fb) { fb.classList.remove("warn"); fb.textContent = t("poll.thanks"); }
  }

  function askConsent(group, onYes) {
    var box = group.querySelector(".consent-inline");
    if (!box) {
      box = document.createElement("div");
      box.className = "consent-inline";
      box.setAttribute("role", "group");
      group.appendChild(box);
    }
    box.innerHTML = "";
    var p = document.createElement("p");
    p.textContent = t("poll.needConsent");
    var row = document.createElement("div");
    row.className = "row";
    var yes = document.createElement("button");
    yes.type = "button";
    yes.className = "btn btn-primary";
    yes.textContent = t("poll.enable");
    yes.addEventListener("click", function () { C.accept(); box.remove(); onYes(); });
    var no = document.createElement("button");
    no.type = "button";
    no.className = "btn btn-outline";
    no.textContent = t("poll.noThanks");
    no.addEventListener("click", function () { box.remove(); });
    row.appendChild(yes);
    row.appendChild(no);
    box.appendChild(p);
    box.appendChild(row);
    yes.focus();
  }

  function vote(group, value) {
    var q = group.getAttribute("data-poll");
    function send() {
      C.track("sondage-" + q + "-" + value);
      saveVote(q, value);
      lock(group, value);
      showThanks(group);
    }
    if (C.hasAnalytics()) send(); else askConsent(group, send);
  }

  document.querySelectorAll("[data-poll]").forEach(function (group) {
    var q = group.getAttribute("data-poll");
    var done = getVotes()[q];
    if (done) { lock(group, done); showThanks(group); }
    group.querySelectorAll("button[data-value]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") || "false");
      b.addEventListener("click", function () { if (!b.disabled) vote(group, b.getAttribute("data-value")); });
    });
    var input = group.querySelector("[data-poll-input]");
    var send = group.querySelector("[data-poll-send]");
    if (input && send) {
      var submitMeasure = function () {
        var value = readMeters(input.value);
        var fb = group.querySelector(".poll-feedback");
        if (!value) {
          input.setAttribute("aria-invalid", "true");
          fb.classList.add("warn");
          fb.textContent = t("poll.badHeight");
          input.focus();
          return;
        }
        input.removeAttribute("aria-invalid");
        fb.classList.remove("warn");
        fb.textContent = "";
        vote(group, value);
      };
      send.addEventListener("click", submitMeasure);
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submitMeasure(); } });
      input.addEventListener("input", function () { input.removeAttribute("aria-invalid"); });
    }
  });

  I.onChange(function () {
    document.querySelectorAll("[data-poll]").forEach(function (group) {
      if (getVotes()[group.getAttribute("data-poll")]) showThanks(group);
      var box = group.querySelector(".consent-inline");
      if (box) box.remove();
    });
  });

  // ---------- Formulaire d'inscription ----------
  var form = document.getElementById("signup-form");
  if (form) {
    var shownAt = Date.now();
    var email = form.querySelector("#email");
    var consent = form.querySelector("#signup-consent");
    var msg = form.querySelector(".form-msg");
    var submit = form.querySelector("button[type=submit]");

    function setMsg(key, kind) {
      msg.textContent = key ? t(key) : "";
      msg.className = "form-msg" + (kind ? " " + kind : "");
    }

    email.addEventListener("input", function () { email.removeAttribute("aria-invalid"); setMsg("", ""); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var cfg = window.CICLIFT_CONFIG || {};
      var value = email.value.trim();

      // Anti-spam : champ piège invisible + délai minimum de remplissage
      if (form.querySelector(".hp input").value || Date.now() - shownAt < 2500) { setMsg("form.ok", "ok"); return; }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) || value.length > 254) {
        email.setAttribute("aria-invalid", "true");
        email.focus();
        return setMsg("form.badEmail", "error");
      }
      if (!consent.checked) { consent.focus(); return setMsg("form.needConsent", "error"); }
      if (!cfg.brevoFormAction) return setMsg("form.notReady", "error");

      var data = new FormData();
      // Champs attendus par le formulaire Brevo (EMAIL + champ piège + langue)
      data.append("EMAIL", value);
      data.append("email_address_check", "");
      data.append("locale", I.lang());
      submit.disabled = true;
      setMsg("form.sending", "");

      fetch(cfg.brevoFormAction, { method: "POST", body: data, mode: "no-cors" })
        .then(function () {
          C.track("inscription");
          var root = document.documentElement.getAttribute("data-root");
          location.href = root + "merci.html" + (I.lang() === "fr" ? "" : "?lang=" + I.lang());
        })
        .catch(function () { submit.disabled = false; setMsg("form.error", "error"); });
    });
  }

  // ---------- Images (photos / images IA) déclarées dans config.js ----------
  var photos = (window.CICLIFT_CONFIG || {}).photos || {};
  function renderPhotos() {
    document.querySelectorAll("[data-photo]").forEach(function (box) {
      var file = photos[box.getAttribute("data-photo")];
      if (!file) return;
      var svg = box.querySelector("svg[aria-label]");
      var fig = box.querySelector(".photo");
      if (!fig) {
        fig = document.createElement("figure");
        fig.className = "photo";
        var img = document.createElement("img");
        img.src = document.documentElement.getAttribute("data-root") + "assets/img/photos/" + file;
        img.loading = "lazy";
        img.decoding = "async";
        fig.appendChild(img);
        fig.appendChild(document.createElement("figcaption"));
        // La photo prend la place exacte du dessin
        if (svg) svg.parentNode.insertBefore(fig, svg); else box.appendChild(fig);
        box.classList.add("has-photo");
      }
      fig.querySelector("img").alt = svg ? svg.getAttribute("aria-label") : "";
      // Pastille discrète « IA » ; le texte complet reste lisible au survol et par les lecteurs d'écran
      var cap = fig.querySelector("figcaption");
      cap.textContent = "IA";
      cap.title = t("photo.ai");
      cap.setAttribute("aria-label", t("photo.ai"));
    });
  }
  renderPhotos();
  I.onChange(renderPhotos);

  // ---------- Apparition des blocs au défilement ----------
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var ioFired = false;
  function show(el) { el.classList.add("is-visible"); }
  function showAll() { revealEls.forEach(show); }
  // Vérification directe : utile au chargement et en secours si l'observateur ne se déclenche pas
  function checkInView() {
    var h = window.innerHeight || document.documentElement.clientHeight;
    revealEls.forEach(function (el) {
      if (el.classList.contains("is-visible")) return;
      var r = el.getBoundingClientRect();
      if (r.top < h - 40 && r.bottom > 0) show(el);
    });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      ioFired = true;
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    window.addEventListener("scroll", checkInView, { passive: true });
    // Sécurité : si l'observateur ne répond jamais (navigateur ancien, capture d'écran…), on affiche tout
    setTimeout(function () { if (!ioFired) showAll(); }, 2500);
  } else {
    showAll();
  }
  checkInView();
  window.addEventListener("beforeprint", showAll);

  // ---------- Barre de progression de lecture ----------
  var bar = document.createElement("div");
  bar.className = "progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  // Fond vivant (halos de couleur) piloté par la position dans la page
  var fx = document.createElement("div");
  fx.className = "bg-fx";
  fx.setAttribute("aria-hidden", "true");
  fx.innerHTML = '<div class="orb-wrap w1"><div class="orb"></div></div><div class="orb-wrap w2"><div class="orb"></div></div><div class="orb-wrap w3"><div class="orb"></div></div>';
  document.body.insertBefore(fx, document.body.firstChild);

  var touch = window.matchMedia && window.matchMedia("(hover: none)").matches;

  // ---------- Constellation animée (étoiles reliées par des traits lumineux) ----------
  (function constellation() {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var canvas = document.createElement("canvas");
    canvas.className = "stars";
    fx.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, stars = [], mouse = null, last = 0;
    var COLORS = ["110, 231, 183", "125, 211, 252", "230, 245, 255"];
    var LINK = 140;

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(150, Math.max(55, W * H / 9500)));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H * 1.6,
          vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18,
          r: Math.random() * 1.8 + .7, c: COLORS[i % 3],
          depth: Math.random() * .7 + .3, tw: Math.random() * Math.PI * 2
        });
      }
    }

    function frame(time) {
      var dt = Math.min(50, time - last || 16); last = time;
      var scroll = window.scrollY || 0;
      ctx.clearRect(0, 0, W, H);
      var pts = [];
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        if (!reduce) { s.x += s.vx * dt / 16; s.y += s.vy * dt / 16; s.tw += .02; }
        if (s.x < -20) s.x = W + 20; else if (s.x > W + 20) s.x = -20;
        var span = H * 1.6;
        if (s.y < -20) s.y = span; else if (s.y > span) s.y = -20;
        // Effet de profondeur : les étoiles proches défilent plus vite que les lointaines
        var y = ((s.y - scroll * s.depth * .35) % span + span) % span - H * .3;
        pts.push({ x: s.x, y: y, s: s });
      }
      // Traits entre étoiles proches
      for (var a = 0; a < pts.length; a++) {
        for (var b = a + 1; b < pts.length; b++) {
          var dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y, d = dx * dx + dy * dy;
          if (d < LINK * LINK) {
            var al = (1 - Math.sqrt(d) / LINK) * .55;
            ctx.strokeStyle = "rgba(" + pts[a].s.c + "," + al.toFixed(3) + ")";
            ctx.lineWidth = .9;
            ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
          }
        }
        // Traits vers la souris
        if (mouse) {
          var mx = pts[a].x - mouse.x, my = pts[a].y - mouse.y, md = Math.sqrt(mx * mx + my * my);
          if (md < LINK * 1.4) {
            ctx.strokeStyle = "rgba(125, 211, 252," + ((1 - md / (LINK * 1.4)) * .5).toFixed(3) + ")";
            ctx.lineWidth = .8;
            ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
      }
      // Étoiles (avec léger scintillement)
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k], tw = .65 + Math.sin(p.s.tw) * .35;
        ctx.fillStyle = "rgba(" + p.s.c + "," + (.85 * tw).toFixed(3) + ")";
        ctx.shadowColor = "rgba(" + p.s.c + ",.9)";
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
      if (!reduce) requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    if (!touch) {
      window.addEventListener("pointermove", function (e) { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
      document.addEventListener("pointerleave", function () { mouse = null; });
    }
    if (reduce) { frame(0); window.addEventListener("scroll", function () { requestAnimationFrame(frame); }, { passive: true }); }
    else requestAnimationFrame(frame);
  })();
  var glowEls = document.querySelectorAll(".card, .version, .bike-type, .poll");

  var ticking = false;
  function updateBar() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.transform = "scaleX(" + p + ")";
    document.documentElement.style.setProperty("--p", p.toFixed(4));
    // Sur téléphone : le halo de chaque carte visible glisse pendant le défilement
    if (touch) {
      var h = window.innerHeight;
      glowEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > h) return;
        var k = (h - r.top) / (h + r.height); // 0 → 1 pendant que la carte traverse l'écran
        el.style.setProperty("--mx", (r.width * (0.15 + 0.7 * k)) + "px");
        el.style.setProperty("--my", (r.height * (1 - k)) + "px");
      });
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(updateBar); } }, { passive: true });
  updateBar();

  // ---------- Halo lumineux qui suit la souris sur les cartes ----------
  if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", function (e) {
      var el = e.target.closest && e.target.closest(".card, .version, .bike-type, .poll");
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  // Année du pied de page
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
