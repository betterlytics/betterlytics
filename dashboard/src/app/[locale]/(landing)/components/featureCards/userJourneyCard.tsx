import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

export default async function UserJourneyCard() {
  const t = await getTranslations('public.landing.cards.journeys');
  const journeyData = {
    start: { name: 'Landing Page', users: 1000 },
    middle: { name: 'Product Page', users: 650 },
    pathA: [
      { name: 'Add to Cart', users: 320 },
      { name: 'Checkout', users: 180 },
    ],
    pathB: [
      { name: 'Search', users: 330 },
      { name: 'Compare', users: 120 },
    ],
  };

  const JourneyNode = ({ name, users, isStart }: { name: string; users: number; isStart?: boolean }) => (
    <div className='flex flex-col items-center'>
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium ${
          isStart ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-muted/50 border-border/30'
        }`}
      >
        {users}
      </div>
      <div className='mt-1 text-center'>
        <div className='text-xs font-medium'>{name}</div>
      </div>
    </div>
  );

  const VerticalArrow = () => (
    <div className='flex justify-center py-1'>
      <div className='bg-border h-4 w-px'></div>
    </div>
  );

  const BranchingConnector = () => (
    <div className='relative flex h-8 w-full justify-center'>
      <div className='bg-border absolute top-0 h-4 w-px'></div>
      <div className='bg-border absolute top-4 right-2/9 left-2/9 h-px'></div>
      <div className='bg-border absolute top-4 left-2/9 h-4 w-px'></div>
      <div className='bg-border absolute top-4 right-2/9 h-4 w-px'></div>
    </div>
  );

  return (
    <Card>
      <CardHeader className='pb-0'>
        <CardTitle className='text-xl'>{t('title')}</CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className='space-y-3'>
        <div className='flex flex-col items-center'>
          <JourneyNode name={journeyData.start.name} users={journeyData.start.users} isStart />
          <VerticalArrow />
          <JourneyNode name={journeyData.middle.name} users={journeyData.middle.users} />
          <BranchingConnector />
          <div className='grid w-full grid-cols-2 gap-8'>
            <div className='flex flex-col items-center space-y-1'>
              {journeyData.pathA.map((step, index) => (
                <div key={step.name} className='flex flex-col items-center space-y-1'>
                  <JourneyNode name={step.name} users={step.users} />
                  {index < journeyData.pathA.length - 1 && <VerticalArrow />}
                </div>
              ))}
            </div>
            <div className='flex flex-col items-center space-y-1'>
              {journeyData.pathB.map((step, index) => (
                <div key={step.name} className='flex flex-col items-center space-y-1'>
                  <JourneyNode name={step.name} users={step.users} />
                  {index < journeyData.pathB.length - 1 && <VerticalArrow />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
