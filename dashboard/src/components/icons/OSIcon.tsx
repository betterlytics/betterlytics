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
    <>
      <StaticIcon
        src={`/os-icons/${def.icon.file}`}
        label={def.label}
        mono={def.icon.mono}
        className={cn(className, 'dark:hidden')}
      />
      <StaticIcon
        src={`/os-icons/${def.iconDark.file}`}
        label={def.label}
        mono={def.iconDark.mono}
        className={cn(className, 'hidden dark:inline-block')}
      />
    </>
  );
}
