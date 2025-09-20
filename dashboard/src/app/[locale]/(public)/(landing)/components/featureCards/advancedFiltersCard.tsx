import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';
import {
  ArrowRight,
  Target,
  Megaphone,
  Tag,
  ExternalLink,
  Laptop,
  Zap,
  Flag,
  LinkIcon,
  Monitor,
  Globe,
} from 'lucide-react';

export default async function AdvancedFiltersCard() {
  const t = await getTranslations('public.landing.cards.advancedFilters');
  const filterCategories = [
    { name: 'URL', icon: <LinkIcon className='h-4 w-4' /> },
    { name: 'Device Type', icon: <Monitor className='h-4 w-4' /> },
    { name: 'Country Code', icon: <Flag className='h-4 w-4' /> },
    { name: 'Browser', icon: <Globe className='h-4 w-4' /> },
    { name: 'Operating System', icon: <Laptop className='h-4 w-4' /> },
    { name: 'Event Name', icon: <Zap className='h-4 w-4' /> },
    { name: 'Referrer Source', icon: <ExternalLink className='h-4 w-4' /> },
    { name: 'Referrer Medium', icon: <ArrowRight className='h-4 w-4' /> },
    { name: 'UTM Source', icon: <Tag className='h-4 w-4' /> },
    { name: 'UTM Medium', icon: <Megaphone className='h-4 w-4' /> },
    { name: 'UTM Campaign', icon: <Target className='h-4 w-4' /> },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>{t('title')}</CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex flex-wrap gap-2'>
          {filterCategories.slice(0, 12).map((filter) => (
            <div
              key={filter.name}
              className='bg-card/80 border-border/50 flex items-center space-x-1.5 rounded-full border px-3 py-1.5 text-sm'
            >
              {filter.icon}
              <span>{filter.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
