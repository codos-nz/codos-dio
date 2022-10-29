import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/serverless";
import compress from "astro-compress";

// https://astro.build/config
export default defineConfig({
  output: "server",
  site: "https://dio.codos.co.nz",
  integrations: [
    tailwind(),
    image({
      serviceEntryPoint: "@astrojs/image/sharp",
    }),
    compress({
      css: true,
      html: true,
      img: true,
      js: true,
      svg: true,
    }),
  ],
  vite: {
    ssr: {
      external: ["svgo"],
    },
  },
  adapter: vercel(),
});
