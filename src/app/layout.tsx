import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ShopProvider } from "@/context/ShopContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnnouncementPopup } from "@/components/AnnouncementPopup";
import { BootSplash } from "@/components/BootSplash";
import { PWAInstallBanner } from "@/components/InstallApp";
import { BRAND } from "@shared/constants";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.slogan}`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Boutique de mode féminine haut de gamme à Lubumbashi. Collections venues de Turquie.",
  applicationName: BRAND.name,
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/logo.jpg", type: "image/jpeg" }],
    apple: [{ url: "/logo.jpg", type: "image/jpeg" }],
    shortcut: "/logo.jpg",
  },
  appleWebApp: {
    capable: true,
    title: BRAND.name,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF8F5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${cormorant.variable} ${outfit.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" type="image/jpeg" href="/logo.jpg" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
      </head>
      <body className="flex min-h-full flex-col bg-[var(--ivory)] text-[var(--ink)]">
        <ShopProvider>
          <BootSplash />
          <Header />
          <AnnouncementPopup />
          <main className="flex-1">{children}</main>
          <Footer />
          <PWAInstallBanner />
        </ShopProvider>
      </body>
    </html>
  );
}
