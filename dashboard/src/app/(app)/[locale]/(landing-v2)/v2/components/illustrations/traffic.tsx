import { vars } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/cssVars';

/* Illustration copy is mock product UI, kept literal on purpose. */

const PAGES = [
  { path: '/pricing', views: '8,412', share: 100 },
  { path: '/blog/cookieless-analytics', views: '6,203', share: 74 },
  { path: '/', views: '5,118', share: 61 },
  { path: '/docs/installation', views: '3,940', share: 47 },
  { path: '/changelog', views: '2,106', share: 25 },
];

/** Share of readers still on the page at each quarter of its length. */
const DEPTH = [100, 72, 48, 21];
const AVG_DEPTH = 58;

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const HOURS = 24;

/**
 * Visitors by weekday and hour, 0 to 1: office hours on weekdays, a smaller
 * evening bump, quiet nights and slower weekends. A fixed shape rather than
 * random, so it renders the same on the server and the client.
 */
function intensity(day: number, hour: number) {
  const weekend = day >= 5;
  const office = Math.exp(-((hour - 11) ** 2) / 14);
  const evening = Math.exp(-((hour - 20) ** 2) / 6) * 0.45;
  const night = hour < 6 ? 0.04 : 0;
  const base = (weekend ? 0.45 : 1) * Math.max(office, evening) + night;
  const wobble = 0.08 * Math.sin(day * 2.3 + hour * 1.7);
  return Math.min(1, Math.max(0.03, base + wobble - (day === 4 && hour > 14 ? 0.18 : 0)));
}

/** Three cards, fanned, each a different kind of view: what they open, how far they read, when they come. */
export function Traffic() {
  return (
    <div className='tf'>
      <div className='tf__c tf__c--a' style={vars({ '--d': '.05s' })}>
        <div className='tf__hd'>
          <b>Top pages</b>
          <span>views · 24h</span>
        </div>
        <div className='tf__b'>
          {PAGES.map((page, i) => (
            <div key={page.path} className='tf__r'>
              <u style={vars({ '--d': `${0.25 + i * 0.07}s` }, { width: `${page.share}%` })} />
              <b>{page.path}</b>
              <em>{page.views}</em>
            </div>
          ))}
        </div>
      </div>

      <div className='tf__c tf__c--b' style={vars({ '--d': '.2s' })}>
        <div className='tf__hd'>
          <b>Scroll depth</b>
        </div>
        <div className='tf__b tf__depth'>
          <p className='tf__path'>/blog/cookieless-analytics</p>
          <div className='tf__page'>
            <div className='tf__chrome' aria-hidden>
              <i />
              <i />
              <i />
            </div>
            {/* how many readers each quarter of the page kept, filled in top-down as if read */}
            <div className='tf__read' aria-hidden>
              {DEPTH.map((reach, i) => (
                <span key={i} style={vars({ '--reach': reach / 100, '--d': `${0.5 + i * 0.16}s` })} />
              ))}
            </div>
            <ol className='tf__marks'>
              {DEPTH.map((reach, i) => (
                <li key={i} style={{ top: `${i * 25}%` }}>
                  {reach}%
                </li>
              ))}
            </ol>
          </div>
          <p className='tf__avg'>
            Avg. depth <em>{AVG_DEPTH}%</em>
          </p>
        </div>
      </div>

      <div className='tf__c tf__c--c' style={vars({ '--d': '.36s' })}>
        <div className='tf__hd'>
          <b>Weekly traffic</b>
          <span>visitors by hour</span>
        </div>
        <div className='tf__b tf__heat'>
          <div className='tf__days' aria-hidden>
            {DAYS.map((day, i) => (
              <span key={i}>{day}</span>
            ))}
          </div>
          <div className='tf__grid' aria-hidden>
            {DAYS.map((_, day) =>
              Array.from({ length: HOURS }, (_, hour) => (
                <i
                  key={`${day}-${hour}`}
                  style={vars({
                    '--v': intensity(day, hour).toFixed(2),
                    '--d': `${0.45 + (day + hour) * 0.012}s`,
                  })}
                />
              )),
            )}
          </div>
          <div className='tf__hours' aria-hidden>
            <span>00</span>
            <span>06</span>
            <span>12</span>
            <span>18</span>
          </div>
        </div>
      </div>
    </div>
  );
}
