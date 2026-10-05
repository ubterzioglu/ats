import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { 
      "@": resolve(__dirname, "."),
      "server-only": resolve(__dirname, "../../tests/mocks/server-only.ts")
    }
  },
  test: {
    environment: "node",
    // The suite lives at the repo root, one level above this workspace, while
    // the `@/` alias above still resolves into it.
    include: ["../../tests/**/*.test.ts"]
  }
});
