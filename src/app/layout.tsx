import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Cera (на ClassBento) е платен фонт. Manrope е бесплатна геометриска замена со кирилица.
const font = Manrope({ subsets: ["latin", "cyrillic"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Classnest – Искуства и работилници во Македонија", template: "%s | Classnest" },
  description:
    "Резервирајте работилници и искуства со локални мајстори: готвење, керамика, вино, сликање и многу повеќе.",
  openGraph: { type: "website", siteName: "Classnest", locale: "mk_MK" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mk">
      <body className={font.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
