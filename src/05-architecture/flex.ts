// module 5 — literals (exact allowed values), enums (named sets of
// choices), generics (one definition that works for many kinds),
// utility types (ready-made shape transformers).
// js first: `const POSITIONS = ["QB", "RB", "WR"]` plus discipline —
// nothing stops `setStatus("injureed")`. teams add extra checking code
// or Object.freeze (a command that locks an object) and hope reviewers
// catch the rest.
// ts upgrade: `"active" | "injured"` rejects the typo before running;
// generics + utilities derive new shapes instead of redeclaring them.

import type { Player } from "../data/patriots.js";

// literal union: closed set of allowed values
export type Status = "active" | "injured" | "practice-squad";

// prefer `as const` objects over enum for tree-shakable unions
export const Position = { QB: "QB", RB: "RB", WR: "WR", LB: "LB" } as const;
export type Position = (typeof Position)[keyof typeof Position];

// legacy enum form, still seen in older codebases
export enum Down {
  First = 1,
  Second,
  Third,
  Fourth,
}

// generics: reusable without sacrificing safety
export function first<T>(arr: readonly T[]): T | undefined {
  return arr[0];
}

// constrained generic: works on anything with a name
export function namesOf<T extends { name: string }>(
  rows: readonly T[],
): string[] {
  return rows.map((r) => r.name);
}

// keyof: derive keys from the type itself
export function getField<K extends keyof Player>(p: Player, key: K): Player[K] {
  return p[key];
}

// utility types on the Player shape
export type TradeTarget = Pick<Player, "id" | "name">;
export type UnsignedRookie = Omit<Player, "id">;
export type RosterPatch = Partial<Player>;
export type DepthChart = Record<string, Player[]>;

// satisfies: check the shape without widening the literal
export const brady = {
  team: "NE",
  id: 1,
  name: "Tom Brady",
  position: "QB",
  college: "Michigan",
  status: "active",
} satisfies Player;
