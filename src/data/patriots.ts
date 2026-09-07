// canonical patriots data shared by every module.
// mirrors BryanChasko/pythonExamplesWithNewEnglandPatriots datasets:
// datasets/2004_patriots_players.csv, 2004_coaches.csv,
// basic_loops_dictionaries_patriots_legends.py legends list.

export interface Player {
  readonly team: "NE";
  id: number;
  name: string;
  position: string;
  college: string;
  jersey?: number;
  status: "active" | "injured" | "practice-squad";
}

export interface Coach {
  name: string;
  role: string;
}

// sample rows from 2004_patriots_players.csv (full csv in ./datasets/)
export const roster2004: Player[] = [
  {
    team: "NE",
    id: 1,
    name: "Tom Brady",
    position: "QB",
    college: "Michigan",
    jersey: 12,
    status: "active",
  },
  {
    team: "NE",
    id: 2,
    name: "Corey Dillon",
    position: "RB",
    college: "Washington",
    jersey: 28,
    status: "active",
  },
  {
    team: "NE",
    id: 3,
    name: "Deion Branch",
    position: "WR",
    college: "Louisville",
    jersey: 83,
    status: "active",
  },
  {
    team: "NE",
    id: 4,
    name: "Troy Brown",
    position: "WR/PR",
    college: "Marshall",
    jersey: 80,
    status: "active",
  },
  {
    team: "NE",
    id: 5,
    name: "Tedy Bruschi",
    position: "LB",
    college: "Arizona",
    jersey: 54,
    status: "injured",
  },
  {
    team: "NE",
    id: 6,
    name: "Rohan Davey",
    position: "QB",
    college: "LSU",
    status: "practice-squad",
  },
];

// mirrors 2004_coaches.csv
export const coaches2004: Coach[] = [
  { name: "Bill Belichick", role: "Head Coach, General Manager" },
  { name: "Charlie Weis", role: "Offensive Coordinator" },
  { name: "Josh McDaniels", role: "Quarterbacks" },
  { name: "Eric Mangini", role: "Defensive Coordinator" },
];

// mirrors patriots_legends.py TypedDict list
export interface Legend {
  name: string;
  position: string;
  college: string;
}

export const legends: Legend[] = [
  { name: "John Hannah", position: "Offensive Guard", college: "Alabama" },
  { name: "Tom Brady", position: "Quarterback", college: "Michigan" },
  { name: "Andre Tippett", position: "Linebacker", college: "Iowa" },
  {
    name: "Gino Cappelletti",
    position: "Wide Receiver/Kicker",
    college: "Minnesota",
  },
  { name: "Steve Grogan", position: "Quarterback", college: "Kansas State" },
];

// fixed-length, fixed-type tuple: [down, yardsToGo]
export type PlayCall = [down: number, yardsToGo: number, formation: string];
