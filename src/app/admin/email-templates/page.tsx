import { requireAdminPage } from "@/lib/admin-guard";
import { listEmailTemplates } from "@/lib/email";
import { PageHeader, formatDateTime } from "@/components/admin/ui";
import { saveTemplateAction } from "./actions";

export const dynamic = "force-dynamic";

const MERGE_FIELDS = [
  "firstName", "lastName", "propertyType", "budget", "location", "timeframe", "siteName", "siteUrl",
];

export default async function EmailTemplatesPage() {
  await requireAdminPage();
  const templates = listEmailTemplates();

  return (
    <>
      <PageHeader
        title="Email Templates"
        description="The automated follow-up sequence. Editable here — the code always reads the current version at send time."
      />

      <div className="mb-6 rounded-xl border border-ink-100 bg-canvas-raised p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Merge fields</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {MERGE_FIELDS.map((field) => (
            <code
              key={field}
              className="rounded bg-canvas-sunken px-2 py-1 text-xs text-ink-700"
            >{`{{${field}}}`}</code>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-500">
          Delay is measured from the moment the investor registers. Email 1 should stay at 0 hours
          and must not contain a specific property — it confirms receipt of their criteria only.
        </p>
      </div>

      <div className="space-y-6">
        {templates.map((template) => (
          <form
            key={template.key}
            action={saveTemplateAction}
            className="rounded-xl border border-ink-100 bg-canvas-raised"
          >
            <input type="hidden" name="key" value={template.key} />
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
              <div>
                <h2 className="text-sm font-semibold text-ink-900">{template.name}</h2>
                <p className="mt-0.5 text-xs text-ink-400">
                  key: {template.key} · updated {formatDateTime(template.updated_at)}
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-ink-700">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={template.is_active === 1}
                  className="h-4 w-4 rounded border-ink-300"
                />
                Active
              </label>
            </header>

            <div className="space-y-4 px-5 py-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
                <div>
                  <label htmlFor={`name-${template.key}`} className="mb-1.5 block text-xs font-semibold text-ink-600">
                    Template name
                  </label>
                  <input
                    id={`name-${template.key}`}
                    name="name"
                    type="text"
                    defaultValue={template.name}
                    className="field-input !py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`delay-${template.key}`} className="mb-1.5 block text-xs font-semibold text-ink-600">
                    Delay (hours)
                  </label>
                  <input
                    id={`delay-${template.key}`}
                    name="delay_hours"
                    type="number"
                    min={0}
                    defaultValue={template.delay_hours}
                    className="field-input !py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`subject-${template.key}`} className="mb-1.5 block text-xs font-semibold text-ink-600">
                  Subject
                </label>
                <input
                  id={`subject-${template.key}`}
                  name="subject"
                  type="text"
                  defaultValue={template.subject}
                  className="field-input !py-2.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor={`body-${template.key}`} className="mb-1.5 block text-xs font-semibold text-ink-600">
                  Body
                </label>
                <textarea
                  id={`body-${template.key}`}
                  name="body"
                  rows={16}
                  defaultValue={template.body}
                  className="field-input !py-3 font-mono text-xs leading-relaxed"
                />
              </div>

              <button type="submit" className="btn-primary !min-h-[2.5rem] px-5 text-sm">
                Save template
              </button>
            </div>
          </form>
        ))}
      </div>
    </>
  );
}
