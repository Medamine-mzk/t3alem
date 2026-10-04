import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/shared/pagination";

export const dynamic = "force-dynamic";

interface CoursesPageProps {
  searchParams: Promise<{ page?: string; search?: string; className?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 12;
  const search = params.search || "";
  const className = params.className || "";

  const where = {
    AND: [
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {},
      className ? { className: { contains: className, mode: "insensitive" as const } } : {},
    ],
  };

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
        <h1 className="text-3xl font-bold">Courses</h1>
        <p className="text-muted-foreground">Browse all available courses</p>
      </div>

      <form action="/courses" method="get" className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            defaultValue={search}
            className="pl-9"
            name="search"
          />
        </div>
        <Input
          placeholder="Filter by class..."
          defaultValue={className}
          className="sm:w-64"
          name="className"
        />
        <Button type="submit">Search</Button>
        {(search || className) && (
          <Button variant="outline" asChild>
            <Link href="/courses">Clear</Link>
          </Button>
        )}
      </form>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No courses found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: any) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card className="h-full transition-colors hover:bg-accent/50">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription>{course.className}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {course.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {course.teacher.firstName} {course.teacher.lastName}
                      </span>
                      <span>{course._count.sessions} sessions</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination currentPage={page} totalPages={totalPages} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
