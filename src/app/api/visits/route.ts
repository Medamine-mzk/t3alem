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
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const targetSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!targetSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const visit = await prisma.visit.upsert({
      where: {
        userId_sessionId: {
          userId: session.user.id,
          sessionId,
        },
      },
      update: { visitedAt: new Date() },
      create: {
        userId: session.user.id,
        sessionId,
      },
    });

    return NextResponse.json(visit, { status: 201 });
  } catch (error) {
    console.error("Visit POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
