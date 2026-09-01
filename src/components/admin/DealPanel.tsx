import { Panel, formatCurrency, formatDate } from "@/components/admin/ui";
import { DEAL_STAGES, DEAL_STAGE_LABELS, STAGE_PROBABILITY, settlementSpeed } from "@/lib/revenue";
import type { DealWithContext } from "@/lib/repositories/deals";
import type { MatchWithOpportunity } from "@/lib/repositories/opportunities";
import { createDealAction, updateDealAction, deleteDealAction } from "@/app/(admin)/admin/investors/actions";

/**
 * Deals attached to one investor.
 *
 * This is where the pipeline stops being a list of names and starts being
 * money. Recording a deal at the moment an opportunity is sent — not at
 * settlement — is what makes the forecast on the dashboard mean anything.
 */
export default function DealPanel({
  investorId,
  deals,
  matches,
  commissionRate,
}: {
  investorId: number;
  deals: DealWithContext[];
  matches: MatchWithOpportunity[];
  commissionRate: number;
}) {
  return (
    <Panel title={`Deals (${deals.length})`}>
      {deals.length > 0 && (
        <ul className="divide-y divide-ink-50">
          {deals.map((deal) => {
            const speed = settlementSpeed(deal.completion_status);
            const probability = STAGE_PROBABILITY[deal.stage as keyof typeof STAGE_PROBABILITY] ?? 0;
            return (
              <li key={deal.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {deal.reference ?? "No opportunity linked"}
                      {deal.suburb ? ` · ${deal.suburb}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {formatCurrency(deal.price)} at {deal.commission_rate}% ={" "}
                      <strong className="font-semibold text-ink-800">
                        {formatCurrency(deal.commission_amount)}
                      </strong>
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-ink-200 bg-canvas-sunken px-2 py-0.5 text-[0.6875rem] font-medium text-ink-600">
                        {DEAL_STAGE_LABELS[deal.stage as keyof typeof DEAL_STAGE_LABELS] ?? deal.stage}
                        {" · "}
                        {Math.round(probability * 100)}%
                      </span>
                      {speed && (
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium ${
                            speed.tone === "fast"
                              ? "border-signal-positive/30 bg-signal-positive/10 text-signal-positive"
                              : speed.tone === "medium"
                                ? "border-brass-200 bg-brass-100 text-brass-600"
                                : "border-ink-200 bg-canvas-sunken text-ink-500"
                          }`}
                        >
                          {speed.label}
                        </span>
                      )}
                      {deal.commission_paid_at && (
                        <span className="rounded-md border border-signal-positive/30 bg-signal-positive/10 px-2 py-0.5 text-[0.6875rem] font-medium text-signal-positive">
                          Paid {formatDate(deal.commission_paid_at)}
                        </span>
                      )}
                    </div>
                    {deal.expected_settlement && (
                      <p className="mt-1.5 text-xs text-ink-400">
                        Expected settlement {formatDate(deal.expected_settlement)}
                      </p>
                    )}
                  </div>

                  <form action={deleteDealAction}>
                    <input type="hidden" name="dealId" value={deal.id} />
                    <input type="hidden" name="investorId" value={investorId} />
                    <button type="submit" className="text-xs text-ink-400 hover:text-signal-hot">
                      Remove
                    </button>
                  </form>
                </div>

                <form action={updateDealAction} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="dealId" value={deal.id} />
                  <input type="hidden" name="investorId" value={investorId} />
                  <select
                    name="stage"
                    defaultValue={deal.stage}
                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs"
                    aria-label="Deal stage"
                  >
                    {DEAL_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {DEAL_STAGE_LABELS[stage]}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-ink-600">
                    <input
                      type="checkbox"
                      name="markPaid"
                      defaultChecked={Boolean(deal.commission_paid_at)}
                      className="h-4 w-4 rounded border-ink-300"
                    />
                    Commission paid
                  </label>
                  <button type="submit" className="btn-secondary !min-h-[2rem] px-3 text-xs">
                    Update
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      <details className="border-t border-ink-100" open={deals.length === 0}>
        <summary className="cursor-pointer px-5 py-3 text-xs font-semibold text-ink-700">
          Record a deal
        </summary>
        <form action={createDealAction} className="space-y-3 px-5 pb-5">
          <input type="hidden" name="investorId" value={investorId} />

          <div>
            <label htmlFor={`opp-${investorId}`} className="mb-1.5 block text-xs font-semibold text-ink-600">
              Opportunity
            </label>
            <select
              id={`opp-${investorId}`}
              name="opportunityId"
              className="field-input !py-2 text-sm"
              defaultValue=""
            >
              <option value="">Not linked</option>
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.reference} · {match.suburb ?? "—"} · {formatCurrency(match.price)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-400">
              Only this investor&rsquo;s matched opportunities are listed.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor={`price-${investorId}`} className="mb-1.5 block text-xs font-semibold text-ink-600">
                Price
              </label>
              <input
                id={`price-${investorId}`}
                name="price"
                type="number"
                min={0}
                step={1000}
                className="field-input !py-2 text-sm"
                placeholder="500000"
              />
            </div>
            <div>
              <label htmlFor={`rate-${investorId}`} className="mb-1.5 block text-xs font-semibold text-ink-600">
                Commission %
              </label>
              <input
                id={`rate-${investorId}`}
                name="commissionRate"
                type="number"
                min={0}
                max={20}
                step={0.1}
                defaultValue={commissionRate}
                className="field-input !py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor={`stage-${investorId}`} className="mb-1.5 block text-xs font-semibold text-ink-600">
                Stage
              </label>
              <select
                id={`stage-${investorId}`}
                name="stage"
                defaultValue="opportunity_sent"
                className="field-input !py-2 text-sm"
              >
                {DEAL_STAGES.filter((s) => s !== "lost").map((stage) => (
                  <option key={stage} value={stage}>
                    {DEAL_STAGE_LABELS[stage]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor={`settle-${investorId}`} className="mb-1.5 block text-xs font-semibold text-ink-600">
              Expected settlement
            </label>
            <input
              id={`settle-${investorId}`}
              name="expectedSettlement"
              type="date"
              className="field-input !py-2 text-sm"
            />
          </div>

          <button type="submit" className="btn-primary !min-h-[2.5rem] px-5 text-sm">
            Record deal
          </button>
        </form>
      </details>
    </Panel>
  );
}
