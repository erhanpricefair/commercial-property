import { requireAdminPage } from "@/lib/admin-guard";
import { integrationStatus, listIntegrationEvents } from "@/lib/integrations";
import { PageHeader, Panel, formatDateTime } from "@/components/admin/ui";
import { SITE } from "@/lib/site";
import { getSettings } from "@/lib/repositories/deals";
import { saveRevenueSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

/** Configuration overview. Values are never rendered — only whether they're set. */
const ENV_CHECKS: { key: string; label: string; note: string }[] = [
  { key: "NEXT_PUBLIC_SITE_URL", label: "Site URL", note: "Canonical URLs, sitemap and email links" },
  { key: "NEXT_PUBLIC_SITE_NAME", label: "Site name", note: "Shown throughout the public site" },
  { key: "NEXT_PUBLIC_CONTACT_EMAIL", label: "Contact email", note: "Footer and contact page" },
  { key: "DATABASE_PATH", label: "Database path", note: "Defaults to ./data/platform.db" },
  { key: "NEXT_PUBLIC_GA_MEASUREMENT_ID", label: "Google Analytics 4", note: "GA4 measurement ID" },
  { key: "NEXT_PUBLIC_GTM_ID", label: "Google Tag Manager", note: "Container ID" },
  { key: "NEXT_PUBLIC_META_PIXEL_ID", label: "Meta Pixel", note: "Pixel ID" },
  { key: "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION", label: "Search Console", note: "Verification token" },
  { key: "LEAD_WEBHOOK_URL", label: "Lead webhook", note: "Zapier / Make / n8n / custom" },
  { key: "LEAD_WEBHOOK_SECRET", label: "Webhook signing secret", note: "HMAC-SHA256 of the body" },
  { key: "HUBSPOT_ACCESS_TOKEN", label: "HubSpot", note: "Private app token" },
  { key: "GOOGLE_SHEETS_WEBHOOK", label: "Google Sheets", note: "Apps Script web app URL" },
  { key: "SLACK_WEBHOOK_URL", label: "Slack alerts", note: "Notified on HOT leads" },
];

export default async function SettingsPage() {
  await requireAdminPage();
  const settings = getSettings();
  const integrations = integrationStatus();
  const events = listIntegrationEvents(20);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configuration status and outbound integration activity. Secret values are never displayed."
      />

      <div className="mb-6">
        <Panel title="Revenue target">
          <form action={saveRevenueSettingsAction} className="grid gap-4 px-5 py-4 sm:grid-cols-4">
            <div>
              <label htmlFor="revenue_target" className="mb-1.5 block text-xs font-semibold text-ink-600">
                Target (AUD commission)
              </label>
              <input
                id="revenue_target"
                name="revenue_target"
                type="number"
                min={0}
                step={1000}
                defaultValue={settings.revenue_target}
                className="field-input !py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="commission_rate" className="mb-1.5 block text-xs font-semibold text-ink-600">
                Commission rate (%)
              </label>
              <input
                id="commission_rate"
                name="commission_rate"
                type="number"
                min={0}
                max={20}
                step={0.1}
                defaultValue={settings.commission_rate}
                className="field-input !py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="target_date" className="mb-1.5 block text-xs font-semibold text-ink-600">
                Target date
              </label>
              <input
                id="target_date"
                name="target_date"
                type="date"
                defaultValue={settings.target_date}
                className="field-input !py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="assumed_conversion_rate" className="mb-1.5 block text-xs font-semibold text-ink-600">
                Assumed conversion
              </label>
              <input
                id="assumed_conversion_rate"
                name="assumed_conversion_rate"
                type="number"
                min={0.001}
                max={1}
                step={0.005}
                defaultValue={settings.assumed_conversion_rate}
                className="field-input !py-2.5 text-sm"
              />
              <p className="mt-1 text-xs text-ink-400">Registrations to closed deals</p>
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className="btn-primary !min-h-[2.5rem] px-5 text-sm">
                Save
              </button>
              <p className="mt-2 text-xs text-ink-400">
                The assumed conversion rate is only used until real deals exist — after that the
                dashboard uses your observed rate.
              </p>
            </div>
          </form>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Configuration">
          <ul className="divide-y divide-ink-50">
            {ENV_CHECKS.map((check) => {
              const configured = Boolean(process.env[check.key]);
              return (
                <li key={check.key} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-800">{check.label}</p>
                    <p className="truncate text-xs text-ink-400">
                      <code>{check.key}</code> — {check.note}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium ${
                      configured
                        ? "border-signal-positive/30 bg-signal-positive/10 text-signal-positive"
                        : "border-ink-200 bg-canvas-sunken text-ink-400"
                    }`}
                  >
                    {configured ? "Set" : "Not set"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel title="CRM destinations">
            <ul className="divide-y divide-ink-50">
              {integrations.map((destination) => (
                <li key={destination.name} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm capitalize text-ink-800">
                    {destination.name.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium ${
                      destination.configured
                        ? "border-signal-positive/30 bg-signal-positive/10 text-signal-positive"
                        : "border-ink-200 bg-canvas-sunken text-ink-400"
                    }`}
                  >
                    {destination.configured ? "Active" : "Inactive"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-ink-100 px-5 py-3 text-xs leading-relaxed text-ink-500">
              Destinations activate automatically when their environment variable is set. Leads are
              always written to this database first, so a CRM outage never loses a registration.
            </p>
          </Panel>

          <Panel title="Recent integration events" empty={events.length === 0}>
            {events.length === 0 ? (
              "No outbound events yet."
            ) : (
              <ul className="divide-y divide-ink-50">
                {events.map((event) => (
                  <li key={event.id} className="px-5 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-ink-800">{event.event_type}</p>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[0.6875rem] ${
                          event.status === "delivered"
                            ? "border-signal-positive/30 text-signal-positive"
                            : event.status === "failed"
                              ? "border-signal-hot/30 text-signal-hot"
                              : "border-ink-200 text-ink-500"
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-400">
                      {event.destination ?? "—"} · {formatDateTime(event.created_at)}
                      {event.last_error ? ` · ${event.last_error}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Privacy posture">
            <ul className="space-y-2.5 px-5 py-4 text-xs leading-relaxed text-ink-600">
              <li>Public pages read no data from the opportunity table.</li>
              <li>Admin routes require a database-validated session on every request.</li>
              <li>Presentation links use 32 bytes of randomness and are revocable.</li>
              <li>
                Private surfaces send <code>X-Robots-Tag: noindex</code> and are excluded from{" "}
                <code>sitemap.xml</code> and <code>robots.txt</code>.
              </li>
              <li>
                Run <code>npm run audit:privacy</code> before each deploy to verify the built output.
              </li>
            </ul>
          </Panel>
        </div>
      </div>

      <p className="mt-6 text-xs text-ink-400">
        Public site: <a href={SITE.url} className="underline">{SITE.url}</a>
      </p>
    </>
  );
}
