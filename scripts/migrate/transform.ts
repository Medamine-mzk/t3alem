import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = path.join(__dirname, "data");
const OUTPUT_DIR = path.join(__dirname, "transformed");

function readCollection(name: string) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeCollection(name: string, data: any[]) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const filePath = path.join(OUTPUT_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function transformUsers() {
  const users = readCollection("users");
  const usedEmails = new Set<string>();
  const usedUsernames = new Set<string>();

  const transformed = users.map((user: any, index: number) => {
    let email = user.email || "";
    if (!email || usedEmails.has(email)) {
      email = `user_${index}@placeholder.local`;
    }
    usedEmails.add(email);

    let username = user.username || "";
    if (!username || usedUsernames.has(username)) {
      username = `user_${index}`;
    }
    usedUsernames.add(username);

    return {
      id: randomUUID(),
      email,
      username,
      passwordHash: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      className: user.className || null,
      specialization: user.specialization || null,
      role: user.role === "TEACHER" ? "TEACHER" : "STUDENT",
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
      _oldId: user._id,
    };
  });
  writeCollection("users", transformed);
  return transformed;
}

function transformCourses(users: any[]) {
  const courses = readCollection("courses");
  const userMap = new Map(users.map((u: any) => [u._oldId, u.id]));

  const transformed = courses.map((course: any) => ({
    id: randomUUID(),
    title: course.title,
    description: course.description,
    className: course.className || "Unknown",
    teacherId: userMap.get(course.teacher) || users[0]?.id,
    createdAt: course.createdAt ? new Date(course.createdAt) : new Date(),
    updatedAt: course.updatedAt ? new Date(course.updatedAt) : new Date(),
    _oldId: course._id,
  }));
  writeCollection("courses", transformed);
  return transformed;
}

function transformSessions(courses: any[], users: any[]) {
  const sessions = readCollection("sessions");
  const courseMap = new Map(courses.map((c: any) => [c._oldId, c.id]));
  const userMap = new Map(users.map((u: any) => [u._oldId, u.id]));

  const placeholderCourses: any[] = [];
  const placeholderCourseMap = new Map<string, string>();

  const getOrCreatePlaceholderCourse = (oldCourseId: string): string => {
    if (placeholderCourseMap.has(oldCourseId)) {
      return placeholderCourseMap.get(oldCourseId)!;
    }
    const teacherId = users[0]?.id || "";
    const placeholder = {
      id: randomUUID(),
      title: `Course ${oldCourseId.substring(0, 8)}`,
      description: "Course data not available in migration",
      className: "Unknown",
      teacherId,
      createdAt: new Date(),
      updatedAt: new Date(),
      _oldId: oldCourseId,
    };
    placeholderCourses.push(placeholder);
    placeholderCourseMap.set(oldCourseId, placeholder.id);
    return placeholder.id;
  };

  const transformed = sessions.map((session: any) => {
    const existingCourseId = courseMap.get(session.courseId);
    const courseId = existingCourseId || getOrCreatePlaceholderCourse(session.courseId);

    return {
      id: randomUUID(),
      courseId,
      title: session.title,
      description: session.description,
      date: session.date ? new Date(session.date) : new Date(),
      createdAt: session.createdAt ? new Date(session.createdAt) : new Date(),
      updatedAt: session.updatedAt ? new Date(session.updatedAt) : new Date(),
      _oldId: session._id,
      _contentBlocks: session.contentBlocks || [],
    };
  });

  const allCourses = [...courses, ...placeholderCourses];
  writeCollection("courses", allCourses);
  writeCollection("sessions", transformed);
  return { sessions: transformed, courses: allCourses };
}

function transformContentBlocks(sessions: any[]) {
  const contentBlocks = readCollection("contentBlocks");
  const sessionMap = new Map(sessions.map((s: any) => [s._oldId, s.id]));

  const transformed: any[] = [];

  for (const session of sessions) {
    if (session._contentBlocks && session._contentBlocks.length > 0) {
      session._contentBlocks.forEach((block: any, index: number) => {
        transformed.push({
          id: randomUUID(),
          sessionId: session.id,
          type: block.type?.toUpperCase() || "TEXT",
          content: block.content || "",
          position: index,
          createdAt: new Date(),
          _oldId: block._id,
        });
      });
    }
  }

  for (const block of contentBlocks) {
    const sessionId = sessionMap.get(block.sessionId);
    if (sessionId && !transformed.find((t) => t._oldId === block._id)) {
      transformed.push({
        id: randomUUID(),
        sessionId,
        type: block.type?.toUpperCase() || "TEXT",
        content: block.content || "",
        position: 0,
        createdAt: block.createdAt ? new Date(block.createdAt) : new Date(),
        _oldId: block._id,
      });
    }
  }

  writeCollection("contentBlocks", transformed);
  return transformed;
}

function transformComments(sessions: any[], users: any[]) {
  const comments = readCollection("comments");
  const sessionMap = new Map(sessions.map((s: any) => [s._oldId, s.id]));
  const userMap = new Map(users.map((u: any) => [u._oldId, u.id]));

  const transformed = comments.map((comment: any) => ({
    id: randomUUID(),
    sessionId: sessionMap.get(comment.sessionId) || sessions[0]?.id,
    userId: userMap.get(comment.userId) || users[0]?.id,
    content: comment.content,
    createdAt: comment.date ? new Date(comment.date) : new Date(),
    updatedAt: comment.date ? new Date(comment.date) : new Date(),
    _oldId: comment._id,
  }));
  writeCollection("comments", transformed);
  return transformed;
}

function transformVisits(sessions: any[], users: any[]) {
  const visits = readCollection("visits");
  const sessionMap = new Map(sessions.map((s: any) => [s._oldId, s.id]));
  const userMap = new Map(users.map((u: any) => [u._oldId, u.id]));

  const transformed = visits.map((visit: any) => ({
    id: randomUUID(),
    userId: userMap.get(visit.userId) || users[0]?.id,
    sessionId: sessionMap.get(visit.sessionId) || sessions[0]?.id,
    visitedAt: visit.date ? new Date(visit.date) : new Date(),
    _oldId: visit._id,
  }));
  writeCollection("visits", transformed);
  return transformed;
}

function main() {
  console.log("Transforming data...");

  const users = transformUsers();
  console.log(`Transformed ${users.length} users`);

  const courses = transformCourses(users);
  console.log(`Transformed ${courses.length} courses`);

  const { sessions, courses: allCourses } = transformSessions(courses, users);
  console.log(`Transformed ${sessions.length} sessions`);
  console.log(`Total courses (including placeholders): ${allCourses.length}`);

  const contentBlocks = transformContentBlocks(sessions);
  console.log(`Transformed ${contentBlocks.length} content blocks`);

  const comments = transformComments(sessions, users);
  console.log(`Transformed ${comments.length} comments`);

  const visits = transformVisits(sessions, users);
  console.log(`Transformed ${visits.length} visits`);

  console.log("Transformation complete!");
}

main();
