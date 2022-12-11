import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import { defineConfig } from "astro/config";
import compress from "astro-compress";
import vercel from "@astrojs/vercel/serverless";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";

// https://astro.build/config
export default defineConfig({
  site: "https://dragitout.co.nz",
  output: "server",
  adapter: vercel(),
  integrations: [
    tailwind(),
    image({
      serviceEntryPoint: "@astrojs/image/sharp",
    }),
    sitemap({
      customPages: [
        "https://dragitout.co.nz/",
        "https://dragitout.co.nz/events",
        "https://dragitout.co.nz/about-us",
        "https://dragitout.co.nz/contact",
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
