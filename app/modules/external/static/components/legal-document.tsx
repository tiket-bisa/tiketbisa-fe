export interface LegalSection {
  title: string;
  introduction?: string[];
  items?: string[];
  closing?: string[];
}

interface LegalDocumentProps {
  title: string;
  highlightedTitle: string;
  description: string;
  sections: LegalSection[];
}

export function LegalDocument({
  title,
  highlightedTitle,
  description,
  sections,
}: LegalDocumentProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="mb-12 text-center sm:mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
          {title} <span className="text-brand-primary">{highlightedTitle}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
          {description}
        </p>
      </header>

      <LegalSections sections={sections} className="mx-auto max-w-4xl border-t border-divider pt-12 sm:pt-16" />
    </div>
  );
}

interface LegalSectionsProps {
  sections: LegalSection[];
  className?: string;
}

export function LegalSections({ sections, className = "" }: LegalSectionsProps) {
  return (
    <article className={`space-y-10 ${className}`}>
      {sections.map((section) => (
        <section key={section.title} aria-labelledby={toSectionId(section.title)}>
          <h2
            id={toSectionId(section.title)}
            className="mb-4 text-xl font-extrabold text-text-primary sm:text-2xl"
          >
            {section.title}
          </h2>

          <div className="space-y-4 text-sm leading-7 text-text-secondary sm:text-base sm:leading-8">
            {section.introduction?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

            {section.items && (
              <ol className="list-decimal space-y-3 pl-6 marker:font-bold marker:text-text-primary">
                {section.items.map((item) => <li key={item} className="pl-2">{item}</li>)}
              </ol>
            )}

            {section.closing?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>
      ))}
    </article>
  );
}

function toSectionId(title: string): string {
  return title
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
