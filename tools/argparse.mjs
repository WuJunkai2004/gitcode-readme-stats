/**
 * @file Lightweight CLI argument parser for tools scripts.
 *
 * Usage:
 *   const args = parseArgs(process.argv.slice(2), {
 *     username:    { type: "string",  default: "Neila" },
 *     layout:      { type: "string",  default: "normal" },
 *     langs_count: { type: "number",  default: 5 },
 *     hide_title:  { type: "boolean", default: false },
 *   });
 *
 * CLI: node script.mjs -username Neila -layout compact -langs_count 8 -hide_title
 */

/**
 * Parse command-line arguments according to a schema.
 *
 * @param {string[]} argv - Raw argv (usually process.argv.slice(2)).
 * @param {Record<string, { type: "string"|"number"|"boolean", default?: any }>} schema
 * @returns {Record<string, any>} Parsed arguments.
 */
export function parseArgs(argv, schema) {
  const result = {};

  for (const key in schema) {
    result[key] = schema[key].default;
  }

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("-")) {
      continue;
    }

    const key = token.slice(1);
    const def = schema[key];
    if (!def) {
      throw new Error(`Unknown argument: -${key}`);
    }

    if (def.type === "boolean") {
      result[key] = true;
    } else {
      const value = argv[++i];
      if (value === undefined || value.startsWith("-")) {
        throw new Error(`Missing value for -${key}`);
      }
      result[key] = def.type === "number" ? Number(value) : value;
    }
  }

  return result;
}

/**
 * Build a help string from the schema.
 *
 * @param {string} usage - One-line usage description.
 * @param {Record<string, { type: string, default?: any, desc?: string }>} schema
 * @returns {string}
 */
export function buildHelp(usage, schema) {
  const lines = [`Usage: ${usage}`, ""];
  for (const [key, def] of Object.entries(schema)) {
    const tag = def.type === "boolean" ? "" : " <value>";
    const defStr =
      def.default !== undefined
        ? ` (default: ${JSON.stringify(def.default)})`
        : "";
    const desc = def.desc || "";
    lines.push(`  -${key}${tag.padEnd(20 - key.length)}${desc}${defStr}`);
  }
  return lines.join("\n");
}
