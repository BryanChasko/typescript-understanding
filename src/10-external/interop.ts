// module 10 — living with external and untyped code: type-only imports,
// taming an any-shaped third-party payload, and incremental migration
// from unknown at the boundary to a validated typed value.
// js first: you `import legacy from "legacy-stats"` and hope the shape is
// what the readme claimed; a wrong field is a runtime crash in prod.
// ts upgrade: `import type` pulls in the contract with zero runtime cost,
// and a guard converts unknown into Player before any field is trusted.

// type-only import: erased at compile time, no runtime dependency created.
import type { Player } from "../data/patriots.js";
// type-only reference to the ambient module — never imported at runtime.
import type { rawScore } from "legacy-stats";

// re-export the type so course snippets can consume it without the value.
export type { Player };

// signature borrowed from the ambient declaration, kept as a typed alias
// so we can document the legacy surface without executing it.
export type RawScoreFn = typeof rawScore;

// an untyped payload as it arrives from a legacy endpoint: shape unknown.
export function narrowToPlayer(payload: unknown): Player {
  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof (payload as Player).id !== "number" ||
    typeof (payload as Player).name !== "string" ||
    (payload as Player).team !== "NE"
  ) {
    throw new Error("legacy payload is not a Player");
  }
  return payload as Player;
}

// incremental migration: accept unknown at the boundary, validate once,
// hand a fully typed Player to the rest of the codebase.
export function migrateLegacyPlayer(raw: unknown): {
  id: number;
  name: string;
} {
  const player = narrowToPlayer(raw);
  return { id: player.id, name: player.name };
}

if (process.argv[1]?.endsWith("interop.ts")) {
  const migrated = migrateLegacyPlayer({
    team: "NE",
    id: 1,
    name: "Tom Brady",
    position: "QB",
    college: "Michigan",
    status: "active",
  });
  console.log(`migrated ${migrated.name}`);
}
