# setup: what runs where, and why

javascript is a programming language: the one built into every web
browser (buttons, forms, and games on websites run it). typescript is
javascript plus type notes (labels like `: string` stating what kind
of value something holds) that a checker reads before the code runs.

| tool   | what it is                                                                                   | why you need it                  |
| ------ | -------------------------------------------------------------------------------------------- | -------------------------------- |
| node   | a program that runs javascript files on your computer instead of inside a web page           | nothing runs without it          |
| npm    | the tool bundled with node; downloads shared code libraries and runs named shortcut commands | downloads what the course needs  |
| npx    | runs a tool once without installing it permanently                                           | `npx tsx ...` runs one file      |
| tsx    | a tool that runs typescript files with no separate conversion step                           | try ideas immediately            |
| tsc    | the typescript checker; reads the type notes and reports mismatches                          | `npm run build` reviews the repo |
| vitest | a program that runs automated checks (called tests) verifying code behaves as expected       | `npm test` proves examples work  |

## where commands run

a terminal is a window where you operate the computer by typing
commands as text instead of clicking icons. type the course commands
at the repo root: the top level of this folder, where the file
`package.json` (the list of this course's ingredients and shortcuts)
lives. check you are there:

```bash
pwd && ls package.json
```

## first run: inside a box

`npm install` downloads shared code libraries, and downloaded code can
do anything your user account can. sandboxed means running inside an
isolated box the code cannot escape to reach your real files; docker is
software that builds such boxes (each running box is called a
container) from a recipe file, here named `Dockerfile`.

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

`node -v` prints the version; you need 20 or higher (older versions
cannot read this course's code style). then:

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
