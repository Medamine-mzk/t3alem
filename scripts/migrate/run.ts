import { execSync } from "child_process";

const steps = [
  { name: "Extract", command: "npx tsx scripts/migrate/extract.ts" },
  { name: "Transform", command: "npx tsx scripts/migrate/transform.ts" },
  { name: "Import", command: "npx tsx scripts/migrate/import.ts" },
  { name: "Verify", command: "npx tsx scripts/migrate/verify.ts" },
];

const stepIndex = parseInt(process.argv[2] || "0");

if (stepIndex >= steps.length) {
  console.log("Invalid step index. Usage: npx tsx scripts/migrate/run.ts [0-3]");
  process.exit(1);
}

const step = steps[stepIndex];
console.log(`Running step ${stepIndex}: ${step.name}...`);

try {
  execSync(step.command, { stdio: "inherit" });
  console.log(`Step ${stepIndex} complete!`);
} catch (error) {
  console.error(`Step ${stepIndex} failed!`);
  process.exit(1);
}
