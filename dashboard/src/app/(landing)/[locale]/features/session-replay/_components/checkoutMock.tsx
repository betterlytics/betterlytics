import type { ReactNode } from 'react';
import { cn } from '@/landing/lib/cn';
import styles from './checkoutMock.module.css';

/* A made-up shop, deliberately untranslated. Prices are bars: crawlers and AI tools read mock prices as ours. */

/** What the recorder does to text: every non-space character becomes an asterisk. */
export const maskText = (text: string) => text.replace(/\S/g, '*');

const FIELDS = [
  { label: 'Full name', value: 'Jane Cooper' },
  { label: 'Email', value: 'jane.cooper@example.com' },
  { label: 'Address', value: 'Vesterbrogade 12, 3rd floor' },
] as const;

type CheckoutMockProps = {
  masked?: boolean;
  /** Rings the empty postcode field, for the scene that points at it. */
  flagPostcode?: boolean;
  /** Drawn inside the postcode field and the Pay button, so notes stay pinned to them. */
  adorn?: { postcode?: ReactNode; pay?: ReactNode };
  className?: string;
};

export function CheckoutMock({ masked = false, flagPostcode = false, adorn, className }: CheckoutMockProps) {
  const m = (text: string) => (masked ? maskText(text) : text);
  return (
    <div className={cn(styles.page, className)} data-masked={masked || undefined}>
      <div className={styles.siteNav}>
        <b>
          <i />
          {m('Northwind Coffee')}
        </b>
        <span>{m('Shop')}</span>
        <span>{m('Subscriptions')}</span>
        <em>{m('Cart (1)')}</em>
      </div>
      <div className={styles.columns}>
        <div className={styles.form}>
          <p className={styles.heading}>{m('Shipping details')}</p>
          {FIELDS.map(({ label, value }) => (
            <div key={label} className={styles.field}>
              <span>{m(label)}</span>
              <span className={styles.input}>{m(value)}</span>
            </div>
          ))}
          <div className={styles.pair}>
            <div className={styles.field} data-flag={flagPostcode || undefined}>
              <span>{m('Postcode')}</span>
              <span className={styles.input} />
              {adorn?.postcode}
            </div>
            <div className={styles.field}>
              <span>{m('City')}</span>
              <span className={styles.input}>{m('Copenhagen')}</span>
            </div>
          </div>
          <span className={styles.pay}>
            {m('Pay now')}
            {adorn?.pay}
          </span>
        </div>
        <div className={styles.summary}>
          <div className={styles.product}>
            {/* blocked like any image in a replay: same box, no picture */}
            <span className={styles.photo} data-blocked={masked || undefined}>
              {!masked && (
                <svg viewBox='0 0 40 52' aria-hidden>
                  <path d='M9 6h22l3 8v32a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V14z' className={styles.bag} />
                  <path d='M6 14h28' className={styles.fold} />
                  <circle cx='20' cy='30' r='7' className={styles.label} />
                  <path d='M17.5 27.5c2 1 3 3 2.5 6M22.5 26.5c-.5 2.5.5 4.5 2 5.5' className={styles.bean} />
                </svg>
              )}
            </span>
            <span className={styles.productText}>
              <b>{m('Espresso beans')}</b>
              <span>{m('1 kg · Whole bean')}</span>
            </span>
          </div>
          <dl className={styles.totals}>
            {['Subtotal', 'Shipping', 'Total'].map((row) => (
              <div key={row}>
                <dt>{m(row)}</dt>
                <dd>
                  <i />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
