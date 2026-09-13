// module 11 — advanced type-level programming: conditional types with
// infer (pull a type out of another type) and structural typing (types
// match by shape, not by name).
// js first: none of this exists — there is no type layer to compute over,
// so "what element does this array hold" is answered by reading the code.
// ts upgrade: conditional + infer derive one type from another, and
// structural typing means two same-shaped types are interchangeable while
// object literals still get excess-property checks.

import type { Player } from "../data/patriots.js";

// conditional type with infer: extract the element type of an array.
export type ElementType<T> = T extends readonly (infer E)[] ? E : T;
export type PlayerElement = ElementType<Player[]>; // Player
export type NotArray = ElementType<number>; // number

// second infer example: unwrap the value inside a Promise.
export type Awaited1<T> = T extends Promise<infer U> ? U : T;
export type UnwrappedPlayer = Awaited1<Promise<Player>>; // Player

// structural typing, first-class: two differently-named same-shape types
// are mutually assignable. names are irrelevant, shape is everything.
export interface NamedThing {
  name: string;
}
export interface LabeledThing {
  name: string;
}
export function toNamed(x: LabeledThing): NamedThing {
  return x; // assignable purely because the shapes match
}

// excess property check: object literals reject unknown extra props even
// though a pre-built object with the same extra prop would be accepted.
export function acceptNamed(x: NamedThing): string {
  return x.name;
}
// runtime demo value proving structural assignment works.
export const structuralName: string = toNamed({ name: "Deion Branch" }).name;

if (process.argv[1]?.endsWith("type-level.ts")) {
  console.log(`element type demo: ${acceptNamed({ name: "Troy Brown" })}`);
  console.log(`structural: ${structuralName}`);
}
