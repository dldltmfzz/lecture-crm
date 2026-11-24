import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@aileaders/domain";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("auth_user_id", user.id).single();
  return data as Profile | null;
}

export async function requireActiveProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_status === "PENDING") redirect("/pending");
  if (profile.account_status !== "ACTIVE") redirect("/login?error=suspended");
  return profile;
}
