import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function FunnelsCard() {
  const t = await getTranslations('public.landing.cards.funnels');
  const funnelSteps = [
    { name: 'Read Blog Post', conversion: 100, dropOff: 60.0 },
    { name: 'Click CTA', conversion: 40, dropOff: 30.0 },
    { name: 'View Landing Page', conversion: 28, dropOff: 16.3 },
    { name: 'Start Form', conversion: 15, dropOff: null },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>{t('title')}</CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {funnelSteps.map((step) => (
          <div key={step.name} className='space-y-1'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>{step.name}</span>
              <span className='text-sm font-bold'>{step.conversion}%</span>
            </div>
            <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
              <div className='bg-primary h-full' style={{ width: `${step.conversion}%` }} />
            </div>
            {step.dropOff && (
              <div className='text-muted-foreground flex items-center text-xs'>
                <TrendingDown className='mr-1 h-3 w-3' />
                <span>{step.dropOff}% drop off</span>
              </div>
            )}
          </div>
        ))}

        <div className='border-border mt-4 border-t pt-3'>
          <div className='flex items-center justify-between text-sm'>
            <span className='font-medium'>{t('total')}: 15%</span>
            <div className='flex items-center text-green-500'>
              <TrendingUp className='mr-1 h-3 w-3' />
              <span>2.3% {t('sinceLastWeek')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
