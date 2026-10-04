import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { BookOpen, Eye, MessageSquare, Trash2 } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/shared/pagination";

export const dynamic = "force-dynamic";

interface AdminCoursesPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminCoursesPage({ searchParams }: AdminCoursesPageProps) {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 20;
  const search = params.search || "";

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
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

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Course Management</h1>
        <p className="text-muted-foreground">View and manage all courses</p>
      </div>

      <form action="/admin/courses" method="get" className="mb-6 flex gap-4">
        <Input
          placeholder="Search courses..."
          defaultValue={search}
          className="max-w-sm"
          name="search"
        />
        <Button type="submit">Search</Button>
        {search && (
          <Button variant="outline" asChild>
            <a href="/admin/courses">Clear</a>
          </Button>
        )}
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Courses ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No courses found</h3>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {courses.map((course: any) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/courses/${course.id}`}
                          className="font-medium hover:underline"
                        >
                          {course.title}
                        </Link>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {course.teacher.firstName} {course.teacher.lastName} · {course.className}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {course._count.sessions} sessions
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {course._count.comments} comments
                        </span>
                        <span>{formatDate(course.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/courses/${course.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination currentPage={page} totalPages={totalPages} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
