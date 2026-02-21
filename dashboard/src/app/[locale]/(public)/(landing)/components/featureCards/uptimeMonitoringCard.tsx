import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, RefreshCcw, Mail, Bell } from 'lucide-react';
import { formatPercentage } from '@/utils/formatters';
import { getLocale, getTranslations } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';

export default async function UptimeMonitoringCard() {
  const t = await getTranslations('public.landing.cards.uptimeMonitoring');
  const locale = await getLocale();

  return (
    <Card className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 gap-2 overflow-hidden border shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:content-[""] supports-[backdrop-filter]:backdrop-blur-[2px]'>
      <CardHeader className='pb-0'>
        <CardTitle className='text-xl'>{t('title')}</CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className='pt-4'>
        <UptimeMonitoringIllustration
          locale={locale}
          alertDown={t('alertDown', { site: 'staging.example.com' })}
          alertSent={t('alertSent', { email: 'team@example.com' })}
          incidentDetected={t('incidentDetected', { count: 1 })}
          sslLabel={t('ssl')}
        />
      </CardContent>
    </Card>
  );
}

type IllustrationProps = {
  locale: SupportedLanguages;
  alertDown: string;
  alertSent: string;
  incidentDetected: string;
  sslLabel: string;
};

function UptimeMonitoringIllustration({ locale, alertDown, alertSent, incidentDetected, sslLabel }: IllustrationProps) {
  const monitors = [
    {
      name: 'staging.example.com',
      uptime: 99.87,
      interval: '1m',
      pattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -1],
      isDown: true,
    },
    {
      name: 'api.example.com',
      uptime: 99.98,
      interval: '1m',
      pattern: [1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 1],
      isDown: false,
    },
    {
      name: 'app.example.com',
      uptime: 100,
      interval: '5m',
      pattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      isDown: false,
    },
    {
      name: 'example.com',
      uptime: 99.94,
      interval: '1m',
      pattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      isDown: false,
    },
  ];

  const animationStyles = `
    @keyframes uptime-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .uptime-live-dot {
      animation: uptime-pulse 2s ease-in-out infinite;
    }
    @keyframes alert-shake {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      10% { transform: translateX(-1px) rotate(-1deg); }
      20% { transform: translateX(2px) rotate(1deg); }
      30% { transform: translateX(-2px) rotate(-0.5deg); }
      40% { transform: translateX(1px) rotate(0.5deg); }
      50% { transform: translateX(-1px) rotate(-0.5deg); }
      60% { transform: translateX(1px) rotate(0deg); }
      70%, 100% { transform: translateX(0) rotate(0deg); }
    }
    @keyframes alert-glow {
      0%, 70%, 100% { box-shadow: 0 2px 10px -4px rgba(239, 68, 68, 0.15), 0 0 0 0 rgba(239, 68, 68, 0); }
      35% { box-shadow: 0 4px 20px -2px rgba(239, 68, 68, 0.3), 0 0 6px 1px rgba(239, 68, 68, 0.15); }
    }
    .alert-toast {
      animation: alert-shake 2.5s ease-in-out infinite, alert-glow 2.5s ease-in-out infinite;
    }
    @keyframes status-pill-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .status-pill-alert {
      animation: status-pill-pulse 1.5s ease-in-out infinite;
    }
    @keyframes row-glow {
      0%, 100% { box-shadow: inset 0 0 0 0 rgba(239, 68, 68, 0); }
      50% { box-shadow: inset 0 0 8px 0 rgba(239, 68, 68, 0.05); }
    }
    .monitor-row-alert {
      animation: row-glow 3s ease-in-out infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .uptime-live-dot,
      .alert-toast,
      .status-pill-alert,
      .monitor-row-alert {
        animation: none;
      }
    }
  `;

  return (
    <div aria-hidden='true' className='w-full space-y-3'>
      <style>{animationStyles}</style>

      <div className='alert-toast relative flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-gradient-to-r from-red-500/5 to-transparent px-3 py-2'>
        <div className='relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-500/15'>
          <Bell className='h-3.5 w-3.5 text-red-500' strokeWidth={2.2} />
          <span className='absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white'>
            1
          </span>
        </div>
        <div className='min-w-0 flex-1'>
          <div className='truncate text-xs font-medium'>{alertDown}</div>
          <div className='text-muted-foreground text-[10px]'>{alertSent}</div>
        </div>
        <Mail className='text-muted-foreground/50 h-3.5 w-3.5 flex-shrink-0' strokeWidth={2} />
      </div>

      <div className='space-y-2'>
        {monitors.map((monitor, idx) => (
          <MonitorRow key={idx} monitor={monitor} locale={locale} />
        ))}
      </div>

      <div className='border-border/60 flex items-center justify-between border-t pt-3'>
        <div className='flex items-center gap-2'>
          <span className='uptime-live-dot h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]' />
          <span className='text-muted-foreground text-xs font-medium'>{incidentDetected}</span>
        </div>

        <div className='flex items-center gap-1.5'>
          <Shield className='h-3.5 w-3.5 text-green-500' strokeWidth={2.2} />
          <span className='text-muted-foreground text-xs font-medium'>{sslLabel}</span>
          <span className='text-foreground text-xs font-semibold'>3/3</span>
        </div>
      </div>
    </div>
  );
}

type Monitor = {
  name: string;
  uptime: number;
  interval: string;
  pattern: number[];
  isDown: boolean;
};

function MonitorRow({ monitor, locale }: { monitor: Monitor; locale: SupportedLanguages }) {
  const getStatusColor = (value: number, isLast: boolean) => {
    if (value < 0) return `bg-red-500 ${isLast && monitor.isDown ? 'status-pill-alert' : ''}`;
    if (value < 1) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const uptimeColor = monitor.isDown ? 'text-red-500' : monitor.uptime >= 99.9 ? 'text-green-500' : 'text-amber-500';
  const accentColor = monitor.isDown ? 'bg-red-500' : 'bg-green-500';
  const dotColor = monitor.isDown ? 'bg-red-500' : 'bg-green-500';
  const rowClass = monitor.isDown ? 'monitor-row-alert border-red-500/20' : 'border-border/50';

  return (
    <div className={`bg-card/80 group relative overflow-hidden rounded-lg border px-3 py-2 ${rowClass}`}>
      <div className={`absolute top-0 left-0 h-full w-0.5 ${accentColor}`} aria-hidden />

      <div className='flex items-center gap-3 pl-1'>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <span className={`uptime-live-dot h-1.5 w-1.5 rounded-full ${dotColor}`} />
          <span className='truncate text-xs font-medium'>{monitor.name}</span>
        </div>

        <div className='text-muted-foreground hidden items-center gap-0.5 text-[10px] sm:flex'>
          <RefreshCcw size={10} />
          <span>{monitor.interval}</span>
        </div>

        <div className='bg-muted/50 flex gap-[2px] rounded p-1'>
          {monitor.pattern.map((value, i) => (
            <span
              key={i}
              className={`h-3.5 w-1 rounded-sm ${getStatusColor(value, i === monitor.pattern.length - 1)} opacity-80 transition-opacity group-hover:opacity-100`}
            />
          ))}
        </div>

        <span className={`min-w-[2.8rem] text-right text-[11px] font-semibold tabular-nums ${uptimeColor}`}>
          {formatPercentage(monitor.uptime, locale, { minimumFractionDigits: monitor.uptime === 100 ? 0 : 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
