"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

type VisualProgress = {
  colorHex: string;
  value: number;
  name: string;
}

type MultiProgressProps = Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, 'value'> & {
  progresses: VisualProgress[];
  maxValue: number;
}

function MultiProgress({
  className,
  progresses,
  maxValue,
  ...props
}: MultiProgressProps) {
  
  const computedMaxValue = React.useMemo(
    () => Math.max(maxValue, 1),
    [maxValue]
  );

  const computedProgresses = React.useMemo(
    () => progresses.map((progress) => ({...progress, value: 100 * (progress.value / computedMaxValue) })),
    [progresses, computedMaxValue]
  );

  console.log(computedProgresses)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-state="loading"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {
        computedProgresses.map(({ value, colorHex, name }) => (
          <ProgressPrimitive.Indicator
            key={name}
            className="h-full w-full flex-1 transition-all absolute"
            style={{ transform: `translateX(-${100 - (value || 0)}%)`, background: colorHex }}
          />
        ))
      }
    </ProgressPrimitive.Root>
  )
}

export { MultiProgress }
