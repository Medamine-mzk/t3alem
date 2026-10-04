import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { course: true },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: sessionData.courseId } },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    const updated = await prisma.enrollment.update({
      where: { userId_courseId: { userId: session.user.id, courseId: sessionData.courseId } },
      data: {
        completedSessions: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Progress POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
