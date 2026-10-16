import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Classnest – Искуства и работилници во Македонија",
  description:
    "Резервирајте работилници и искуства со локални мајстори: готвење, керамика, вино, сликање и многу повеќе.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mk">
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
