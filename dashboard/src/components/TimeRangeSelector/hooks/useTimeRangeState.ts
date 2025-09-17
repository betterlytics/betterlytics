'use client';

import { useState, useMemo, useCallback } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { TIME_RANGE_PRESETS, TimeRangeValue, getDateRangeForTimePresets } from '@/utils/timeRanges';
import { GranularityRangeValues, getAllowedGranularities } from '@/utils/granularityRanges';

interface TempState {
  range: TimeRangeValue;
  granularity: GranularityRangeValues;
  customStart: Date | undefined;
  customEnd: Date | undefined;
  compareEnabled: boolean;
  compareStart: Date | undefined;
  compareEnd: Date | undefined;
}

export function useTimeRangeState() {
  const context = useTimeRangeContext();

  const currentActivePreset = useMemo<TimeRangeValue>(() => {
    if (!context.startDate || !context.endDate) return 'custom';

    for (const preset of TIME_RANGE_PRESETS) {
      if (preset.value === 'custom') continue;

      const { startDate: presetStart, endDate: presetEnd } = getDateRangeForTimePresets(preset.value);

      if (
        presetStart &&
        presetEnd &&
        differenceInCalendarDays(context.startDate, presetStart) === 0 &&
        differenceInCalendarDays(context.endDate, presetEnd) === 0
      ) {
        return preset.value;
      }
    }
    return 'custom';
  }, [context.startDate, context.endDate]);

  const createInitialTempState = useCallback((): TempState => {
    let customStart = context.startDate;
    let customEnd = context.endDate;

    if (currentActivePreset !== 'custom') {
      const { startDate, endDate } = getDateRangeForTimePresets(currentActivePreset);
      customStart = startDate;
      customEnd = endDate;
    }

    return {
      range: currentActivePreset,
      granularity: context.granularity,
      customStart,
      customEnd,
      compareEnabled: context.compareMode !== 'off',
      compareStart: context.compareStartDate,
      compareEnd: context.compareEndDate,
    };
  }, [currentActivePreset, context]);

  const [tempState, setTempState] = useState<TempState>(createInitialTempState);

  const allowedGranularities = useMemo((): GranularityRangeValues[] => {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (tempState.range === 'custom') {
      startDate = tempState.customStart;
      endDate = tempState.customEnd;
    } else {
      const range = getDateRangeForTimePresets(tempState.range);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    if (!startDate || !endDate) return ['day'];
    return getAllowedGranularities(startDate, endDate);
  }, [tempState.range, tempState.customStart, tempState.customEnd]);

  const updateTempState = useCallback((updates: Partial<TempState>) => {
    setTempState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetTempState = useCallback(() => {
    setTempState(createInitialTempState());
  }, [createInitialTempState]);

  return {
    // Context values
    context,
    currentActivePreset,

    // Temp state
    tempState,
    allowedGranularities,

    // Actions
    updateTempState,
    resetTempState,
  };
}
