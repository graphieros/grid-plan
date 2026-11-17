import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "GridPlan",
      formats: ["es"],
      fileName: () => "grid-plan.js",
    },
    rollupOptions: {
      external: [
        "vue",
        /^three(\/.+)?$/,
      ],
      output: {},
    },
    sourcemap: true,
    emptyOutDir: true,
    minify: "esbuild",
  },
});
