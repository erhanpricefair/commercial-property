import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-guard";
import { getDb } from "@/lib/db";
import { getMatchesForInvestor } from "@/lib/repositories/opportunities";
import { getSetting } from "@/lib/repositories/deals";
import { commissionFor, settlementSpeed } from "@/lib/revenue";
import {
  ClassificationBadge,
  PageHeader,
  StatusBadge,
  formatCurrency,
  formatDate,
} from "@/components/admin/ui";
import { labelFor } from "@/lib/taxonomy";
import { logCallOutcomeAction } from "./actions";

export const dynamic = "force-dynamic";

/**
 * The call list.
 *
 * Built for a phone, because that is where this work actually happens —
 * between inspections, in a car park, with one hand. Everything needed to make
 * the call is on the card: who they are, what they want, what we could show
 * them, what it's worth, and a dial button.
 */
type CallRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  contact_method: string;
  classification: string;
  lead_score: number;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  next_followup_at: string | null;
  notes_from_lead: string | null;
  property_type: string | null;
  budget: string | null;
  location_scope: string | null;
  location_free: string | null;
  finance_status: string | null;
  timeframe: string | null;
  match_count: number;
};

const SELECT = `
  SELECT i.id, i.first_name, i.last_name, i.email, i.mobile, i.contact_method,
         i.classification, i.lead_score, i.status, i.created_at, i.last_contact_at,
         i.next_followup_at, i.notes_from_lead,
         p.property_type, p.budget, p.location_scope, p.location_free,
         p.finance_status, p.timeframe,
         (SELECT COUNT(*) FROM opportunity_matches m WHERE m.investor_id = i.id) AS match_count
    FROM investors i
    LEFT JOIN investor_preferences p ON p.id = (
      SELECT id FROM investor_preferences WHERE investor_id = i.id ORDER BY id DESC LIMIT 1
    )
   WHERE i.status NOT IN ('converted','not_suitable')`;

export default async function TodayPage() {
  await requireAdminPage();
  const db = getDb();
  const commissionRate = Number(getSetting("commission_rate")) || 4;

  // Never contacted and hot — the most valuable calls available right now.
  const uncontacted = db
    .prepare(`${SELECT} AND i.last_contact_at IS NULL ORDER BY i.lead_score DESC, i.created_at DESC LIMIT 25`)
    .all() as CallRow[];

  // Follow-ups that have come due.
  const due = db
    .prepare(
      `${SELECT} AND i.last_contact_at IS NOT NULL
         AND i.next_followup_at IS NOT NULL AND i.next_followup_at <= datetime('now')
       ORDER BY i.next_followup_at ASC LIMIT 25`,
    )
    .all() as CallRow[];

  return (
    <>
      <PageHeader
        title="Call list"
        description="Work top to bottom. Uncontacted leads first — the ones most likely to still be thinking about it."
      />

      <CallSection
        title="Never contacted"
        subtitle="Highest scoring first"
        rows={uncontacted}
        commissionRate={commissionRate}
        emptyText="Everyone has been contacted at least once."
      />

      <div className="mt-8">
        <CallSection
          title="Follow-up due"
          subtitle="Past their scheduled date"
          rows={due}
          commissionRate={commissionRate}
          emptyText="Nothing is overdue."
        />
      </div>
    </>
  );
}

async function CallSection({
  title,
  subtitle,
  rows,
  commissionRate,
  emptyText,
}: {
  title: string;
  subtitle: string;
  rows: CallRow[];
  commissionRate: number;
  emptyText: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-ink-900">
          {title} <span className="text-ink-400">({rows.length})</span>
        </h2>
        <span className="text-xs text-ink-400">{subtitle}</span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-ink-100 bg-canvas-raised px-5 py-8 text-center text-sm text-ink-400">
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <CallCard key={row.id} row={row} commissionRate={commissionRate} />
          ))}
        </ul>
      )}
    </section>
  );
}

