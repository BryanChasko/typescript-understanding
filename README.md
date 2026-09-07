# TS50: from spell-checker to sideline caller

```
+-[ ts50 patriots edition ]----------------------------------+
|  typescript safety nets -> agentic orchestration            |
|  taught with the 2004 new england patriots. three rings,   |
|  zero `any`s. foxboro is the classroom, the roster is the  |
|  dataset, and the compiler is the assistant coach that     |
|  never sleeps.                                             |
+------------------------------------------------------------+
```

javascript lets you fumble at runtime. typescript blows the whistle
before the snap. this is harvard cs50 energy with a belichick hoodie:
every concept lands on real patriots data, and every module ends with
the agentic payoff — typed tools, guarded calls, agents you can trust
on 4th-and-2.

sister repo: [pythonExamplesWithNewEnglandPatriots](https://github.com/BryanChasko/pythonExamplesWithNewEnglandPatriots) — same team, python lens. this repo is the typescript mirror.

## run it

```bash
npm install
npm run build   # tsc --noEmit, strict on
npm test        # vitest, 11 tests
npx tsx src/01-why/hello-patriots.ts
```

## the course

| mod             | topic                                           | patriots example                                      | agentic tie-in                                     |
| --------------- | ----------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| 01 why          | types as safety net, tsc compile                | `qbWins: number = "Maye"` fails before kickoff        | decomposition into checkable subtasks              |
| 02 basics       | primitives, inference, any vs unknown vs never  | brady 2007 (-14) vs jones 2023 (-134) weighted score  | typed agent state, never `any` for tool args       |
| 03 shapes       | arrays, tuples, interfaces, optional + readonly | `[4, 2, "Shotgun"]` play tuple, `readonly team: "NE"` | interfaces as tool contracts                       |
| 04 functions    | signatures, unions, narrowing, guards           | `PlayResult` union, `goatFromArgs` argv port          | discriminated agent messages, guard before acting  |
| 05 architecture | literals, enums, generics, utilities            | `Pick<Player,"id"\|"name">` trade target, `first<T>`  | closed sets via zod enums, `Paginated<T>` wrappers |
| 06 config       | tsconfig strict, docs/releases, mcp             | `getPlayerStats` zod tool, context7 docs playbook     | mcp `registerTool` + `generateObject` + hitl       |
| 07 capstone     | full analyst agent                              | scout -> stats -> coach, 4th-down gate                | hitl, reflection retry, fallback, trace            |

## why this order

learners say they keep three things: the safety net, the editor
superpowers, and shapes for real api data. devs daily-drive interfaces,
unions, `unknown` + guards, `Partial/Pick/Omit/Record`, and `strict:true`.
agents demand one more level: every tool input is a zod schema, every
decision is a discriminated union, every risky call has a human gate and
a fallback. that is modules 06-07, and it is the whole point.

details in [docs/research-findings.md](docs/research-findings.md).

## repo map

```
src/data/patriots.ts      canonical roster, coaches, legends, PlayCall
src/01-why/               spell-checker demo + tsc
src/02-basics/            primitives, inference, unknown, never
src/03-shapes/            roster, tuples, optional/readonly
src/04-functions/         unions, guards, narrowing, argv
src/05-architecture/      literals, enums, generics, utilities
src/06-config/            strict boundaries + mcp tool with zod
src/07-agentic/           scout/stats/coach capstone with hitl + trace
tests/course.test.ts      11 vitest tests, mirror of the python pytest file
datasets/                 2004 roster + coaches csvs from the python repo
```

## three rings, zero anys

brady had branch and brown. you have `satisfies` and `narrowing`.
same dynasty math: preparation, precision, parades. do the reps,
trust the compiler, and go win the fourth quarter — on the field
and in the agent loop.
