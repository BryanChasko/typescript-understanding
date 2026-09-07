// module 7 — agentic capstone: typed decomposition + guardrails.
// js first: a pipeline passing one big untyped `state = {}` between
// agents. scout writes `state.players`, coach reads `state.plaers` —
// undefined, discovered during the demo.
// ts upgrade: `AgentState` fixes the shared shape; each agent's inputs
// and outputs are typed, so wiring mistakes fail `npm run build`
// instead of failing on 4th down. trace log included for observability.

import { z } from "zod";
import { roster2004 } from "../data/patriots.js";
import { calculateWeightedScore } from "../02-basics/primitives.js";
import { describePlay, type PlayResult } from "../04-functions/playbook.js";

export interface TraceStep {
  agent: string;
  tool: string;
  at: string;
  ok: boolean;
  note: string;
}

export interface AgentState {
  goal: string;
  players: string[];
  stats: Record<string, number>;
  plan: string | null;
  approved: boolean;
  trace: TraceStep[];
}

const GamePlan = z.object({
  call: z.string().describe("e.g. play-action to Branch on 4th-and-2"),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});
export type GamePlan = z.infer<typeof GamePlan>;

function step(state: AgentState, s: Omit<TraceStep, "at">): void {
  state.trace.push({ ...s, at: new Date().toISOString() });
}

// decomposition: one vague goal -> typed subtasks
export function scout(state: AgentState): AgentState {
  const qbs = roster2004.filter((p) => p.position === "QB").map((p) => p.name);
  step(state, {
    agent: "scout",
    tool: "getPlayerStats",
    ok: true,
    note: `found ${qbs.length} QBs`,
  });
  return { ...state, players: qbs };
}

export function statsAgent(state: AgentState): AgentState {
  // ephemeral execution memory: stats accumulate in typed state
  const stats = { ...state.stats, brady2007: calculateWeightedScore(50, 8) };
  step(state, {
    agent: "stats",
    tool: "calculateWeightedScore",
    ok: true,
    note: "brady2007=-14",
  });
  return { ...state, stats };
}

// deterministic fallback: cache wins when the live tool throws
export function statsWithFallback(
  state: AgentState,
  live: () => number,
): AgentState {
  try {
    const v = live();
    step(state, { agent: "stats", tool: "live", ok: true, note: `live=${v}` });
    return { ...state, stats: { ...state.stats, live: v } };
  } catch {
    step(state, {
      agent: "stats",
      tool: "live",
      ok: false,
      note: "fallback to cached -14",
    });
    return { ...state, stats: { ...state.stats, live: -14 } };
  }
}

// self-reflection loop: validate structured output, retry once on failure
export function coach(state: AgentState, propose: () => unknown): AgentState {
  const raw = propose();
  const parsed = GamePlan.safeParse(raw);
  if (parsed.success) {
    step(state, {
      agent: "coach",
      tool: "generateObject",
      ok: true,
      note: "plan valid",
    });
    return { ...state, plan: parsed.data.call };
  }
  const retry = GamePlan.safeParse({
    call: "punt",
    confidence: 0.5,
    reasoning: "first proposal failed validation; safest call",
  });
  step(state, {
    agent: "coach",
    tool: "generateObject",
    ok: retry.success,
    note: "reflection retry",
  });
  return { ...state, plan: retry.success ? retry.data.call : null };
}

// human-in-the-loop: high-cost calls need approval before execution
export function fourthDownGate(
  state: AgentState,
  approve: boolean,
): AgentState {
  const play: PlayResult = approve
    ? { status: "success", yards: 3 }
    : { status: "error", reason: "punt: not approved" };
  step(state, {
    agent: "coach",
    tool: "hitl-approve-4th-down",
    ok: approve,
    note: describePlay(play),
  });
  return { ...state, approved: approve };
}

export function runAnalyst(): AgentState {
  let s: AgentState = {
    goal: "win 4th-and-2",
    players: [],
    stats: {},
    plan: null,
    approved: false,
    trace: [],
  };
  s = scout(s);
  s = statsAgent(s);
  s = coach(s, () => ({
    call: "play-action to Branch",
    confidence: 0.72,
    reasoning: "man coverage, Branch 8.9 ypt",
  }));
  s = fourthDownGate(s, true);
  return s;
}
