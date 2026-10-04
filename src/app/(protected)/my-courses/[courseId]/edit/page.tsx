"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseUpdateSchema, type CourseUpdateInput } from "@/lib/validations/course";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface EditCoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default function EditCoursePage({ params }: EditCoursePageProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [courseId, setCourseId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseUpdateInput>({
    resolver: zodResolver(courseUpdateSchema),
  });

  useEffect(() => {
    params.then((p) => setCourseId(p.courseId));
  }, [params]);

  useEffect(() => {
    if (!courseId) return;

    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        if (res.ok) {
          const data = await res.json();
          reset({
            title: data.title,
            description: data.description,
            className: data.className,
          });
        }
      } catch {
        setError("Failed to load course");
      } finally {
        setIsFetching(false);
      }
    }

    fetchCourse();
  }, [courseId, reset]);

  async function onSubmit(data: CourseUpdateInput) {
    if (!courseId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to update course");
        setIsLoading(false);
        return;
      }

      router.push("/my-courses");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
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

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Course</CardTitle>
          <CardDescription>Update your course information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Course title"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Course description"
                rows={4}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="className">Class name</Label>
              <Input
                id="className"
                type="text"
                placeholder="Class name"
                {...register("className")}
              />
              {errors.className && (
                <p className="text-sm text-destructive">{errors.className.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update course
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
