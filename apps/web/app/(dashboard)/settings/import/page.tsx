import { redirect } from "next/navigation";
import { ImportWorkspace } from "@/features/imports/components/import-workspace";
import { getImportBatch, getImportBatches, getImportRows } from "@/features/imports/queries";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canManageImports } from "@/lib/permissions";

export const runtime = "nodejs";

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ batch?: string }> }) {
  const profile = await requireActiveProfile();
  if (!canManageImports(profile)) redirect("/settings?error=permission");

  const params = await searchParams;
  const batches = await getImportBatches();
  const batchId = params.batch ?? batches[0]?.id ?? null;
  const [batch, rows] = batchId ? await Promise.all([getImportBatch(batchId), getImportRows(batchId)]) : [null, []];
  return <ImportWorkspace batches={batches} batch={batch} rows={rows} />;
}
