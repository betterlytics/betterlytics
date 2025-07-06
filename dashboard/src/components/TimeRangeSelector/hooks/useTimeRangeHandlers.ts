'use client';

import { useCallback, useEffect } from 'react';
import {
  TimeRangeValue,
  getCompareRangeForTimePresets,
  getDateRangeForTimePresets,
  getDateWithTimeOfDay,
  getEndDateWithGranularity,
  getStartDateWithGranularity,
} from '@/utils/timeRanges';
import {
  GranularityRangeValues,
  getAllowedGranularities,
  getValidGranularityFallback,
} from '@/utils/granularityRanges';
import { endOfDay, startOfDay } from 'date-fns';

export type TempState = {
  range: TimeRangeValue;
  granularity: GranularityRangeValues;
  customStart: Date | undefined;
  customEnd: Date | undefined;
  compareEnabled: boolean;
  compareStart: Date | undefined;
  compareEnd: Date | undefined;
};

interface UseTimeRangeHandlersProps {
  tempState: TempState;
  updateTempState: (updates: Partial<TempState>) => void;
  allowedGranularities: GranularityRangeValues[];
  onApply: (tempState: TempState) => void;
}

function getDateRangeWithGranularity(
  range: Exclude<TimeRangeValue, 'custom'>,
  granularity: GranularityRangeValues,
) {
  const preset = getDateRangeForTimePresets(range);

  const startDate = getStartDateWithGranularity(preset.startDate, granularity);
  const endDate = getEndDateWithGranularity(preset.endDate, granularity);

  return { startDate, endDate };
}

function getCompareRangeWithGranularity(
  range: TimeRangeValue,
  granularity: GranularityRangeValues,
  startDate: Date,
  endDate: Date,
) {
  if (range === 'custom') {
    return {};
  }

  const preset = getCompareRangeForTimePresets(range);

  const compareStart = getStartDateWithGranularity(
    getDateWithTimeOfDay(preset.compareStart, startDate),
    granularity,
  );
  const compareEnd = getEndDateWithGranularity(getDateWithTimeOfDay(preset.compareEnd, endDate), granularity);

  return { compareStart, compareEnd };
}

export function useTimeRangeHandlers({
  tempState,
  updateTempState,
  allowedGranularities,
  onApply,
}: UseTimeRangeHandlersProps) {
  const handleQuickSelect = useCallback(
    (value: TimeRangeValue) => {
      if (value === 'custom') {
        updateTempState({ range: value });
        return;
      }

      const granularityRange = getDateRangeForTimePresets(value);
      const granularity = getValidGranularityFallback(
        tempState.granularity,
        getAllowedGranularities(granularityRange.startDate, granularityRange.endDate),
      );

      const { startDate, endDate } = getDateRangeWithGranularity(value, granularity);
      const compare = getCompareRangeWithGranularity(value, granularity, startDate, endDate);

      updateTempState({
        range: value,
        granularity,
        customStart: startDate,
        customEnd: endDate,
        ...compare,
      });
    },
    [updateTempState, tempState.granularity],
  );

  const handleGranularitySelect = useCallback(
    (granularity: GranularityRangeValues) => {
      if (!allowedGranularities.includes(granularity)) return;

      if (tempState.range === 'custom') {
        updateTempState({ granularity });
        return;
      }

      const { startDate, endDate } = getDateRangeWithGranularity(tempState.range, granularity);

      updateTempState({
        granularity,
        customStart: startDate,
        customEnd: endDate,
      });
    },
    [updateTempState, allowedGranularities, tempState.range],
  );

  const handleStartDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      updateTempState({
        range: 'custom',
        customStart: startOfDay(date),
        customEnd: tempState.customEnd && endOfDay(tempState.customEnd),
      });
    },
    [updateTempState, tempState.customEnd],
  );

  const handleEndDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;
      updateTempState({
        range: 'custom',
        customEnd: endOfDay(date),
        customStart: tempState.customStart && startOfDay(tempState.customStart),
      });
    },
    [updateTempState, tempState.customStart],
  );

  const handleCompareEnabledChange = useCallback(
    (enabled: boolean) => {
      updateTempState({ compareEnabled: enabled });
    },
    [updateTempState],
  );

  const handleCompareStartDateSelect = useCallback(
    (date: Date | undefined) => {
      updateTempState({
        compareStart: date,
      });
    },
    [updateTempState, tempState],
  );

  const handleCompareEndDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date || !tempState.customStart || !tempState.customEnd) {
        return;
      }

      const timeDifference = tempState.customEnd.getTime() - tempState.customStart.getTime();

      const compareEnd = getDateWithTimeOfDay(date, tempState.customEnd);
      const compareStart = new Date(compareEnd.getTime() - timeDifference);

      updateTempState({
        compareStart,
        compareEnd,
      });
    },
    [updateTempState, tempState],
  );

  const handleApply = useCallback(() => {
    let finalGranularity = tempState.granularity;
    if (!allowedGranularities.includes(finalGranularity)) {
      finalGranularity = getValidGranularityFallback(finalGranularity, allowedGranularities);
    }

    const finalState = {
      ...tempState,
      granularity: finalGranularity,
    };

    onApply(finalState);
  }, [tempState, allowedGranularities, onApply]);

  useEffect(() => {
    updateTempState({
      granularity: getValidGranularityFallback(tempState.granularity, allowedGranularities),
    });
  }, [tempState.granularity, allowedGranularities, updateTempState]);

  useEffect(() => {
    if (!tempState.compareEnabled || !tempState.customEnd || !tempState.customStart || !tempState.compareStart) {
      return;
    }

    const timeDifference = tempState.customEnd.getTime() - tempState.customStart.getTime();

    const compareStart = getDateWithTimeOfDay(tempState.compareStart, tempState.customStart);
    const compareEnd = new Date(compareStart.getTime() + timeDifference);

    if (
      tempState.compareStart.getTime() !== compareStart.getTime() ||
      tempState.compareEnd?.getTime() !== compareEnd.getTime()
    ) {
      updateTempState({ compareStart, compareEnd });
    }
  }, [tempState, updateTempState]);

  return {
    handleQuickSelect,
    handleGranularitySelect,
    handleStartDateSelect,
    handleEndDateSelect,
    handleCompareEnabledChange,
    handleCompareStartDateSelect,
    handleCompareEndDateSelect,
    handleApply,
  };
}
