import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseCreateSchema, courseQuerySchema } from "@/lib/validations/course";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = courseQuerySchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "12",
      search: searchParams.get("search") || undefined,
      className: searchParams.get("className") || undefined,
      teacherId: searchParams.get("teacherId") || undefined,
    });

    const where = {
      AND: [
        query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: "insensitive" as const } },
                { description: { contains: query.search, mode: "insensitive" as const } },
              ],
            }
          : {},
        query.className
          ? { className: { contains: query.className, mode: "insensitive" as const } }
          : {},
        query.teacherId ? { teacherId: query.teacherId } : {},
      ],
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        include: {
          teacher: {
            select: { firstName: true, lastName: true },
          },
          _count: { select: { sessions: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return NextResponse.json({
      data: courses,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error("Courses GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = courseCreateSchema.parse(body);

    const course = await prisma.course.create({
      data: {
        ...validated,
        teacherId: session.user.id,
      },
      include: {
        teacher: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error },
        { status: 400 }
      );
    }

    console.error("Courses POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
