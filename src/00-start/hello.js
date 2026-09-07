// ts50 module 00 — plain javascript. zero tooling beyond node itself.
// run: node src/00-start/hello.js
// (node = the program that runs javascript outside a browser.
//  if `node` is not found, see docs/setup.md — start with the docker path.)

const teamName = "New England Patriots";
const rings = 3;

console.log(`hello from ${teamName}, rings: ${rings}`);

// the fumble javascript lets through: a string minus a number is NaN.
// no error, no warning — just a wrong answer on the scoreboard.
console.log("Maye minus one:", "Maye" - 1);
