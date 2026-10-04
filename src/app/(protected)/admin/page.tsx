import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, MessageSquare, Eye, TrendingUp, Clock, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (session?.user.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  const [userCount, courseCount, sessionCount, commentCount, recentUsers, recentCourses, recentComments] =
    await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.session.count(),
      prisma.comment.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
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
    { label: "Total Users", value: userCount, icon: Users },
    { label: "Total Courses", value: courseCount, icon: BookOpen },
    { label: "Total Sessions", value: sessionCount, icon: Eye },
    { label: "Total Comments", value: commentCount, icon: MessageSquare },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management</p>
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
              <CardTitle>Recent Users</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/users">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Courses</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/courses">
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
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/courses">
                <BookOpen className="mr-2 h-4 w-4" />
                Manage Courses
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/comments">
                <MessageSquare className="mr-2 h-4 w-4" />
                Moderate Comments
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
