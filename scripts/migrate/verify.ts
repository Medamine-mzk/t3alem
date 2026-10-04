import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, "transformed");

function readCollection(name: string) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

async function main() {
  console.log("Verifying migration...\n");

  const tables = ["users", "courses", "sessions", "contentBlocks", "comments", "visits"];
  let allPassed = true;

  for (const table of tables) {
    const sourceCount = readCollection(table).length;
    let dbCount = 0;

    switch (table) {
      case "users":
        dbCount = await prisma.user.count();
        break;
      case "courses":
        dbCount = await prisma.course.count();
        break;
      case "sessions":
        dbCount = await prisma.session.count();
        break;
      case "contentBlocks":
        dbCount = await prisma.contentBlock.count();
        break;
      case "comments":
        dbCount = await prisma.comment.count();
        break;
      case "visits":
        dbCount = await prisma.visit.count();
        break;
    }

    const status = sourceCount === dbCount ? "PASS" : "FAIL";
    if (status === "FAIL") allPassed = false;
    console.log(`${status}: ${table} — source: ${sourceCount}, db: ${dbCount}`);
  }

  console.log("\n" + (allPassed ? "All checks passed!" : "Some checks failed!"));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
