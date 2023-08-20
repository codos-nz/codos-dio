import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import compress from "astro-compress";
import vercel from "@astrojs/vercel/serverless";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";

// https://astro.build/config
export default defineConfig({
  site: "https://www.dragitout.co.nz",
  output: "server",
  adapter: vercel({
    analytics: true,
    imageService: true,
    imagesConfig: {
      sizes: [400, 800, 1200, 1920, 2560, 3840]
    }
  }),
  integrations: [
    tailwind(),
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
  experimental: { assets: true },
  build: {
    split: true
}
});
