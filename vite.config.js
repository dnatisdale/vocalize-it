import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const now = new Date();
const version = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}.${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
const updated = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}).format(now);

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_UPDATED__: JSON.stringify(updated),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "Listen Better",
        short_name: "Listen Better",
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
