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

  const existingUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const existingEmails = new Set(existingUsers.map((u) => u.email));

  const newUsers = users.filter((u: any) => !existingEmails.has(u.email));
  const usersData = newUsers.map(({ _oldId, ...data }: any) => data);

  if (usersData.length > 0) {
    await prisma.user.createMany({ data: usersData, skipDuplicates: true });
  }

  const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  for (const user of users) {
    const match = allUsers.find((u) => u.email === user.email);
    if (match) {
      userIdMap.set(user.id, match.id);
    }
  }
  console.log(`Imported ${userIdMap.size} users`);

  const courses = readCollection("courses");
  const coursesData = courses.map((course: any) => {
    const { _oldId, ...data } = course;
    const dbTeacherId = userIdMap.get(data.teacherId);
    if (dbTeacherId) {
      data.teacherId = dbTeacherId;
    }
    return data;
  });
  if (coursesData.length > 0) {
    const result = await prisma.course.createMany({ data: coursesData, skipDuplicates: true });
    console.log(`Imported ${result.count} courses`);
  }

  const sessions = readCollection("sessions");
  const sessionsData = sessions.map((session: any) => {
    const { _oldId, _contentBlocks, ...data } = session;
    return data;
  });
  if (sessionsData.length > 0) {
    const result = await prisma.session.createMany({ data: sessionsData, skipDuplicates: true });
    console.log(`Imported ${result.count} sessions`);
  }

  const contentBlocks = readCollection("contentBlocks");
  const contentBlocksData = contentBlocks.map((block: any) => {
    const { _oldId, ...data } = block;
    return data;
  });
  if (contentBlocksData.length > 0) {
    const result = await prisma.contentBlock.createMany({ data: contentBlocksData, skipDuplicates: true });
    console.log(`Imported ${result.count} content blocks`);
  }

  const comments = readCollection("comments");
  const commentsData = comments.map((comment: any) => {
    const { _oldId, ...data } = comment;
    const dbUserId = userIdMap.get(data.userId);
    if (dbUserId) {
      data.userId = dbUserId;
    }
    return data;
  });
  if (commentsData.length > 0) {
    const result = await prisma.comment.createMany({ data: commentsData, skipDuplicates: true });
    console.log(`Imported ${result.count} comments`);
  }

  const visits = readCollection("visits");
  const visitsData = visits.map((visit: any) => {
    const { _oldId, ...data } = visit;
    const dbUserId = userIdMap.get(data.userId);
    if (dbUserId) {
      data.userId = dbUserId;
    }
    return data;
  });
  if (visitsData.length > 0) {
    const result = await prisma.visit.createMany({ data: visitsData, skipDuplicates: true });
    console.log(`Imported ${result.count} visits`);
  }

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
