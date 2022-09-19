import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import netlify from '@astrojs/netlify/functions';
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://dio.codos.co.nz",
  integrations: [tailwind(), image()],
  vite: {
    ssr: {
      external: ["svgo"]
    }
  },
  output: 'server',
  adapter: netlify({
    dist: new URL('./dist/', import.meta.url)
  }),
});
