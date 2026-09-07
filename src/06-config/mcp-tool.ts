// module 6 — tsconfig (the file of checker settings) on strict (its
// pickiest preset) + docs/releases + MCP (the standard AI programs use
// to offer tools to each other) tool shape.
// js first: `const data = await res.json()` — data is whatever the
// network sent. `data.player.namme` is undefined, three layers from
// where the mistake matters.
// ts upgrade: strict forces the network boundary to be checked; zod (a
// library that checks data while the program runs) parses the payload,
// so the same description guards the tool other programs call.

import { z } from "zod";
import { roster2004 } from "../data/patriots.js";

// what strict gives you here:
// - noImplicitAny: every boundary value must be typed or validated
// - noUncheckedIndexedAccess: roster[10] is Player | undefined, not Player
// - exactOptionalPropertyTypes: jersey?: number means number | undefined,
//   never assignable from null without saying so

export const PlayerQuery = z.object({
  playerId: z.string().describe("patriots roster id, e.g. '1' for Tom Brady"),
});
export type PlayerQuery = z.infer<typeof PlayerQuery>;

export const PlayerStats = z.object({
  id: z.string(),
  name: z.string(),
  position: z.string(),
  college: z.string(),
});
export type PlayerStats = z.infer<typeof PlayerStats>;

// same shape an MCP SDK registerTool call uses:
// inputSchema + outputSchema + handler returning structuredContent.
// with @modelcontextprotocol/sdk v2: server.registerTool(name,
// { description, inputSchema, outputSchema }, handler)
export const getPlayerStatsTool = {
  name: "getPlayerStats",
  description: "look up a 2004 patriots player by roster id",
  inputSchema: PlayerQuery,
  outputSchema: PlayerStats,
  handler(raw: unknown): PlayerStats {
    const q = PlayerQuery.parse(raw); // throws zodError on bad agent input
    const found = roster2004.find((p) => String(p.id) === q.playerId);
    if (!found) throw new Error(`no patriot with id ${q.playerId}`);
    return PlayerStats.parse({
      id: String(found.id),
      name: found.name,
      position: found.position,
      college: found.college,
    });
  },
};

// docs workflow for staying current (context7 pattern):
// 1. resolve-library-id("typescript") -> 2. query-docs(topic, max 3 calls,
// one concept per call). pin lesson deltas to release notes 5.0-5.4:
// satisfies, const type params, NoInfer, inferred predicates, decorators.
export const docsPlaybook = [
  "handbook: everyday types, narrowing, generics",
  "reference: utility types, decorators",
  "release notes 5.0-5.4: satisfies, const type params",
] as const;
