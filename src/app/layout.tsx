import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  title: "Dividir Gastos — Divide cuentas con amigos",
  description:
    "Crea una sala, agrega gastos y descubre quien le debe a quien. Simple, rapido y en tiempo real.",
  applicationName: "Dividir Gastos",
  keywords: ["dividir gastos", "split expenses", "cuentas", "amigos", "deudas"],
  authors: [{ name: "Dividir Gastos" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Dividir Gastos — Divide cuentas con amigos",
    description:
      "Crea una sala, agrega gastos y descubre quien le debe a quien. Simple, rapido y en tiempo real.",
    type: "website",
    locale: "es_PE",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dividir Gastos",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
