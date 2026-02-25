export default function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hotel-atlas.example";
  const pages = [
    "",
    "/disponibilites",
    "/chambres",
    "/services",
    "/offres",
    "/spa",
    "/restaurant",
    "/contact",
    "/mentions-legales",
    "/politique-confidentialite",
    "/conditions-generales",
    "/hotel-spa-ile-de-re",
    "/hotel-bord-de-mer-ile-de-re",
  ];
  return [
    ...pages.map((path, index) => ({
      url: `${siteUrl}${path || "/"}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: index === 0 ? 1 : 0.8,
    })),
  ];
}
