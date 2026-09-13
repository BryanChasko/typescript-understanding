// ambient module declaration for an untyped third-party package.
// this is how you describe the shape of a library that ships no types,
// so callers get checking without the library itself changing.
declare module "legacy-stats" {
  export function rawScore(id: number): number;
}
