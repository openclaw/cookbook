import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "recipes", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const failures = [];

for (const recipe of manifest) {
  for (const key of ["entry", "readme"]) {
    const value = recipe[key];
    if (typeof value !== "string" || !fs.existsSync(path.join(root, value))) {
      failures.push(`${recipe.id}: missing ${key} ${value}`);
    }
  }
  const readme = fs.readFileSync(path.join(root, recipe.readme), "utf8");
  if (!readme.includes("```bash")) {
    failures.push(`${recipe.id}: README should include a bash command`);
  }
}

const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
for (const recipe of manifest) {
  const link = `recipes/${recipe.id}`;
  if (!readme.includes(link)) {
    failures.push(`README missing link to ${link}`);
  }
}

if (!fs.existsSync(path.join(root, "examples", "node-cli", "src", "index.ts"))) {
  failures.push("missing node-cli example entry");
}

const sdkExamples = ["quickstart", "coding-agent-cli", "agent-workbench", "run-board"];
for (const id of sdkExamples) {
  const base = path.join(root, "sdk", id);
  for (const file of ["README.md", "package.json", "tsconfig.json"]) {
    if (!fs.existsSync(path.join(base, file))) {
      failures.push(`sdk/${id}: missing ${file}`);
    }
  }
  const packageJson = JSON.parse(fs.readFileSync(path.join(base, "package.json"), "utf8"));
  if (!packageJson.scripts?.check) {
    failures.push(`sdk/${id}: missing check script`);
  }
  if (!readme.includes(`sdk/${id}`)) {
    failures.push(`README missing link to sdk/${id}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`docs ok: ${manifest.length} recipes`);
}
