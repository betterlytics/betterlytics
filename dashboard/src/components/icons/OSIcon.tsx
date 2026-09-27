import { Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveOSIcon } from '@/constants/operatingSystemIcons';
import { StaticIcon } from './StaticIcon';

interface OSIconProps {
  name: string;
  className?: string;
}

export function OSIcon({ name, className = 'h-3.5 w-3.5' }: OSIconProps) {
  const def = resolveOSIcon(name);

  if (!def) return <Monitor className={cn('shrink-0', className)} />;

  if (!def.iconDark) {
    return (
      <StaticIcon
        src={`/os-icons/${def.icon.file}`}
        label={def.label}
        mono={def.icon.mono}
        className={className}
      />
    );
  }

  return (
    <span
      role='img'
      aria-label={def.label}
      className={cn(
        'inline-block shrink-0 bg-(image:--icon-light) bg-contain bg-center bg-no-repeat align-[-0.125em]',
        'dark:bg-current dark:bg-none dark:mask-(--icon-dark) dark:mask-contain dark:mask-center dark:mask-no-repeat',
        className,
      )}
      style={
        {
          '--icon-light': `url(/os-icons/${def.icon.file})`,
          '--icon-dark': `url(/os-icons/${def.iconDark.file})`,
        } as React.CSSProperties
      }
    />
  );
}
