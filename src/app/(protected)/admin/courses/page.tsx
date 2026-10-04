"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { BookOpen, Eye, MessageSquare, Trash2 } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";

interface AdminCoursesPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default function AdminCoursesPage({ searchParams }: AdminCoursesPageProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const params = use(searchParams);
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 20;
  const search = params.search || "";
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    async function fetchCourses() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        if (search) params.set("search", search);
        const res = await fetch(`/api/admin/courses?${params}`);
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses);
          setTotal(data.total);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourses();
  }, [page, search]);

  async function handleDeleteCourse() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/courses/${deleteTarget}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Course deleted");
        setCourses(courses.filter((c) => c.id !== deleteTarget));
        setTotal(total - 1);
        setDeleteTarget(null);
      } else {
        toast.error("Failed to delete course");
      }
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Course Management</h1>
        <p className="text-muted-foreground">View and manage all courses</p>
      </div>

      <form action="/admin/courses" method="get" className="mb-6 flex gap-4">
        <Input
          placeholder="Search courses..."
          defaultValue={search}
          className="max-w-sm"
          name="search"
        />
        <Button type="submit">Search</Button>
        {search && (
          <Button variant="outline" asChild>
            <a href="/admin/courses">Clear</a>
          </Button>
        )}
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Courses ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No courses found</h3>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {courses.map((course: any) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/courses/${course.id}`}
                          className="font-medium hover:underline"
                        >
                          {course.title}
                        </Link>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {course.teacher.firstName} {course.teacher.lastName} · {course.className}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {course._count.sessions} sessions
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {course._count.comments} comments
                        </span>
                        <span>{formatDate(course.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/courses/${course.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(course.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination currentPage={page} totalPages={totalPages} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Course"
        description="Are you sure you want to delete this course? All sessions and content will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDeleteCourse}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
