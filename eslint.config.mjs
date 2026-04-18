import js from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  // Base ESLint recommended rules
  js.configs.recommended,
  
  // TypeScript recommended rules
  ...typescriptEslint.configs.recommended,

  // React & Hooks
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-unescaped-entities": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // Custom Ignores
  {
    ignores: ["dist/*", "build/*", "vite.config.ts"],
  },
];
