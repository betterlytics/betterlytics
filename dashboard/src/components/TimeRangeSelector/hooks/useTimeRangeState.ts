'use client';

import { useState, useMemo, useCallback } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { TIME_RANGE_PRESETS, TimeRangeValue, getDateRangeForTimePresets } from '@/utils/timeRanges';
import { GranularityRangeValues, getAllowedGranularities } from '@/utils/granularityRanges';
import { convertUTCDatesToUser, type UTCDate, type TZDate, createTimezoneHelper } from '@/utils/timezoneHelpers';

interface TempState {
  range: TimeRangeValue;
  granularity: GranularityRangeValues;
  customStart: TZDate | undefined;
  customEnd: TZDate | undefined;
  compareEnabled: boolean;
  compareStart: TZDate | undefined;
  compareEnd: TZDate | undefined;
}

export function useTimeRangeState() {
  const context = useTimeRangeContext();

  const currentActivePreset = useMemo<TimeRangeValue>(() => {
    if (!context.startDate || !context.endDate) return 'custom';

    for (const preset of TIME_RANGE_PRESETS) {
      if (preset.value === 'custom') continue;

      const { startDate: presetStart, endDate: presetEnd } = getDateRangeForTimePresets(
        preset.value,
        context.userTimezone,
      );

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
  }, [context.startDate, context.endDate, context.userTimezone]);

  const createInitialTempState = useCallback((): TempState => {
    const helper = createTimezoneHelper(context.userTimezone);
    let customStart = helper.toUserTimezone(context.startDate);
    let customEnd = helper.toUserTimezone(context.endDate);

    if (currentActivePreset !== 'custom') {
      // For presets, get UTC dates then convert to user timezone for display
      const { startDate, endDate } = getDateRangeForTimePresets(currentActivePreset, context.userTimezone);
      customStart = helper.toUserTimezone(startDate);
      customEnd = helper.toUserTimezone(endDate);
    }

    let compareStart = context.compareStartDate && helper.toUserTimezone(context.compareStartDate);
    let compareEnd = context.compareEndDate && helper.toUserTimezone(context.compareEndDate);

    return {
      range: currentActivePreset,
      granularity: context.granularity,
      customStart,
      customEnd,
      compareEnabled: context.compareEnabled,
      compareStart,
      compareEnd,
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
      const range = getDateRangeForTimePresets(tempState.range, context.userTimezone);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    if (!startDate || !endDate) return ['day'];
    return getAllowedGranularities(startDate, endDate);
  }, [tempState.range, tempState.customStart, tempState.customEnd, context.userTimezone]);

  const periodDurationDays = useMemo(() => {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (tempState.range === 'custom') {
      startDate = tempState.customStart;
      endDate = tempState.customEnd;
    } else {
      const range = getDateRangeForTimePresets(tempState.range, context.userTimezone);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    if (!startDate || !endDate) return null;
    return differenceInCalendarDays(endDate, startDate);
  }, [tempState.range, tempState.customStart, tempState.customEnd, context.userTimezone]);

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
    periodDurationDays,

    // Actions
    updateTempState,
    resetTempState,
  };
}
