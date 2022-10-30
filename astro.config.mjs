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
      svg: {
        multipass: true, // boolean. false by default
        datauri: "enc", // 'base64' (default), 'enc' or 'unenc'.
        js2svg: {
          indent: 2, // string with spaces or number of spaces. 4 by default
          pretty: true, // boolean, false by default
        },
        plugins: [
          // set of built-in plugins enabled by default
          "preset-default",
        ],
      },
    }),
  ],
});
