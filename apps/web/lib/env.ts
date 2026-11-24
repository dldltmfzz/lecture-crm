import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLIC_KEY: z.string().min(1),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVER_SECRET_KEY: z.string().min(1).optional(),
  APP_URL: z.string().url().optional(),
  AI_API_KEY: z.string().min(1).optional(),
  AI_CLASSIFIER_MODEL: z.string().min(1).optional(),
});

export function publicEnv() {
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLIC_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY,
  });
}

export function serverEnv() {
  return serverSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLIC_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY,
    SUPABASE_SERVER_SECRET_KEY: process.env.SUPABASE_SERVER_SECRET_KEY,
    APP_URL: process.env.APP_URL,
    AI_API_KEY: process.env.AI_API_KEY,
    AI_CLASSIFIER_MODEL: process.env.AI_CLASSIFIER_MODEL,
  });
}
