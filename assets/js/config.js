/*
 * Ciclift — réglages du site.
 * C'est le SEUL fichier à modifier pour changer les informations ci-dessous.
 * Les champs vides s'affichent « [à compléter] » sur le site : il faut tous les remplir avant la mise en ligne publique.
 */
window.CICLIFT_CONFIG = {
  // Adresse publique du site (avec la barre oblique finale)
  siteUrl: "https://ciclift.fr/",

  // Éditeur du site (mentions légales + responsable des données)
  ownerName: "Louis Desarmenien",        // ex. "Prénom Nom"
  contactEmail: "contact@ciclift.fr",     // ex. "contact.ciclift@gmail.com" (adresse dédiée conseillée)

  // Mesure d'audience sans cookie : code du compte GoatCounter (ex. "ciclift" pour ciclift.goatcounter.com)
  goatcounterCode: "ciclift",

  // Formulaire d'inscription Brevo : adresse « action » du formulaire fourni par Brevo
  brevoFormAction: "https://9c59becb.sibforms.com/serve/MUIFAEu3Sxm55NQOIXCwMOSAfTZt0gaUxFyjINW94tf_Bt7JdQ0g7guI5hp3BEkQFA9rFsNGJUqfC2Ncm_2FgvtGDFj7yPYHdtbjFEZrtCfD-54hUbcbA-v4qB4oSJDrHrFjIm1q3hzcapOaIy2NLZiQmdANFS5_OIf48kPKBEzu0xgS-FAschMgYRzWuCUqIB4ml9Y4rGFdtyTXoA",

  // Date de dernière mise à jour des pages légales (AAAA-MM-JJ)
  legalUpdated: "2026-10-16",

  // Images (générées par IA ou photos) : déposer le fichier dans assets/img/photos/ puis écrire son nom ici.
  // Tant qu'un nom est vide, c'est l'illustration dessinée qui s'affiche. Voir assets/img/photos/PROMPTS.md
  photos: {
    hero: "hero.jpg",        // accroche : garage lumineux, vélo rangé en hauteur
    before: "",      // avant : garage encombré par les vélos
    after: "",       // après : garage dégagé, vélos en hauteur
    vertical: "vertical.jpg",      // version verticale
    horizontal: "horizontal.jpg",  // version horizontale
    vtt: "vtt.jpg",                // VTT
    ville: "ville.jpg",            // vélo de ville
    vae: "vae.jpg"                 // vélo électrique
  }
};
