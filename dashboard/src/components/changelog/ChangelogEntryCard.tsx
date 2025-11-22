import type { WhatsNewEntry } from '@/content/whats-new';

type ChangelogEntryCardProps = {
  entry: WhatsNewEntry;
  locale: string;
};

export function ChangelogEntryCard({ entry, locale }: ChangelogEntryCardProps) {
  const releaseDate = new Date(entry.releasedAt);
  const isValidDate = !Number.isNaN(releaseDate.getTime());
  const formattedReleaseDate = isValidDate
    ? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(releaseDate)
    : entry.releasedAt;

  return (
    <section className='border-border/60 border-t py-10 first:pt-8 first:border-t-0 last:border-b'>
      <div className='flex flex-col gap-8 md:grid md:grid-cols-[160px_1fr] md:items-start md:gap-12'>
        <div className='text-muted-foreground/90 text-xs font-semibold uppercase tracking-[0.35em] md:text-sm'>
          {isValidDate ? (
            <time dateTime={entry.releasedAt}>{formattedReleaseDate}</time>
          ) : (
            formattedReleaseDate
          )}
        </div>

        <div className='space-y-6'>
          <header className='space-y-3'>
            <div className='space-y-2'>
              <h2 className='text-3xl font-semibold tracking-tight text-foreground'>{entry.title}</h2>
              <p className='text-muted-foreground/90 text-base leading-relaxed'>{entry.summary}</p>
            </div>
          </header>

          <div className='prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_section+section]:mt-6 [&_section]:space-y-3 [&_ul]:ml-4 [&_ul]:list-disc [&_figure]:rounded-2xl [&_figure]:overflow-hidden [&_figcaption]:text-[0.65rem] [&_figcaption]:uppercase [&_figcaption]:tracking-[0.3em] [&_img]:w-full [&_img]:rounded-xl'>
            <entry.Content />
          </div>
        </div>
      </div>
    </section>
  );
}


