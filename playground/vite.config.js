import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [vue()],
  resolve: { dedupe: ["vue", "three"] },
  // Consume the linked package's exports from dist; never alias it to src.
  optimizeDeps: { exclude: ["grid-plan"] },
  server: { fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] } },
});
