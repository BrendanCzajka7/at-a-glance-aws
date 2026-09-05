import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/config": {
        target: "https://d6ul0xqk7ua47.cloudfront.net",
        changeOrigin: true,
      },
      "/data": {
        target: "https://d6ul0xqk7ua47.cloudfront.net",
        changeOrigin: true,
      },
      "/images": {
        target: "https://d6ul0xqk7ua47.cloudfront.net",
        changeOrigin: true,
      },
    },
  },
});