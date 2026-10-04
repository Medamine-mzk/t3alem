import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionForm } from "@/components/sessions/session-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface NewSessionPageProps {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function NewSessionPage({ searchParams }: NewSessionPageProps) {
  const { courseId } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!courseId) {
    notFound();
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
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
        href={`/sessions?courseId=${courseId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sessions
      </Link>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Create New Session</CardTitle>
          <CardDescription>Add a new session to {course.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionForm courseId={courseId} />
        </CardContent>
      </Card>
    </div>
  );
}
