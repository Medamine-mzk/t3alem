import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionForm } from "@/components/sessions/session-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface EditSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function EditSessionPage({ params }: EditSessionPageProps) {
  const { sessionId } = await params;
  const session = await getServerSession(authOptions);

  const sessionData = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          teacherId: true,
        },
      },
    },
  });

  if (!sessionData) {
    notFound();
  }

  const isOwner = sessionData.course.teacherId === session?.user.id;
  const isAdmin = session?.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/courses/${sessionData.course.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sessions
      </Link>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Session</CardTitle>
          <CardDescription>Update session information</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionForm
            courseId={sessionData.courseId}
            sessionId={sessionId}
            isEditing
            initialData={{
              title: sessionData.title,
              description: sessionData.description,
              date: sessionData.date,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
