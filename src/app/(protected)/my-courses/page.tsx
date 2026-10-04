import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions);

  const courses = await prisma.course.findMany({
    where: { teacherId: session?.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { sessions: true } },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Manage your courses and sessions</p>
        </div>
        <Button asChild>
          <Link href="/my-courses/new">
            <Plus className="h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No courses yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first course to get started
          </p>
          <Button asChild className="mt-4">
            <Link href="/my-courses/new">
              <Plus className="h-4 w-4" />
              Create Course
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: any) => (
            <Link key={course.id} href={`/my-courses/${course.id}/edit`}>
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
                    <span>{course._count.sessions} sessions</span>
                    <span>{formatDate(course.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
