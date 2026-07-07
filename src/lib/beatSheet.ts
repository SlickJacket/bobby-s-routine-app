export interface BeatSheetBeat {
  name: string;
  percent: string;
  blurb: string;
}

/** Blake Snyder's ("Save the Cat") 15-beat story structure, as percentages of the whole. */
export const SAVE_THE_CAT_BEATS: BeatSheetBeat[] = [
  { name: "Opening Image", percent: "0-1%", blurb: "A snapshot of the hero's world and flaw before the story begins." },
  { name: "Theme Stated", percent: "5%", blurb: "Someone (often not the hero) states the story's underlying truth." },
  { name: "Set-Up", percent: "1-10%", blurb: "Establish the hero, stakes, world, and what needs fixing." },
  { name: "Catalyst", percent: "10%", blurb: "The inciting incident that knocks the hero's world off balance." },
  { name: "Debate", percent: "10-20%", blurb: "The hero hesitates, questioning whether to act." },
  { name: "Break into Two", percent: "20%", blurb: "The hero commits and enters a new, unfamiliar world or plan." },
  { name: "B Story", percent: "22%", blurb: "A secondary relationship begins, often carrying the theme." },
  { name: "Fun and Games", percent: "20-50%", blurb: "The \"promise of the premise\" — the trailer moments." },
  { name: "Midpoint", percent: "50%", blurb: "A false victory or false defeat raises the stakes." },
  { name: "Bad Guys Close In", percent: "50-75%", blurb: "External pressure and internal doubt intensify." },
  { name: "All Is Lost", percent: "75%", blurb: "The lowest point — something or someone is lost." },
  { name: "Dark Night of the Soul", percent: "75-80%", blurb: "The hero processes the loss before finding new resolve." },
  { name: "Break into Three", percent: "80%", blurb: "Armed with a new idea, the hero commits to the final plan." },
  { name: "Finale", percent: "80-99%", blurb: "The hero executes the plan and resolves the story's conflict." },
  { name: "Final Image", percent: "99-100%", blurb: "A mirror of the opening image, showing how much has changed." },
];
