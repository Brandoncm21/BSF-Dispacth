import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts", "./tests/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Meta: subir thresholds iterativamente hasta 80%
      // thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      exclude: [
        "node_modules/",
        "tests/setup.ts",
        "**/*.d.ts",
        "next.config.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
