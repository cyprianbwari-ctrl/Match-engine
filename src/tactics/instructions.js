export const MENTALITIES = [
  "Very Defensive", "Defensive", "Balanced", "Positive", "Attacking", "Very Attacking"
];

// Sliders (0-100) and selects for In Possession / Out of Possession.
export const IN_POSSESSION = {
  sliders: [
    { key: "tempo", label: "Tempo", low: "Slower", high: "Higher" },
    { key: "width", label: "Width", low: "Narrow", high: "Wide" },
    { key: "creativeFreedom", label: "Creative Freedom", low: "Disciplined", high: "Expressive" },
    { key: "attackingFocus", label: "Attacking Focus", low: "Left", high: "Right" },
  ],
  selects: [
    { key: "passingStyle", label: "Passing Style", options: ["Shorter Passing", "Mixed Passing", "Direct Passing"] },
    { key: "buildUp", label: "Build-Up Style", options: ["Play Out Of Defence", "Mixed", "Route One"] },
    { key: "crossing", label: "Crossing", options: ["Low Crosses", "Mixed Crosses", "Whipped Crosses", "Sparingly"] },
  ],
};

export const TRANSITION = [
  { key: "counterPress", label: "Counter-Press" },
  { key: "quickTransitions", label: "Quick Transitions" },
  { key: "regroup", label: "Regroup" },
  { key: "counter", label: "Counter" },
  { key: "holdShape", label: "Hold Shape" },
  { key: "distributeFlanks", label: "Distribute To Flanks" },
];

export const OUT_OF_POSSESSION = {
  sliders: [
    { key: "defensiveLine", label: "Defensive Line", low: "Deeper", high: "Higher" },
    { key: "lineOfEngagement", label: "Line of Engagement", low: "Deeper", high: "Higher" },
    { key: "pressingIntensity", label: "Pressing Intensity", low: "Cautious", high: "More Urgent" },
    { key: "compactness", label: "Defensive Compactness", low: "Loose", high: "Compact" },
  ],
  selects: [
    { key: "tackling", label: "Tackling", options: ["Stay On Feet", "Balanced", "Get Stuck In"] },
    { key: "marking", label: "Marking", options: ["Zonal Marking", "Man Marking", "Mixed"] },
  ],
  toggles: [
    { key: "offsideTrap", label: "Offside Trap" },
    { key: "preventShortGK", label: "Prevent Short GK Distribution" },
    { key: "higherDefLine", label: "Higher Defensive Line" },
    { key: "highPress", label: "High Press" },
  ],
};

export const PRESSING_TRIGGERS = [
  "Closest 3 Press · Others Maintain Shape",
  "Full Team Press",
  "Contain & Show Wide",
  "Designated Presser Only",
];
export const PRESSING_ZONES = ["Whole Pitch", "Final Third", "Own Half", "Middle Third"];
export const PRESSING_INITIATORS = ["Forwards", "Whole Team", "Designated Presser"];

export const PLAYER_INSTRUCTIONS = [
  "Roam", "Take More Risks", "Press More", "Move Into Channels",
  "Shoot More", "Hold Position", "Cut Inside", "Get Further Forward",
];

export const SITUATIONS = ["Default Tactic", "Protecting A Lead", "Need A Goal"];
