'use client';

import { useQuery } from '@tanstack/react-query';
import { FunnelDetails } from "@/entities/funnels";
import { fetchFunnelsAction } from "@/app/actions/funnels";
import { Badge } from '@/components/ui/badge';
import { ReactNode, useMemo } from 'react';
import { analyzeFunnel } from './analytics';
import Link from 'next/link';
import { ArrowRightCircleIcon } from 'lucide-react';

export default function FunnelsClient() {
  const { data: funnels = [], isLoading: funnelsLoading } = useQuery<FunnelDetails[]>({
    queryKey: ['funnels', 'default-site'],
    queryFn: () => fetchFunnelsAction('default-site'),
  });

  const funnelsData = useMemo(() => funnels.map((funnel) => analyzeFunnel(funnel)), [funnels]);

  if (funnelsLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {
        funnelsData
          .map((funnel) => (
            <div key={funnel.id} className='grid grid-cols-5 bg-white p-3 rounded-md shadow mb-5'>
              <div className="flex col-span-1 gap-2">
                <h1 className="text-xl font-semibold">{funnel.name}</h1>
                <Badge className="rounded-full mt-0.5 text-gray-800" variant='outline'>{funnel.steps.length} steps</Badge>  
              </div>
              <div className='grid col-span-3 grid-cols-4 gap-2'>
                <InlineDataDisplay
                  title={'conversion rate'}
                  value={`${Math.floor(100 * funnel.conversionRate)}%`}
                />
                <InlineDataDisplay
                  title={'completed'}
                  value={funnel.visitorCount.min}
                />
                <InlineDataDisplay
                  title={'total users'}
                  value={funnel.visitorCount.max}
                />
                <InlineDataDisplay
                  title={'- largest drop-off'}
                  value={`${Math.floor(100 * funnel.biggestDropOff.dropoffRatio)}%`}
                />
              </div>

              <div className='col-span-1 flex justify-end'>
                <Link className='text-right mr-2' href={`/dashboard/funnels/${funnel.id}`}><ArrowRightCircleIcon /></Link>
              </div>
            </div>
          ))
      }
    </div>
  );
}

type InlineDataDisplayProps = {
  title: ReactNode;
  value: ReactNode;
}
function InlineDataDisplay({ title, value }: InlineDataDisplayProps) {
  return (
    <div className='flex justify-center gap-2 place-items-center border-1 px-2 rounded-md shadow'>
      <p className='text-lg font-semibold'>{value}</p>
      <h4 className='text-gray-700'>{title}</h4>
    </div>
  )
}