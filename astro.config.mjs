import { defineConfig } from "astro/config";
import restart from "vite-plugin-restart";
import glsl from "vite-plugin-glsl";
import { fileURLToPath } from "url";

export default defineConfig({
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "/src/assets/styles/_variables.scss" as *;
          `,
        },
      },
    },
    plugins: [
      restart({ restart: ["../public/**"] }), // Restart server on static file change
      glsl(), // Handle shader files
    ],
    resolve: {
      alias: {
        "@plugins": fileURLToPath(new URL("./src/plugins", import.meta.url)),
        "@shaders": fileURLToPath(new URL("./src/shaders", import.meta.url)),
      },
    },
  },
});
