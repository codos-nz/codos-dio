import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import { defineConfig } from "astro/config";
import compress from "astro-compress";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";

// https://astro.build/config
export default defineConfig({
  site: "https://dio.codos.co.nz",
  integrations: [
    tailwind(),
    image({
      serviceEntryPoint: "@astrojs/image/sharp",
    }),
    sitemap({
      customPages: [
        "https://codos-dio.vercel.app/",
        "https://codos-dio.vercel.app/events",
        "https://codos-dio.vercel.app/about-us",
        "https://codos-dio.vercel.app/contact",
      ],
    }),
    robotsTxt(),
    compress({
      css: false,
      html: false,
      img: true,
      js: false,
      svg: false,
    }),
  ]
});
