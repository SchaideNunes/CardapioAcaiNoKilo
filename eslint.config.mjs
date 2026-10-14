import js from "@eslint/js";
import globals from "globals";
import typescriptEslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...typescriptEslint.configs.recommended,

  // Frontend (navegador)
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
  },

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

  // Backend Express (CommonJS)
  {
    files: ["server/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Testes da API e scripts utilitários (ESM no Node)
  {
    files: ["server/**/*.mjs", "scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Script de migração executado no mongosh
  {
    files: ["migration.js"],
    languageOptions: {
      sourceType: "script",
      globals: globals.mongo,
    },
  },

  // Custom Ignores
  {
    ignores: ["dist/*", "build/*", "server/node_modules/*"],
  },
];
