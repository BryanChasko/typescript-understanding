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
