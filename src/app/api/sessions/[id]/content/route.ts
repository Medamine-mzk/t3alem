import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contentBlockCreateSchema } from "@/lib/validations/session";

type Params = Promise<{ id: string }>;

export async function POST(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const existingSession = await prisma.session.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existingSession.course.teacherId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = contentBlockCreateSchema.parse(body);

    const maxPosition = await prisma.contentBlock.aggregate({
      where: { sessionId: id },
      _max: { position: true },
    });

    const contentBlock = await prisma.contentBlock.create({
      data: {
        sessionId: id,
        type: validated.type,
        content: validated.content,
        position: validated.position ?? (maxPosition._max.position ?? -1) + 1,
      },
    });

    return NextResponse.json(contentBlock, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error },
        { status: 400 }
      );
    }

    console.error("Content block POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
