// module 8 — classes and object-oriented shape: access modifiers
// (public/private/protected), readonly fields, constructor parameter
// properties, getters/setters, static members, abstract base classes,
// inheritance, and a class implementing an interface.
// js first: `class` exists, but every field is public, "private" is a
// naming convention (_x), and nothing enforces that a subclass fills in
// the methods it promised. mistakes surface only when the code runs.
// ts upgrade: private/protected are checked, abstract members must be
// implemented, and `implements` forces the class to satisfy a contract.

import type { Player } from "../data/patriots.js";

// a small contract a class can promise to satisfy.
export interface Describable {
  describe(): string;
}

// abstract base: cannot be instantiated directly; describe() is abstract
// so every concrete subclass must supply it.
export abstract class TeamMember implements Describable {
  // parameter property + access modifiers + readonly, all in the ctor.
  constructor(
    public readonly name: string,
    protected role: string,
  ) {}

  abstract describe(): string;

  // shared behavior available to every subclass.
  label(): string {
    return `${this.name} (${this.role})`;
  }
}

// inheritance: RosterPlayer extends TeamMember and implements the abstract
// method. also implements Describable transitively through the base.
export class RosterPlayer extends TeamMember {
  // static member/method: a factory-owned counter across all instances.
  private static count = 0;

  // private field: only reachable inside this class.
  private _status: Player["status"];

  constructor(
    name: string,
    public readonly position: string,
    status: Player["status"] = "active",
  ) {
    super(name, position);
    this._status = status;
    RosterPlayer.count += 1;
  }

  // getter/setter pair guarding an internal field.
  get status(): Player["status"] {
    return this._status;
  }
  set status(next: Player["status"]) {
    this._status = next;
  }

  static rostered(): number {
    return RosterPlayer.count;
  }

  // static factory method.
  static fromPlayer(p: Player): RosterPlayer {
    return new RosterPlayer(p.name, p.position, p.status);
  }

  describe(): string {
    return `${this.name} — ${this.position} [${this._status}]`;
  }
}

if (process.argv[1]?.endsWith("roster-oop.ts")) {
  const brady = new RosterPlayer("Tom Brady", "QB");
  const bruschi = new RosterPlayer("Tedy Bruschi", "LB", "injured");
  console.log(brady.describe());
  console.log(bruschi.label());
  bruschi.status = "active";
  console.log(`${bruschi.name} now ${bruschi.status}`);
  console.log(`rostered: ${RosterPlayer.rostered()}`);
}
