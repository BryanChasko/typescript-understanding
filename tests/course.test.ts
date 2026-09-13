import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  calculateWeightedScore,
  square,
  summarizeStats,
} from "../src/02-basics/primitives.js";
import {
  legendLines,
  numberedLegends,
  rosterByCollege,
} from "../src/03-shapes/roster.js";
import {
  describePlay,
  goatFromArgs,
  isApiError,
  parseStat,
} from "../src/04-functions/playbook.js";
import {
  first,
  getField,
  namesOf,
  brady,
} from "../src/05-architecture/flex.js";
import { getPlayerStatsTool } from "../src/06-config/mcp-tool.js";
import {
  coach,
  fourthDownGate,
  runAnalyst,
  scout,
  statsWithFallback,
} from "../src/07-agentic/capstone.js";
import { legends } from "../src/data/patriots.js";

describe("00 start (plain js hello runs on node alone)", () => {
  it("hello.js prints the team with zero tooling", () => {
    const out = execFileSync("node", ["src/00-start/hello.js"], {
      encoding: "utf8",
    });
    expect(out).toContain("New England Patriots");
  });
});

describe("02 basics (brady vs jones calculator port)", () => {
  it("weighted scores match python: -14 and -134", () => {
    expect(calculateWeightedScore(50, 8)).toBe(-14);
    expect(calculateWeightedScore(10, 12)).toBe(-134);
  });
  it("square rejects non-numbers at compile time; unknown guard rejects bad payloads", () => {
    expect(square(3)).toBe(9);
    expect(() => summarizeStats({ td: "fifty" })).toThrow();
    expect(summarizeStats({ td: 50, int: 8 })).toContain("-14");
  });
});

describe("03 shapes (legends + roster ports)", () => {
  it("legends render and enumerate like the python loops", () => {
    expect(legendLines()[1]).toContain("Tom Brady");
    expect(numberedLegends()[0]).toBe("1. John Hannah");
    expect(legendLines()).toHaveLength(legends.length);
  });
  it("roster sorts by college", () => {
    expect(rosterByCollege()[0]).toContain("from");
  });
});

describe("04 functions (guards + unions + argv)", () => {
  it("discriminated union describes plays", () => {
    expect(describePlay({ status: "success", yards: 3 })).toContain("3");
    expect(describePlay({ status: "error", reason: "hold" })).toContain("hold");
  });
  it("guards and narrowing", () => {
    expect(isApiError({ message: "x", code: 1 })).toBe(true);
    expect(isApiError("nope")).toBe(false);
    expect(parseStat("8.5")).toBe(8.5);
  });
  it("goat argv port validates input", () => {
    expect(goatFromArgs(["node", "goat.js", "Tom Brady"])).toContain(
      "Tom Brady",
    );
    expect(() => goatFromArgs(["node", "goat.js"])).toThrow();
  });
});

describe("05 architecture (generics + utilities)", () => {
  it("first/namesOf/getField stay type-safe", () => {
    expect(first(legends)?.name).toBe("John Hannah");
    expect(namesOf(legends)).toContain("Tom Brady");
    expect(getField(brady, "college")).toBe("Michigan");
  });
});

describe("06 mcp tool (zod boundary)", () => {
  it("looks up brady, rejects bad input", () => {
    expect(getPlayerStatsTool.handler({ playerId: "1" }).name).toBe(
      "Tom Brady",
    );
    expect(() => getPlayerStatsTool.handler({ playerId: 1 })).toThrow();
    expect(() => getPlayerStatsTool.handler({ playerId: "999" })).toThrow();
  });
});

describe("07 capstone (agentic loop)", () => {
  it("scout finds QBs and full run approves", () => {
    const s = runAnalyst();
    expect(s.players).toContain("Tom Brady");
    expect(s.plan).toContain("Branch");
    expect(s.approved).toBe(true);
    expect(s.trace.length).toBeGreaterThanOrEqual(4);
  });
  it("fallback uses cache when live throws; reflection repairs bad proposals", () => {
    const base = runAnalyst();
    const fb = statsWithFallback(base, () => {
      throw new Error("down");
    });
    expect(fb.stats["live"]).toBe(-14);
    const fixed = coach(base, () => ({ nope: true }));
    expect(fixed.plan).toBe("punt");
    expect(fourthDownGate(base, false).approved).toBe(false);
  });
});

// --- appended: bootcamp concept coverage ---
import { logRoster } from "../src/02-basics/primitives.js";
import {
  assertIsPlayer,
  describeFromContext,
  formatPlayer,
  weightedScorer,
} from "../src/04-functions/playbook.js";
import {
  bradyLabel,
  injuredUnknownJersey,
} from "../src/05-architecture/flex.js";
import { RosterPlayer } from "../src/08-classes/roster-oop.js";
import {
  fetchFromRoster,
  firstName,
  loadMany,
  loadPlayer,
} from "../src/09-async/data-layer.js";
import {
  migrateLegacyPlayer,
  narrowToPlayer,
} from "../src/10-external/interop.js";
import { structuralName, toNamed } from "../src/11-advanced/type-level.js";
import {
  filterByStatus,
  makePlayer,
  topScorer,
  type StatsSource,
} from "../src/13-testing/testable.js";
import { STRICT_TSCONFIG_SNIPPET } from "../src/12-tooling/tooling-notes.js";
import { roster2004 } from "../src/data/patriots.js";

