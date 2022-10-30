import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import { defineConfig } from "astro/config";
import compress from "astro-compress";

// https://astro.build/config
export default defineConfig({
  site: "https://dio.codos.co.nz",
  integrations: [
    tailwind(),
    image({
      serviceEntryPoint: "@astrojs/image/sharp",
    }),
    compress({
      css: false,
      html: false,
      img: true,
      js: false,
      svg: false,
    }),
  ],
  cleanUrls: true,
});
