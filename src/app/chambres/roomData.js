export const ROOM_IMAGE_SETS = {
  classic: ["/chambre1.webp", "/chambre2.webp", "/chambre3.webp"],
  deluxe: ["/chsup1.webp", "/chsup2.webp", "/chsup3.webp"],
  suite: ["/chdeluxe1.webp", "/chdeluxe2.webp", "/chdeluxe3.webp"],
};

export const ROOM_DETAILS = {
  classic: {
    slug: "classic",
    name: "Classic",
    tagline: "L'essentiel premium pour une escapade a deux.",
    surface: "22 m2",
    guests: "2 pers.",
    bed: "Lit queen-size",
    amenities: [
      "Literie haut de gamme",
      "Salle de bain avec douche pluie",
      "Wi-Fi tres haut debit",
      "Machine a cafe et bouilloire",
      "Bureau et espace lecture",
      "Peignoirs et produits d'accueil",
    ],
    conditions: [
      "Check-in a partir de 15h",
      "Check-out jusqu'a 11h",
      "Annulation gratuite jusqu'a 48h avant l'arrivee",
      "Petit-dejeuner disponible en option",
    ],
  },
  deluxe: {
    slug: "deluxe",
    name: "Deluxe",
    tagline: "Plus d'espace, plus de confort, vue degagee sur les jardins.",
    surface: "30 m2",
    guests: "2-3 pers.",
    bed: "Lit king-size + canape lit",
    amenities: [
      "Salon cosy avec coin bureau",
      "Salle de bain spacieuse",
      "Plateau de courtoisie premium",
      "TV connectee avec casting",
      "Climatisation individuelle",
      "Service couverture sur demande",
    ],
    conditions: [
      "Check-in a partir de 15h",
      "Check-out jusqu'a 11h",
      "Annulation gratuite jusqu'a 72h avant l'arrivee",
      "Lit enfant disponible sur demande",
    ],
  },
  suite: {
    slug: "suite",
    name: "Suite Signature",
    tagline: "Notre experience la plus complete pour un sejour d'exception.",
    surface: "45 m2",
    guests: "4 pers.",
    bed: "Lit king-size + salon separe",
    amenities: [
      "Salon independant",
      "Salle de bain double vasque",
      "Baignoire et douche italienne",
      "Mini-bar inclus (1ere recharge)",
      "Room service prioritaire",
      "Acces spa preferentiel",
    ],
    conditions: [
      "Check-in prioritaire a partir de 14h",
      "Check-out jusqu'a 12h",
      "Annulation gratuite jusqu'a 5 jours avant l'arrivee",
      "Transfert gare/aeroport disponible en option",
    ],
  },
};

export const ROOM_REVIEW_ITEMS = [
  {
    quote: "Chambre impeccable, calme total et literie exceptionnelle.",
    author: "Lea et Thomas",
    source: "Google",
  },
  {
    quote: "Le niveau de service est vraiment au-dessus de la moyenne.",
    author: "Nora, Bordeaux",
    source: "Booking",
  },
];

export const ROOM_GUARANTEES = [
  "Meilleur tarif en direct",
  "Annulation flexible",
  "Paiement securise",
  "Confirmation immediate",
];
