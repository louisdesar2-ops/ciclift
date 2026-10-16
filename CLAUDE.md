# Ciclift

Site statique (GitHub Pages, domaine ciclift.fr) de test de marché pour un lève-vélo motorisé au plafond.
Propriétaire : débutant, francophone — répondre en français, simplement.

## Règles
- Confidentialité produit : montrer le résultat/bénéfice, jamais le mécanisme (pas de schéma, vidéo, détail technique).
- Conformité stricte RGPD/CNIL/LCEN : rien ne se charge avant consentement, pas de Google Fonts ni service tiers non déclaré.
  Tout nouveau service ou stockage local doit être ajouté à `confidentialite.html`, `cookies.html` ET aux 4 traductions.
- Pas de build : HTML/CSS/JS purs. CSP stricte : aucun script ou style inline (pas d'attribut `style=`).
- Français = texte écrit dans le HTML. Toute modif de texte doit être reportée dans `assets/js/lang/{en,de,nl,es}.js`
  (même clé `data-i18n`). Textes générés en JS : clés `ui` de chaque fichier de langue, y compris `fr.js`.
- Réglages (nom, email, codes services) uniquement dans `assets/js/config.js`.
- Mode discret : balise robots noindex (« MODE DISCRET ») sur les pages, à retirer au lancement.
- Aperçu : `tools/serve.ps1` → http://localhost:8080/
- Publier UNIQUEMENT avec `tools/publish.ps1 "message"` (version anti-cache + pull --rebase + push vérifié). Ne jamais masquer les erreurs de git push.
