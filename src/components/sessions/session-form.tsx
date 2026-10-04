"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sessionCreateSchema, type SessionCreateInput } from "@/lib/validations/session";
import { Loader2 } from "lucide-react";

interface SessionFormProps {
  courseId: string;
  initialData?: {
    title: string;
    description: string;
    date?: Date;
  };
  isEditing?: boolean;
  sessionId?: string;
}

export function SessionForm({ courseId, initialData, isEditing, sessionId }: SessionFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SessionCreateInput>({
    resolver: zodResolver(sessionCreateSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      date: initialData?.date,
    },
  });

  async function onSubmit(data: SessionCreateInput) {
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/sessions/${sessionId}` : "/api/sessions";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          courseId,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to save session");
        setIsLoading(false);
        return;
      }

      router.push(`/courses/${courseId}`);
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
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
          placeholder="Session title"
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
          placeholder="Session description"
          rows={4}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="datetime-local"
          {...register("date", {
            setValueAs: (v) => (v ? new Date(v) : undefined),
          })}
        />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isEditing ? "Update session" : "Create session"}
      </Button>
    </form>
  );
}
