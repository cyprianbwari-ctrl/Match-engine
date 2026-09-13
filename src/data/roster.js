// Shared squad roster + role/duty definitions.
// Single source of truth so Tactics, Home, and Squad all read the same data.
// IDs 1-15 are unchanged from the original roster (Tactics/Home reference
// them directly) — only new fields were added. IDs 16-30 extend the squad
// to a full 30-man roster for the Squad screen.

export const players = [
  {id:1,pos:"GK",name:"André Onana",role:"SK",nat:"🇨🇲",fit:96,rate:6.8,
    number:24,displayPos:"GK",bucket:"GK",age:28,ovr:89,form:[7.2,6.9,7.4,7.0],morale:"Good",
    playTime:"Key Player",contract:"Jun 2028",wage:"£120k/w",availability:"Available",value:"£65,000,000",roleLabel:"Sweeper Keeper"},
  {id:2,pos:"DR",name:"Diogo Dalot",role:"WB",nat:"🇵🇹",fit:94,rate:7.0,
    number:20,displayPos:"RB",bucket:"DEF",age:25,ovr:83,form:[7.0,6.8,7.3,7.1],morale:"Good",
    playTime:"First Team",contract:"Jun 2028",wage:"£110k/w",availability:"Available",value:"£55,000,000",roleLabel:"Wing-Back"},
  {id:3,pos:"DC",name:"Harry Maguire",role:"CD",nat:"🏴",fit:78,rate:7.1,
    number:5,displayPos:"CB",bucket:"DEF",age:31,ovr:80,form:[6.9,6.5,7.0,6.8],morale:"Okay",
    playTime:"Rotation",contract:"Jun 2026",wage:"£120k/w",availability:"Available",value:"£25,000,000",roleLabel:"Central Defender"},
  {id:4,pos:"DC",name:"Lisandro Martínez",role:"CD",nat:"🇦🇷",fit:92,rate:7.3,
    number:6,displayPos:"CB",bucket:"DEF",age:26,ovr:87,form:[7.4,7.2,7.5,7.3],morale:"Good",
    playTime:"First Team",contract:"Jun 2029",wage:"£160k/w",availability:"Injured",value:"£75,000,000",roleLabel:"Central Defender"},
  {id:5,pos:"DL",name:"Luke Shaw",role:"FB",nat:"🏴",fit:80,rate:7.0,
    number:23,displayPos:"LB",bucket:"DEF",age:29,ovr:81,form:[6.8,6.6,7.0,6.9],morale:"Unhappy",
    playTime:"Rotation",contract:"Jun 2027",wage:"£100k/w",availability:"Available",value:"£30,000,000",roleLabel:"Full-back"},
  {id:6,pos:"DM",name:"Casemiro",role:"DM",nat:"🇧🇷",fit:90,rate:7.3,
    number:18,displayPos:"DM",bucket:"MID",age:32,ovr:84,form:[7.3,7.5,7.1,7.4],morale:"Good",
    playTime:"Key Player",contract:"Jun 2026",wage:"£150k/w",availability:"Available",value:"£25,000,000",roleLabel:"Defensive Midfielder"},
  {id:7,pos:"MC",name:"Kobbie Mainoo",role:"DLP",nat:"🏴",fit:92,rate:7.1,
    number:37,displayPos:"CM",bucket:"MID",age:19,ovr:80,form:[7.0,7.2,6.9,7.3],morale:"Good",
    playTime:"First Team",contract:"Jun 2029",wage:"£90k/w",availability:"Available",value:"£70,000,000",roleLabel:"Deep-Lying Playmaker"},
  {id:8,pos:"AMC",name:"Bruno Fernandes",role:"AP",nat:"🇵🇹",fit:96,rate:7.8,
    number:8,displayPos:"AM",bucket:"MID",age:30,ovr:88,form:[7.9,7.6,8.0,7.7],morale:"Good",
    playTime:"Key Player",contract:"Jun 2027",wage:"£180k/w",availability:"Available",value:"£75,000,000",roleLabel:"Advanced Playmaker"},
  {id:9,pos:"AML",name:"Marcus Rashford",role:"IF",nat:"🏴",fit:85,rate:7.6,
    number:10,displayPos:"LW",bucket:"ATT",age:27,ovr:82,form:[7.5,7.2,7.8,7.4],morale:"Okay",
    playTime:"Squad Player",contract:"Jun 2028",wage:"£130k/w",availability:"Available",value:"£60,000,000",roleLabel:"Inside Forward"},
  {id:10,pos:"AMR",name:"Alejandro Garnacho",role:"IW",nat:"🇦🇷",fit:93,rate:7.2,
    number:17,displayPos:"LW",bucket:"ATT",age:20,ovr:82,form:[7.1,7.4,6.9,7.3],morale:"Good",
    playTime:"Rotation",contract:"Jun 2028",wage:"£100k/w",availability:"Available",value:"£65,000,000",roleLabel:"Inverted Winger"},
  {id:11,pos:"ST",name:"Rasmus Højlund",role:"AF",nat:"🇩🇰",fit:88,rate:7.4,
    number:11,displayPos:"ST",bucket:"ATT",age:21,ovr:84,form:[7.5,7.3,7.6,7.4],morale:"Good",
    playTime:"First Team",contract:"Jun 2028",wage:"£120k/w",availability:"Available",value:"£70,000,000",roleLabel:"Advanced Forward"},
  // bench / squad depth
  {id:12,pos:"GK",name:"Altay Bayındır",role:"GK",nat:"🇹🇷",fit:85,rate:6.5,
    number:26,displayPos:"GK",bucket:"GK",age:26,ovr:78,form:[6.4,6.6,6.3,6.5],morale:"Good",
    playTime:"Backup",contract:"Jun 2028",wage:"£70k/w",availability:"Available",value:"£15,000,000",roleLabel:"Goalkeeper"},
  {id:13,pos:"DC",name:"Victor Lindelöf",role:"CD",nat:"🇸🇪",fit:90,rate:6.9,
    number:2,displayPos:"CB",bucket:"DEF",age:30,ovr:79,form:[6.8,7.0,6.7,6.9],morale:"Good",
    playTime:"Rotation",contract:"Jun 2026",wage:"£90k/w",availability:"Available",value:"£12,000,000",roleLabel:"Central Defender"},
  {id:14,pos:"DM",name:"Manuel Ugarte",role:"DM",nat:"🇺🇾",fit:93,rate:6.9,
    number:25,displayPos:"DM",bucket:"MID",age:24,ovr:79,form:[6.9,7.1,6.8,7.0],morale:"Good",
    playTime:"Rotation",contract:"Jun 2029",wage:"£95k/w",availability:"Available",value:"£45,000,000",roleLabel:"Defensive Midfielder"},
  {id:15,pos:"ST",name:"Joshua Zirkzee",role:"F9",nat:"🇳🇱",fit:89,rate:7.0,
    number:9,displayPos:"ST",bucket:"ATT",age:23,ovr:78,form:[6.9,7.1,6.8,7.0],morale:"Okay",
    playTime:"Rotation",contract:"Jun 2029",wage:"£100k/w",availability:"Available",value:"£40,000,000",roleLabel:"False Nine"},
  // expanded squad (16-30) to reach a full 30-man roster
  {id:16,pos:"DC",name:"Leny Yoro",role:"CD",nat:"🇫🇷",fit:91,rate:7.0,
    number:15,displayPos:"CB",bucket:"DEF",age:19,ovr:82,form:[7.0,6.8,7.2,6.9],morale:"Good",
    playTime:"Rotation",contract:"Jun 2029",wage:"£90k/w",availability:"Available",value:"£50,000,000",roleLabel:"Central Defender"},
  {id:17,pos:"DC",name:"Matthijs de Ligt",role:"BPD",nat:"🇳🇱",fit:90,rate:7.2,
    number:4,displayPos:"CB",bucket:"DEF",age:25,ovr:84,form:[7.2,7.4,7.0,7.3],morale:"Good",
    playTime:"First Team",contract:"Jun 2029",wage:"£140k/w",availability:"Available",value:"£60,000,000",roleLabel:"Ball-Playing Defender"},
  {id:18,pos:"DR",name:"Aaron Wan-Bissaka",role:"FB",nat:"🏴",fit:82,rate:6.9,
    number:29,displayPos:"RB",bucket:"DEF",age:27,ovr:79,form:[6.8,7.0,6.7,6.9],morale:"Good",
    playTime:"Rotation",contract:"Jun 2027",wage:"£90k/w",availability:"Available",value:"£20,000,000",roleLabel:"Wing-Back"},
  {id:19,pos:"MC",name:"Sofyan Amrabat",role:"BWM",nat:"🇲🇦",fit:81,rate:6.8,
    number:4,displayPos:"CM",bucket:"MID",age:28,ovr:78,form:[6.7,6.9,6.6,6.8],morale:"Good",
    playTime:"Rotation",contract:"Jun 2027",wage:"£85k/w",availability:"Available",value:"£18,000,000",roleLabel:"Ball-Winning Midfielder"},
  {id:20,pos:"MC",name:"Christian Eriksen",role:"DLP",nat:"🇩🇰",fit:75,rate:6.9,
    number:14,displayPos:"CM",bucket:"MID",age:32,ovr:77,form:[6.9,6.6,7.0,6.7],morale:"Okay",
    playTime:"Rotation",contract:"Jun 2026",wage:"£70k/w",availability:"Injured",value:"£8,000,000",roleLabel:"Deep-Lying Playmaker"},
  {id:21,pos:"GK",name:"Tom Heaton",role:"GK",nat:"🏴",fit:70,rate:6.3,
    number:33,displayPos:"GK",bucket:"GK",age:38,ovr:72,form:[6.2,6.4,6.1,6.3],morale:"Good",
    playTime:"Third Choice",contract:"Jun 2025",wage:"£40k/w",availability:"Available",value:"£1,000,000",roleLabel:"Goalkeeper"},
  {id:22,pos:"AMR",name:"Amad Diallo",role:"IW",nat:"🇨🇮",fit:90,rate:7.3,
    number:16,displayPos:"RW",bucket:"ATT",age:22,ovr:81,form:[7.3,7.5,7.1,7.4],morale:"Good",
    playTime:"Rotation",contract:"Jun 2029",wage:"£85k/w",availability:"Available",value:"£45,000,000",roleLabel:"Inverted Winger"},
  {id:23,pos:"AMR",name:"Antony",role:"W",nat:"🇧🇷",fit:83,rate:6.7,
    number:21,displayPos:"RW",bucket:"ATT",age:24,ovr:77,form:[6.6,6.8,6.5,6.7],morale:"Unhappy",
    playTime:"Squad Player",contract:"Jun 2027",wage:"£110k/w",availability:"Available",value:"£25,000,000",roleLabel:"Winger"},
  {id:24,pos:"MC",name:"Mason Mount",role:"CM",nat:"🏴",fit:79,rate:6.6,
    number:7,displayPos:"CM",bucket:"MID",age:26,ovr:76,form:[6.5,6.7,6.4,6.6],morale:"Okay",
    playTime:"Rotation",contract:"Jun 2027",wage:"£100k/w",availability:"Injured",value:"£20,000,000",roleLabel:"Central Midfielder"},
  {id:25,pos:"AMR",name:"Facundo Pellistri",role:"W",nat:"🇺🇾",fit:88,rate:6.7,
    number:28,displayPos:"RW",bucket:"ATT",age:22,ovr:75,form:[6.6,6.8,6.5,6.7],morale:"Good",
    playTime:"Prospect",contract:"Jun 2027",wage:"£45k/w",availability:"Available",value:"£15,000,000",roleLabel:"Winger"},
  {id:26,pos:"MC",name:"Toby Collyer",role:"CM",nat:"🏴",fit:92,rate:6.4,
    number:43,displayPos:"CM",bucket:"MID",age:20,ovr:70,form:[6.3,6.5,6.2,6.4],morale:"Good",
    playTime:"Youth",contract:"Jun 2027",wage:"£15k/w",availability:"Available",value:"£4,000,000",roleLabel:"Central Midfielder"},
  {id:27,pos:"ST",name:"Omari Forson",role:"AF",nat:"🏴",fit:90,rate:6.3,
    number:45,displayPos:"ST",bucket:"ATT",age:20,ovr:69,form:[6.2,6.4,6.1,6.3],morale:"Good",
    playTime:"Youth",contract:"Jun 2026",wage:"£12k/w",availability:"Available",value:"£3,000,000",roleLabel:"Advanced Forward"},
  {id:28,pos:"DM",name:"Dan Gore",role:"DM",nat:"🏴",fit:89,rate:6.3,
    number:46,displayPos:"DM",bucket:"MID",age:21,ovr:68,form:[6.2,6.4,6.1,6.3],morale:"Good",
    playTime:"Emergency",contract:"Jun 2026",wage:"£10k/w",availability:"Available",value:"£2,500,000",roleLabel:"Defensive Midfielder"},
  {id:29,pos:"MC",name:"Jack Fletcher",role:"CM",nat:"🏴",fit:90,rate:6.0,
    number:58,displayPos:"CM",bucket:"MID",age:19,ovr:64,form:[5.9,6.1,5.8,6.0],morale:"Good",
    playTime:"Youth",contract:"Jun 2026",wage:"£6k/w",availability:"Available",value:"£1,200,000",roleLabel:"Central Midfielder"},
  {id:30,pos:"GK",name:"Radek Vítek",role:"GK",nat:"🇨🇿",fit:90,rate:6.0,
    number:41,displayPos:"GK",bucket:"GK",age:20,ovr:65,form:[5.9,6.1,5.8,6.0],morale:"Good",
    playTime:"Youth",contract:"Jun 2027",wage:"£8k/w",availability:"Available",value:"£1,500,000",roleLabel:"Goalkeeper"},
];

