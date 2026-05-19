import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";
import { fetchTopLanguages } from "../src/fetchers/top-languages.js";
import { renderTopLanguages } from "../src/cards/top-languages.js";
import { parseArgs, buildHelp } from "./argparse.mjs";

const schema = {
  username:        { type: "string",                       desc: "GitCode username" },
  layout:          { type: "string",  default: "normal",   desc: "Card layout: normal|compact|donut|donut-vertical|pie" },
  langs_count:     { type: "number",  default: 5,          desc: "Number of languages (1-20)" },
  theme:           { type: "string",  default: "default",  desc: "Theme name" },
  custom_title:    { type: "string",                        desc: "Custom card title" },
  title_color:     { type: "string",                        desc: "Title hex color" },
  text_color:      { type: "string",                        desc: "Text hex color" },
  bg_color:        { type: "string",                        desc: "Background hex color or gradient" },
  border_color:    { type: "string",                        desc: "Border hex color" },
  border_radius:   { type: "number",                        desc: "Card corner radius" },
  card_width:      { type: "number",                        desc: "Card width in px" },
  locale:          { type: "string",  default: "en",        desc: "Locale, e.g. cn" },
  hide:            { type: "string",                        desc: "Comma-separated languages to hide" },
  exclude_repo:    { type: "string",                        desc: "Comma-separated repos to exclude" },
  stats_format:    { type: "string",  default: "percentages", desc: "percentages|bytes" },
  size_weight:     { type: "number",  default: 1,          desc: "Size weight for ranking" },
  count_weight:    { type: "number",  default: 0,          desc: "Count weight for ranking" },
  show_icons:      { type: "boolean", default: false,      desc: "Show icons" },
  hide_title:      { type: "boolean", default: false,      desc: "Hide card title" },
  hide_border:     { type: "boolean", default: false,      desc: "Hide card border" },
  hide_progress:   { type: "boolean", default: false,      desc: "Hide progress bars" },
  disable_animations: { type: "boolean", default: false,   desc: "Disable animations" },
};

if (process.argv.includes("-help") || process.argv.includes("-h")) {
  console.log(buildHelp("node tools/generate-top-langs.mjs [options]", schema));
  process.exit(0);
}

const args = parseArgs(process.argv.slice(2), schema);

if (!args.username) {
  console.error("Error: -username is required.");
  console.log(buildHelp("node tools/generate-repo.mjs [options]", schema));
  process.exit(1);
}

const langs = await fetchTopLanguages(
  args.username,
  args.exclude_repo ? args.exclude_repo.split(",") : [],
  args.size_weight,
  args.count_weight,
);

const renderOptions = {};
for (const key of [
  "layout", "langs_count", "theme", "custom_title",
  "title_color", "text_color", "bg_color", "border_color",
  "border_radius", "card_width", "locale", "hide",
  "stats_format", "show_icons", "hide_title", "hide_border",
  "hide_progress", "disable_animations",
]) {
  if (args[key] !== undefined) {
    renderOptions[key] = args[key]
  };
}

const svg = renderTopLanguages(langs, renderOptions);

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outFile = join(rootDir, "top-langs.svg");
writeFileSync(outFile, svg);
console.log("top-langs.svg generated for user: " + args.username);