describe("02 basics (void)", () => {
  it("logRoster returns nothing meaningful (void)", () => {
    expect(logRoster(roster2004)).toBeUndefined();
  });
});

describe("04 functions (overloads, call sig, this, assertion)", () => {
  it("overloaded formatPlayer handles 1 and 2 args", () => {
    expect(formatPlayer("Tom Brady")).toBe("Tom Brady");
    expect(formatPlayer("Tom Brady", "QB")).toBe("Tom Brady — QB");
  });
  it("call signature value computes a weighted score", () => {
    expect(weightedScorer(50, 8)).toBe(-14);
  });
  it("this-typed fn reads its bound context", () => {
    expect(describeFromContext.call({ team: "NE" }, "Tom Brady")).toContain(
      "NE",
    );
  });
  it("assertion function narrows or throws", () => {
    const good: unknown = roster2004[0];
    expect(() => assertIsPlayer(good)).not.toThrow();
    expect(() => assertIsPlayer({ name: "x" })).toThrow();
  });
});

describe("05 architecture (template literal + custom utility)", () => {
  it("template literal value and nullable player", () => {
    expect(bradyLabel).toBe("#12 Tom Brady");
    expect(injuredUnknownJersey.jersey).toBeNull();
  });
});

describe("08 classes (oop)", () => {
  it("instantiate, describe, getter/setter, subclass, static", () => {
    const before = RosterPlayer.rostered();
    const p = new RosterPlayer("Tom Brady", "QB");
    expect(p.describe()).toContain("QB");
    expect(p.status).toBe("active");
    p.status = "injured";
    expect(p.status).toBe("injured");
    expect(p.label()).toContain("Tom Brady");
    expect(RosterPlayer.rostered()).toBe(before + 1);
    const factory = RosterPlayer.fromPlayer({
      team: "NE",
      id: 2,
      name: "Corey Dillon",
      position: "RB",
      college: "Washington",
      status: "active",
    });
    expect(factory.position).toBe("RB");
  });
});

describe("09 async (promise typing, injected fetch, error path)", () => {
  it("awaits injected fetch and resolves a Player", async () => {
    const brady = await fetchFromRoster(1);
    expect(brady.name).toBe("Tom Brady");
  });
  it("Promise.all returns typed array", async () => {
    const many = await loadMany([1, 2, 3]);
    expect(many).toHaveLength(3);
    expect(firstName(many)).toBe("Tom Brady");
  });
  it("error path returns a Result failure, not a throw", async () => {
    const missing = await loadPlayer(999);
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error).toContain("999");
    const ok = await loadPlayer(1);
    expect(ok.ok).toBe(true);
  });
});

describe("10 external (interop guard)", () => {
  it("narrows a legacy payload to Player and rejects junk", () => {
    const migrated = migrateLegacyPlayer({
      team: "NE",
      id: 1,
      name: "Tom Brady",
      position: "QB",
      college: "Michigan",
      status: "active",
    });
    expect(migrated.name).toBe("Tom Brady");
    expect(() => narrowToPlayer({ id: "nope" })).toThrow();
  });
});

describe("11 advanced (conditional/infer + structural)", () => {
  it("structural typing assigns by shape", () => {
    expect(toNamed({ name: "Deion Branch" }).name).toBe("Deion Branch");
    expect(structuralName).toBe("Deion Branch");
  });
});

describe("12 tooling (snippet constants compile and export)", () => {
  it("strict tsconfig snippet mentions the key flags", () => {
    expect(STRICT_TSCONFIG_SNIPPET).toContain("noUncheckedIndexedAccess");
    expect(STRICT_TSCONFIG_SNIPPET).toContain("exactOptionalPropertyTypes");
  });
});

describe("13 testing (subject: fixture + injected mock)", () => {
  it("makePlayer builds a complete Player and honors overrides", () => {
    const p = makePlayer();
    expect(p.team).toBe("NE");
    expect(p.name).toBe("Tom Brady");
    const rb = makePlayer({ name: "Corey Dillon", position: "RB", jersey: 28 });
    expect(rb.jersey).toBe(28);
    const noJersey = makePlayer({ name: "Rohan Davey" });
    expect(noJersey.jersey).toBeUndefined(); // base fixture has no jersey
    expect("jersey" in noJersey).toBe(false); // truly absent, not undefined-valued
  });
  it("filterByStatus is pure and typed", () => {
    expect(filterByStatus(roster2004, "injured").length).toBeGreaterThan(0);
  });
  it("topScorer uses an injected mock dependency", () => {
    const mock: StatsSource = { scoreFor: (id) => (id === 3 ? 99 : 1) };
    const best = topScorer(roster2004, mock);
    expect(best?.id).toBe(3);
  });
});
