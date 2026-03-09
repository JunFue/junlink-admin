// types.ts

import * as z from "zod";

// --- Sign In Schema and Types ---
export const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

// --- Sign Up Schema and Types ---
export const signUpSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  jobTitle: z.string().min(1, { message: "Job title is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  enrollmentId: z.string().optional(),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

// --- Shared Types ---
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Metadata {
  [key: string]: Json | undefined;
}
