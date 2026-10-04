"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDateTime } from "@/lib/utils";
import { MessageSquare, Send } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface CommentSectionProps {
  sessionId: string;
  comments: Comment[];
  isAuthenticated: boolean;
}

export function CommentSection({ sessionId, comments, isAuthenticated }: CommentSectionProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState(comments);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setLocalComments([newComment, ...localComments]);
        setContent("");
      }
    } catch {
      console.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b p-4">
        <h3 className="font-semibold">Comments ({localComments.length})</h3>
      </div>

      <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
        {localComments.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8" />
            <p className="mt-2 text-sm">No comments yet</p>
          </div>
        ) : (
          localComments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(comment.user.firstName, comment.user.lastName)}
                </AvatarFallback>
              </Avatar>
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

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="border-t p-4">
          <Textarea
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mb-2 min-h-[80px]"
          />
          <Button type="submit" disabled={isSubmitting || !content.trim()}>
            <Send className="h-4 w-4" />
            Post
          </Button>
        </form>
      ) : (
        <div className="border-t p-4 text-center text-sm text-muted-foreground">
          Sign in to comment
        </div>
      )}
    </div>
  );
}
