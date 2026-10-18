# Ciclift — site de test de marché

Site vitrine pour mesurer l'intérêt du public pour Ciclift (rangement vélo motorisé au plafond).
On y montre le **résultat** (vélo rangé en hauteur, sol libéré), **jamais le mécanisme**.
Rien n'est vendu et on ne parle pas de prix.

**En ligne depuis le 17/10/2026** sur https://ciclift.fr (GitHub Pages, HTTPS obligatoire).

## Ce que fait le site
- Présentation du concept, des avantages, des versions verticale et horizontale (dès 2,10 m sous plafond)
  et du fonctionnement en 3 étapes, sans détail technique
- Bouton « Ça m'intéresse » + mini-sondage (prix, nombre de vélos, lieu de rangement, type de vélo) — réponses anonymes
- Inscription par email pour être prévenu du lancement (Brevo, double confirmation, retour sur `confirme.html`)
- Formulaire « Vous avez une question ? » (Web3Forms, les questions arrivent par email)
- Statistiques de visite sans cookie (GoatCounter), activées **uniquement après accord**
- 5 langues (FR, EN, DE, NL, ES) avec sélecteur en haut de page
- Pages légales : mentions légales, politique de confidentialité (RGPD), politique cookies, CGU

## Réglages : `assets/js/config.js`
C'est le seul fichier où se trouvent le nom de l'éditeur, l'email de contact, les codes des services
(GoatCounter, Brevo, Web3Forms), la date des pages légales et les noms des photos.
Attention : l'adresse `brevoFormAction` se termine par « == » ; si elle est coupée, Brevo répond « Invalid token ».

## Design
- Thème sombre, vert `#22c58b` et bleu `#38bdf8`
- Fond animé « roues à rayons » + poussière lumineuse (réagit à la souris, allégé sur téléphone)
- Police des titres **Sora**, hébergée sur le site (`assets/fonts`, licence OFL citée dans les mentions légales).
  Aucune police Google Fonts.
- Sur téléphone : menu à 3 barres et carrousels
- Les retouches de l'audit design sont regroupées à la fin de `assets/css/style.css`
  (bloc « Audit design du 17/10/2026 », puis bloc « B6 » pour la police Sora)

## Photos générées par IA
Les prompts et les règles sont dans `assets/img/photos/PROMPTS.md`. Les photos portent la pastille « IA ».
Format : 1600 px de large, moins de 300 Ko. Dépose l'image dans `assets/img/photos/`,
puis écris son nom dans `photos` de `config.js`.

## Voir le site en local
```
powershell -ExecutionPolicy Bypass -File tools\serve.ps1
```
puis ouvrir http://localhost:8080/

## Publier une modification
```
powershell -ExecutionPolicy Bypass -File tools\publish.ps1 "message"
```
Le script met à jour le numéro de version anti-cache, récupère les changements de GitHub, envoie et vérifie.
Le site est à jour 1 à 2 minutes après.

## Tableau de bord des résultats
Le tableau de bord tourne sur le PC (dossier `Documents\Ciclift`, double-clic sur « Ouvrir le tableau de bord »).
Une copie des scripts, **sans les clés**, est dans `tools/tableau`. Les clés API (GoatCounter en lecture seule,
Brevo « contacts en lecture ») sont chiffrées dans `cles.xml` sur le PC et ne doivent jamais aller dans le dépôt.

## Structure
```
index.html              Page d'accueil (texte français = texte de référence)
mentions-legales.html   Mentions légales (LCEN)
confidentialite.html    Politique de confidentialité (RGPD)
cookies.html            Politique cookies (CNIL)
cgu.html                Conditions générales d'utilisation
merci.html              Page après inscription
confirme.html           Page après la confirmation de l'email (lien reçu de Brevo)
404.html                Page d'erreur
assets/css/style.css    Style
assets/fonts/           Police Sora + sa licence OFL
assets/js/config.js     ⚙️ Réglages
assets/js/i18n.js       Gestion des langues
assets/js/lang/*.js     Traductions (fr = textes d'interface uniquement ; pages légales dans les clés legal.*)
assets/js/consent.js    Bandeau cookies + statistiques
assets/js/main.js       Sondage, formulaires, animations
assets/img/             Logo, icônes, image de partage réseaux sociaux
assets/img/photos/      Photos IA + PROMPTS.md
tools/publish.ps1       Publication (à utiliser à chaque fois)
tools/version.ps1       Numéro de version anti-cache (appelé par publish.ps1)
tools/serve.ps1         Serveur d'aperçu local
tools/make-images.ps1   Regénère les images PNG
tools/tableau/          Scripts du tableau de bord (sans les clés)
```

## Checklist « 20 points avant de lancer un site »
| # | Point | État |
|---|---|---|
| 1 | Page RGPD | ✅ `confidentialite.html` |
| 2 | Page CGU | ✅ `cgu.html` |
| 3 | Aucune clé secrète dans le code | ✅ seulement des codes publics (GoatCounter, Brevo, Web3Forms) |
| 4 | HTTPS forcé | ✅ GitHub Pages, « Enforce HTTPS » coché ; certificat renouvelé automatiquement (vérifier le cadenas mi-janvier 2027) |
| 5 | Cookies | ✅ aucun cookie ; mesure d'audience exemptée de consentement (conditions CNIL), opposition en un clic via « Gérer mes cookies » |
| 6 | Meta title | ✅ par page et par langue |
| 7 | Image réseaux sociaux | ✅ `og-image.png` 1200×630 |
| 8 | Favicon | ✅ SVG + PNG + icône Apple |
| 9 | Sitemap + robots.txt | ✅ sitemap envoyé à Google Search Console le 17/10/2026 |
| 10 | Textes alternatifs des images | ✅ décrits et traduits |
| 11 | Images compressées | ✅ photos à 1600 px, moins de 300 Ko |
| 12 | Vitesse | ✅ aucune librairie externe, police hébergée, langues chargées à la demande |
| 13 | Contraste | ✅ couleurs vérifiées |
| 14 | Responsive | ✅ testé en 375 px (mobile) et 1280 px |
| 15 | Page 404 personnalisée | ✅ |
| 16 | Liens cassés | ✅ vérifiés |
| 17 | Validation des formulaires | ✅ email + case de consentement obligatoire |
| 18 | Anti-spam | ✅ champ piège + délai minimum + double confirmation Brevo |
| 19 | Outil d'analytics | ✅ GoatCounter (sans cookie, IP non conservée, hébergé en UE) |
| 20 | Un seul appel à l'action | ✅ « Être prévenu du lancement » |
