# Ciclift — site de test de marché

Site vitrine pour mesurer l'intérêt du public pour Ciclift (rangement vélo motorisé au plafond).
On y montre le **résultat** (vélo rangé en hauteur, sol libéré), **jamais le mécanisme**.

## Ce que fait le site
- Présentation du concept, des avantages et du fonctionnement (en 3 étapes, sans détail technique)
- Bouton « Ça m'intéresse » + mini-sondage (prix, nombre de vélos, lieu de rangement, type de vélo) — réponses anonymes
- Inscription par email pour être prévenu du lancement (via Brevo, double confirmation)
- Statistiques de visite sans cookie (GoatCounter), activées **uniquement après accord**
- 5 langues (FR, EN, DE, NL, ES) avec sélecteur en haut de page
- Pages légales : mentions légales, politique de confidentialité (RGPD), politique cookies, CGU

## Avant la mise en ligne publique : à compléter dans `assets/js/config.js`
| Champ | Quoi mettre |
|---|---|
| `ownerName` | Ton prénom et nom (éditeur du site, obligatoire) |
| `contactEmail` | Une adresse email de contact (idéalement dédiée au projet) |
| `goatcounterCode` | Le code de ton compte GoatCounter (gratuit) |
| `brevoFormAction` | L'adresse du formulaire Brevo (gratuit) |

Tant qu'un champ est vide, le site affiche « [à compléter] » ou désactive la fonction concernée.

## Images générées par IA
Les prompts et les règles sont dans `assets/img/photos/PROMPTS.md`. Dépose l'image dans `assets/img/photos/`,
puis écris son nom dans `photos` de `config.js` : elle remplace automatiquement l'illustration dessinée
et porte la mention « Illustration générée par IA ».

## Voir le site en local
```
powershell -ExecutionPolicy Bypass -File tools\serve.ps1
```
puis ouvrir http://localhost:8080/

## Structure
```
index.html              Page d'accueil (texte français = texte de référence)
mentions-legales.html   Mentions légales (LCEN)
confidentialite.html    Politique de confidentialité (RGPD)
cookies.html            Politique cookies (CNIL)
cgu.html                Conditions générales d'utilisation
merci.html              Page après inscription
404.html                Page d'erreur
assets/css/style.css    Style (polices système, mode sombre automatique)
assets/js/config.js     ⚙️ Réglages à compléter
assets/js/i18n.js       Gestion des langues
assets/js/lang/*.js     Traductions (fr = textes d'interface uniquement)
assets/js/consent.js    Bandeau cookies + statistiques
assets/js/main.js       Sondage + formulaire
assets/img/             Logo, icônes, image de partage réseaux sociaux
tools/make-images.ps1   Regénère les images PNG
tools/serve.ps1         Serveur d'aperçu local
```

## Checklist « 20 points avant de lancer un site »
| # | Point | État |
|---|---|---|
| 1 | Page RGPD | ✅ `confidentialite.html` |
| 2 | Page CGU | ✅ `cgu.html` |
| 3 | Aucune clé secrète dans le code | ✅ aucune clé (GoatCounter et Brevo n'en exposent pas) |
| 4 | HTTPS forcé | ✅ GitHub Pages + `upgrade-insecure-requests` (cocher « Enforce HTTPS » dans GitHub) |
| 5 | Bannière cookies | ✅ refus aussi simple que l'acceptation, choix redemandé tous les 6 mois |
| 6 | Meta title | ✅ par page et par langue |
| 7 | Image réseaux sociaux | ✅ `og-image.png` 1200×630 |
| 8 | Favicon | ✅ SVG + PNG + icône Apple |
| 9 | Sitemap + robots.txt | ✅ |
| 10 | Textes alternatifs des images | ✅ illustrations décrites, traduites |
| 11 | Images compressées | ✅ illustrations en SVG (très légères) |
| 12 | Vitesse | ✅ aucune librairie externe, langues chargées à la demande |
| 13 | Contraste | ✅ couleurs vérifiées, mode sombre |
| 14 | Responsive | ✅ testé en 375 px (mobile) et 1280 px |
| 15 | Page 404 personnalisée | ✅ |
| 16 | Liens cassés | ✅ vérifiés |
| 17 | Validation des formulaires | ✅ email + case de consentement obligatoire |
| 18 | Anti-spam | ✅ champ piège + délai minimum + double confirmation Brevo |
| 19 | Outil d'analytics | ✅ GoatCounter (sans cookie, IP non conservée, hébergé en UE) |
| 20 | Un seul appel à l'action | ✅ « Être prévenu du lancement » |
