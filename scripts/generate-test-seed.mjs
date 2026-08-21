import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { TEST_REGISTRY } from "../packages/shared/dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../supabase/seed-tests.sql");

function sqlEscape(json) {
  return json.replace(/'/g, "''");
}

const lines = Object.values(TEST_REGISTRY).map((test) => {
  const json = sqlEscape(JSON.stringify(test));
  return `insert into tests (id, definition) values ('${test.id}', '${json}'::jsonb) on conflict (id) do nothing;`;
});

writeFileSync(outPath, lines.join("\n\n") + "\n", "utf-8");
console.log(`Wrote ${lines.length} statements to ${outPath}`);
