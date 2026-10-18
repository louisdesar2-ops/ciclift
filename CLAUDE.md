# Ciclift

Site statique (GitHub Pages, domaine ciclift.fr) de test de marché pour un lève-vélo motorisé au plafond.
Propriétaire : débutant, francophone — répondre en français, simplement.

## Règles
- Confidentialité produit : montrer le résultat/bénéfice, jamais le mécanisme (pas de schéma, vidéo, détail technique).
- Conformité stricte RGPD/CNIL/LCEN : pas de Google Fonts ni service tiers non déclaré. Seule exception au consentement :
  la mesure d'audience GoatCounter (sans cookie, IP non conservée), chargée sans bandeau au titre de l'exemption CNIL,
  avec droit d'opposition (« Gérer mes cookies », signal Global Privacy Control respecté). Tout autre service reste soumis à accord.
  Tout nouveau service ou stockage local doit être ajouté à `confidentialite.html`, `cookies.html` ET aux 4 traductions.
- Pas de build : HTML/CSS/JS purs. CSP stricte : aucun script ou style inline (pas d'attribut `style=`).
- Français = texte écrit dans le HTML. Toute modif de texte doit être reportée dans `assets/js/lang/{en,de,nl,es}.js`
  (même clé `data-i18n`). Textes générés en JS : clés `ui` de chaque fichier de langue, y compris `fr.js`.
- Réglages (nom, email, codes services) uniquement dans `assets/js/config.js`.
- Site lancé le 17/10/2026 : plus de balise noindex sur les pages publiques (seules 404, merci et confirme restent en noindex).
- Aperçu : `tools/serve.ps1` → http://localhost:8080/
- Publier UNIQUEMENT avec `tools/publish.ps1 "message"` (version anti-cache + pull --rebase + push vérifié). Ne jamais masquer les erreurs de git push.
