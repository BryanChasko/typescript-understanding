// ts50 module 00 — the same hello, with types.
// run:   npx tsx src/00-start/hello.ts   (tsx runs typescript directly)
// check: npm run build                   (tsc typechecks the whole repo)
//
// what changed vs hello.js: `: string` and `: number` type notes.
// they do nothing at runtime (when the program actually runs) —
// node/tsx erases them — but the compiler (the checker program) reads
// them and refuses code that mixes shapes up. that is the whole course
// in one file: javascript you can run, plus a spell-checker.

const teamName: string = "New England Patriots";
const rings: number = 3;

console.log(`hello from ${teamName}, rings: ${rings}`);

// uncomment the next line, then run `npm run build` to feel the checker:
// const qbWins: number = "Maye"; // tsc: string is not assignable to number

export { teamName, rings };
