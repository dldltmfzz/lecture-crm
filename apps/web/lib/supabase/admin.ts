import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

export function createAdminClient() {
  const env = serverEnv();
  if (!env.SUPABASE_SERVER_SECRET_KEY) throw new Error("SUPABASE_SERVER_SECRET_KEY_REQUIRED");
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVER_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
