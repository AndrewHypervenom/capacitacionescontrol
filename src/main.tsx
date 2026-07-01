import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import App from "./App";
import { ToastProvider } from "./lib/toast";
import "./index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

if (!convexUrl) {
  // Mensaje claro si falta la configuración, en vez de una pantalla en blanco.
  document.getElementById("root")!.innerHTML = `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 640px; margin: 80px auto; padding: 24px; border: 1px solid #fcd34d; background: #fffbeb; border-radius: 16px; color: #92400e;">
      <h2 style="margin:0 0 8px">⚠️ Falta conectar Convex</h2>
      <p style="margin:0">No se encontró <code>VITE_CONVEX_URL</code>. Corre <code>npx convex dev</code> una vez (crea el archivo <code>.env.local</code>) y vuelve a iniciar <code>npm run dev</code>. Mira el <code>README.md</code>.</p>
    </div>`;
  throw new Error("VITE_CONVEX_URL no está definida.");
}

const convex = new ConvexReactClient(convexUrl);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ConvexAuthProvider>
  </React.StrictMode>,
);
