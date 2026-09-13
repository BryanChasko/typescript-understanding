// module 9 — async work with types: Promise<T>, async/await return
// types, typed error handling, and a typed Promise.all over many lookups.
// js first: `const p = await fetchPlayer(id)` returns whatever the server
// felt like sending; a typo in a field surfaces as undefined three calls
// later. errors caught in `catch (e)` are `any`, so `e.mesage` compiles.
// ts upgrade: Promise<Player> pins the resolved shape, `catch (e: unknown)`
// forces you to narrow before touching the error, and Promise.all keeps a
// tuple of typed results.

import type { Player } from "../data/patriots.js";
import { roster2004 } from "../data/patriots.js";

// injected async source (no network): resolves from the shared roster.
// callers can swap this for a real fetch in production or a mock in tests.
export type FetchPlayer = (id: number) => Promise<Player>;

export const fetchFromRoster: FetchPlayer = async (id) => {
  const found = roster2004.find((p) => p.id === id);
  if (!found) throw new Error(`no player with id ${id}`);
  return found;
};

// Result pattern: typed success/failure without throwing across the boundary.
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

// async/await with a typed error path: narrow unknown, then rethrow as Result.
export async function loadPlayer(
  id: number,
  fetchPlayer: FetchPlayer = fetchFromRoster,
): Promise<Result<Player>> {
  try {
    const player = await fetchPlayer(id);
    return { ok: true, value: player };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "unknown fetch failure";
    return { ok: false, error };
  }
}

// typed Promise.all over several lookups. each element is Player, but we
// still guard the roster index read to satisfy noUncheckedIndexedAccess.
export async function loadMany(
  ids: readonly number[],
  fetchPlayer: FetchPlayer = fetchFromRoster,
): Promise<Player[]> {
  return Promise.all(ids.map((id) => fetchPlayer(id)));
}

// helper that reads by array position — index access is Player|undefined
// under noUncheckedIndexedAccess, so the guard is mandatory.
export function firstName(players: readonly Player[]): string {
  const first = players[0];
  if (!first) throw new Error("empty roster");
  return first.name;
}

if (process.argv[1]?.endsWith("data-layer.ts")) {
  void (async () => {
    const one = await loadPlayer(1);
    console.log(one.ok ? one.value.name : one.error);
    const missing = await loadPlayer(999);
    console.log(missing.ok ? missing.value.name : `error: ${missing.error}`);
    const many = await loadMany([1, 2, 3]);
    console.log(`loaded ${many.length}: ${firstName(many)}`);
  })();
}
