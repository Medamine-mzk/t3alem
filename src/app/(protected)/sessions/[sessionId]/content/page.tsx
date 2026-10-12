"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, FileText, Image as ImageIcon, Video, HelpCircle, Plus } from "lucide-react";
import { ContentBlockActions } from "./content-block-actions";
import { ContentBlockEditor } from "@/components/sessions/content-block-editor";
import MDEditor from "@uiw/react-md-editor";
import { toast } from "sonner";

interface ManageContentPageProps {
  params: Promise<{ sessionId: string }>;
}

function getBlockIcon(type: string) {
  switch (type) {
    case "TEXT":
      return <FileText className="h-4 w-4" />;
    case "IMAGE":
      return <ImageIcon className="h-4 w-4" />;
    case "VIDEO":
      return <Video className="h-4 w-4" />;
    case "QUIZ":
      return <HelpCircle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function ManageContentPage({ params }: ManageContentPageProps) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchData() {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (res.ok) {
        setSessionData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  async function handleDeleteBlock(blockId: string) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/content/${blockId}`, { method: "DELETE" });
      if (res.ok) {
        setSessionData({
          ...sessionData,
          contentBlocks: sessionData.contentBlocks.filter((b: any) => b.id !== blockId),
        });
        toast.success("Content block deleted");
      }
    } catch {
      toast.error("Failed to delete content block");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Session not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/courses/${sessionData.courseId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to course
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">{sessionData.title}</h1>
        <p className="text-muted-foreground">
          {formatDate(sessionData.date)}
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
                    <div className="prose prose-sm max-w-none">
                      <MDEditor.Markdown source={block.content} />
                    </div>
                  )}
                  {block.type === "IMAGE" && (
                    <img src={block.content} alt="Content" className="max-w-full rounded-lg" />
                  )}
                  {block.type === "VIDEO" && (
                    getYouTubeEmbedUrl(block.content) ? (
                      <div className="aspect-video">
                        <iframe
                          src={getYouTubeEmbedUrl(block.content)!}
                          className="h-full w-full rounded"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <video src={block.content} controls className="max-w-full rounded-lg" />
                    )
                  )}
                  {block.type === "QUIZ" && (
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm whitespace-pre-wrap">{block.content}</p>
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
              <Button onClick={() => setShowAddBlock(true)} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Block
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ContentBlockEditor
        sessionId={sessionId}
        open={showAddBlock}
        onOpenChange={setShowAddBlock}
        onContentAdded={() => {
          fetchData();
          setShowAddBlock(false);
        }}
      />
    </div>
  );
}
