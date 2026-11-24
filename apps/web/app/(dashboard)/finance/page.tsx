import { FinanceWorkspace } from "@/features/finance/components/finance-workspace";
import { getOutstandingPayments } from "@/features/programs/queries";
import { requireActiveProfile } from "@/lib/auth/profile";

export default async function FinancePage(){await requireActiveProfile();const rows=await getOutstandingPayments();return <FinanceWorkspace rows={rows}/>}
