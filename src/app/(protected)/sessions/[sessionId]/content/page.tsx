import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, FileText, Image, Video, HelpCircle, Plus } from "lucide-react";
import { ContentBlockActions } from "./content-block-actions";
import { ContentBlockEditor } from "@/components/sessions/content-block-editor";

export const dynamic = "force-dynamic";

interface ManageContentPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ManageContentPage({ params }: ManageContentPageProps) {
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
      contentBlocks: {
        orderBy: { position: "asc" },
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

  const getBlockIcon = (type: string) => {
    switch (type) {
      case "TEXT":
        return <FileText className="h-4 w-4" />;
      case "IMAGE":
        return <Image className="h-4 w-4" />;
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "QUIZ":
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/courses/${sessionData.course.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to course
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">{sessionData.title}</h1>
        <p className="text-muted-foreground">
          {sessionData.course.title} · {formatDate(sessionData.date)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {sessionData.contentBlocks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No content blocks yet. Add your first block to get started.
              </CardContent>
            </Card>
          ) : (
            sessionData.contentBlocks.map((block: any, index: number) => (
              <Card key={block.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getBlockIcon(block.type)}
                      <CardTitle className="text-base">
                        {block.type.charAt(0) + block.type.slice(1).toLowerCase()} Block
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    </div>
                    <ContentBlockActions
                      sessionId={sessionId}
                      blockId={block.id}
                      blockType={block.type}
                      isFirst={index === 0}
                      isLast={index === sessionData.contentBlocks.length - 1}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {block.type === "TEXT" && (
                    <p className="whitespace-pre-wrap text-sm">{block.content}</p>
                  )}
                  {block.type === "IMAGE" && (
                    <img
                      src={block.content}
                      alt="Content"
                      className="max-w-full rounded-lg"
                    />
                  )}
                  {block.type === "VIDEO" && (
                    <video
                      src={block.content}
                      controls
                      className="max-w-full rounded-lg"
                    />
                  )}
                  {block.type === "QUIZ" && (
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm">{block.content}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Content Block
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContentBlockEditor sessionId={sessionId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
