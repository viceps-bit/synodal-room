import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/tiles": {
        target: "http://192.168.99.87:8120",
        changeOrigin: true,
      },
      "/cog": {
        target: "http://192.168.99.87:8110",
        changeOrigin: true,
      },
      "/tms": {
        target: "https://lcz-generator.rub.de",
        changeOrigin: true,
      },
    },
  },
});
