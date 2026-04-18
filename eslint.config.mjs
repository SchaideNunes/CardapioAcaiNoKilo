import nextConfig from "eslint-config-next";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  ...nextConfig,
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [".next/*", "out/*", "build/*", "next-env.d.ts", "*.mts"],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-unescaped-entities": "off",
    },
  },
];
