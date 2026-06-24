import "./globals.css";
import { Toaster } from "sonner";
import CursorEffects from "@/components/CursorEffects";

export const metadata = {
  title: "ProcureHub — Procurement & Inventory Control",
  description: "Procurement & Inventory Control Panel",
  appleWebApp: { capable: true, title: "ProcureHub", statusBarStyle: "black-translucent" },
};

export const viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
};

const themeInit = `
try {
  var t = localStorage.getItem("ph-theme");
  if (t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        {children}
        <CursorEffects />
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
