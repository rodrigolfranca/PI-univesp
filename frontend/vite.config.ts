import { validateVariants } from "./scripts/variants.mjs";
import { defineConfig, loadEnv } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

function figmaAssetResolver() {
  return {
    name: "figma-asset-resolver",
    resolveId(id) {
      if (id.startsWith("figma:asset/")) {
        const filename = id.replace("figma:asset/", "");
        return path.resolve(__dirname, "src/assets", filename);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [
      {
        name: "variant-validation",
        buildStart() {
          validateVariants();
        },
        configureServer(server) {
          const isVariant = (file) =>
            file.includes("/src/variants/") || file.includes("/public/variants/");

          const restart = (file) => {
            if (isVariant(file)) server.restart();
          };

          server.watcher.on("add", restart).on("unlink", restart);
        },
        handleHotUpdate({ file, server }) {
          if (file.includes("/src/variants/") || file.includes("/public/variants/")) {
            validateVariants();
            server.ws.send({ type: "full-reload" });
          }
        },
      },
      figmaAssetResolver(),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },

    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:3000",
          changeOrigin: true,
          rewrite: (url) => url.replace(/^\/api/, ""),
        },
      },
    },

    assetsInclude: ["**/*.svg", "**/*.csv"],
  };
});
