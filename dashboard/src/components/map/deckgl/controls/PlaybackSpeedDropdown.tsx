'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const PLAYBACK_SPEEDS = [2, 1.75, 1.5, 1.25, 1, 0.75, 0.5, 0.25] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export function PlaybackSpeedDropdown({
  speed,
  onChange,
}: {
  speed: PlaybackSpeed;
  onChange: (speed: PlaybackSpeed) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='bg-secondary rounded-md px-2 py-1 text-sm'>
        Speed: x{speed}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {PLAYBACK_SPEEDS.map((s) => (
          <DropdownMenuItem key={s} onClick={() => onChange(s)}>
            x{s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
