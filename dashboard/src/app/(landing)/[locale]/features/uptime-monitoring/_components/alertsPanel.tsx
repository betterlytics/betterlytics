import type { ReactNode } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { SpotlightList } from '@/landing/components/ui/spotlightList';
import { Heading, Label } from '@/landing/components/ui/text';
import { cn } from '@/landing/lib/cn';
import { LINKS } from '@/landing/lib/links';
import { AlertPreview } from './alertPreview';
import styles from './alertsPanel.module.css';

const SETUP = `${LINKS.integrationsDocs}#setting-up-an-integration`;

const logo = (src: string) => <Image src={src} alt='' width={14} height={14} />;

/* `name` is a brand, or a key under landing.uptime.alerts */
const CHANNELS: { name: string; translated?: 'email' | 'webhook'; glyph: ReactNode; href: string }[] = [
  { name: 'Slack', glyph: logo('/images/integrations/slack.svg'), href: SETUP },
  { name: 'Discord', glyph: logo('/images/integrations/discord.svg'), href: SETUP },
  { name: 'Microsoft Teams', glyph: logo('/images/integrations/teams.svg'), href: SETUP },
  { name: 'Pushover', glyph: logo('/images/integrations/pushover.svg'), href: SETUP },
  { name: 'email', translated: 'email', glyph: <MailIcon />, href: `${LINKS.monitoringDocs}#email-alerts` },
  {
    name: 'webhook',
    translated: 'webhook',
    glyph: logo('/images/integrations/webhook.svg'),
    href: `${LINKS.integrationsDocs}#webhook-payload-format`,
  },
];

const EVENTS = ['down', 'recovery', 'ssl'] as const;

function MailIcon() {
  return (
    <svg viewBox='0 0 16 16' fill='none' className='size-3.5' aria-hidden>
      <rect x='2' y='3.5' width='12' height='9' rx='1.6' stroke='currentColor' strokeWidth='1.3' />
      <path d='m2.6 4.4 5.4 4.1 5.4-4.1' stroke='currentColor' strokeWidth='1.3' strokeLinejoin='round' />
    </svg>
  );
}

export function AlertsPanel() {
  const t = useTranslations('landing.uptime.alerts');
  return (
    <div className='grid grid-cols-[1fr_1.1fr] max-lg:grid-cols-1'>
      <div className='flex flex-col justify-center border-r border-rule-10 px-7.5 pt-8 pb-8 transition-ink max-lg:border-r-0 max-lg:border-b max-sm:px-6'>
        <Heading as='h3' size='title' className='mb-2'>
          {t('lead')}
        </Heading>
        <p className='mb-6 text-body leading-[23px] text-muted'>{t('body')}</p>
        <Label className='mb-4 block'>{t('channels')}</Label>
        <SpotlightList className='grid grid-cols-2 gap-[9px] border-t border-rule-08 pt-4.5 transition-ink max-sm:grid-cols-1'>
          {CHANNELS.map((channel) => (
            <li key={channel.name} className={styles.tile}>
              <a className={styles.tileLink} href={channel.href}>
                <span className={styles.glyph}>{channel.glyph}</span>
                {channel.translated ? t(channel.translated) : channel.name}
                <ArrowUpRight className={styles.tileArrow} aria-hidden />
              </a>
            </li>
          ))}
        </SpotlightList>
        <div className='pt-8'>
          <Label className='mb-3 block'>{t('events.label')}</Label>
          {/* the status-page points' checkmark, at the channel tiles' size, so it reads as a footnote to them */}
          <ul className='flex flex-wrap gap-x-5 gap-y-2'>
            {EVENTS.map((key) => (
              <li
                key={key}
                className='inline-flex items-center gap-2 text-[13.5px] leading-5 tracking-[-0.15px] text-fg/85'
              >
                <Check className='size-[15px] text-volt-soft' strokeWidth={2.4} aria-hidden />
                {t(`events.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={cn('flex min-w-0 p-4.5 max-sm:p-0', 'bg-hatch')}>
        <AlertPreview />
      </div>
    </div>
  );
}
