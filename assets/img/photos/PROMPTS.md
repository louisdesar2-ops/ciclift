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

## Pour un rendu réaliste
- Chaque photo a son propre lieu : garage de maison, local vélo d'immeuble, cave… (sauf « Avant » et « Après » : même garage).
- Pour « Après », le plus simple est de repartir de l'image « Avant » et de demander à l'IA :
  « Same image, but the three bicycles are now stored high up just under the ceiling and the floor is clear ».
- Si l'image fait trop « appartement » ou trop « catalogue », relance en ajoutant : *more worn, cluttered, real everyday place*.

## Les 8 images

| Fichier | Où | Prompt |
|---|---|---|
| `hero.jpg` | Accroche | Real lived-in home garage in a French house, raw grey concrete floor with a few oil stains and tyre marks, unpainted plasterboard and cinder block walls, metal shelving with paint cans, cardboard boxes and storage bins, a workbench with hand tools hanging on a pegboard, garden tools and a lawn mower in a corner, sectional garage door partly open letting in late afternoon daylight, a single bicycle stored horizontally high up just under the ceiling, the floor below completely free, natural slightly dusty atmosphere, realistic not staged, photorealistic, wide angle, eye level, no visible cables, hooks or lifting mechanism, no logos, no people |
| `before.jpg` | Avant | Cluttered single-car garage of a 1980s suburban French house, rough concrete floor with oil stains, three bicycles (a mountain bike, a city bike with a basket and an e-bike) leaning against each other and lying on the floor with tangled handlebars and pedals, a small hatchback car squeezed in so its door can barely open, cardboard boxes, a chest freezer, recycling bins, fluorescent tube light, overcast daylight from a small window, realistic not staged, photorealistic, wide angle, eye level, no logos, no people |
| `after.jpg` | Après | **À faire à partir de l'image « Avant »** : Same image, same garage, same camera angle and same light. The three bicycles are no longer on the floor: they are now stored side by side high up just under the ceiling along the left wall, in full natural colours and as sharp and detailed as the car. The floor where the bicycles were is now clear and swept, a few boxes tidied away. Keep everything else identical. Nothing attached to the bicycles: no visible cables, hooks, rails or lifting mechanism, no logos, no people |
| `vertical.jpg` | Version verticale | Shared bike storage room in the basement of a French apartment building, painted concrete block walls, exposed pipes and electrical conduits on the ceiling, a grey metal door, several bicycles standing on the floor along one wall, and one single bicycle stored vertically the right way up: standing on its rear wheel with its front wheel pointing up toward the ceiling, saddle and handlebars the right way up (not upside down, not hanging from its front wheel), the whole bicycle lifted high against the wall so its rear wheel is about 1.5 m above the floor, neon lighting, slightly worn and scuffed, realistic not staged, photorealistic, eye level, nothing attached to the bicycle: no visible hooks, cables, rails or mechanism, no signs, posters or text, no logos, no people |
| `horizontal.jpg` | Version horizontale | Old French house cellar with a low ceiling about 2.1 m high, exposed wooden beams and whitewashed stone walls, wine racks, shelves with glass jars and a few wooden crates, one bicycle in its normal riding position, upright on its two wheels exactly as if it were standing on the ground (wheels vertical, not lying on its side, not upside down), but lifted up so its tyres are just below the ceiling beams, seen from the side, plenty of free headroom below, warm light from a single bare bulb, slightly dusty, realistic not staged, photorealistic, eye level, nothing attached to the bicycle: no visible rods, cables, hooks or mechanism, no logos, no people |
| `vtt.jpg` | VTT | Modern mountain bike with wide knobby tyres and suspension fork, a little mud on the tyres, studio shot on a soft mint green background, side view, photorealistic, no logos |
| `ville.jpg` | Vélo de ville | Elegant city bike with step-through frame, front basket and mudguards, studio shot on a soft light blue background, side view, photorealistic, no logos |
| `vae.jpg` | Vélo électrique | Modern electric bike with integrated battery on the down tube, studio shot on a soft warm yellow background, side view, photorealistic, no logos |
