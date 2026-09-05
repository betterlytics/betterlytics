import { cn } from '@/lib/utils';
import { vars } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/cssVars';

/* Illustration copy is mock product UI, kept literal on purpose. */

const BARS = 28;

function Monitor({
  variant,
  host,
  uptime,
  down = [],
  delay,
}: {
  variant: 'a' | 'b';
  host: string;
  uptime: string;
  down?: number[];
  delay: string;
}) {
  return (
    <div className={`mo__c mo__c--${variant}`} style={vars({ '--d': delay })}>
      <div className='mo__hd'>
        <i className={cn(down.length > 0 && 'warn')} />
        <b>{host}</b>
        <em>{uptime}</em>
      </div>
      <div className='mo__s'>
        {Array.from({ length: BARS }, (_, i) => (
          <i key={i} className={cn(down.includes(i) && 'dn')} style={vars({ '--i': i })} />
        ))}
      </div>
    </div>
  );
}

/**
 * Two monitors and the alert they raise, joined by a connector so the three
 * read as one sequence rather than three objects.
 */
export function Uptime() {
  return (
    <div className='mo'>
      <svg className='mo__wire' viewBox='0 0 986 555' preserveAspectRatio='none' aria-hidden>
        <path d='M681,296 H714 Q722,296 722,304 V372' style={vars({ '--len': 116, '--d': '.86s' })} />
        <circle cx='681' cy='296' r='4.5' style={vars({ '--d': '.86s' })} />
        <polygon points='716,372 728,372 722,384' style={vars({ '--d': '1.24s' })} />
      </svg>
      <Monitor variant='a' host='api.example.com' uptime='99.98%' delay='.06s' />
      <Monitor variant='b' host='staging.example.com' uptime='99.87%' down={[16, 17]} delay='.22s' />
      <div className='mo__al'>
        <span className='mo__bell'>
          <svg viewBox='0 0 20 20' fill='none' aria-hidden>
            <path
              d='M10 2.6a5 5 0 0 0-5 5v3L3.6 13h12.8L15 10.6v-3a5 5 0 0 0-5-5Z'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinejoin='round'
            />
            <path d='M8 15.4a2 2 0 0 0 4 0' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
          </svg>
          <u>1</u>
        </span>
        <span>
          <b>staging.example.com is down</b>
          <span>Alert sent to team@example.com</span>
        </span>
        <time>12s ago</time>
      </div>
    </div>
  );
}