// Roles available per natural position code. Codes match tactical slot codes
// used by the formation library in tactics/formations.js.
export const roles = {
  GK:["GK","SK","BPK"],
  DR:["FB","WB","IWB"],
  DL:["FB","WB","IWB"],
  DC:["CD","BPD","NCB","STP","COV","LIB"],
  DM:["DM","A","HB","BWM","DLP"],
  MC:["CM","BBM","DLP","BWM","MEZ","RPM","REG","SV","AP"],
  AMC:["AP","SS","TREQ","ENG"],
  AML:["W","IW","IF","WP","WF"],
  AMR:["W","IW","IF","WP","WF"],
  ST:["AF","CF","DLF","F9","TF","PF","PCH","SS"]
};

export const duties = ["Defend","Support","Attack"];

// Compatibility score of a player's NATURAL position against a tactical slot
// code: 1 = natural fit (lime), 0.45–0.89 = playable but unfamiliar (amber),
// below 0.45 = poor fit (red). Missing pairs default to 0.15.
export const POS_COMPAT = {
  GK: {GK:1},
  DL: {DL:1, DR:0.5, AML:0.55},
  DR: {DR:1, DL:0.5, AMR:0.55},
  DC: {DC:1, DM:0.5},
  DM: {DM:1, MC:0.7, DC:0.4},
  MC: {MC:1, DM:0.65, AMC:0.55},
  AMC:{AMC:1, MC:0.5, AML:0.45, AMR:0.45, ST:0.45},
  AML:{AML:1, AMR:0.5, DL:0.45, AMC:0.5},
  AMR:{AMR:1, AML:0.5, DR:0.45, AMC:0.5},
  ST: {ST:1, AMC:0.45},
};

export function compat(playerPos, slotCode) {
  if (playerPos === slotCode) return 1;
  return POS_COMPAT[playerPos]?.[slotCode] ?? 0.15;
}

export function fitTier(score) {
  if (score >= 0.9) return "natural";
  if (score >= 0.45) return "playable";
  return "poor";
}
