import type { ImportBatch, ImportRow } from "@aileaders/domain";
import { createClient } from "@/lib/supabase/server";

export async function getImportBatches(): Promise<ImportBatch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("import_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(`IMPORT_BATCHES_QUERY_FAILED:${error.message}`);
  return (data ?? []) as ImportBatch[];
}

export async function getImportBatch(batchId: string): Promise<ImportBatch | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("import_batches")
    .select("*")
    .eq("id", batchId)
    .maybeSingle();
  if (error) throw new Error(`IMPORT_BATCH_QUERY_FAILED:${error.message}`);
  return data as ImportBatch | null;
}

export async function getImportRows(batchId: string): Promise<ImportRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("import_rows")
    .select("*")
    .eq("batch_id", batchId)
    .order("sheet_name", { ascending: true })
    .order("sheet_row", { ascending: true })
    .limit(2000);
  if (error) throw new Error(`IMPORT_ROWS_QUERY_FAILED:${error.message}`);
  return (data ?? []) as ImportRow[];
}
