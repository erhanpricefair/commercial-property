import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin-guard";
import { getInvestor } from "@/lib/repositories/investors";
import { getMatchesForInvestor } from "@/lib/repositories/opportunities";
import { listActivity, listNotes, listCommunications } from "@/lib/repositories/activity";
import { listEmailTemplates } from "@/lib/email";
import { scoreLead, type ScoringInput } from "@/lib/scoring";
import {
  ClassificationBadge,
  PageHeader,
  Panel,
  PrivateBadge,
  StatusBadge,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "@/components/admin/ui";
import {
  AVAILABILITY_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  labelFor,
} from "@/lib/taxonomy";
import {
  addNoteAction,
  createPresentationAction,
  deleteNoteAction,
  logContactAction,
  queueTemplateAction,
  recomputeMatchesAction,
  setFollowUpAction,
  setStatusAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function InvestorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const investorId = Number(id);
  const investor = getInvestor(investorId);
  if (!investor) notFound();

  const prefs = investor.preferences;
  const matches = getMatchesForInvestor(investorId);
  const notes = listNotes(investorId);
  const activity = listActivity(investorId, 40);
  const communications = listCommunications(investorId);
  const templates = listEmailTemplates();

  const breakdown = prefs
    ? scoreLead({
        propertyType: prefs.property_type as ScoringInput["propertyType"],
        budget: prefs.budget as ScoringInput["budget"],
        locationScope: prefs.location_scope as ScoringInput["locationScope"],
        locationFree: prefs.location_free,
        priorities: prefs.priorities as ScoringInput["priorities"],
        financeStatus: prefs.finance_status as ScoringInput["financeStatus"],
        timeframe: prefs.timeframe as ScoringInput["timeframe"],
      })
    : null;

  return (
    <>
      <div className="mb-4">
        <Link href="/admin/investors" className="text-xs font-medium text-ink-500 hover:text-ink-900">
          ← All investors
        </Link>
      </div>

      <PageHeader
        title={`${investor.first_name} ${investor.last_name}`.trim() || investor.email}
        description={`Registered ${formatDateTime(investor.created_at)} · source: ${investor.source ?? "website"}`}
        action={
          <div className="flex items-center gap-2">
            <ClassificationBadge value={investor.classification} />
            <StatusBadge value={investor.status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {/* Criteria */}
          <Panel title="Investment criteria">
            <dl className="grid grid-cols-2 gap-px bg-ink-50 sm:grid-cols-3">
              <Field label="Property type" value={labelFor("propertyType", prefs?.property_type)} />
              <Field label="Budget" value={labelFor("budget", prefs?.budget)} />
              <Field label="Location" value={labelFor("location", prefs?.location_scope)} />
              <Field label="Suburb / area" value={prefs?.location_free || "—"} />
              <Field label="Finance status" value={labelFor("finance", prefs?.finance_status)} />
              <Field label="Timeframe" value={labelFor("timeframe", prefs?.timeframe)} />
            </dl>
            <div className="border-t border-ink-100 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                What matters most
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {(prefs?.priorities ?? []).length === 0 && (
                  <span className="text-sm text-ink-400">Not provided</span>
                )}
                {(prefs?.priorities ?? []).map((priority) => (
                  <span
                    key={priority}
                    className="rounded-full border border-ink-200 bg-canvas-sunken px-2.5 py-1 text-xs text-ink-700"
                  >
                    {labelFor("priority", priority)}
                  </span>
                ))}
              </div>
            </div>
            {investor.notes_from_lead && (
              <div className="border-t border-ink-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Message from investor
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                  {investor.notes_from_lead}
                </p>
              </div>
            )}
          </Panel>

          {/* Matches — PRIVATE */}
          <Panel
            title={`Potential Matches: ${matches.length}`}
            empty={matches.length === 0}
            action={
              <form action={recomputeMatchesAction}>
                <input type="hidden" name="investorId" value={investorId} />
                <button type="submit" className="text-xs font-semibold text-ink-600 hover:text-ink-900">
                  Recompute
                </button>
              </form>
            }
          >
            {matches.length === 0 ? (
              "No opportunities currently match these criteria."
            ) : (
              <ul className="divide-y divide-ink-50">
                {matches.map((match) => (
                  <li key={match.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/opportunities/${match.id}`}
                            className="text-sm font-semibold text-ink-900 hover:underline"
                          >
                            {match.reference}
                          </Link>
                          <PrivateBadge />
                          <span className="text-xs text-ink-400">
                            {AVAILABILITY_LABELS[match.availability as keyof typeof AVAILABILITY_LABELS] ??
                              match.availability}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-ink-600">
                          {labelFor("propertyType", match.property_type)}
                          {match.suburb ? ` · ${match.suburb}` : ""}
                          {match.state ? `, ${match.state}` : ""}
                          {match.size_sqm ? ` · ${match.size_sqm} sqm` : ""}
                        </p>
                        <p className="mt-1 text-xs text-ink-600">
                          {formatCurrency(match.price)}
                          {match.estimated_rental
                            ? ` · rental ${formatCurrency(match.estimated_rental)} pa`
                            : ""}
                          {match.estimated_yield ? ` · ${match.estimated_yield}% est. yield` : ""}
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {match.reasons.map((reason) => (
                            <li
                              key={reason}
                              className="rounded bg-canvas-sunken px-2 py-0.5 text-[0.6875rem] text-ink-500"
                            >
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-display-sm text-brass-600">
                          {match.match_score}
                        </p>
                        <p className="text-[0.6875rem] text-ink-400">match score</p>
                      </div>
                    </div>

                    {/* Issue a private, tokenised presentation link */}
                    <details className="mt-3 rounded-lg border border-ink-100 bg-canvas-sunken">
                      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-ink-700">
                        Send this privately
                      </summary>
                      <form action={createPresentationAction} className="space-y-3 px-3 pb-3">
                        <input type="hidden" name="investorId" value={investorId} />
                        <input type="hidden" name="opportunityId" value={match.id} />
                        <div>
                          <label className="mb-1 block text-xs font-medium text-ink-600">
                            Intro note (optional)
                          </label>
                          <textarea
                            name="introNote"
                            rows={2}
                            className="field-input !py-2 text-sm"
                            placeholder="A sentence for the investor at the top of the page."
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
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
                        </div>
                        <button type="submit" className="btn-primary !min-h-[2.25rem] px-4 text-xs">
                          Create private link
                        </button>
                      </form>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Notes */}
          <Panel title="Notes">
            <form action={addNoteAction} className="border-b border-ink-100 px-5 py-4">
              <input type="hidden" name="investorId" value={investorId} />
              <label htmlFor="note-body" className="sr-only">Add a note</label>
              <textarea
                id="note-body"
                name="body"
                rows={3}
                required
                className="field-input !py-2.5 text-sm"
                placeholder="Record what was discussed, what they're really after, any constraints."
              />
              <button type="submit" className="btn-primary mt-3 !min-h-[2.25rem] px-4 text-xs">
                Add note
              </button>
            </form>
            {notes.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-400">No notes yet.</p>
            ) : (
              <ul className="divide-y divide-ink-50">
                {notes.map((note) => (
                  <li key={note.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                        {note.body}
                      </p>
                      <form action={deleteNoteAction}>
                        <input type="hidden" name="noteId" value={note.id} />
                        <input type="hidden" name="investorId" value={investorId} />
                        <button type="submit" className="text-xs text-ink-400 hover:text-signal-hot">
                          Delete
                        </button>
                      </form>
                    </div>
                    <p className="mt-2 text-xs text-ink-400">
                      {note.author_name ?? "System"} · {formatDateTime(note.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Communications */}
          <Panel title="Communications" empty={communications.length === 0}>
            {communications.length === 0 ? (
              "Nothing queued or logged yet."
            ) : (
              <ul className="divide-y divide-ink-50">
                {communications.map((comm) => (
                  <li key={comm.id} className="px-5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-ink-800">{comm.subject ?? comm.channel}</p>
                      <span className="rounded border border-ink-200 px-2 py-0.5 text-[0.6875rem] text-ink-500">
                        {comm.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-400">
                      {comm.channel} ·{" "}
                      {comm.sent_at
                        ? `sent ${formatDateTime(comm.sent_at)}`
                        : comm.scheduled_for
                          ? `scheduled ${formatDateTime(comm.scheduled_for)}`
                          : formatDateTime(comm.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Activity */}
          <Panel title="Activity" empty={activity.length === 0}>
            {activity.length === 0 ? (
              "No activity recorded."
            ) : (
              <ul className="divide-y divide-ink-50">
                {activity.map((event) => (
                  <li key={event.id} className="px-5 py-2.5">
                    <p className="text-sm text-ink-700">{event.detail ?? event.event_type}</p>
                    <p className="text-xs text-ink-400">
                      {event.event_type} · {formatDateTime(event.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Panel title="Contact">
            <dl className="divide-y divide-ink-50">
              <SideField label="Email" value={investor.email} href={`mailto:${investor.email}`} />
              <SideField
                label="Mobile"
                value={investor.mobile || "—"}
                href={investor.mobile ? `tel:${investor.mobile.replace(/\s+/g, "")}` : undefined}
              />
              <SideField label="Prefers" value={labelFor("contactMethod", investor.contact_method)} />
              <SideField label="Marketing consent" value={investor.consent_marketing ? "Yes" : "No"} />
              <SideField label="Landing page" value={investor.landing_page || "—"} />
              <SideField label="Last contact" value={formatDateTime(investor.last_contact_at)} />
            </dl>
          </Panel>

          <Panel title="Lead score (internal)">
            <div className="px-5 py-4">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-display-md text-ink-900">
                  {investor.lead_score}
                </span>
                <span className="text-sm text-ink-400">/ 100</span>
                <span className="ml-auto">
                  <ClassificationBadge value={investor.classification} />
                </span>
              </div>
              {breakdown && (
                <ul className="mt-4 space-y-2.5">
                  {breakdown.components.map((component) => (
                    <li key={component.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-600">{component.label}</span>
                        <span className="tabular-nums text-ink-500">
                          {component.points}/{component.max}
                        </span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className="h-full rounded-full bg-brass-500"
                          style={{ width: `${(component.points / component.max) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-ink-400">
                Never shown publicly or sent to the investor.
              </p>
            </div>
          </Panel>

          <Panel title="Pipeline">
            <form action={setStatusAction} className="space-y-3 px-5 py-4">
              <input type="hidden" name="investorId" value={investorId} />
              <label htmlFor="status" className="block text-xs font-semibold text-ink-600">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={investor.status}
                className="field-input !py-2.5 text-sm"
              >
                {LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {LEAD_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary w-full !min-h-[2.5rem] text-sm">
                Update status
              </button>
            </form>

            <form action={setFollowUpAction} className="space-y-3 border-t border-ink-100 px-5 py-4">
              <input type="hidden" name="investorId" value={investorId} />
              <label htmlFor="nextFollowUp" className="block text-xs font-semibold text-ink-600">
                Next follow-up
              </label>
              <input
                id="nextFollowUp"
                name="nextFollowUp"
                type="date"
                defaultValue={investor.next_followup_at?.slice(0, 10) ?? ""}
                className="field-input !py-2 text-sm"
              />
              <button type="submit" className="btn-secondary w-full !min-h-[2.5rem] text-sm">
                Save follow-up
              </button>
            </form>

            <form action={logContactAction} className="space-y-3 border-t border-ink-100 px-5 py-4">
              <input type="hidden" name="investorId" value={investorId} />
              <label htmlFor="channel" className="block text-xs font-semibold text-ink-600">
                Log a contact
              </label>
              <select id="channel" name="channel" className="field-input !py-2.5 text-sm">
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="other">Other</option>
              </select>
              <textarea
                name="summary"
                rows={2}
                className="field-input !py-2 text-sm"
                placeholder="Brief summary"
              />
              <button type="submit" className="btn-secondary w-full !min-h-[2.5rem] text-sm">
                Log contact
              </button>
            </form>
          </Panel>

          <Panel title="Send an email">
            <form action={queueTemplateAction} className="space-y-3 px-5 py-4">
              <input type="hidden" name="investorId" value={investorId} />
              <label htmlFor="templateKey" className="block text-xs font-semibold text-ink-600">
                Template
              </label>
              <select id="templateKey" name="templateKey" className="field-input !py-2.5 text-sm">
                {templates.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-secondary w-full !min-h-[2.5rem] text-sm">
                Queue email
              </button>
              <p className="text-xs text-ink-400">
                Queued messages are dispatched by the configured provider.
              </p>
            </form>
          </Panel>
        </aside>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-canvas-raised px-5 py-3.5">
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink-800">{value}</dd>
    </div>
  );
}

function SideField({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-5 py-2.5">
      <dt className="shrink-0 text-xs font-medium text-ink-500">{label}</dt>
      <dd className="truncate text-right text-sm text-ink-800">
        {href ? (
          <a href={href} className="hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
