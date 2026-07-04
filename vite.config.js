import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "Vocalize.it - Smart Clipboard AI Processor",
        short_name: "Vocalize",
        description: "Smart active processing hub for your clipboard",
        theme_color: "#090d16",
        background_color: "#090d16",
        display: "standalone",
        orientation: "portrait",
        categories: ["productivity", "utilities"],
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
        ],
        share_target: {
          action: "/",
          method: "GET",
          enctype: "application/x-www-form-urlencoded",
          params: {
            title: "title",
            text: "text",
            url: "url",
          },
        },
        shortcuts: [
          {
            name: "Summarize",
            short_name: "Summarize",
            description: "Summarize clipboard text",
            url: "/?action=summarize",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Correct Grammar",
            short_name: "Grammar",
            description: "Correct clipboard text grammar",
            url: "/?action=correct",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Key Takeaways",
            short_name: "Keypoints",
            description: "Extract bullet points",
            url: "/?action=bulletpoints",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },
    }),
  ],
});
