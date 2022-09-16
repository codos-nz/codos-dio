import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://dio.codos.co.nz",
  integrations: [tailwind()],
  vite: {
    ssr: {
      external: ["@11ty/eleventy-img", "svgo"],
    },
  },
  output: "server",
  adapter: cloudflare({ mode: "directory" }),
});
