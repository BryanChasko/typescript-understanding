// module 2 — primitives (the basic kinds: text, numbers, true/false),
// inference (leaving a note off and letting the checker fill it in),
// any (skip checking) vs unknown (check later) vs never (impossible).
// js first: `function square(n) { return n ** 2 }` works, but so does
// `square("cat")` — answer NaN, no complaint. every caller must just
// know n is a number, and nothing checks.
// ts upgrade: `(n: number)` writes the contract down, tsc enforces it.
// ports basic_function_tom_brady_versus_mac_jones_calculator.py.

export function square(n: number): number {
  return n ** 2;
}

// explicit annotations on the inputs, inferred number on the output.
export function calculateWeightedScore(
  touchdowns: number,
  interceptions: number,
): number {
  return touchdowns - interceptions ** 2;
}

export const brady2007 = { td: 50, int: 8 }; // inference: { td: number; int: number }
export const jones2023 = { td: 10, int: 12 };

// any disables the safety net. unknown keeps it: must narrow before use.
export function summarizeStats(raw: unknown): string {
  if (typeof raw === "object" && raw !== null && "td" in raw) {
    const s = raw as { td: unknown; int: unknown };
    if (typeof s.td === "number" && typeof s.int === "number") {
      return `weighted score: ${calculateWeightedScore(s.td, s.int)}`;
    }
  }
  throw new Error("stats payload has wrong shape");
}

// never: values that never occur. exhaustiveness + fatal errors.
export function fail(message: string): never {
  throw new Error(message);
}

if (process.argv[1]?.endsWith("primitives.ts")) {
  console.log(
    `brady 2007: ${calculateWeightedScore(brady2007.td, brady2007.int)}`,
  ); // -14
  console.log(
    `jones 2023: ${calculateWeightedScore(jones2023.td, jones2023.int)}`,
  ); // -134
}
