import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Calendar, Eye, MessageSquare, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

interface ManageSessionsPageProps {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function ManageSessionsPage({ searchParams }: ManageSessionsPageProps) {
  const { courseId } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!courseId) {
    notFound();
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: {
        select: { firstName: true, lastName: true },
      },
      sessions: {
        orderBy: { date: "asc" },
        include: {
          _count: {
            select: { comments: true, visits: true },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const isOwner = course.teacherId === session?.user.id;
  const isAdmin = session?.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/my-courses"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to my courses
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">Manage sessions for this course</p>
        </div>
        <Button asChild>
          <Link href={`/sessions/new?courseId=${courseId}`}>
            <Plus className="h-4 w-4" />
            New Session
          </Link>
        </Button>
      </div>

      {course.sessions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No sessions yet. Create your first session to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {course.sessions.map((s: any) => (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{s.title}</CardTitle>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(s.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {s._count.visits} visits
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {s._count.comments} comments
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/courses/${courseId}/sessions/${s.id}`}>View</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/sessions/${s.id}/edit`}>Edit</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/sessions/${s.id}/content`}>Content</Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
