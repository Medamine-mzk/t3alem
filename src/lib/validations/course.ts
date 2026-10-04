import { z } from "zod";

export const courseCreateSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters"),
  className: z
    .string()
    .min(1, "Class name is required")
    .max(100, "Class name must be at most 100 characters"),
});

export const courseUpdateSchema = courseCreateSchema.partial();

export const courseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
  className: z.string().optional(),
  teacherId: z.string().optional(),
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
