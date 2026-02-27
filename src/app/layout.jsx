import { Manrope, Playfair_Display } from "next/font/google";
import AnalyticsTracker from "../components/AnalyticsTracker";
import CookieBanner from "../components/CookieBanner";
import SiteHeader from "../components/SiteHeader";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

function getMetadataBase() {
  const fallback = new URL("https://hotel-atlas.example");
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return fallback;
  try {
    return new URL(raw);
  } catch {
    return fallback;
  }
}

export const metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "Hotel Atlas - Réservations",
    template: "%s | Hotel Atlas",
  },
  description: "Boutique resort en bord de mer. Réservations en ligne.",
  keywords: ["hotel", "resort", "spa", "suite", "île de ré", "réservation hotel"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Hotel Atlas - Réservations",
    description: "Boutique resort en bord de mer. Réservations en ligne.",
    siteName: "Hotel Atlas",
    locale: "fr_FR",
    images: [
      {
        url: "/image-hotel.png",
        width: 1200,
        height: 800,
        alt: "Facade de l'hotel Atlas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hotel Atlas - Réservations",
    description: "Boutique resort en bord de mer. Réservations en ligne.",
    images: ["/image-hotel.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={`${manrope.variable} ${playfair.variable}`}>
        <AnalyticsTracker />
        <SiteHeader />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
