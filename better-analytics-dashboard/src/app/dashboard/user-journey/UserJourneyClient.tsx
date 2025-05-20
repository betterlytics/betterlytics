'use client';

import { useState } from "react";
import { fetchUserJourneyAction } from "@/app/actions/userJourney";
import UserJourneyChart from "../../../components/analytics/UserJourneyChart";
import { useQuery } from "@tanstack/react-query";
import { useTimeRangeContext } from "@/contexts/TimeRangeContextProvider";
import TimeRangeSelector from "@/components/TimeRangeSelector";

const STEP_OPTIONS = [1, 2, 3, 4, 5];
const JOURNEY_OPTIONS = [5, 10, 20, 50, 100];

export default function UserJourneyClient({ siteId }: { siteId: string }) {
    const [numberOfSteps, setNumberOfSteps] = useState<number>(3);
    const [numberOfJourneys, setNumberOfJourneys] = useState<number>(10);

    const { startDate, endDate } = useTimeRangeContext();

    const { data: journeyData, isLoading, error } = useQuery({
      queryKey: ['userJourney', siteId, startDate, endDate, numberOfSteps, numberOfJourneys],
      queryFn: () => {
        return fetchUserJourneyAction(
          siteId,
          startDate,
          endDate,
          numberOfSteps,
          numberOfJourneys
        );
      }
    });

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch journey data";

    return (
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">User Journey</h1>
              <p className="text-sm text-gray-500">Analytics and insights for your website</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative inline-block text-left">
                <label htmlFor="steps-select" className="sr-only">Number of Steps</label>
                <select
                  id="steps-select"
                  className="border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={numberOfSteps}
                  onChange={e => setNumberOfSteps(Number(e.target.value))}
                >
                  {STEP_OPTIONS.map(steps => (
                    <option key={steps} value={steps}>{steps} Steps</option>
                  ))}
                </select>
              </div>
              <div className="relative inline-block text-left">
                <label htmlFor="journeys-select" className="sr-only">Number of Journeys</label>
                <select
                  id="journeys-select"
                  className="border rounded px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={numberOfJourneys}
                  onChange={e => setNumberOfJourneys(Number(e.target.value))}
                >
                  {JOURNEY_OPTIONS.map(journeys => (
                    <option key={journeys} value={journeys}>Top {journeys} Journeys</option>
                  ))}
                </select>
              </div>
              <TimeRangeSelector />
            </div>
          </div>
          
          <div className="mt-8 relative min-h-[400px]">
            {!isLoading && !error && journeyData && journeyData.nodes.length > 0 && (
              <div className="bg-white p-4 rounded-lg">
                <UserJourneyChart data={journeyData} />
              </div>
            )}
            
            {!isLoading && error && (
              <div className="bg-red-50 p-8 rounded-md text-center">
                <p className="text-red-500">{errorMessage}</p>
              </div>
            )}
            
            {journeyData?.nodes.length === 0 && (
              <div className="bg-gray-50 p-8 rounded-md text-center">
                <p className="text-gray-500">No journey data available for the selected criteria.</p>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-gray-700">Loading journey data...</p>
                </div>
              </div>
            )}
          </div>
        </div>
    )
}
