import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.js"),
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
