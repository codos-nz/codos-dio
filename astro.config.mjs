import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import react from "@astrojs/react";
import netlify from '@astrojs/netlify/functions';
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://dio.codos.co.nz",
  integrations: [react(), tailwind(), image()],
  vite: {
    ssr: {
      external: ["svgo"]
    }
  },
  output: 'server',
  adapter: netlify(),
});
