import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nortia Supply — Control de Liquidez & Cobranzas",
  description: "Plataforma de gestión de liquidez, proyección de caja y cobranza estratégica para Nortia Supply.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-slate-50 text-slate-900">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-slate-200">
        {children}
      </body>
    </html>
  );
}
