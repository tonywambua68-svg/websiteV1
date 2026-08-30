import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0", // storefront reachable on localhost AND the LAN IP
    port: 5173, // the Product API owns :3000 (node server.mjs) — never share it
    strictPort: true, // fail loudly rather than silently picking another port
  },
});
