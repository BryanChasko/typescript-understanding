# setup: what runs where, and why

## the 30-second version

| word   | what it is                                               | why you need it                             |
| ------ | -------------------------------------------------------- | ------------------------------------------- |
| node   | the program that runs javascript outside a browser       | nothing runs without it                     |
| npm    | node’s package manager; installs libraries, runs scripts | fetches deps (zod, vitest), runs build/test |
| npx    | runs a one-off tool without installing it globally       | `npx tsx ...` runs one typescript file      |
| tsx    | runs `.ts` files directly (types erased on the fly)      | try ideas without a compile step            |
| tsc    | the typescript compiler / spell-checker                  | `npm run build` typechecks the repo         |
| vitest | the test runner                                          | `npm test` proves the examples behave       |

## where commands run

your terminal, inside the repo root — the folder containing
`package.json`. every `npm ...` command in this course assumes that.
verify you are there:

```bash
pwd && ls package.json
```

## should you sandbox? yes for your first run

`npm install` downloads and executes third-party code. this repo’s
deps are mainstream (typescript, vitest, zod), but the habit should
be: unknown repo → sandboxed container first. docker keeps rogue
install scripts off your machine.

### path A — docker (recommended first run)

```bash
docker build -t ts50 .
docker run -it --rm ts50
# now inside the container, at /course:
npm run build   # typecheck everything (tsc --noEmit, strict on)
npm test        # run the 12 vitest tests
node src/00-start/hello.js       # plain js, zero tooling
npx tsx src/00-start/hello.ts    # same hello, with types
npx tsx src/01-why/hello-patriots.ts
```

### path B — local node

needs node 20+ (`node -v` to check; anything older will fail on
`import` syntax and `as const`).

```bash
npm install   # download deps into node_modules/ (first time only)
npm run build # typecheck: expect silence = clean
npm test      # 12 tests, all green
```

## what each course command does

- `npm install` — reads `package.json`, downloads deps. run once
  (again only if deps change). creates `node_modules/`, never edit it.
- `npm run build` — runs `tsc --noEmit`: checks every type, emits
  nothing. silence means clean; errors print as `file(line,col)`.
- `npm test` — runs vitest over `tests/`. each test replays a python
  repo example and asserts the typescript port matches.
- `npx tsx <file>` — runs one `.ts` file now. no output files.

## troubleshooting

- `node: command not found` → use path A, or install node 20+.
- `npm install` fails on network → retry; container builds need
  registry access.
- `tsc` errors after editing → read the first error only, fix, rerun.
  one bad annotation can cascade.
