import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA: only register service worker outside Lovable preview / iframes
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovable.app") === false &&
    window.location.hostname.includes("lovable");

if (isInIframe || isPreviewHost) {
  // Aggressively unregister any stale service workers in preview / iframe
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
  }
} else if ("serviceWorker" in navigator) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({ immediate: true });
  }).catch(() => { /* PWA disabled in dev */ });
}

createRoot(document.getElementById("root")!).render(<App />);
