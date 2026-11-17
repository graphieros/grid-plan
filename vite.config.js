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
    rolldownOptions: {
      external: ["vue", /^three(\/.+)?$/],
      output: {
        minify: {
          compress: true,
          mangle: true,
          codegen: true,
        },
        comments: {
          annotation: true,
          legal: true,
        },
      },
    },
    emptyOutDir: true,
    minify: "oxc",
  },
});
