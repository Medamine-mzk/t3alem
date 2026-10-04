import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, BookOpen, MessageSquare, Eye, Calendar, User } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (session?.user.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      courses: {
        include: {
          _count: { select: { sessions: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          session: { select: { title: true } },
        },
      },
      _count: {
        select: { courses: true, comments: true, visits: true },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/admin/users"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {user.firstName} {user.lastName}
        </h1>
        <p className="text-muted-foreground">{user.email}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Badge
            variant={
              user.role === "ADMIN"
                ? "default"
                : user.role === "TEACHER"
                  ? "secondary"
                  : "outline"
            }
          >
            {user.role}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Joined {formatDate(user.createdAt)}
          </span>
          {!user.isActive && (
            <Badge variant="destructive">Inactive</Badge>
          )}
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.courses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.comments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Viewed</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.visits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{user.className || "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {user.courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No courses yet.</p>
            ) : (
              <div className="space-y-4">
                {user.courses.map((course: any) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="font-medium">{course.title}</div>
                    <div className="text-sm text-muted-foreground">
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
            <CardTitle>Recent Comments</CardTitle>
          </CardHeader>
          <CardContent>
            {user.comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {user.comments.map((comment: any) => (
                  <div key={comment.id} className="rounded-lg border p-3">
                    <div className="text-sm font-medium">
                      {comment.session.title}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
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
    </div>
  );
}
