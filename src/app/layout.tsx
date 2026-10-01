import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nortia Supply — Cash Runway & Control de Liquidez",
  description: "Sistema de control de liquidez, proyección de caja y cobranza estratégica para Nortia Supply.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
