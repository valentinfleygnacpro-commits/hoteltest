const ROOM_OPTIONS = [
  { value: "", label: "Sélectionner" },
  { value: "classic", label: "Classic - 140 EUR/nuit", area: "22 m2", capacity: "2 pers." },
  { value: "deluxe", label: "Deluxe - 190 EUR/nuit", area: "30 m2", capacity: "2-3 pers." },
  { value: "suite", label: "Suite Signature - 280 EUR/nuit", area: "45 m2", capacity: "4 pers." },
];

const ADDON_OPTIONS = [
  { value: "none", label: "Aucune" },
  { value: "breakfast", label: "Petit-déjeuner +18 EUR/pers" },
  { value: "spa", label: "Accès spa +35 EUR/pers" },
  { value: "transfer", label: "Transfert privé +55 EUR" },
];

const FAQ_ITEMS = [
  {
    question: "À quelle heure sont les check-in et check-out ?",
    answer: "Check-in à partir de 15h, check-out jusqu'à 11h.",
  },
  {
    question: "Le petit-déjeuner est-il inclus ?",
    answer: "Disponible en option à 18 EUR par personne.",
  },
  {
    question: "Les animaux sont-ils acceptés ?",
    answer: "Oui, sur demande préalable. Supplément de 15 EUR/nuit.",
  },
  {
    question: "Comment fonctionne l'annulation ?",
    answer: "Annulation gratuite jusqu'à 48h avant l'arrivée.",
  },
];

const OFFER_ITEMS = [
  {
    title: "Escapade bien-être",
    details: "2 nuits + massage + spa illimité.",
    priceFrom: 420,
  },
  {
    title: "Gastronomie locale",
    details: "Menu dégustation 5 plats inclus.",
    priceFrom: 360,
  },
  {
    title: "Work and Reset",
    details: "Suite + salle de réunion + café illimité.",
    priceFrom: 510,
  },
];

const TESTIMONIALS = [
  {
    quote: "Service impeccable, literie incroyable. Nous reviendrons.",
    author: "Camille et Hugo",
    source: "Google",
    date: "janvier 2026",
  },
  {
    quote: "Le spa et le restaurant valent le détour à eux seuls.",
    author: "Salma, Lyon",
    source: "Booking",
    date: "décembre 2025",
  },
  {
    quote: "Un lieu calme pour travailler et se ressourcer.",
    author: "Jonathan, Londres",
    source: "Tripadvisor",
    date: "novembre 2025",
  },
];

module.exports = {
  ROOM_OPTIONS,
  ADDON_OPTIONS,
  FAQ_ITEMS,
  OFFER_ITEMS,
  TESTIMONIALS,
};
