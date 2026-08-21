import { Breadcrumbs } from "@/components/ui";
import type { LegalSection } from "@/lib/content/legal";

export default function LegalPage({
  title,
  intro,
  sections,
  updated,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  updated: string;
}) {
  return (
    <div className="bg-canvas">
      <div className="container-narrow py-12 sm:py-16 lg:py-20">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: title }]} />
        <h1 className="font-display text-display-lg text-ink-900">{title}</h1>
        <p className="mt-4 text-[1.0625rem] leading-[1.7] text-ink-600">{intro}</p>
        <p className="mt-3 text-sm text-ink-400">Last updated: {updated}</p>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-display-sm text-ink-900">{section.heading}</h2>
              {section.paragraphs.map((p, i) => (
                <p key={i} className="mt-4 text-[0.9375rem] leading-[1.75] text-ink-600">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-4 space-y-2.5 border-l-2 border-ink-100 pl-5">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="text-[0.9375rem] leading-relaxed text-ink-600">
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
