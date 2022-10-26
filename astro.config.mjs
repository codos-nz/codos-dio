import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  output: "server",
  site: "https://dio.codos.co.nz",
  integrations: [
    react(),
    tailwind(),
    image({
      serviceEntryPoint: "@astrojs/image/sharp",
    }),
  ],
  vite: {
    ssr: {
      external: ["svgo"],
    },
  },
  adapter: vercel(),
});
