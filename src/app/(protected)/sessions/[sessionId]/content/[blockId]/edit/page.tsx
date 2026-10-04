"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentBlockUpdateSchema, type ContentBlockUpdateInput } from "@/lib/validations/session";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import Link from "next/link";

interface EditContentBlockPageProps {
  params: Promise<{ sessionId: string; blockId: string }>;
}

export default function EditContentBlockPage({ params }: EditContentBlockPageProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [blockType, setBlockType] = useState("TEXT");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [blockId, setBlockId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContentBlockUpdateInput>({
    resolver: zodResolver(contentBlockUpdateSchema),
  });

  useEffect(() => {
    params.then((p) => {
      setSessionId(p.sessionId);
      setBlockId(p.blockId);
    });
  }, [params]);

  useEffect(() => {
    if (!sessionId || !blockId) return;

    async function fetchBlock() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          const block = data.contentBlocks.find((b: any) => b.id === blockId);
          if (block) {
            setBlockType(block.type);
            setValue("type", block.type);
            setValue("content", block.content);
            setValue("position", block.position);
          }
        }
      } catch {
        setError("Failed to load content block");
      } finally {
        setIsFetching(false);
      }
    }

    fetchBlock();
  }, [sessionId, blockId, setValue]);

  async function onSubmit(data: ContentBlockUpdateInput) {
    if (!sessionId || !blockId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/content/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to update content block");
        setIsLoading(false);
        return;
      }

      router.push(`/sessions/${sessionId}/content`);
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Upload failed");
        setIsLoading(false);
        return;
      }

      setValue("content", result.url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
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
        href={`/sessions/${sessionId}/content`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to content
      </Link>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Content Block</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={blockType}
                onValueChange={(value) => {
                  setBlockType(value);
                  setValue("type", value as "TEXT" | "IMAGE" | "VIDEO" | "QUIZ");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Text</SelectItem>
                  <SelectItem value="IMAGE">Image</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="QUIZ">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(blockType === "IMAGE" || blockType === "VIDEO") && (
              <div className="space-y-2">
                <Label>Upload {blockType === "IMAGE" ? "Image" : "Video"}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept={blockType === "IMAGE" ? "image/*" : "video/*"}
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>
                {blockType === "TEXT" && "Text Content"}
                {blockType === "IMAGE" && "Image URL"}
                {blockType === "VIDEO" && "Video URL"}
                {blockType === "QUIZ" && "Quiz Content"}
              </Label>
              <Textarea
                placeholder={
                  blockType === "TEXT"
                    ? "Enter your text content..."
                    : blockType === "IMAGE"
                      ? "Enter image URL or upload above..."
                      : blockType === "VIDEO"
                        ? "Enter video URL or upload above..."
                        : "Enter quiz questions..."
                }
                rows={4}
                {...register("content")}
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Content Block
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
