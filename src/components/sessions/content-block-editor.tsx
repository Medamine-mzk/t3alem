"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentBlockCreateSchema, type ContentBlockCreateInput } from "@/lib/validations/session";
import { Loader2, Upload, FileText, Image as ImageIcon, PlayCircle, HelpCircle, X } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { toast } from "sonner";

interface ContentBlockEditorProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContentAdded?: () => void;
}

type BlockType = "TEXT" | "IMAGE" | "VIDEO" | "QUIZ";

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: "TEXT", label: "Text", icon: <FileText className="h-6 w-6" />, description: "Rich text content" },
  { type: "IMAGE", label: "Image", icon: <ImageIcon className="h-6 w-6" />, description: "Upload an image" },
  { type: "VIDEO", label: "Video", icon: <PlayCircle className="h-6 w-6" />, description: "YouTube or video URL" },
  { type: "QUIZ", label: "Quiz", icon: <HelpCircle className="h-6 w-6" />, description: "Quiz questions" },
];

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export function ContentBlockEditor({ sessionId, open, onOpenChange, onContentAdded }: ContentBlockEditorProps) {
  const [blockType, setBlockType] = useState<BlockType>("TEXT");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [markdownValue, setMarkdownValue] = useState("");
  const [textContent, setTextContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContentBlockCreateInput>({
    resolver: zodResolver(contentBlockCreateSchema),
    defaultValues: { type: "TEXT", content: "" },
  });

  function selectType(type: BlockType) {
    setBlockType(type);
    setValue("type", type);
    setUploadedFile(null);
    if (type !== "TEXT") {
      setValue("content", "");
    }
  }

  async function handleFileUpload(file: File) {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Upload failed");
        return;
      }
      setValue("content", result.url);
      setUploadedFile(result.url);
      toast.success("File uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (blockType === "IMAGE" && !file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      if (blockType === "VIDEO" && !file.type.startsWith("video/")) {
        toast.error("Please upload a video file");
        return;
      }
      handleFileUpload(file);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }

  async function onSubmit() {
    let content = "";
    if (blockType === "TEXT") {
      content = markdownValue;
    } else if (blockType === "QUIZ") {
      content = textContent;
    } else {
      content = uploadedFile || "";
    }

    if (!content.trim()) {
      toast.error("Please enter content");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: blockType, content }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to add content block");
        setIsLoading(false);
        return;
      }
      toast.success("Content block added");
      resetForm();
      onOpenChange(false);
      onContentAdded?.();
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setBlockType("TEXT");
    setMarkdownValue("");
    setTextContent("");
    setUploadedFile(null);
    setValue("content", "");
    setValue("type", "TEXT");
  }

  const youTubeEmbedUrl = blockType === "VIDEO" && uploadedFile ? getYouTubeEmbedUrl(uploadedFile) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Content Section</DialogTitle>
          <DialogDescription>Choose a type and add content to your session</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BLOCK_TYPES.map(({ type, label, icon, description }) => (
              <button
                key={type}
                type="button"
                onClick={() => selectType(type)}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors ${
                  blockType === type
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }`}
              >
                {icon}
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </button>
            ))}
          </div>

          {blockType === "TEXT" && (
            <div className="space-y-2">
              <Label>Text Content (Markdown)</Label>
              <MDEditor value={markdownValue} onChange={(val) => setMarkdownValue(val || "")} height={200} preview="edit" />
            </div>
          )}

          {blockType === "QUIZ" && (
            <div className="space-y-2">
              <Label>Quiz Questions</Label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter your quiz questions..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[150px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={6}
              />
            </div>
          )}

          {(blockType === "IMAGE" || blockType === "VIDEO") && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{blockType === "IMAGE" ? "Upload Image" : "Upload Video"}</Label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50"
                  }`}
                >
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {isDragging ? "Drop file here" : "Drag & drop or click to upload"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {blockType === "IMAGE" ? "PNG, JPG, GIF, WebP" : "MP4, WebM, MOV"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={blockType === "IMAGE" ? "image/*" : "video/*"}
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
                {uploadedFile && blockType === "IMAGE" && (
                  <div className="relative rounded-lg border">
                    <img src={uploadedFile} alt="Preview" className="max-h-48 w-full rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => { setUploadedFile(null); setValue("content", ""); }}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {uploadedFile && blockType === "VIDEO" && !youTubeEmbedUrl && (
                  <div className="relative rounded-lg border">
                    <video src={uploadedFile} controls className="max-h-48 w-full rounded-lg" />
                    <button
                      type="button"
                      onClick={() => { setUploadedFile(null); setValue("content", ""); }}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Or paste a URL</Label>
                <input
                  type="url"
                  placeholder={blockType === "IMAGE" ? "https://example.com/image.jpg" : "https://www.youtube.com/watch?v=..."}
                  value={uploadedFile && !uploadedFile.startsWith("data:") ? uploadedFile : ""}
                  onChange={(e) => {
                    setValue("content", e.target.value);
                    setUploadedFile(e.target.value);
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {youTubeEmbedUrl && (
                <div className="aspect-video">
                  <iframe
                    src={youTubeEmbedUrl}
                    className="h-full w-full rounded"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
