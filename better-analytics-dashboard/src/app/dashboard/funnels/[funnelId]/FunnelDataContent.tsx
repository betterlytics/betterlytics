'use client';

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFunnelDetailsAction } from "@/app/actions/funnels";
import { FunnelDetails } from "@/entities/funnels";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import SummaryCard from "@/components/SummaryCard";
import { ArrowRight } from "lucide-react";
import { analyzeFunnel } from "../analytics";

type FunnelDataContentProps = {
  funnelId: string;
};

export function FunnelDataContent({ funnelId }: FunnelDataContentProps) {
  
  const { data: funnel, isLoading: funnelLoading } = useQuery<FunnelDetails>({
    queryKey: ['funnel', 'default-site', funnelId],
    queryFn: () => fetchFunnelDetailsAction('default-site', funnelId),
  });

  const funnelData = useMemo(() => {
    return funnel && analyzeFunnel(funnel);
  }, [funnel]);

  if (funnelLoading || !funnel || !funnelData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white border-1 p-5 rounded-md grid grid-cols-3 gap-6">
      <div className="col-span-2 text-sm font-semibold">
        {
          funnelData
            .steps
            .map((step, index) => (
              <div key={step.page}>
                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-3">
                    <p className="flex justify-center items-center bg-gray-200 size-6 rounded-full font-medium text-xs">{index+1}</p>
                    <p>{step.page}</p>
                  </div>
                  <p className="mt-3">{step.visitors} users</p>
                </div>
                <div className="p-3 text-gray-600">
                  <Progress
                    className="h-4"
                    value={100 * step.visitorsRatio}
                    color="#22C55E"
                  />
                  <div className="flex justify-between items-end">
                    <p>{step.visitors} users</p>
                    <p className="text-right">{Math.floor(100 * step.visitorsRatio)}%</p>
                  </div>
                  <Progress
                    className="mt-2"
                    value={100 * step.dropoffRatio}
                    color="#F97315"
                  />
                  <div className="flex justify-between items-end">
                    <p>{step.dropoffCount} users dropped-off</p>
                    <p className="text-right">{Math.floor(100 * step.dropoffRatio)}%</p>
                  </div>
                </div>
                <hr />
              </div>
            ))
        }
      </div>
      <div className="col-span-1 text-sm border-l-1 pl-3 ">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-xl font-semibold">{funnel.name}</h1>
          <Badge className="rounded-full h-[50%] mt-1 text-gray-800" variant='outline'>{funnelData.steps.length} steps</Badge>  
        </div>
        <div className="flex flex-col gap-3 bg-gray-200 p-4 rounded-lg">
          <SummaryCard
            title="Overall conversion"
            value={`${Math.floor(100 * funnelData.conversionRate)}%`}
            changeText={""}
          />
          <SummaryCard
            title="Total visitors"
            value={`${funnelData.visitorCount.max}`}
            changeText={""}
          />
          <SummaryCard
            title="Total completed"
            value={`${funnelData.visitorCount.min}`}
            changeText={""}
          />
          <SummaryCard
            title="Biggest drop-off"
            value={<span className="text-sm flex text-ellipsis overflow-hidden">{funnelData.biggestDropOff.pageStep[0]} <ArrowRight size="18px" /> {funnelData.biggestDropOff.pageStep[1]}</span>}
            changeText={`${funnelData.biggestDropOff.dropoffCount} users (${Math.floor(100 * funnelData.biggestDropOff.dropoffRatio)}%)`}
            changeColor="text-orange-600"
          />
        </div>
      </div>
    </div>
  );
}
