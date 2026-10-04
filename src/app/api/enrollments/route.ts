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

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can enroll" }, { status: 403 });
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { sessions: true } } },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId,
        totalSessions: course._count.sessions,
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("Enrollment POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (courseId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId } },
      });
      return NextResponse.json(enrollment);
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          include: {
            teacher: { select: { firstName: true, lastName: true } },
            _count: { select: { sessions: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error("Enrollment GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
