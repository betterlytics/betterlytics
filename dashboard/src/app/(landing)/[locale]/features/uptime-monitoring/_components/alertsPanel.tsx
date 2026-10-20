import { Check } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LinkTiles } from '@/landing/components/ui/linkTiles';
import { Heading, Label } from '@/landing/components/ui/text';
import { LINKS } from '@/landing/lib/links';
import { MailIcon } from './alertMocks';
import { AlertPreview } from './alertPreview';

const CHANNELS_ID = 'alert-channels';
const SETUP = `${LINKS.integrationsDocs}#setting-up-an-integration`;
const EVENTS = ['down', 'recovery', 'ssl'] as const;

const logo = (src: string) => <Image src={src} alt='' width={14} height={14} />;

export function AlertsPanel() {
  const t = useTranslations('landing.uptime.alerts');
  const channels = [
    { name: 'Slack', icon: logo('/images/integrations/slack.svg'), href: SETUP },
    { name: 'Discord', icon: logo('/images/integrations/discord.svg'), href: SETUP },
    { name: 'Microsoft Teams', shortName: 'Teams', icon: logo('/images/integrations/teams.svg'), href: SETUP },
    { name: 'Pushover', icon: logo('/images/integrations/pushover.svg'), href: SETUP },
    { name: t('email'), icon: <MailIcon />, href: `${LINKS.monitoringDocs}#email-alerts` },
    {
      name: t('webhook'),
      icon: logo('/images/integrations/webhook.svg'),
      href: `${LINKS.integrationsDocs}#webhook-payload-format`,
    },
  ];
  return (
    <div className='grid grid-cols-[1fr_1.1fr] max-lg:grid-cols-1'>
      <div className='flex flex-col justify-center border-r border-rule-10 px-7.5 pt-8 pb-8 transition-ink max-lg:border-r-0 max-lg:border-b max-sm:px-6'>
        <Heading as='h3' size='title' className='mb-2'>
          {t('lead')}
        </Heading>
        <p className='mb-6 text-body leading-[23px] text-muted'>{t('body')}</p>
        <Label id={CHANNELS_ID} className='mb-4 block'>
          {t('channels')}
        </Label>
        <LinkTiles items={channels} labelledBy={CHANNELS_ID} arrow />
        <div className='pt-8'>
          <Label className='mb-3 block'>{t('events.label')}</Label>
          <ul className='flex flex-wrap gap-x-5 gap-y-2 max-sm:gap-x-3'>
            {EVENTS.map((key) => (
              <li
                key={key}
                className='inline-flex items-center gap-2 text-[13.5px] leading-5 tracking-[-0.15px] whitespace-nowrap text-fg/85 max-sm:gap-1.5 max-sm:text-[13px]'
              >
                <Check className='size-[15px] text-volt-soft' strokeWidth={2.4} aria-hidden />
                {t(`events.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className='flex min-w-0 bg-hatch p-4.5 max-sm:p-0'>
        <AlertPreview />
      </div>
    </div>
  );
}
