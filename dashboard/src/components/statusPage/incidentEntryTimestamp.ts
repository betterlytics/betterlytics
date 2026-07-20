export type IncidentEntryLabels = {
  today: string;
  yesterday: string;
};

type IncidentEntryFormatterOptions = {
  locale: string;
  timeZone?: string;
  hour12?: boolean;
  labels: IncidentEntryLabels;
};

export function createIncidentEntryFormatter({
  locale,
  timeZone,
  hour12,
  labels,
}: IncidentEntryFormatterOptions) {
  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12, timeZone });
  const date = new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric', timeZone });
  const dateWithYear = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  });

  const dayKey = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone });

  return (entry: Date, now: Date): string => {
    const key = dayKey.format(entry);
    const todayKey = dayKey.format(now);
    const yesterdayKey = dayKey.format(new Date(now.getTime() - 86_400_000));
    const day =
      key === todayKey
        ? labels.today
        : key === yesterdayKey
          ? labels.yesterday
          : (key.slice(0, 4) === todayKey.slice(0, 4) ? date : dateWithYear).format(entry);
          
    return `${day}, ${time.format(entry)}`;
  };
}
