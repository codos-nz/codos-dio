import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import { defineConfig } from "astro/config";
import compress from "astro-compress";
import vercel from "@astrojs/vercel/serverless";
import sitemap from "@astrojs/sitemap";
import robotsTxt from 'astro-robots-txt';

// https://astro.build/config
export default defineConfig({
  site: "https://codos-dio.vercel.app",
  output: "server",
  adapter: vercel(),
  integrations: [
    tailwind(),
    image({
      serviceEntryPoint: "@astrojs/image/sharp",
    }),
    sitemap(),robotsTxt(),
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
