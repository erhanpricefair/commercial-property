import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-guard";
import { listPresentations } from "@/lib/repositories/opportunities";
import { PageHeader, formatDateTime } from "@/components/admin/ui";
import { SITE } from "@/lib/site";
import { labelFor } from "@/lib/taxonomy";
import { revokePresentationAction } from "../investors/actions";
import CopyLink from "@/components/admin/CopyLink";

export const dynamic = "force-dynamic";

export default async function PresentationsPage() {
  await requireAdminPage();
  const presentations = listPresentations();

  const isLive = (p: (typeof presentations)[number]) =>
    !p.revoked_at && (!p.expires_at || new Date(p.expires_at) > new Date());

  return (
    <>
      <PageHeader
        title="Private Presentations"
        description="Tokenised links you've issued to investors. Each is noindex, excluded from the sitemap, and revocable."
      />

      <div className="mb-5 rounded-xl border border-ink-100 bg-canvas-raised px-4 py-3">
        <p className="text-xs leading-relaxed text-ink-500">
          Links use 32 bytes of cryptographic randomness, so they cannot be guessed or enumerated.
          Identifying fields — developer, development name, exact address and lot/unit number — are
          stripped by the data layer unless you ticked &ldquo;disclose identity&rdquo; when creating
          the link.
        </p>
      </div>

      {presentations.length === 0 ? (
        <div className="rounded-xl border border-ink-100 bg-canvas-raised px-5 py-12 text-center text-sm text-ink-400">
          No presentation links yet. Create one from an investor&rsquo;s match list or from an
          opportunity.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-canvas-raised">
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="border-b border-ink-100 bg-canvas-sunken">
              <tr className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                <th scope="col" className="px-4 py-3">Opportunity</th>
                <th scope="col" className="px-4 py-3">Prepared for</th>
                <th scope="col" className="px-4 py-3">Identity</th>
                <th scope="col" className="px-4 py-3">Views</th>
                <th scope="col" className="px-4 py-3">Expires</th>
                <th scope="col" className="px-4 py-3">Link</th>
                <th scope="col" className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {presentations.map((presentation) => (
                <tr key={presentation.id} className={isLive(presentation) ? "" : "opacity-50"}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/opportunities/${presentation.opportunity_id}`}
                      className="font-semibold text-ink-900 hover:underline"
                    >
                      {presentation.reference}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {labelFor("propertyType", presentation.property_type)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-600">
                    {presentation.investor_id ? (
                      <Link
                        href={`/admin/investors/${presentation.investor_id}`}
                        className="hover:underline"
                      >
                        {presentation.investor_name ?? `Investor #${presentation.investor_id}`}
                      </Link>
                    ) : (
                      <span className="text-ink-400">Unattributed</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[0.6875rem] font-medium ${
                        presentation.disclose_identity
                          ? "border-signal-hot/30 bg-signal-hot/10 text-signal-hot"
                          : "border-ink-200 bg-canvas-sunken text-ink-500"
                      }`}
                    >
                      {presentation.disclose_identity ? "Disclosed" : "Withheld"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums text-ink-600">
                    {presentation.view_count}
                    {presentation.last_viewed_at && (
                      <p className="text-ink-400">{formatDateTime(presentation.last_viewed_at)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">
                    {presentation.revoked_at
                      ? `Revoked ${formatDateTime(presentation.revoked_at)}`
                      : presentation.expires_at
                        ? formatDateTime(presentation.expires_at)
                        : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    {isLive(presentation) ? (
                      <CopyLink url={`${SITE.url}/opportunity/${presentation.token}`} />
                    ) : (
                      <span className="text-xs text-ink-400">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isLive(presentation) && (
                      <form action={revokePresentationAction}>
                        <input type="hidden" name="presentationId" value={presentation.id} />
                        <button type="submit" className="text-xs text-ink-400 hover:text-signal-hot">
                          Revoke
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
