// module 3 — complex shapes: arrays, tuples, interfaces, optional + readonly.
// ports basic_loops_dictionaries_patriots_legends.py + file-io sorting example.

import {
  legends,
  roster2004,
  type PlayCall,
  type Player,
} from "../data/patriots.js";

// arrays of a shaped object
export const roster: Player[] = roster2004;

// tuple: fixed length, fixed types — [down, yardsToGo, formation]
export const fourthAndTwo: PlayCall = [4, 2, "Shotgun"];

// optional (?) for data that may be missing, readonly for what agents must not mutate
export interface TradePayload {
  playerId: number;
  team?: string; // optional
  readonly requestedAt: string; // immutable once built
}

// loop 1: shaped iteration (mirrors the legends for-loop)
export function legendLines(): string[] {
  return legends.map((l) => `${l.name} | ${l.position} | ${l.college}`);
}

// loop 2: comprehension + enumerate becomes map + index
export function numberedLegends(): string[] {
  return legends.map((l) => l.name).map((name, i) => `${i + 1}. ${name}`);
}

// mirrors the csv sort-by-state example: sort roster by college name
export function rosterByCollege(): string[] {
  return [...roster]
    .sort((a, b) => b.college.localeCompare(a.college))
    .map((p) => `${p.name} is a ${p.position} from ${p.college}`);
}
