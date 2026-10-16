# Images IA pour le site Ciclift

## Comment faire
1. Ouvre un générateur d'images, par exemple :
   - **ChatGPT** (onglet images) : tu peux utiliser les images commercialement ;
   - **Microsoft Designer / Bing Image Creator** : gratuit avec un compte Microsoft ;
   - **Adobe Firefly** : entraîné sur des images sous licence, le plus sûr juridiquement pour un usage commercial.
2. Copie un prompt ci-dessous (ils sont en anglais car les générateurs comprennent mieux l'anglais).
3. Télécharge l'image, nomme-la exactement comme indiqué et mets-la dans ce dossier (`assets/img/photos/`).
4. Dans `assets/js/config.js`, écris le nom du fichier dans `photos` (ex. `hero: "hero.jpg"`).
   Sinon, donne-moi les images et je m'en occupe.

## Règles importantes
- ⚠️ **Aucun mécanisme visible** : pas de câbles, poulies, moteurs, rails ni système de levage. Si l'IA en dessine un, regénère l'image.
- Pas de marques ni de logos visibles (vélos, voitures, outils).
- Évite les visages reconnaissables.
- Format paysage 16:10 (par exemple 1600 × 1000 px), en **JPG ou WebP de moins de 300 Ko**. Je peux compresser les images pour toi.
- Le site indique automatiquement « Illustration générée par IA » sur chaque image : c'est une bonne pratique de transparence.

## Les 8 images

| Fichier | Où | Prompt |
|---|---|---|
| `hero.jpg` | Accroche | Bright, cheerful modern home garage, clean concrete floor completely free, one bicycle stored horizontally high up near the white ceiling, warm morning sunlight through a window, plants and a few tidy shelves, soft pastel colors with green and yellow accents, photorealistic, wide angle, no visible cables or lifting mechanism, no logos, no people |
| `before.jpg` | Avant | Cluttered small home garage with three bicycles lying and leaning on the floor, tangled handlebars and pedals, car squeezed in, slightly messy but realistic, natural light, photorealistic, no logos, no people |
| `after.jpg` | Après | Same tidy home garage, three bicycles stored side by side high up near the ceiling, the floor completely clear with a small car parked comfortably, bright and airy, photorealistic, no visible cables or lifting mechanism, no logos, no people |
| `vertical.jpg` | Version verticale | Bright garage with high ceiling, a bicycle stored vertically, standing upright on its rear wheel, high up against a white wall near the ceiling, minimalist and tidy, photorealistic, no visible hooks, cables or mechanism, no logos |
| `horizontal.jpg` | Version horizontale | Basement or garage with a low ceiling, a bicycle stored flat and horizontal just under the ceiling, plenty of free headroom below, cozy warm lighting, photorealistic, no visible cables or mechanism, no logos |
| `vtt.jpg` | VTT | Modern mountain bike with wide knobby tyres and suspension fork, a little mud on the tyres, studio shot on a soft mint green background, side view, photorealistic, no logos |
| `ville.jpg` | Vélo de ville | Elegant city bike with step-through frame, front basket and mudguards, studio shot on a soft light blue background, side view, photorealistic, no logos |
| `vae.jpg` | Vélo électrique | Modern electric bike with integrated battery on the down tube, studio shot on a soft warm yellow background, side view, photorealistic, no logos |
