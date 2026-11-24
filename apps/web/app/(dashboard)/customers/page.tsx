import { CustomerWorkspace } from "@/features/customers/components/customer-workspace";
import { getCustomerSummaries } from "@/features/customers/queries";
import { requireActiveProfile } from "@/lib/auth/profile";
import { canEditOperations } from "@/lib/permissions";

export default async function CustomersPage() {
  const profile = await requireActiveProfile();
  const customers = await getCustomerSummaries();
  return <CustomerWorkspace customers={customers} canEdit={canEditOperations(profile)} />;
}
