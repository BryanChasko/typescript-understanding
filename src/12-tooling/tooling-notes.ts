// module 12 — tooling around the compiler: linting, formatting, and the
// strict tsconfig knobs that make the earlier modules behave.
// js first: style and correctness live in reviewers' heads; two files
// disagree on quotes and nobody notices a floating promise.
// ts upgrade: eslint catches logic smells the type checker allows,
// prettier removes style debates, and strict tsconfig flags turn silent
// hazards into build errors.
//
// example config, not wired into this repo's build. these are exported as
// string constants so drift-checkers and course snippets can read them
// without adding eslint/prettier as dependencies or npm scripts.

// why: type-aware linting catches unhandled promises and unsafe any that
// the compiler alone permits.
export const ESLINT_CONFIG = `{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}`;

// why: one formatter, zero style arguments in review.
export const PRETTIER_CONFIG = `{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all"
}`;

// why: these are the flags that made the strict hazards in modules 2-13
// real errors instead of runtime surprises.
export const STRICT_TSCONFIG_SNIPPET = `{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}`;

if (process.argv[1]?.endsWith("tooling-notes.ts")) {
  console.log("example configs (not wired into build):");
  console.log(STRICT_TSCONFIG_SNIPPET);
}
