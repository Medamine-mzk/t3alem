import { z } from "zod";

export const commentCreateSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be at most 2000 characters"),
});

export const commentUpdateSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be at most 2000 characters"),
});

export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
export type CommentUpdateInput = z.infer<typeof commentUpdateSchema>;
