import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import { defineConfig } from "astro/config";
import compress from "astro-compress";
import vercel from "@astrojs/vercel/serverless";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";

// https://astro.build/config
export default defineConfig({
  site: "https://www.dragitout.co.nz",
  output: "server",
  adapter: vercel(),
  integrations: [
    tailwind(),
    image({
      serviceEntryPoint: "@astrojs/image/sharp",
    }),
    sitemap({
      customPages: [
        "https://www.dragitout.co.nz/",
        "https://www.dragitout.co.nz/events",
        "https://www.dragitout.co.nz/about-us",
        "https://www.dragitout.co.nz/contact",
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
  ],
  cleanUrls: true,
});
