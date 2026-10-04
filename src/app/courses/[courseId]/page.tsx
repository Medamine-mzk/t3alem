"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Eye,
  MessageSquare,
  CheckCircle,
  Circle,
  BookOpen,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { EditModeToggle } from "@/components/courses/edit-mode-toggle";
import { InlineEditable } from "@/components/courses/inline-editable";
import { DraggableList } from "@/components/courses/draggable-list";
import { toast } from "sonner";

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [course, setCourse] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const isTeacher = session?.user.role === "TEACHER" || session?.user.role === "ADMIN";
  const isOwner = course && session && course.teacherId === session.user.id;
  const canEdit = isTeacher && (isOwner || session?.user.role === "ADMIN");

  async function fetchCourse() {
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
      }
    } catch (error) {
      console.error("Failed to fetch course:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  async function handleUpdateCourse(field: string, value: string) {
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setCourse({ ...course, [field]: value });
      }
    } catch {
      toast.error("Failed to update course");
    }
  }

  async function handleAddSession() {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title: "New Session",
          description: "Session description",
        }),
      });
      if (res.ok) {
        const newSession = await res.json();
        setCourse({
          ...course,
          sessions: [...course.sessions, newSession],
        });
        toast.success("Session added");
      }
    } catch {
      toast.error("Failed to add session");
    }
  }

  async function handleDeleteSession(sessionId: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        setCourse({
          ...course,
          sessions: course.sessions.filter((s: any) => s.id !== sessionId),
        });
        toast.success("Session deleted");
      }
    } catch {
      toast.error("Failed to delete session");
    }
  }

  async function handleUpdateSession(sessionId: string, field: string, value: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setCourse({
          ...course,
          sessions: course.sessions.map((s: any) =>
            s.id === sessionId ? { ...s, [field]: value } : s
          ),
        });
      }
    } catch {
      toast.error("Failed to update session");
    }
  }

  async function handleReorderSessions(newSessions: any[]) {
    setCourse({ ...course, sessions: newSessions });
    try {
      await Promise.all(
        newSessions.map((s: any, index: number) =>
          fetch(`/api/sessions/${s.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ position: index }),
          })
        )
      );
    } catch {
      toast.error("Failed to reorder sessions");
    }
  }

  function toggleSession(sessionId: string) {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
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

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Course not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/courses"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </Link>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditMode ? (
              <InlineEditable
                value={course.title}
                onSave={(value) => handleUpdateCourse("title", value)}
                className="text-3xl font-bold"
                inputClassName="text-3xl font-bold"
              />
            ) : (
              <h1 className="text-3xl font-bold">{course.title}</h1>
            )}
            {isEditMode ? (
              <InlineEditable
                value={course.description}
                onSave={(value) => handleUpdateCourse("description", value)}
                className="mt-2 text-muted-foreground"
                multiline
              />
            ) : (
              <p className="mt-2 text-muted-foreground">{course.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {course.teacher.firstName} {course.teacher.lastName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(course.createdAt)}
              </span>
              <Badge variant="secondary">{course.className}</Badge>
              <span>{course.sessions?.length || 0} sessions</span>
            </div>
          </div>
          {canEdit && (
            <EditModeToggle
              isEditMode={isEditMode}
              onToggle={() => setIsEditMode(!isEditMode)}
            />
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sessions</h2>
          {isEditMode && (
            <Button onClick={handleAddSession} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Session
            </Button>
          )}
        </div>

        {(!course.sessions || course.sessions.length === 0) ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No sessions yet.
            </CardContent>
          </Card>
        ) : isEditMode ? (
          <DraggableList
            items={course.sessions}
            onReorder={handleReorderSessions}
            renderItem={(session: any, index: number) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSession(session.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {expandedSessions.has(session.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <InlineEditable
                        value={session.title}
                        onSave={(value) => handleUpdateSession(session.id, "title", value)}
                        className="font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/courses/${courseId}/sessions/${session.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Content
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {expandedSessions.has(session.id) && (
                  <CardContent className="pt-0">
                    <InlineEditable
                      value={session.description}
                      onSave={(value) => handleUpdateSession(session.id, "description", value)}
                      className="text-sm text-muted-foreground"
                      multiline
                    />
                    <div className="mt-4 rounded-lg border bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        Content blocks are managed on the session page. Click "Edit Content" to add or modify sections.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          />
        ) : (
          <div className="space-y-3">
            {course.sessions.map((session: any, index: number) => (
              <Link key={session.id} href={`/courses/${courseId}/sessions/${session.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{session.title}</div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(session.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {session._count?.visits || 0} views
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {session._count?.comments || 0} comments
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
