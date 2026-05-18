import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";
import { fetchRepo } from "../src/fetchers/repo.js";
import { renderRepoCard } from "../src/cards/repo.js";
import { parseArgs, buildHelp } from "./argparse.mjs";

const schema = {
  username:             { type: "string",                        desc: "GitCode username (required)" },
  repo:                 { type: "string",                        desc: "Repository name (required)" },
  theme:                { type: "string",  default: "default",   desc: "Theme name" },
  title_color:          { type: "string",                        desc: "Title hex color" },
  icon_color:           { type: "string",                        desc: "Icon hex color" },
  text_color:           { type: "string",                        desc: "Text hex color" },
  bg_color:             { type: "string",                        desc: "Background hex color or gradient" },
  border_color:         { type: "string",                        desc: "Border hex color" },
  border_radius:        { type: "number",                        desc: "Card corner radius" },
  locale:               { type: "string",  default: "en",        desc: "Locale, e.g. cn" },
  show_owner:           { type: "boolean", default: false,       desc: "Show repo owner name" },
  hide_border:          { type: "boolean", default: false,       desc: "Hide card border" },
  description_lines_count: { type: "number",                     desc: "Description lines (1-3)" },
};

if (process.argv.includes("-help") || process.argv.includes("-h")) {
  console.log(buildHelp("node tools/generate-repo.mjs [options]", schema));
  process.exit(0);
}

const args = parseArgs(process.argv.slice(2), schema);

if (!args.username || !args.repo) {
  console.error("Error: -username and -repo are required.");
  console.log(buildHelp("node tools/generate-repo.mjs [options]", schema));
  process.exit(1);
}

const repoData = await fetchRepo(args.username, args.repo);

const renderOptions = {};
for (const key of [
  "theme", "title_color", "icon_color", "text_color", "bg_color",
  "border_color", "border_radius", "locale", "show_owner",
  "hide_border", "description_lines_count",
]) {
  if (args[key] !== undefined) {
    renderOptions[key] = args[key]
  };
}

const svg = renderRepoCard(repoData, renderOptions);

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outFile = join(rootDir, `repo-${args.repo}.svg`);
writeFileSync(outFile, svg);
console.log(`${args.repo}.svg generated for ${args.username}/${args.repo}`);
