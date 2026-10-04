"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Eye,
  MessageSquare,
  PlayCircle,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Plus,
  Trash2,
  Pencil,
  CheckCircle,
  Circle,
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import { EditModeToggle } from "@/components/courses/edit-mode-toggle";
import { InlineEditable } from "@/components/courses/inline-editable";
import { DraggableList } from "@/components/courses/draggable-list";
import { RichTextEditor } from "@/components/courses/rich-text-editor";
import { ContentBlockEditor } from "@/components/sessions/content-block-editor";
import MDEditor from "@uiw/react-md-editor";
import { toast } from "sonner";

interface SessionDetailPageProps {
  params: Promise<{ courseId: string; sessionId: string }>;
}

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { courseId, sessionId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [sessionData, setSessionData] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const { theme } = useTheme();

  const isTeacher = session?.user.role === "TEACHER" || session?.user.role === "ADMIN";
  const isOwner = course && session && course.teacherId === session.user.id;
  const canEdit = isTeacher && (isOwner || session?.user.role === "ADMIN");

  async function fetchData() {
    try {
      const [courseRes, sessionRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/sessions/${sessionId}`),
      ]);
      if (courseRes.ok) setCourse(await courseRes.json());
      if (sessionRes.ok) setSessionData(await sessionRes.json());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [courseId, sessionId]);

  async function handleUpdateSession(field: string, value: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setSessionData({ ...sessionData, [field]: value });
      }
    } catch {
      toast.error("Failed to update session");
    }
  }

  async function handleAddContentBlock(type: string, content: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content }),
      });
      if (res.ok) {
        const newBlock = await res.json();
        setSessionData({
          ...sessionData,
          contentBlocks: [...(sessionData.contentBlocks || []), newBlock],
        });
        setShowAddBlock(false);
        toast.success("Content block added");
      }
    } catch {
      toast.error("Failed to add content block");
    }
  }

  async function handleUpdateContentBlock(blockId: string, content: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/content/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setSessionData({
          ...sessionData,
          contentBlocks: sessionData.contentBlocks.map((b: any) =>
            b.id === blockId ? { ...b, content } : b
          ),
        });
      }
    } catch {
      toast.error("Failed to update content block");
    }
  }

  async function handleDeleteContentBlock(blockId: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/content/${blockId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessionData({
          ...sessionData,
          contentBlocks: sessionData.contentBlocks.filter((b: any) => b.id !== blockId),
        });
        toast.success("Content block deleted");
      }
    } catch {
      toast.error("Failed to delete content block");
    }
  }

  async function handleReorderBlocks(newBlocks: any[]) {
    setSessionData({ ...sessionData, contentBlocks: newBlocks });
    try {
      await Promise.all(
        newBlocks.map((b: any, index: number) =>
          fetch(`/api/sessions/${sessionId}/content/${b.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ position: index }),
          })
        )
      );
    } catch {
      toast.error("Failed to reorder blocks");
    }
  }

  async function handleMarkComplete() {
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        toast.success("Session marked as complete");
        router.refresh();
      }
    } catch {
      toast.error("Failed to mark as complete");
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Session not found</h1>
      </div>
    );
  }

  const getBlockIcon = (type: string) => {
    switch (type) {
      case "TEXT":
        return <FileText className="h-4 w-4" />;
      case "IMAGE":
        return <ImageIcon className="h-4 w-4" />;
      case "VIDEO":
        return <PlayCircle className="h-4 w-4" />;
      case "QUIZ":
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/courses/${courseId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {course.title}
      </Link>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditMode ? (
              <InlineEditable
                value={sessionData.title}
                onSave={(value) => handleUpdateSession("title", value)}
                className="text-3xl font-bold"
                inputClassName="text-3xl font-bold"
              />
            ) : (
              <h1 className="text-3xl font-bold">{sessionData.title}</h1>
            )}
            {isEditMode ? (
              <InlineEditable
                value={sessionData.description}
                onSave={(value) => handleUpdateSession("description", value)}
                className="mt-2 text-muted-foreground"
                multiline
              />
            ) : (
              <p className="mt-2 text-muted-foreground">{sessionData.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDateTime(sessionData.date)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {sessionData._count?.visits || 0} visits
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {sessionData.comments?.length || 0} comments
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <EditModeToggle
                isEditMode={isEditMode}
                onToggle={() => setIsEditMode(!isEditMode)}
              />
            )}
            {session?.user.role === "STUDENT" && (
              <Button onClick={handleMarkComplete} variant="outline" size="sm">
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Content Sections</CardTitle>
                {isEditMode && (
                  <Button onClick={() => setShowAddBlock(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Section
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {(!sessionData.contentBlocks || sessionData.contentBlocks.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No content sections yet.</p>
                  {isEditMode && (
                    <p className="text-sm">Click "Add Section" to create your first content block.</p>
                  )}
                </div>
              ) : isEditMode ? (
                <DraggableList
                  items={sessionData.contentBlocks}
                  onReorder={handleReorderBlocks}
                  renderItem={(block: any, index: number) => (
                    <div key={block.id} className="rounded-lg border bg-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getBlockIcon(block.type)}
                          <span className="text-sm font-medium uppercase">{block.type}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteContentBlock(block.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      {block.type === "TEXT" ? (
                        <RichTextEditor
                          value={block.content}
                          onSave={(value) => handleUpdateContentBlock(block.id, value)}
                        />
                      ) : block.type === "IMAGE" ? (
                        <img src={block.content} alt="Content" className="max-w-full rounded" />
                      ) : block.type === "VIDEO" ? (
                        <video src={block.content} controls className="max-w-full rounded" />
                      ) : (
                        <p className="text-sm">{block.content}</p>
                      )}
                    </div>
                  )}
                />
              ) : (
                <div className="space-y-4">
                  {sessionData.contentBlocks.map((block: any) => (
                    <div key={block.id} className="rounded-lg border bg-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {getBlockIcon(block.type)}
                        <span className="text-xs font-medium uppercase text-muted-foreground">{block.type}</span>
                      </div>
                      {block.type === "TEXT" && (
                        <div className="prose prose-sm max-w-none" data-color-mode={theme}>
                          <MDEditor.Markdown source={block.content} />
                        </div>
                      )}
                      {block.type === "IMAGE" && (
                        <img src={block.content} alt="Content" className="max-w-full rounded" />
                      )}
                      {block.type === "VIDEO" && (
                        <video src={block.content} controls className="max-w-full rounded" />
                      )}
                      {block.type === "QUIZ" && (
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-sm">{block.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {showAddBlock && isEditMode && (
                <div className="mt-4 border-t pt-4">
                  <ContentBlockEditor
                    sessionId={sessionId}
                    onContentAdded={() => {
                      fetchData();
                      setShowAddBlock(false);
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="rounded-xl border bg-card">
            <div className="border-b p-4">
              <h3 className="font-semibold">Comments ({sessionData.comments?.length || 0})</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
              {sessionData.comments?.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8" />
                  <p className="mt-2 text-sm">No comments yet</p>
                </div>
              ) : (
                sessionData.comments?.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {comment.user.firstName.charAt(0)}{comment.user.lastName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comment.user.firstName} {comment.user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {session ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.querySelector('textarea') as HTMLTextAreaElement;
                  if (!input.value.trim()) return;
                  try {
                    const res = await fetch("/api/comments", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sessionId, content: input.value }),
                    });
                    if (res.ok) {
                      const newComment = await res.json();
                      setSessionData({
                        ...sessionData,
                        comments: [newComment, ...sessionData.comments],
                      });
                      input.value = "";
                    }
                  } catch {
                    toast.error("Failed to post comment");
                  }
                }}
                className="border-t p-4"
              >
                <textarea
                  placeholder="Write a comment..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button type="submit" className="mt-2" size="sm">
                  Post
                </Button>
              </form>
            ) : (
              <div className="border-t p-4 text-center text-sm text-muted-foreground">
                Sign in to comment
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
