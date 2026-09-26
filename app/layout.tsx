import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL("https://iispc.org"),
  title: {
    default: "IISPC — Международный институт социальной психотерапии",
    template: "%s — IISPC",
  },
  description: "Образовательные программы, супервизия, научные проекты и международное сотрудничество для психологов, психотерапевтов и консультантов.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "IISPC",
    title: "IISPC — образование и наука для тех, кто работает с человеком",
    description: "Подготовка специалистов, супервизия, исследования и международное профессиональное сообщество.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "IISPC — научная психотерапия и образование" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IISPC — образование и наука для тех, кто работает с человеком",
    description: "Подготовка специалистов, супервизия, исследования и международное профессиональное сообщество.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <a className="skip-link" href="#main-content">Перейти к содержанию</a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
