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
  console.log("Importing data...");

  const users = readCollection("users");
  const userIdMap = new Map<string, string>();

  for (const user of users) {
    const { _oldId, ...data } = user;
    try {
      const created = await prisma.user.create({ data });
      userIdMap.set(user.id, created.id);
    } catch {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        userIdMap.set(user.id, existing.id);
      }
    }
  }
  console.log(`Imported ${userIdMap.size} users`);

  const courses = readCollection("courses");
  let coursesImported = 0;
  for (const course of courses) {
    const { _oldId, ...data } = course;
    const dbTeacherId = userIdMap.get(data.teacherId);
    if (dbTeacherId) {
      data.teacherId = dbTeacherId;
    }
    try {
      await prisma.course.create({ data });
      coursesImported++;
    } catch (e) {
      console.error(`Failed to import course: ${data.title}`);
    }
  }
  console.log(`Imported ${coursesImported} courses`);

  const sessions = readCollection("sessions");
  let sessionsImported = 0;
  for (const session of sessions) {
    const { _oldId, _contentBlocks, ...data } = session;
    try {
      await prisma.session.create({ data });
      sessionsImported++;
    } catch (e) {
      console.error(`Failed to import session: ${data.title}`);
    }
  }
  console.log(`Imported ${sessionsImported} sessions`);

  const contentBlocks = readCollection("contentBlocks");
  let contentBlocksImported = 0;
  for (const block of contentBlocks) {
    const { _oldId, ...data } = block;
    try {
      await prisma.contentBlock.create({ data });
      contentBlocksImported++;
    } catch (e) {
      console.error(`Failed to import content block`);
    }
  }
  console.log(`Imported ${contentBlocksImported} content blocks`);

  const comments = readCollection("comments");
  let commentsImported = 0;
  for (const comment of comments) {
    const { _oldId, ...data } = comment;
    const dbUserId = userIdMap.get(data.userId);
    if (dbUserId) {
      data.userId = dbUserId;
    }
    try {
      await prisma.comment.create({ data });
      commentsImported++;
    } catch (e) {
      console.error(`Failed to import comment`);
    }
  }
  console.log(`Imported ${commentsImported} comments`);

  const visits = readCollection("visits");
  let visitsImported = 0;
  for (const visit of visits) {
    const { _oldId, ...data } = visit;
    const dbUserId = userIdMap.get(data.userId);
    if (dbUserId) {
      data.userId = dbUserId;
    }
    try {
      await prisma.visit.create({ data });
      visitsImported++;
    } catch (e) {
      console.error(`Failed to import visit`);
    }
  }
  console.log(`Imported ${visitsImported} visits`);

  console.log("Import complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
