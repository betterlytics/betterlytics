import { vars } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/cssVars';

/* Illustration copy is mock product UI, kept literal on purpose. */

const PAGES = [
  { label: '/pricing', value: '8,412', width: '100%', delay: '0.22s' },
  { label: '/blog/[slug]', value: '6,203', width: '74%', delay: '0.29s' },
  { label: '/', value: '5,118', width: '61%', delay: '0.36s' },
];
const COUNTRIES = [
  { label: 'United States', value: '9,204', width: '100%', delay: '0.42s' },
  { label: 'Denmark', value: '4,118', width: '45%', delay: '0.49s' },
  { label: 'Germany', value: '3,552', width: '39%', delay: '0.56s' },
];
const DEVICES = [
  { label: 'Desktop', share: 61.4, color: '#4A5CFF', delay: '0.62s' },
  { label: 'Mobile', share: 33.2, color: '#8B97FF', delay: '0.69s' },
  { label: 'Tablet', share: 5.4, color: '#5E6580', delay: '0.76s' },
];

function Rows({ rows }: { rows: typeof PAGES }) {
  return (
    <div className='tf__b'>
      {rows.map((row) => (
        <div key={row.label} className='tf__r'>
          <b>{row.label}</b>
          <em>{row.value}</em>
          <i>
            <u style={vars({ '--d': row.delay }, { width: row.width })} />
          </i>
        </div>
      ))}
    </div>
  );
}

/** Three focused cards, fanned: pages AND countries AND devices is the claim. */
export function Traffic() {
  return (
    <div className='tf'>
      <div className='tf__c tf__c--a' style={vars({ '--d': '.05s' })}>
        <div className='tf__hd'>
          <b>Top pages</b>
          <span>views · 24h</span>
        </div>
        <Rows rows={PAGES} />
      </div>
      <div className='tf__c tf__c--b' style={vars({ '--d': '.22s' })}>
        <div className='tf__hd'>
          <b>Countries</b>
          <span>visitors · 24h</span>
        </div>
        <Rows rows={COUNTRIES} />
      </div>
      <div className='tf__c tf__c--c' style={vars({ '--d': '.42s' })}>
        <div className='tf__hd'>
          <b>Devices</b>
          <span>share of sessions</span>
        </div>
        <div className='tf__b'>
          <div className='tf__split'>
            {DEVICES.map((d) => (
              <i key={d.label} style={vars({ '--d': d.delay }, { flex: d.share, background: d.color })} />
            ))}
          </div>
          <div className='tf__lg'>
            {DEVICES.map((d) => (
              <span key={d.label}>
                <s style={{ background: d.color }} />
                {d.label} <em>{d.share}%</em>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
