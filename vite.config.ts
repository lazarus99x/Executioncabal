import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const isProd = mode === "production";
  return {
    server: {
      port: 5173,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      // Drop all console logs, warnings, and errors in production builds
      minify: "esbuild",
      sourcemap: false, // No source maps in production
      rollupOptions: {
        output: {
          // Obfuscate chunk file names
          chunkFileNames: "assets/[hash].js",
          entryFileNames: "assets/[hash].js",
          assetFileNames: "assets/[hash].[ext]",
        },
      },
    },
    esbuild: {
      // Strip console.* calls in production only
      drop: isProd ? ["console", "debugger"] : [],
    },
  };
});
