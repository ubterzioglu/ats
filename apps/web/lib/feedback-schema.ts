import { z } from "zod";

export const FEEDBACK_CATEGORIES = ["bug", "idea", "praise", "other"] as const;
export const FEEDBACK_STATUSES = ["new", "read", "archived"] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const feedbackSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES),
  message: z.string().trim().min(10).max(2000),
  email: z
    .string()
    .trim()
    .max(254)
    .optional()
    .transform((value) => (value ? value.toLowerCase() : null))
    .pipe(z.string().email().nullable()),
  locale: z.enum(["en", "tr", "de"]).optional()
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
