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
      data.append("html_type", "simple");
      submit.disabled = true;
      setMsg("form.sending", "");

      // Brevo répond {"success":true} si l'inscription est acceptée : on vérifie la réponse au lieu de supposer
      fetch(cfg.brevoFormAction, { method: "POST", body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !res.success) throw new Error("brevo");
          C.track("inscription");
          var root = document.documentElement.getAttribute("data-root");
          location.href = root + "merci.html" + (I.lang() === "fr" ? "" : "?lang=" + I.lang());
        })
        .catch(function () { submit.disabled = false; setMsg("form.error", "error"); });
    });
  }

  // ---------- Images (photos / images IA) déclarées dans config.js ----------
  var photos = (window.CICLIFT_CONFIG || {}).photos || {};
  var PHOTO_VER = "202610211359"; // mis à jour par tools/version.ps1 (anti-cache)
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
        // Accroche et avant/après : chargées tout de suite (pas de cadre vide en faisant défiler vite)
        img.loading = /^(hero|before|after)$/.test(box.getAttribute("data-photo")) ? "eager" : "lazy";
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
    // Secours au défilement : au plus une fois par image, et arrêt dès que tout est affiché
    var checkQueued = false;
    var onScrollCheck = function () {
      if (checkQueued) return;
      checkQueued = true;
      requestAnimationFrame(function () {
        checkQueued = false;
        checkInView();
        if (revealEls.every(function (el) { return el.classList.contains("is-visible"); })) window.removeEventListener("scroll", onScrollCheck);
      });
    };
    window.addEventListener("scroll", onScrollCheck, { passive: true });
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

  // ---------- Roues à rayons (grandes roues de vélo fines qui tournent) + poussière lumineuse ----------
  (function rayons() {
    var canvas = document.createElement("canvas");
    canvas.className = "stars";
    fx.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Téléphone : moins de roues, moins de poussière et résolution limitée pour rester fluide
    var dpr = Math.min(window.devicePixelRatio || 1, touch ? 1 : 1.5);
    var W = 0, H = 0, wheels = [], dust = [], mouse = null, mx = 0, my = 0, last = 0;
    var GREEN = "34, 197, 139", BLUE = "56, 189, 248", WHITE = "230, 245, 255";
    var COLORS = ["110, 231, 183", "125, 211, 252", WHITE];

    function resize() {
      var newW = window.innerWidth, newH = window.innerHeight;
      // Sur téléphone, la barre d'adresse qui apparaît/disparaît change seulement la hauteur :
      // on agrandit la zone de dessin sans recréer les roues (sinon elles « sautent »)
      if (W && newW === W) {
        H = newH; canvas.height = H * dpr; canvas.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (reduced) frame(0);
        return;
      }
      W = newW; H = newH;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = touch ? 6 : 9, base = Math.min(W, H);
      wheels = [];
      for (var i = 0; i < n; i++) {
        var depth = Math.random() * .7 + .3;
        wheels.push({
          x: Math.random() * W, y: Math.random() * H, r: base * (.12 + depth * .28), depth: depth,
          a: Math.random() * 6, v: (Math.random() < .5 ? -1 : 1) * (.0012 + Math.random() * .0012), boost: 0, hover: 0,
          spokes: Math.random() < .5 ? 28 : 36, c: i % 3 === 0 ? BLUE : GREEN
        });
      }
      // Les roues lointaines d'abord, les proches par-dessus
      wheels.sort(function (a, b) { return a.depth - b.depth; });
      // Poussière lumineuse : beaucoup de petits points qui montent doucement et scintillent
      var m = touch ? Math.round(Math.min(160, Math.max(120, W * H / 2200))) : Math.round(Math.min(320, Math.max(160, W * H / 3600)));
      dust = [];
      for (var q = 0; q < m; q++) {
        dust.push({
          x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .08, vy: -(Math.random() * .12 + .03),
          r: Math.random() * 1.3 + .3, c: COLORS[q % 3], a: Math.random() * .5 + .3, tw: Math.random() * 6, ox: 0, oy: 0
        });
      }
      if (reduced) frame(0);
    }

    // Téléphone : on met l'animation en pause pendant le défilement (le défilement reste parfaitement fluide)
    var scrolling = false, scrollTimer = null;
    // Pause pendant le défilement (téléphone ET ordinateur) : le défilement reste parfaitement fluide
    window.addEventListener("scroll", function () { scrolling = true; clearTimeout(scrollTimer); scrollTimer = setTimeout(function () { scrolling = false; }, 180); }, { passive: true });

    function frame(time) {
      if (!reduced) {
        // Téléphone : 30 images/s suffisent, et rien n'est redessiné pendant le défilement
        if (scrolling || (touch && time - last < 32)) { requestAnimationFrame(frame); return; }
      }
      var dt = reduced ? 0 : Math.min(3, (time - last || 16) / 16); last = time;
      // Ordinateur : les roues suivent la souris (effet de profondeur)
      var tx = mouse && !touch ? mouse.x / W - .5 : 0, ty = mouse && !touch ? mouse.y / H - .5 : 0;
      mx += (tx - mx) * .05; my += (ty - my) * .05;
      ctx.clearRect(0, 0, W, H);

      // Poussière (dessinée en premier, derrière les roues), qui s'écarte de la souris
      for (var u = 0; u < dust.length; u++) {
        var g = dust[u];
        g.x += g.vx * dt; g.y += g.vy * dt; g.tw += .03 * (dt || 1);
        if (g.y < -10) { g.y = H + 10; g.x = Math.random() * W; }
        if (g.x < -10) g.x = W + 10; else if (g.x > W + 10) g.x = -10;
        if (mouse) {
          var ex = g.x + g.ox - mouse.x, ey = g.y + g.oy - mouse.y, ed = Math.sqrt(ex * ex + ey * ey);
          if (ed < 130 && ed > 0) { g.ox += ex / ed * (130 - ed) * .05; g.oy += ey / ed * (130 - ed) * .05; }
        }
        g.ox *= .94; g.oy *= .94;
        ctx.fillStyle = "rgba(" + g.c + "," + (g.a * (.6 + Math.sin(g.tw) * .4)).toFixed(3) + ")";
        ctx.fillRect(g.x + g.ox, g.y + g.oy, g.r * 1.6, g.r * 1.6);
      }

      for (var i = 0; i < wheels.length; i++) {
        var w = wheels[i];
        var cx = w.x - mx * 110 * w.depth, cy = w.y - my * 110 * w.depth;
        // La roue survolée (ou touchée du doigt) s'allume et accélère, puis ralentit doucement
        var over = mouse && Math.sqrt((mouse.x - cx) * (mouse.x - cx) + (mouse.y - cy) * (mouse.y - cy)) < w.r * 1.05;
        w.hover += ((over ? 1 : 0) - w.hover) * .08;
        // Ordinateur : la souris est toujours sur une roue, donc accélération très douce (juste un peu plus vite)
        if (over) w.boost = touch ? Math.min(.035, w.boost + .0015) : Math.min(.004, w.boost + .0002);
        w.boost *= .985;
        w.a += (w.v + (w.v < 0 ? -w.boost : w.boost)) * dt;
        var al = Math.min(.9, .13 + w.depth * .27 + w.hover * .3);
        // Jante (double cercle)
        ctx.strokeStyle = "rgba(" + w.c + "," + al.toFixed(3) + ")";
        ctx.lineWidth = 1.2 + w.depth * 1.6 + w.hover;
        ctx.beginPath(); ctx.arc(cx, cy, w.r, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = .7 + w.depth * .6;
        ctx.beginPath(); ctx.arc(cx, cy, w.r * .93, 0, Math.PI * 2); ctx.stroke();
        // Rayons croisés : ils partent du moyeu légèrement décalés, comme sur une vraie roue
        ctx.strokeStyle = "rgba(" + WHITE + "," + (al * .65).toFixed(3) + ")";
        ctx.lineWidth = .55 + w.depth * .45;
        ctx.beginPath();
        for (var k = 0; k < w.spokes; k++) {
          var off = k % 2 ? .18 : -.18, ang = w.a + k / w.spokes * Math.PI * 2;
          ctx.moveTo(cx + Math.cos(ang + off) * w.r * .07, cy + Math.sin(ang + off) * w.r * .07);
          ctx.lineTo(cx + Math.cos(ang) * w.r * .93, cy + Math.sin(ang) * w.r * .93);
        }
        ctx.stroke();
        // Moyeu
        ctx.fillStyle = "rgba(" + WHITE + "," + Math.min(1, al * 1.1).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(cx, cy, Math.max(2, w.r * .05), 0, Math.PI * 2); ctx.fill();
      }
      if (!reduced) requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    if (!reduced) {
      if (!touch) {
        window.addEventListener("pointermove", function (e) { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
        document.documentElement.addEventListener("mouseleave", function () { mouse = null; });
      } else {
        // Téléphone : un appui sur une roue l'allume et la fait accélérer (sans gêner le défilement)
        window.addEventListener("pointerdown", function (e) { mouse = { x: e.clientX, y: e.clientY }; setTimeout(function () { mouse = null; }, 700); }, { passive: true });
      }
      requestAnimationFrame(frame);
    }
  })();
  var glowEls = document.querySelectorAll(".card, .version, .bike-type, .poll");

  var ticking = false;
  function updateBar() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.transform = "scaleX(" + p + ")";
    // Variable posée sur le fond seulement (et pas sur toute la page) : le navigateur ne recalcule que le fond
    if (!touch) fx.style.setProperty("--p", p.toFixed(4));
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
