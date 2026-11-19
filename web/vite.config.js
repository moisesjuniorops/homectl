import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Em dev, /api vai para a API local. Em produção quem faz esse proxy é o nginx (ou o Ingress).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": process.env.API_URL || "http://127.0.0.1:8000" },
  },
});
