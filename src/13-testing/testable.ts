// module 13 — a testable subject: a small pure well-typed unit, a typed
// fixture builder, and a function that takes an injected dependency typed
// by an interface so tests can pass a mock.
// js first: functions reach out to real clocks, databases, and network,
// so tests are slow and flaky; fixtures are hand-built object literals
// copy-pasted with a field quietly missing.
// ts upgrade: the dependency is an interface (mock it freely), the fixture
// builder returns a guaranteed-complete Player, and the pure unit has a
// signature the test can trust.

import type { Player } from "../data/patriots.js";

// pure well-typed unit under test: filter a roster to one status.
export function filterByStatus(
  players: readonly Player[],
  status: Player["status"],
): Player[] {
  return players.filter((p) => p.status === status);
}

// typed fixture builder. exactOptionalPropertyTypes means we must NOT
// spread an explicit jersey:undefined into the literal — build the jersey
// field conditionally so the property is either present-with-a-number or
// absent, never present-and-undefined. team stays the literal "NE".
export function makePlayer(overrides?: Partial<Player>): Player {
  const base: Player = {
    team: "NE",
    id: 1,
    name: "Tom Brady",
    position: "QB",
    college: "Michigan",
    status: "active",
  };

  // strip jersey out of the spread so we never carry an explicit
  // jersey:undefined (which exactOptionalPropertyTypes rejects on a Player).
  const { jersey: _drop, ...rest } = { ...base, ...overrides };
  const jersey = overrides?.jersey;
  return jersey === undefined
    ? { ...rest, team: "NE" }
    : { ...rest, team: "NE", jersey };
}

// dependency typed by an interface — tests inject a mock implementation.
export interface StatsSource {
  scoreFor(id: number): number;
}

export function topScorer(
  players: readonly Player[],
  stats: StatsSource,
): Player | undefined {
  let best: Player | undefined;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const p of players) {
    const s = stats.scoreFor(p.id);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return best;
}

if (process.argv[1]?.endsWith("testable.ts")) {
  const p = makePlayer({ name: "Corey Dillon", position: "RB" });
  console.log(`fixture: ${p.name} ${p.jersey ?? "(no jersey)"}`);
}
