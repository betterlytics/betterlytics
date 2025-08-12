import { Shield, Zap, Database, Eye, Code, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: <Shield className='h-6 w-6' />,
    title: 'EU-Based & GDPR Compliant',
    description:
      'Servers hosted in the EU with strict data protection standards. Complete GDPR compliance with anonymous data collection and robust privacy safeguards.',
  },
  {
    icon: <CheckCircle className='h-6 w-6' />,
    title: 'No Consent Banner Required',
    description:
      'Fully anonymous analytics mean no cookie banners, no GDPR consent forms, no user friction. Just install and start tracking immediately.',
  },
  {
    icon: <Database className='h-6 w-6' />,
    title: 'Complete Data Ownership',
    description:
      'Your data stays yours forever. Self-host with our open-source version or use our secure cloud infrastructure.',
  },
  {
    icon: <Eye className='h-6 w-6' />,
    title: 'Real-time Business Insights',
    description:
      'Lightning-fast visitor tracking and conversion analytics worldwide. Beautiful dashboards help you make data-driven decisions instantly.',
  },
  {
    icon: <Zap className='h-6 w-6' />,
    title: 'Lightweight & Developer-Friendly',
    description:
      'Under 1KB script, open-source codebase, and comprehensive APIs. Built by developers, for developers.',
  },
  {
    icon: <Code className='h-6 w-6' />,
    title: 'Simple Setup, Powerful Features',
    description:
      'One-line integration for any website. Advanced customization options and enterprise-grade features available.',
  },
];

export function PrinciplesSection() {
  return (
    <section id='features' className='py-20'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
            <span className='text-blue-600 dark:text-blue-400'>High-performance</span> analytics that respects
            privacy
          </h2>
          <p className='text-muted-foreground mx-auto max-w-2xl text-xl'>
            Real-time insights, lightning-fast performance, and complete privacy compliance for everyone
          </p>
        </div>
        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature, index) => (
            <Card key={index} className='dark:metric-card dark:shadow-card-glow'>
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
