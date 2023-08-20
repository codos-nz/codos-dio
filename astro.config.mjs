import tailwind from "@astrojs/tailwind";
import { defineConfig, sharpImageService } from "astro/config";
import vercelServerless from "@astrojs/vercel/serverless";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";

// https://astro.build/config
export default defineConfig({
  site: "https://www.dragitout.co.nz",
  output: "server",
  adapter: vercelServerless({
    analytics: true,
    imagesConfig: {
      sizes: [400, 450, 600, 800, 1200, 1920, 2560, 3840],
    },
    imageService: true,
  }),
  image: {
    service: sharpImageService(),
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.eventfinda.co.nz",
        pathname: "/uploads/events/**",
      },
      {
        protocol: "https",
        hostname: "**.dragitout.co.nz",
      },
    ],
  },
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
  ],
  cleanUrls: true,
  experimental: {
    assets: true,
  },
  build: {
    split: true,
  },
});
