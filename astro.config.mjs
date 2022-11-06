import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import { defineConfig } from "astro/config";
import compress from "astro-compress";
import vercel from "@astrojs/vercel/serverless";
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
