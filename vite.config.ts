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
      "/api/v1/geospatial": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/cog": {
        target: "http://192.168.99.87:8110",
        changeOrigin: true,
      },
    },
    cors: true,
  },
});
