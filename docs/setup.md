# setup: what runs where, and why

javascript is the language the examples are written in. typescript is
javascript plus type notes (like `: string`) that a checker reads
before the code runs.

| tool   | what it is                                                          | why you need it                   |
| ------ | ------------------------------------------------------------------- | --------------------------------- |
| node   | the program that runs javascript files                              | nothing runs without it           |
| npm    | the helper that comes with node; fetches code and runs shortcuts    | downloads what the course needs   |
| npx    | runs a tool once without installing it permanently                  | `npx tsx ...` runs one file       |
| tsx    | a tool that runs typescript files directly                          | try ideas without a separate step |
| tsc    | the typescript checker; reads the type notes and reports mismatches | `npm run build` reviews the repo  |
| vitest | the test runner; replays each example and reports pass or fail      | `npm test` proves examples behave |

## where commands run

a terminal is the text box where you type commands to the computer.
type them at the repo root: the top level of this folder, where the
file `package.json` (the list of this course's pieces and shortcuts)
lives. check you are there:

```bash
pwd && ls package.json
```

## first run: inside a box

`npm install` downloads other people's code, and downloaded code can
do anything your user can. sandboxed means running inside a sealed-off
box so it cannot touch your machine; docker is the program that builds
that box (called a container) from the `Dockerfile` in this folder.

```bash
docker build -t ts50 .
docker run -it --rm ts50
# now inside the box, at /course:
node src/00-start/hello.js       # plain javascript. only node needed.
npx tsx src/00-start/hello.ts    # same hello, with type notes
npm run build                    # checker reviews everything. silence = clean.
npm test                         # test runner replays examples. 12 tests.
```

## if node 20+ is already on your machine

`node -v` prints the version; you need 20 or higher. then:

```bash
npm install   # downloads the needed code into node_modules/ (run once; never edit that folder)
npm run build # checker reviews everything. silence = clean.
npm test      # 12 tests
```

## what each course command does

- `npm install` — reads `package.json` and downloads the listed code.
- `npm run build` — runs the checker over every file without producing
  output files. errors print as `file(line,column)`; fix the first one
  first, since one mistake can cause follow-on complaints.
- `npm test` — runs the files in `tests/`. each one replays an example
  from the python sister repo and checks the typescript version matches.
- `npx tsx <file>` — runs one typescript file right away.

## if something fails

- `node: command not found` — node is not installed; use the docker box.
- `npm install` fails on network — it needs the internet to download;
  retry.
- checker errors after you edit — read the first error, fix, rerun.
