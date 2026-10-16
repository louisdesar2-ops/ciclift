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
  var PHOTO_VER = "202610162119"; // mis à jour par tools/version.ps1 (anti-cache)
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
        img.src = document.documentElement.getAttribute("data-root") + "assets/img/photos/" + file + (PHOTO_VER ? "?v=" + PHOTO_VER : "");
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
    var slow = 1;
    var canvas = document.createElement("canvas");
    canvas.className = "stars";
    fx.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Téléphone : moins de points, pas de halo flou (coûteux) et résolution limitée pour rester fluide
    var dpr = Math.min(window.devicePixelRatio || 1, touch ? 1 : 2);
    var W = 0, H = 0, stars = [], dust = [], mouse = null, last = 0;
    var COLORS = ["110, 231, 183", "125, 211, 252", "230, 245, 255"];
    var LINK = touch ? 125 : 140;

    function resize() {
      var newW = window.innerWidth, newH = window.innerHeight;
      // Sur téléphone, la barre d'adresse qui apparaît/disparaît change seulement la hauteur :
      // on agrandit la zone de dessin sans recréer les étoiles (sinon elles « sautent »)
      if (W && newW === W) {
        H = newH; canvas.height = H * dpr; canvas.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return;
      }
      W = newW; H = newH;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = (touch ? Math.round(Math.min(75, Math.max(55, W * H / 4500))) : Math.round(Math.min(170, Math.max(60, W * H / 8000))));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H * 1.6,
          vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18,
          r: Math.random() * 1.8 + .7, c: COLORS[i % 3],
          depth: Math.random() * .7 + .3, tw: Math.random() * Math.PI * 2
        });
      }
      // Poussière d'étoiles : beaucoup de petits points qui montent doucement et scintillent
      var n = (touch ? Math.round(Math.min(170, Math.max(130, W * H / 1900))) : Math.round(Math.min(650, Math.max(180, W * H / 2200))));
      dust = [];
      for (var q = 0; q < n; q++) {
        dust.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .08, vy: -(Math.random() * .12 + .03),
          r: Math.random() * 1.3 + .3, c: COLORS[q % 3], a: Math.random() * .5 + .3,
          depth: Math.random() * .5 + .1, tw: Math.random() * Math.PI * 2, ox: 0, oy: 0
        });
      }
    }

    // Téléphone : on met l'animation en pause pendant le défilement (le défilement reste parfaitement fluide)
    var scrolling = false, scrollTimer = null;
    if (touch) window.addEventListener("scroll", function () { scrolling = true; clearTimeout(scrollTimer); scrollTimer = setTimeout(function () { scrolling = false; }, 180); }, { passive: true });

    function frame(time) {
      // Téléphone : 30 images/s suffisent, et rien n'est redessiné pendant le défilement
      if (touch && (scrolling || time - last < 32)) { requestAnimationFrame(frame); return; }
      var dt = Math.min(50, time - last || 16); last = time;
      // Téléphone : pas d'effet de profondeur lié au défilement (évite que les étoiles « sautent » à la reprise)
      var scroll = touch ? 0 : (window.scrollY || 0);
      ctx.clearRect(0, 0, W, H);
      // Poussière (sans halo, très légère à dessiner), qui s'écarte doucement de la souris
      for (var u = 0; u < dust.length; u++) {
        var g = dust[u];
        g.x += g.vx * dt / 16; g.y += g.vy * dt / 16; g.tw += .03;
        if (g.y < -10) { g.y = H + 10; g.x = Math.random() * W; }
        if (g.x < -10) g.x = W + 10; else if (g.x > W + 10) g.x = -10;
        var gy = ((g.y - scroll * g.depth * .25) % (H + 20) + H + 20) % (H + 20) - 10;
        if (mouse) {
          var ex = g.x + g.ox - mouse.x, ey = gy + g.oy - mouse.y, ed = Math.sqrt(ex * ex + ey * ey);
          if (ed < 120 && ed > 0) { g.ox += ex / ed * (120 - ed) * .04; g.oy += ey / ed * (120 - ed) * .04; }
        }
        g.ox *= .94; g.oy *= .94;
        ctx.fillStyle = "rgba(" + g.c + "," + (g.a * (.6 + Math.sin(g.tw) * .4)).toFixed(3) + ")";
        ctx.fillRect(g.x + g.ox, gy + g.oy, g.r * 1.6, g.r * 1.6);
      }
      var pts = [];
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.x += s.vx * slow * dt / 16; s.y += s.vy * slow * dt / 16; s.tw += .02 * slow;
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
            var al = (1 - Math.sqrt(d) / LINK) * (touch ? .6 : .55);
            ctx.strokeStyle = "rgba(" + (touch ? "235, 245, 255" : pts[a].s.c) + "," + al.toFixed(3) + ")"; // traits blancs sur téléphone
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
        ctx.shadowBlur = touch ? 0 : 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    // Souris (ordinateur uniquement) : les étoiles s'y relient et la poussière s'écarte
    if (!touch) {
      window.addEventListener("pointermove", function (e) { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
      document.addEventListener("pointerleave", function () { mouse = null; });
    }
    requestAnimationFrame(frame);
  })();
  var glowEls = document.querySelectorAll(".card, .version, .bike-type, .poll");

  var ticking = false;
  function updateBar() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.transform = "scaleX(" + p + ")";
    if (!touch) document.documentElement.style.setProperty("--p", p.toFixed(4));
    // Sur téléphone : le halo de chaque carte visible glisse pendant le défilement
    if (false) {
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

  // ---------- « Vous avez une question ? » : vrai formulaire (Web3Forms), repli sur l'application email ----------
  var ask = document.getElementById("ask-form");
  if (ask) {
    var askMsg = ask.querySelector("#ask-message");
    var askEmail = ask.querySelector("#ask-email");
    var askConsent = ask.querySelector("#ask-consent");
    var askBtn = ask.querySelector("button[type=submit]");
    var askOut = ask.querySelector(".form-msg");
    var askShown = Date.now();
    var say = function (key, kind, email) {
      askOut.textContent = key ? t(key).replace("{email}", email || "") : "";
      askOut.className = "form-msg" + (kind ? " " + kind : "");
    };
    [askMsg, askEmail].forEach(function (el) { el.addEventListener("input", function () { el.removeAttribute("aria-invalid"); say("", ""); }); });
    ask.addEventListener("submit", function (e) {
      e.preventDefault();
      var cfg = window.CICLIFT_CONFIG || {};
      var text = askMsg.value.trim(), mail = askEmail.value.trim();
      if (text.length < 5) { askMsg.setAttribute("aria-invalid", "true"); askMsg.focus(); return say("ask.empty", "error"); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { askEmail.setAttribute("aria-invalid", "true"); askEmail.focus(); return say("form.badEmail", "error"); }
      if (!askConsent.checked) { askConsent.focus(); return say("ask.needConsent", "error"); }
      // Anti-spam : champ piège coché ou envoi trop rapide = robot
      if (ask.querySelector("[name=botcheck]").checked || Date.now() - askShown < 3000) return say("ask.sent", "ok");
      if (!cfg.web3formsKey) {
        // Repli tant que le formulaire n'est pas branché : l'application email s'ouvre avec la question
        if (!cfg.contactEmail) return;
        window.location.href = "mailto:" + cfg.contactEmail + "?subject=" + encodeURIComponent(t("ask.subject")) + "&body=" + encodeURIComponent(text + "\n\n— " + mail);
        return say("ask.opened", "ok", cfg.contactEmail);
      }
      askBtn.disabled = true;
      say("form.sending", "");
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          access_key: cfg.web3formsKey,
          subject: t("ask.subject") + " (" + I.lang().toUpperCase() + ")",
          from_name: "Site Ciclift",
          email: mail,
          replyto: mail,
          message: text,
          botcheck: false
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !res.success) throw new Error("refus");
          C.track("question");
          ask.reset();
          say("ask.sent", "ok");
        })
        .catch(function () { say("form.error", "error"); })
        .then(function () { askBtn.disabled = false; });
    });
  }
  // ---------- Menu à 3 barres (téléphone) ----------
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    var setMenu = function (open) {
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    toggle.addEventListener("click", function () { setMenu(menu.hidden); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setMenu(false); toggle.focus(); } });
    document.addEventListener("click", function (e) { if (!menu.hidden && !menu.contains(e.target) && !toggle.contains(e.target)) setMenu(false); });
  }

  // Année du pied de page
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
