import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "web",
          include: ["src/**/*.test.{ts,tsx}"],
          globals: true,
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          css: true,
        },
      },
      {
        test: {
          name: "server",
          include: ["server/test/**/*.test.mjs"],
          environment: "node",
          // O primeiro boot do MongoDB em memória pode ser lento no Windows
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
