import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore minified/generated files from linting
    "public/pdf.worker.min.mjs",
    "public/pdf.worker.mjs",
  ]),
  {
    rules: {
      // These patterns are intentional (loading initial state from sessionStorage/navigator)
      "react-hooks/set-state-in-effect": "off",
      // Allow empty interfaces for component prop types
      "@typescript-eslint/no-empty-object-type": "off",
      // Allow 'any' in specific library integration code
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unescaped in JSX (common pattern)
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
