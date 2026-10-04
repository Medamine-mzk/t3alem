"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentBlockCreateSchema, type ContentBlockCreateInput } from "@/lib/validations/session";
import { Loader2, Upload } from "lucide-react";

interface ContentBlockEditorProps {
  sessionId: string;
  onContentAdded?: () => void;
}

export function ContentBlockEditor({ sessionId, onContentAdded }: ContentBlockEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [blockType, setBlockType] = useState("TEXT");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContentBlockCreateInput>({
    resolver: zodResolver(contentBlockCreateSchema),
    defaultValues: {
      type: "TEXT",
      content: "",
    },
  });

  async function onSubmit(data: ContentBlockCreateInput) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to add content block");
        setIsLoading(false);
        return;
      }

      setValue("content", "");
      onContentAdded?.();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Content Block</CardTitle>
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
            Add Content Block
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
