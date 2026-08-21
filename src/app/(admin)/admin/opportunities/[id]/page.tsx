import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin-guard";
import { getDb } from "@/lib/db";
import { getOpportunity } from "@/lib/repositories/opportunities";
import OpportunityForm from "@/components/admin/OpportunityForm";
import { PageHeader, PrivateBadge, formatDateTime } from "@/components/admin/ui";
import { labelFor } from "@/lib/taxonomy";
import { deleteOpportunityAction, updateOpportunityAction } from "../actions";
import { createPresentationAction } from "../../investors/actions";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const opportunity = getOpportunity(Number(id));
  if (!opportunity) notFound();

  // Which investors this opportunity matches, so the owner can act from either side.
  const matchedInvestors = getDb()
    .prepare(
      `SELECT i.id, i.first_name, i.last_name, i.email, i.classification, i.status, m.match_score
         FROM opportunity_matches m
         JOIN investors i ON i.id = m.investor_id
        WHERE m.opportunity_id = ?
        ORDER BY m.match_score DESC, i.lead_score DESC
        LIMIT 25`,
    )
    .all(opportunity.id) as {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    classification: string;
    status: string;
    match_score: number;
  }[];

  return (
    <>
      <div className="mb-4">
        <Link href="/admin/opportunities" className="text-xs font-medium text-ink-500 hover:text-ink-900">
          ← All opportunities
        </Link>
      </div>

      <PageHeader
        title={opportunity.reference}
        description={`${labelFor("propertyType", opportunity.property_type)} · updated ${formatDateTime(opportunity.updated_at)}`}
        action={<PrivateBadge />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div>
          <OpportunityForm
            opportunity={opportunity}
            action={updateOpportunityAction}
            submitLabel="Save changes"
          />

          <form action={deleteOpportunityAction} className="mt-8 rounded-xl border border-signal-hot/20 bg-signal-hot/5 p-5">
            <input type="hidden" name="id" value={opportunity.id} />
            <p className="text-sm font-semibold text-signal-hot">Delete this opportunity</p>
            <p className="mt-1 text-xs text-ink-500">
              Removes the record and every match and presentation link attached to it. This cannot be
              undone.
            </p>
            <button type="submit" className="btn mt-4 !min-h-[2.5rem] border border-signal-hot/30 px-4 text-sm text-signal-hot hover:bg-signal-hot/10">
              Delete opportunity
            </button>
          </form>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-ink-100 bg-canvas-raised">
            <header className="border-b border-ink-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-ink-900">
                Matching investors ({matchedInvestors.length})
              </h2>
            </header>
            {matchedInvestors.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-400">
                No investors currently match this opportunity.
              </p>
            ) : (
              <ul className="divide-y divide-ink-50">
                {matchedInvestors.map((investor) => (
                  <li key={investor.id} className="px-5 py-3">
                    <Link
                      href={`/admin/investors/${investor.id}`}
                      className="text-sm font-medium text-ink-900 hover:underline"
                    >
                      {investor.first_name} {investor.last_name}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {investor.classification} · match {investor.match_score}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-ink-100 bg-canvas-raised">
            <header className="border-b border-ink-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-ink-900">Create a private link</h2>
            </header>
            <form action={createPresentationAction} className="space-y-3 px-5 py-4">
              <input type="hidden" name="opportunityId" value={opportunity.id} />
              <div>
                <label htmlFor="pres-investor" className="mb-1.5 block text-xs font-semibold text-ink-600">
                  Investor ID (optional)
                </label>
                <input
                  id="pres-investor"
                  name="investorId"
                  type="number"
                  className="field-input !py-2 text-sm"
                  placeholder="Leave blank for an unattributed link"
                />
              </div>
              <div>
                <label htmlFor="pres-note" className="mb-1.5 block text-xs font-semibold text-ink-600">
                  Intro note
                </label>
                <textarea id="pres-note" name="introNote" rows={2} className="field-input !py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-xs text-ink-700">
                <input type="checkbox" name="discloseIdentity" className="h-4 w-4 rounded border-ink-300" />
                Disclose address / development / developer
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-700">
                Expires in
                <input
                  type="number"
                  name="expiresInDays"
                  min={1}
                  max={365}
                  defaultValue={30}
                  className="w-16 rounded border border-ink-200 px-2 py-1 text-xs"
                />
                days
              </label>
              <button type="submit" className="btn-primary w-full !min-h-[2.5rem] text-sm">
                Create private link
              </button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
