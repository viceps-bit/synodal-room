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
      // "/tms": {
      //   target: "http://lcz-generator.rub.de",
      //   changeOrigin: true,
      // },
    },
  },
});
