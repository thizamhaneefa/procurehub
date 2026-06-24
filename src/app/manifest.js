// Web app manifest — makes "Add to Home Screen" install ProcureHub as a
// standalone app with its own icon, name, and pink theme.
export default function manifest() {
  return {
    name: "ProcureHub — Procurement & Inventory",
    short_name: "ProcureHub",
    description: "Procurement & Inventory Control Panel",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a0712",
    theme_color: "#ec4899",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
