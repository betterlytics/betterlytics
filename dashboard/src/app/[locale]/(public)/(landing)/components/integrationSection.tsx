import { Code, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ExternalLink from '@/components/ExternalLink';
import { getTranslations } from 'next-intl/server';

export async function IntegrationSection() {
  const t = await getTranslations('public.landing.integration');
  const integrationMethods = [
    {
      icon: <Code className='h-6 w-6' />,
      title: t('cards.script.title'),
      description: t('cards.script.description'),
      features: [t('cards.script.features.f1'), t('cards.script.features.f2'), t('cards.script.features.f3')],
    },
    {
      icon: <Zap className='h-6 w-6' />,
      title: t('cards.framework.title'),
      description: t('cards.framework.description'),
      features: [
        t('cards.framework.features.f1'),
        t('cards.framework.features.f2'),
        t('cards.framework.features.f3'),
      ],
    },
    {
      icon: <Shield className='h-6 w-6' />,
      title: t('cards.selfHosted.title'),
      description: t('cards.selfHosted.description'),
      features: [
        t('cards.selfHosted.features.f1'),
        t('cards.selfHosted.features.f2'),
        t('cards.selfHosted.features.f3'),
      ],
    },
  ];

  return (
    <section className='overflow-visible py-20'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
            {t('titleStart')} <span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span>
          </h2>
          <p className='text-muted-foreground mx-auto max-w-2xl text-xl'>{t('subtitle')}</p>
        </div>

        <div className='mx-auto grid max-w-6xl gap-8 md:grid-cols-3'>
          {integrationMethods.map((method, index) => (
            <Card
              key={index}
              className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 flex h-full flex-col border text-center shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:content-[""] supports-[backdrop-filter]:backdrop-blur-[2px]'
            >
              <CardHeader className='flex flex-col items-center'>
                <div className='text-primary mx-auto mb-4'>{method.icon}</div>
                <CardTitle className='text-xl'>{method.title}</CardTitle>
                <CardDescription>{method.description}</CardDescription>
              </CardHeader>
              <CardContent className='mt-auto'>
                <ul className='text-muted-foreground space-y-2 text-sm'>
                  {method.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className='flex items-center justify-start pl-2'>
                      <span className='text-primary mr-2'>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='mt-12 text-center'>
          <Button
            size='lg'
            className='group mb-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:-translate-y-0.5 focus-visible:shadow-lg motion-reduce:transform-none motion-reduce:transition-none'
            asChild
          >
            <ExternalLink href='/docs/installation/cloud-hosting' title={t('guideTitle')}>
              {t('guideButton')}
            </ExternalLink>
          </Button>
          <p className='text-muted-foreground text-sm'>{t('footer')}</p>
        </div>
      </div>
    </section>
  );
}
