import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveBrowser } from '@/constants/browserIcons';
import { StaticIcon } from './StaticIcon';

interface BrowserIconProps {
  name: string;
  className?: string;
}

export function BrowserIcon({ name, className = 'h-3.5 w-3.5' }: BrowserIconProps) {
  const def = resolveBrowser(name);

  if (!def) return <Globe className={cn('shrink-0', className)} />;

  return <StaticIcon src={`/browser-icons/${def.file}`} label={def.label} mono={def.mono} className={className} />;
}
