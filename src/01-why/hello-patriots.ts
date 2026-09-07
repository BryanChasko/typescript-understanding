// module 1 — the why: types as a safety net.
// js first (try in node): `"Maye" - 1` answers NaN with no complaint.
// that is the bug class this whole course kills: wrong-shape values
// flowing silently until a fan sees garbage on the scoreboard.
// ts upgrade: annotations make the same mistake a compile error.
// run: npx tsx src/01-why/hello-patriots.ts
// then break it: change teamName to a number and run `npm run build`.

const teamName: string = "New England Patriots";
const rings2004: number = 3;
const dynasty: boolean = true;

console.log(
  `${teamName} | rings by 2004 season: ${rings2004} | dynasty: ${dynasty}`,
);

// the spell-checker moment. in plain js this is a silent NaN at runtime:
//   const qbWins = "Maye" - 1
// in ts, the compiler refuses before anything runs:
// @ts-expect-error demo: string is not assignable to number
const qbWins: number = "Maye";

// tsc turns hello-patriots.ts into plain hello-patriots.js.
// types evaporate; only the checked javascript ships.
export { teamName, rings2004, dynasty };
