import { z } from "zod";

/**
 * Validation schema for Button component props
 */
export const buttonPropsSchema = z.object({
  href: z.string().min(1, "href is required"),
  children: z.custom<React.ReactNode>(),
  variant: z.enum(["primary", "secondary"]).optional(),
  className: z.string().optional(),
});

/**
 * TypeScript type derived from Button props schema
 */
export type ButtonProps = z.infer<typeof buttonPropsSchema>;

/**
 * Validation schema for EmailCTA component props
 */
export const emailCTAPropsSchema = z.object({
  email: z.string().email("Invalid email address"),
  label: z.string().optional(),
  className: z.string().optional(),
});

/**
 * TypeScript type derived from EmailCTA props schema
 */
export type EmailCTAProps = z.infer<typeof emailCTAPropsSchema>;
