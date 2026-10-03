import { z } from "zod";

// User Interfaces
export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  franchiseId?: string;
  franchiseName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ✅ Login Schema (Zod)
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
