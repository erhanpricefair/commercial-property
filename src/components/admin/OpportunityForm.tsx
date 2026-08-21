import {
  AU_STATES,
  AVAILABILITY_STATUSES,
  AVAILABILITY_LABELS,
  COMPLETION_STATUSES,
  COMPLETION_LABELS,
  PROPERTY_TYPE_OPTIONS,
} from "@/lib/taxonomy";
import type { OpportunityRow } from "@/lib/repositories/opportunities";

/**
 * Private opportunity editor.
 *
 * The identifying fields are grouped and visually flagged so it is obvious at a
 * glance which data must never reach a public surface. The grouping is a
 * usability aid — the actual protection is in the data layer, which strips
 * these fields from any presentation that isn't explicitly authorised.
 */
export default function OpportunityForm({
  opportunity,
  action,
  submitLabel,
}: {
  opportunity?: OpportunityRow;
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  const o = opportunity;

  return (
    <form action={action} className="space-y-6">
      {o && <input type="hidden" name="id" value={o.id} />}

      <fieldset className="rounded-xl border border-ink-100 bg-canvas-raised p-5">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
          Opportunity
        </legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Text name="reference" label="Internal opportunity ID" defaultValue={o?.reference} required
            placeholder="OPP-0001" />
          <Select name="property_type" label="Property type" defaultValue={o?.property_type}
            options={PROPERTY_TYPE_OPTIONS.filter((p) => p.value !== "open")} />
          <Select name="availability" label="Availability" defaultValue={o?.availability}
            options={AVAILABILITY_STATUSES.map((s) => ({ value: s, label: AVAILABILITY_LABELS[s] }))} />
          <Text name="suburb" label="Suburb" defaultValue={o?.suburb ?? ""} />
          <Select name="state" label="State" defaultValue={o?.state ?? "VIC"}
            options={AU_STATES.map((s) => ({ value: s, label: s }))} />
          <Select name="completion_status" label="Completion status" defaultValue={o?.completion_status ?? ""}
            options={COMPLETION_STATUSES.map((s) => ({ value: s, label: COMPLETION_LABELS[s] }))}
            allowEmpty />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-ink-100 bg-canvas-raised p-5">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
          Numbers
        </legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Text name="size_sqm" label="Size (sqm)" type="number" defaultValue={o?.size_sqm ?? ""} />
          <Text name="price" label="Price (AUD)" type="number" defaultValue={o?.price ?? ""} />
          <Text name="estimated_rental" label="Estimated rental (pa)" type="number"
            defaultValue={o?.estimated_rental ?? ""} />
          <Text name="outgoings" label="Outgoings (pa)" type="number" defaultValue={o?.outgoings ?? ""} />
          <Text name="estimated_yield" label="Estimated yield (%)" type="number" step="0.01"
            defaultValue={o?.estimated_yield ?? ""}
            hint="Leave blank to calculate from price, rental and outgoings." />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border-2 border-dashed border-brass-200 bg-brass-100/40 p-5">
        <legend className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-brass-600">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 5V3.5a3 3 0 016 0V5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <rect x="2" y="5" width="8" height="6" rx="1" fill="currentColor" />
          </svg>
          Private / internal only
        </legend>
        <p className="mb-4 text-xs leading-relaxed text-brass-600">
          These fields never appear on the public website, in any public API response, in the sitemap
          or in schema markup. They are only released on a private presentation link where you have
          explicitly ticked &ldquo;disclose identity&rdquo;.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Text name="developer" label="Developer" defaultValue={o?.developer ?? ""} />
          <Text name="development_name" label="Development name" defaultValue={o?.development_name ?? ""} />
          <Text name="address" label="Exact address" defaultValue={o?.address ?? ""} />
          <Text name="lot_unit_number" label="Lot / unit number" defaultValue={o?.lot_unit_number ?? ""} />
          <Text name="source_channel" label="Source / channel" defaultValue={o?.source_channel ?? ""} />
          <div className="sm:col-span-2">
            <label htmlFor="internal_notes" className="mb-1.5 block text-xs font-semibold text-ink-600">
              Internal notes
            </label>
            <textarea
              id="internal_notes"
              name="internal_notes"
              rows={4}
              defaultValue={o?.internal_notes ?? ""}
              className="field-input !py-2.5 text-sm"
            />
          </div>
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary !min-h-[2.75rem] px-6 text-sm">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Text({
  name,
  label,
  defaultValue,
  type = "text",
  required = false,
  placeholder,
  step,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-ink-600">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="field-input !py-2.5 text-sm"
      />
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

function Select({
  name,
  label,
  defaultValue,
  options,
  allowEmpty = false,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
  allowEmpty?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-ink-600">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="field-input !py-2.5 text-sm"
      >
        {allowEmpty && <option value="">—</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
