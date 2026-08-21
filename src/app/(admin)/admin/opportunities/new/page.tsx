import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-guard";
import OpportunityForm from "@/components/admin/OpportunityForm";
import { PageHeader } from "@/components/admin/ui";
import { createOpportunityAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewOpportunityPage() {
  await requireAdminPage();

  return (
    <>
      <div className="mb-4">
        <Link href="/admin/opportunities" className="text-xs font-medium text-ink-500 hover:text-ink-900">
          ← All opportunities
        </Link>
      </div>
      <PageHeader
        title="Add opportunity"
        description="Private / internal record. Nothing entered here is published."
      />
      <OpportunityForm action={createOpportunityAction} submitLabel="Create opportunity" />
    </>
  );
}
