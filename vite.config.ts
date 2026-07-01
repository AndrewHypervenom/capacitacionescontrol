import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// React + Tailwind v4. Convex se conecta en tiempo de ejecución vía VITE_CONVEX_URL.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