async function CallCard({ row, commissionRate }: { row: CallRow; commissionRate: number }) {
  // The pre-call brief: what we could actually put in front of them, and what
  // it would be worth. Knowing this before dialling changes the conversation.
  const matches = getMatchesForInvestor(row.id).slice(0, 3);
  const bestValue = matches.reduce((max, m) => Math.max(max, m.price ?? 0), 0);
  const potentialCommission = commissionFor(bestValue, commissionRate);
  const tel = row.mobile.replace(/[^\d+]/g, "");

  const smsBody = encodeURIComponent(
    `Hi ${row.first_name}, it's regarding the commercial property criteria you registered with us. When suits for a quick call?`,
  );

  return (
    <li className="overflow-hidden rounded-xl border border-ink-100 bg-canvas-raised">
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/investors/${row.id}`}
                className="text-base font-semibold text-ink-900 hover:underline"
              >
                {row.first_name} {row.last_name}
              </Link>
              <ClassificationBadge value={row.classification} />
              <StatusBadge value={row.status} />
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Registered {formatDate(row.created_at)}
              {row.last_contact_at ? ` · last contact ${formatDate(row.last_contact_at)}` : " · never contacted"}
              {row.next_followup_at ? ` · due ${formatDate(row.next_followup_at)}` : ""}
            </p>
          </div>
          {potentialCommission ? (
            <div className="text-right">
              <p className="font-display text-display-sm text-brass-600">
                {formatCurrency(potentialCommission)}
              </p>
              <p className="text-[0.6875rem] text-ink-400">potential commission</p>
            </div>
          ) : null}
        </div>

        {/* Brief */}
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
          <Brief label="Wants" value={labelFor("propertyType", row.property_type)} />
          <Brief label="Budget" value={labelFor("budget", row.budget)} />
          <Brief
            label="Where"
            value={row.location_free || labelFor("location", row.location_scope)}
          />
          <Brief label="Finance" value={labelFor("finance", row.finance_status)} />
        </dl>

        <p className="mt-2 text-xs text-ink-500">
          <span className="font-medium text-ink-700">{labelFor("timeframe", row.timeframe)}</span>
          {" · "}
          prefers {labelFor("contactMethod", row.contact_method)}
          {" · "}
          {row.match_count} match{row.match_count === 1 ? "" : "es"}
        </p>

        {row.notes_from_lead && (
          <p className="mt-2 rounded-lg bg-canvas-sunken px-3 py-2 text-xs italic leading-relaxed text-ink-600">
            &ldquo;{row.notes_from_lead}&rdquo;
          </p>
        )}

        {matches.length > 0 && (
          <div className="mt-3">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-500">
              Could show them
            </p>
            <ul className="mt-1.5 space-y-1">
              {matches.map((match) => {
                const speed = settlementSpeed(match.completion_status);
                return (
                  <li key={match.id} className="text-xs text-ink-600">
                    <span className="font-medium text-ink-800">{match.reference}</span>
                    {" · "}
                    {match.suburb ?? "—"}
                    {" · "}
                    {formatCurrency(match.price)}
                    {speed && (
                      <span
                        className={`ml-1.5 ${speed.tone === "fast" ? "text-signal-positive" : "text-ink-400"}`}
                      >
                        {speed.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Actions — big enough to hit while holding a coffee */}
      <div className="grid grid-cols-2 gap-px border-t border-ink-100 bg-ink-50">
        <a
          href={`tel:${tel}`}
          className="flex min-h-[3rem] items-center justify-center gap-2 bg-ink-900 text-sm font-semibold text-canvas transition hover:bg-ink-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 5c0-.6.4-1 1-1h2.3c.5 0 .9.3 1 .8l.8 3c.1.4 0 .8-.4 1L7.2 10c1 2.1 2.7 3.8 4.8 4.8l1.2-1.5c.2-.3.6-.5 1-.4l3 .8c.5.1.8.5.8 1V17c0 .6-.4 1-1 1h-1C9.6 18 4 12.4 4 5.5V5z"
              fill="currentColor"
            />
          </svg>
          Call {row.first_name}
        </a>
        <a
          href={`sms:${tel}?&body=${smsBody}`}
          className="flex min-h-[3rem] items-center justify-center gap-2 bg-canvas-raised text-sm font-semibold text-ink-800 transition hover:bg-canvas-sunken"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 5h16v11H8l-4 3V5z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          Text
        </a>
      </div>

      {/* One-tap outcome */}
      <div className="flex flex-wrap gap-2 border-t border-ink-100 px-5 py-3">
        {[
          { value: "reached", label: "Spoke" },
          { value: "qualified", label: "Qualified" },
          { value: "no_answer", label: "No answer" },
          { value: "callback", label: "Call back" },
          { value: "nurture", label: "Nurture" },
          { value: "not_suitable", label: "Not suitable" },
        ].map((outcome) => (
          <form key={outcome.value} action={logCallOutcomeAction}>
            <input type="hidden" name="investorId" value={row.id} />
            <input type="hidden" name="outcome" value={outcome.value} />
            <button
              type="submit"
              className="min-h-[2.25rem] rounded-lg border border-ink-200 px-3 text-xs font-medium text-ink-700 transition hover:border-ink-300 hover:bg-canvas-sunken"
            >
              {outcome.label}
            </button>
          </form>
        ))}
      </div>
    </li>
  );
}

function Brief({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.6875rem] uppercase tracking-wider text-ink-400">{label}</dt>
      <dd className="font-medium text-ink-800">{value}</dd>
    </div>
  );
}
