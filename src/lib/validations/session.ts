import { z } from "zod";

export const sessionCreateSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters"),
  date: z.coerce.date().optional(),
});

export const sessionUpdateSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters")
    .optional(),
  date: z.coerce.date().optional(),
});

export const contentBlockCreateSchema = z.object({
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "QUIZ"]),
  content: z
    .string()
    .min(1, "Content is required")
    .max(10000, "Content must be at most 10000 characters"),
  position: z.coerce.number().int().min(0).optional(),
});

export const contentBlockUpdateSchema = z.object({
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "QUIZ"]).optional(),
  content: z
    .string()
    .min(1, "Content is required")
    .max(10000, "Content must be at most 10000 characters")
    .optional(),
  position: z.coerce.number().int().min(0).optional(),
});

export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;
export type ContentBlockCreateInput = z.infer<typeof contentBlockCreateSchema>;
export type ContentBlockUpdateInput = z.infer<typeof contentBlockUpdateSchema>;
