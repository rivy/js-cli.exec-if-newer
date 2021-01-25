// spell-checker:ignore (names) rivy ; (options) iife
module.exports = {
  root: true,
  env: { es6: true },
  ignorePatterns: [".eslintrc.js", "dist", "node_modules"],
  // avoid `parserOptions` ~ [2020-10-29]/rivy ~ use is causing issues for eslint evaluation of files outside of `src` (see https://github.com/typescript-eslint/typescript-eslint/issues/1723)
  // parserOptions: { ecmaVersion: 6, project: ['./tsconfig.json', './tsconfig.eslint.json'] },
  plugins: ["import", "functional"],
  extends: [
    "eslint:recommended",
    "plugin:eslint-comments/recommended",
    "plugin:functional/lite",
    "plugin:security/recommended",
    "plugin:security-node/recommended",
    "prettier",
  ],
  rules: {
    // ref: https://eslint.org/docs/rules
    "eslint-comments/disable-enable-pair": ["error", { allowWholeFile: true }],
    "eslint-comments/no-unused-disable": "warn",
    "import/order": [
      "error",
      { "newlines-between": "always", alphabetize: { order: "asc" } },
    ],
    "no-console": ["warn"], // ref: https://eslint.org/docs/rules/no-console
    "no-undefined": ["error"], // ref: https://eslint.org/docs/rules/no-undefined
    "no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ], // ref: https://eslint.org/docs/rules/no-unused-vars
    "sort-imports": [
      "error",
      { ignoreDeclarationSort: true, ignoreCase: true },
    ],
    "wrap-iife": ["error", "inside"], // correlate with Prettier formatting choice; ref: https://eslint.org/docs/rules/wrap-iife
  },
  // globals: { BigInt: true, console: true, WebAssembly: true },
  // globals: { Atomics: 'readonly', SharedArrayBuffer: 'readonly' },
};
