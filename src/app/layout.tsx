import type { Metadata, Viewport } from "next";
import "sweetalert2/dist/sweetalert2.min.css";
import "./globals.css";
import PwaRegistration from "./components/PwaRegistration";
import DeadlineNotificationWatcher from "./components/DeadlineNotificationWatcher";
import { WorkspaceSettingsProvider } from "./components/WorkspaceSettings";
export const metadata: Metadata = {
  title: "Digital Solutions · Operaciones",
  description: "Panel privado de operaciones",
  applicationName: "Digital Solutions",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#12382f", width: "device-width", initialScale: 1 };
export const dynamic = "force-dynamic";
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body><WorkspaceSettingsProvider><PwaRegistration /><DeadlineNotificationWatcher />{children}</WorkspaceSettingsProvider></body>
    </html>
  );
}
