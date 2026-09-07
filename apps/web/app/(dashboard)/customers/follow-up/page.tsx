import { FollowUpWorkspace } from "@/features/customers/components/follow-up-workspace";
import { getFollowUps } from "@/features/customers/queries";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canEditOperations } from "@/lib/permissions";

export default async function FollowUpPage() {
  const profile = await requireActiveProfile();
  const rows = await getFollowUps();
  return <FollowUpWorkspace rows={rows} canEdit={canEditOperations(profile)} />;
}
