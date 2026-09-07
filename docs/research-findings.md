# research findings: what to teach and why

source: web research pass (stackoverflow survey, state of js, github octoverse)
plus repo scan of BryanChasko/pythonExamplesWithNewEnglandPatriots.

## what learners report valuing

1. safety net that catches bugs before runtime (the spell-checker story).
2. inference: write fewer annotations, keep checking.
3. editor superpowers: rename, refactor, go-to-definition across a team.
4. shapes for real data: interfaces, unions, narrowing api responses.
5. employability: react/node codebases expect typed props, api contracts, tests.

## what devs use every day

- interfaces + literal unions + tuples for domain data.
- unknown + guards at every js boundary (fetch, csv, argv).
- Partial/Pick/Omit/Record, ReturnType/Awaited.
- satisfies + as const to keep literals tight.
- strict:true as the default; ~80% of js devs use ts, top language on github.

## what matters in the agentic world

- tool schemas are types: zod objects double as mcp inputSchema/outputSchema.
- structured output: generateObject + zod schema instead of parsing prose.
- discriminated unions for agent messages + never-exhaustiveness so new
  message kinds fail compile, not production.
- hitl gates, reflection retries, deterministic fallbacks, trace logs.
- docs currency via context7: resolve-library-id then query-docs,
  pin deltas to ts 5.0-5.4 release notes.

## python repo reuse map

| python example            | ts50 module                                    |
| ------------------------- | ---------------------------------------------- |
| brady vs jones calculator | 02 primitives (calculateWeightedScore)         |
| legends loops + dicts     | 03 shapes (legendLines, numberedLegends)       |
| file io csv sort          | 03 shapes (rosterByCollege) + datasets/ csv    |
| goat argv                 | 04 functions (goatFromArgs)                    |
| qb inheritance oop        | 05 architecture (Pick/Omit/Player) + 07 agents |
| pytest square             | tests/course.test.ts (vitest)                  |
