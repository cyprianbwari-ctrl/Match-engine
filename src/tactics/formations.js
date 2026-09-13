// FAMILY 26 formation library.
// Each formation is a flat list of slots: {code, x, y, label}
// code   -> tactical position code used for role lookup (see data/roster.js)
// x,y    -> percentage position on the pitch
// label  -> human-readable slot label shown in the UI

const GK = { code: "GK", x: 50, y: 91, label: "GK" };

const DEF4 = [
  { code: "DL", x: 14, y: 76, label: "LB" },
  { code: "DC", x: 38, y: 78, label: "CB" },
  { code: "DC", x: 62, y: 78, label: "CB" },
  { code: "DR", x: 86, y: 76, label: "RB" },
];
const DEF3 = [
  { code: "DC", x: 24, y: 78, label: "CB" },
  { code: "DC", x: 50, y: 80, label: "CB" },
  { code: "DC", x: 76, y: 78, label: "CB" },
];
const DEF5 = [
  { code: "DL", x: 8, y: 74, label: "LWB" },
  { code: "DC", x: 28, y: 78, label: "CB" },
  { code: "DC", x: 50, y: 80, label: "CB" },
  { code: "DC", x: 72, y: 78, label: "CB" },
  { code: "DR", x: 92, y: 74, label: "RWB" },
];
const WB = [
  { code: "DL", x: 6, y: 58, label: "LWB" },
  { code: "DR", x: 94, y: 58, label: "RWB" },
];
const DM1 = [{ code: "DM", x: 50, y: 64, label: "DM" }];
const DM2 = [
  { code: "DM", x: 38, y: 64, label: "DM" },
  { code: "DM", x: 62, y: 64, label: "DM" },
];
const MC2 = [
  { code: "MC", x: 38, y: 50, label: "CM" },
  { code: "MC", x: 62, y: 50, label: "CM" },
];
const MC3 = [
  { code: "MC", x: 25, y: 52, label: "CM" },
  { code: "MC", x: 50, y: 48, label: "CM" },
  { code: "MC", x: 75, y: 52, label: "CM" },
];
const MC4 = [
  { code: "AML", x: 10, y: 50, label: "LM" },
  { code: "MC", x: 37, y: 50, label: "CM" },
  { code: "MC", x: 63, y: 50, label: "CM" },
  { code: "AMR", x: 90, y: 50, label: "RM" },
];
const AM3 = [
  { code: "AML", x: 17, y: 40, label: "LW" },
  { code: "AMC", x: 50, y: 36, label: "AM" },
  { code: "AMR", x: 83, y: 40, label: "RW" },
];
const AM2C = [
  { code: "AMC", x: 35, y: 37, label: "AM" },
  { code: "AMC", x: 65, y: 37, label: "AM" },
];
const AM4 = [
  { code: "AML", x: 8, y: 38, label: "LW" },
  { code: "AMC", x: 35, y: 36, label: "AM" },
  { code: "AMC", x: 65, y: 36, label: "AM" },
  { code: "AMR", x: 92, y: 38, label: "RW" },
];
const FW1 = [{ code: "ST", x: 50, y: 18, label: "ST" }];
const FW2 = [
  { code: "ST", x: 38, y: 20, label: "ST" },
  { code: "ST", x: 62, y: 20, label: "ST" },
];
const FW3 = [
  { code: "AML", x: 17, y: 22, label: "LW" },
  { code: "ST", x: 50, y: 18, label: "ST" },
  { code: "AMR", x: 83, y: 22, label: "RW" },
];
const SS1 = [{ code: "ST", x: 50, y: 32, label: "SS" }];

function build(...lines) {
  return [GK, ...lines.flat()].map((slot, i) => ({ ...slot, id: `s${i}` }));
}

export const FORMATIONS = {
  "4-4-2":    build(DEF4, MC4, FW2),
  "4-3-3":    build(DEF4, MC3, FW3),
  "4-2-3-1":  build(DEF4, DM2, AM3, FW1),
  "4-1-4-1":  build(DEF4, DM1, MC4, FW1),
  "3-5-2":    build(DEF3, WB, MC3, FW2),
  "3-4-3":    build(DEF3, WB, MC2, FW3),
  "3-4-2-1":  build(DEF3, WB, MC2, AM2C, FW1),
  "3-2-4-1":  build(DEF3, DM2, AM4, FW1),
  "4-2-2-2":  build(DEF4, DM2, AM2C, FW2),
  "4-4-1-1":  build(DEF4, MC4, SS1, FW1),
  "5-3-2":    build(DEF5, MC3, FW2),
  "5-4-1":    build(DEF5, MC4, FW1),
  "4-3-2-1":  build(DEF4, MC3, AM2C, FW1),
};

export const FORMATION_NAMES = Object.keys(FORMATIONS);
