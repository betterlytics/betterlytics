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
    <section className='border-border/60 border-t py-10 first:border-t-0 first:pt-8 last:border-b'>
      <div className='flex flex-col gap-6 md:grid md:grid-cols-[160px_1fr] md:items-start md:gap-12'>
        <div className='text-muted-foreground/90 text-[0.7rem] font-semibold tracking-[0.35em] uppercase md:text-xs'>
          <span className='bg-muted inline-flex w-fit items-center rounded-full px-3 py-1 text-[0.65rem] tracking-[0.3em] md:rounded-none md:bg-transparent md:px-0 md:py-0 md:text-[0.7rem] md:tracking-[0.35em]'>
            {isValidDate ? <time dateTime={entry.releasedAt}>{formattedReleaseDate}</time> : formattedReleaseDate}
          </span>
        </div>

        <div className='space-y-6'>
          <header className='space-y-3'>
            <div className='space-y-2'>
              <h2 className='text-foreground text-2xl font-semibold tracking-tight md:text-3xl'>{entry.title}</h2>
              <p className='text-muted-foreground/90 text-[0.95rem] leading-relaxed md:text-base'>
                {entry.summary}
              </p>
            </div>
          </header>

          <div className='prose prose-slate dark:prose-invert max-w-none text-[0.95rem] leading-relaxed md:text-base [&_figcaption]:text-[0.65rem] [&_figcaption]:tracking-[0.3em] [&_figcaption]:uppercase [&_figure]:overflow-hidden [&_figure]:rounded-2xl [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight md:[&_h2]:text-lg [&_img]:w-full [&_img]:rounded-xl [&_section]:space-y-3 [&_section+section]:mt-6 [&_ul]:ml-4 [&_ul]:list-disc'>
            <entry.Content />
          </div>
        </div>
      </div>
    </section>
  );
}
