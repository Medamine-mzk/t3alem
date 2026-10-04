import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, MessageSquare, Eye, TrendingUp, Clock, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const [courseCount, userCount, sessionCount, commentCount, recentCourses, recentComments] =
    await Promise.all([
      prisma.course.count(),
      prisma.user.count(),
      prisma.session.count(),
      prisma.comment.count(),
      prisma.course.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          teacher: {
            select: { firstName: true, lastName: true },
          },
          _count: { select: { sessions: true } },
        },
      }),
      prisma.comment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
          session: {
            select: { title: true },
          },
        },
      }),
    ]);

  const stats = [
    { label: "Total Courses", value: courseCount, icon: BookOpen },
    { label: "Total Users", value: userCount, icon: Users },
    { label: "Total Sessions", value: sessionCount, icon: Eye },
    { label: "Total Comments", value: commentCount, icon: MessageSquare },
  ];

  const isStudent = session?.user.role === "STUDENT";
  const isTeacher = session?.user.role === "TEACHER";
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {session?.user.firstName}!
        </h1>
        <p className="text-muted-foreground">
          {isStudent
            ? "Continue your learning journey"
            : isTeacher
              ? "Manage your courses and track student progress"
              : "Platform overview and management"}
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Courses</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/courses">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No courses yet.</p>
            ) : (
              <div className="space-y-4">
                {recentCourses.map((course: any) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="font-medium">{course.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {course.teacher.firstName} {course.teacher.lastName} ·{" "}
                      {course._count.sessions} sessions · {formatDate(course.createdAt)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentComments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <div className="space-y-4">
                {recentComments.map((comment: any) => (
                  <div key={comment.id} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {comment.user.firstName} {comment.user.lastName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        commented on
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-medium">
                      {comment.session.title}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {comment.content}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(isTeacher || isAdmin) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/my-courses/new">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create Course
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/my-courses">
                  <Clock className="mr-2 h-4 w-4" />
                  Manage Sessions
                </Link>
              </Button>
              {isAdmin && (
                <Button variant="outline" asChild>
                  <Link href="/admin/users">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
