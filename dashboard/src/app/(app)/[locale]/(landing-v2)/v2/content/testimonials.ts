/**
 * Placeholder quotes carried over from the draft; not real customers. Replace before launch.
 * `*…*` marks the clause the quote turns on. `volt` puts the card in brand colour.
 */
export type Testimonial = { quote: string; name: string; role: string; volt?: boolean };

export const TESTIMONIAL_ROWS: readonly (readonly Testimonial[])[] = [
  [
    {
      quote:
        "We replaced GA4 in an afternoon and got more data back, not less. The part that convinced our board wasn't the dashboard — it was *deleting the cookie banner*.",
      name: 'Ingrid Sørensen',
      role: 'Head of Growth, Kestrel Bank',
    },
    {
      quote:
        'Our consent banner was quietly *costing us 40% of sessions*. Betterlytics needs neither, and the numbers finally match what the order table says.',
      name: 'Tomas Lindqvist',
      role: 'CTO, Halden Freight',
    },
    {
      quote:
        'Funnels that actually segment by source. We found the drop-off in two minutes; the old tool had been *averaging it away for a year*.',
      name: 'Priya Raman',
      role: 'Head of Product, Verity Health',
    },
    {
      quote:
        '4.9 kB, loaded after paint. Our *LCP went down after adding analytics*, which I did not expect to ever be able to say.',
      name: 'Marc Delaunay',
      role: 'Founder, Silo',
    },
  ],
  [
    {
      quote:
        'The AI-assistant breakdown is the first report I open every morning. *Nobody else was even measuring* where that traffic came from.',
      name: 'Anna Kowalski',
      role: 'Marketing Lead, Northbeam',
    },
    {
      quote:
        "*Five years of unsampled events*. We ran a cohort query across the entire history and it came back before I'd finished reading the form.",
      name: 'Diego Santos',
      role: 'Engineering Manager, Merida',
      volt: true,
    },
    {
      quote:
        'We self-host the ingest inside our own VPC. Legal signed off *in a week instead of a quarter*, which has never happened here before.',
      name: 'Lena Fischer',
      role: 'Data Lead, Ordnance',
    },
    {
      quote:
        'Unlimited seats meant people *stopped asking me for screenshots*. Support, sales and design all just look at it themselves now.',
      name: 'Sam Okonkwo',
      role: 'CEO, Linnaeus',
    },
  ],
];
