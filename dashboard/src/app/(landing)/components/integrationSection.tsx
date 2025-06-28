import { Code, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function IntegrationSection() {
  const integrationMethods = [
    {
      icon: <Code className='h-8 w-8' />,
      title: 'Simple Script Tag',
      description: 'Add one line to your HTML and start tracking immediately. Works with any website or CMS.',
      features: ['One-line installation', 'Works anywhere', 'No build process needed'],
    },
    {
      icon: <Zap className='h-8 w-8' />,
      title: 'Framework Ready',
      description: 'Native support for React, Next.js, Vue, and other modern frameworks with TypeScript.',
      features: ['TypeScript support', 'Framework components', 'Tree-shakeable'],
    },
    {
      icon: <Shield className='h-8 w-8' />,
      title: 'Self-Hosted Option',
      description: 'Deploy on your own infrastructure with Docker for complete data ownership and control.',
      features: ['Docker deployment', 'Complete control', 'GDPR compliant'],
    },
  ];

  return (
    <section className='py-20'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
            Get started in <span className='text-blue-600 dark:text-blue-400'>under 2 minutes</span>
          </h2>
          <p className='text-muted-foreground mx-auto max-w-2xl text-xl'>
            Add our lightweight script and start collecting cookieless, privacy-friendly analytics immediately. No
            cookies, no personal data, no consent banners required.
          </p>
        </div>

        <div className='mx-auto grid max-w-6xl gap-8 md:grid-cols-3'>
          {integrationMethods.map((method, index) => (
            <Card key={index} className='dark:metric-card text-center'>
              <CardHeader>
                <div className='text-primary mx-auto mb-4'>{method.icon}</div>
                <CardTitle className='text-xl'>{method.title}</CardTitle>
                <CardDescription>{method.description}</CardDescription>
              </CardHeader>
              <CardContent>
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
          <Button size='lg' className='mb-4' asChild>
            <a href='/docs' title='Betterlytics Integration Guide'>
              View Integration Guide
            </a>
          </Button>
          <p className='text-muted-foreground text-sm'>
            Detailed installation instructions for all platforms and frameworks
          </p>
        </div>
      </div>
    </section>
  );
}
