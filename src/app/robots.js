export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hotel-atlas.example";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
