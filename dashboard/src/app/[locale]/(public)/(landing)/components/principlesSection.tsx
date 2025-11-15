import type { ReactNode } from 'react';
import { Shield, Zap, Database, Eye, Code, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

export async function PrinciplesSection() {
  const t = await getTranslations('public.landing.principles');
  type FeatureItem = {
    icon: ReactNode;
    title: string;
    description: string;
    isHiddenOnMobile?: boolean;
  };

  const featureItems: FeatureItem[] = [
    {
      icon: <Shield className='h-6 w-6' />,
      title: t('features.euGdpr.title'),
      description: t('features.euGdpr.description'),
    },
    {
      icon: <CheckCircle className='h-6 w-6' />,
      title: t('features.noConsent.title'),
      description: t('features.noConsent.description'),
    },
    {
      icon: <Database className='h-6 w-6' />,
      title: t('features.dataOwnership.title'),
      description: t('features.dataOwnership.description'),
      isHiddenOnMobile: true,
    },
    {
      icon: <Eye className='h-6 w-6' />,
      title: t('features.realtime.title'),
      description: t('features.realtime.description'),
    },
    {
      icon: <Zap className='h-6 w-6' />,
      title: t('features.lightweight.title'),
      description: t('features.lightweight.description'),
      isHiddenOnMobile: true,
    },
    {
      icon: <Code className='h-6 w-6' />,
      title: t('features.simpleSetup.title'),
      description: t('features.simpleSetup.description'),
      isHiddenOnMobile: true,
    },
  ];
  return (
    <section id='features' className='overflow-visible py-20'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
            <span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span> {t('titleRest')}
          </h2>
          <p className='text-muted-foreground mx-auto max-w-2xl text-xl'>{t('subtitle')}</p>
        </div>
        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {featureItems.map((feature, index) => (
            <Card key={index} className={feature.isHiddenOnMobile ? 'hidden sm:flex' : undefined}>
              <CardHeader>
                <div className='text-primary mb-2'>{feature.icon}</div>
                <CardTitle className='text-xl'>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className='text-base'>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
