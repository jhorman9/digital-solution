import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Digital Solutions · Operaciones",
  description: "Panel privado de operaciones",
};
export const dynamic = "force-dynamic";
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
