"use client";

import { FileText, Image as ImageIcon, PlayCircle, HelpCircle, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { toast } from "sonner";

interface ContentBlockRendererProps {
  block: any;
  theme?: string;
}

function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?.*)?$/i.test(url);
}

function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ContentBlockRenderer({ block, theme }: ContentBlockRendererProps) {
  const [copied, setCopied] = useState(false);

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("URL copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }

  // TEXT type
  if (block.type === "TEXT") {
    return (
      <div className="prose prose-sm max-w-none" data-color-mode={theme}>
        <MDEditor.Markdown source={block.content} />
      </div>
    );
  }

  // QUIZ type — always a clickable button (URL)
  if (block.type === "QUIZ") {
    const url = block.content;
    return (
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <HelpCircle className="h-4 w-4" />
          Take Quiz
        </a>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => copyUrl(url)}
          className="h-8 w-8"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        <span className="text-xs text-muted-foreground">{getDomain(url)}</span>
      </div>
    );
  }

  // IMAGE type or image URL auto-detect
  if (block.type === "IMAGE" || (isUrl(block.content) && isImageUrl(block.content))) {
    return (
      <div className="space-y-2">
        <img src={block.content} alt="Content" className="max-w-full rounded-lg" />
        {isUrl(block.content) && (
          <div className="flex items-center gap-2">
            <a
              href={block.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {getDomain(block.content)}
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyUrl(block.content)}
              className="h-6 w-6"
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // VIDEO type
  if (block.type === "VIDEO") {
    const embedUrl = getYouTubeEmbedUrl(block.content);
    if (embedUrl) {
      return (
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            className="h-full w-full rounded"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    return <video src={block.content} controls className="max-w-full rounded" />;
  }

  // PDF URL auto-detect
  if (isUrl(block.content) && isPdfUrl(block.content)) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={block.content}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
        >
          <FileText className="h-4 w-4" />
          View PDF
        </a>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => copyUrl(block.content)}
          className="h-8 w-8"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        <span className="text-xs text-muted-foreground">{getDomain(block.content)}</span>
      </div>
    );
  }

  // Generic URL auto-detect
  if (isUrl(block.content)) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={block.content}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          <ExternalLink className="h-4 w-4" />
          Open Link
        </a>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => copyUrl(block.content)}
          className="h-8 w-8"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        <span className="text-xs text-muted-foreground">{getDomain(block.content)}</span>
      </div>
    );
  }

  // Fallback: plain text
  return <p className="text-sm whitespace-pre-wrap">{block.content}</p>;
}
