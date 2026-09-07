// module 4 — functions + safety for the decisions code makes as it runs.
// js first: `if (result.status === "sucess")` — one typo and the branch
// never runs. the function returns undefined, the caller guesses why.
// ts upgrade: `status: "success" | "error"` (an either-or, called a
// union) makes the typo a compile error, and the `never` default (a
// branch declared impossible) fails the build if a new variant arrives
// unhandled.
// ports basic_command_line_arguments_goat.py (argv = the words typed
// after the command on the terminal).

export type PlayResult =
  | { status: "success"; yards: number }
  | { status: "error"; reason: string };

export function describePlay(r: PlayResult): string {
  switch (r.status) {
    case "success":
      return `gained ${r.yards} yards`;
    case "error":
      return `flag: ${r.reason}`;
    default: {
      // never-exhaustiveness: fails compile if a variant is unhandled
      const _exhaustive: never = r;
      return _exhaustive;
    }
  }
}

export interface ApiError {
  message: string;
  code: number;
}

// custom type guard: unknown -> ApiError
export function isApiError(e: unknown): e is ApiError {
  return (
    typeof e === "object" &&
    e !== null &&
    "message" in e &&
    "code" in e &&
    typeof (e as ApiError).message === "string"
  );
}

// typeof narrowing on a string | number union (query-string stat lines)
export function parseStat(input: string | number): number {
  if (typeof input === "string") return Number.parseFloat(input);
  return input;
}

// intersection: a player who is also coachable (both contracts at once)
export interface Coachable {
  coach: string;
}
export type CoachedPlayer = { name: string; position: string } & Coachable;

// argv port: `node goat.js "Tom Brady"` — typed, no silent undefined
export function goatFromArgs(argv: string[]): string {
  const names = argv.slice(2);
  if (names.length === 0) throw new Error("you forgot the name of the GOAT");
  if (names.length > 2) throw new Error("first or first-and-last only");
  return `the goat is ${names.join(" ")}`;
}
