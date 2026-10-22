import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Nitro picks the deploy target automatically: on Vercel it builds for Vercel,
// on Netlify for Netlify, and so on. To force one, set NITRO_PRESET (e.g. "vercel").
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tanstackStart({
      // Use our SSR error wrapper in src/server.ts as the server entry.
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
    nitro(),
  ],
});
