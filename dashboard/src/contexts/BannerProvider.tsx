'use client';

import { cn } from '@/lib/utils';
import React, { useCallback, useState, type Dispatch } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, ChevronDown, InfoIcon } from 'lucide-react';

type Level = 'info' | 'warning' | 'error' | 'success';

const STORAGE_KEY = 'banner:dismissed:v1';
type DismissedSet = string[];

function readDismissed(): DismissedSet {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DismissedSet) : [];
  } catch {
    return [];
  }
}

function writeDismissed(list: DismissedSet): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function markDismissed(id: string): void {
  const existing = new Set(readDismissed());
  existing.add(id);
  writeDismissed(Array.from(existing));
}

function isDismissed(id: string): boolean {
  return readDismissed().includes(id);
}

type Banner = {
  id: string;
  level: Level;
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  dismissible?: boolean;
  showIcon?: boolean;
  custom?: React.ReactNode;
  scope?: 'route' | 'global';
  sticky?: boolean;
};

type BannerContextProps = {
  addBanner: Dispatch<Banner>;
  removeBanner: Dispatch<string>;
  dismissBanner: Dispatch<string>;
};

const BannerContext = React.createContext<BannerContextProps>({
  addBanner: () => {},
  removeBanner: () => {},
  dismissBanner: () => {},
});

type BannerProviderProps = {
  children: React.ReactNode;
};

export function BannerProvider({ children }: BannerProviderProps) {
  const pathname = usePathname();
  const routeKey = pathname ?? '';
  type BannerWithMeta = Banner & { __route?: string };
  const [banners, setBanners] = useState<BannerWithMeta[]>([]);

  const addBanner = useCallback(
    (banner: Banner) => {
      setBanners((prev) => {
        const existingIndex = prev.findIndex((bann) => bann.id === banner.id);
        const withMeta: BannerWithMeta =
          banner.scope === 'global' ? { ...banner } : { ...banner, __route: routeKey };

        if (existingIndex !== -1) {
          const next = [...prev];
          next[existingIndex] = withMeta;
          return next;
        }
        return [...prev, withMeta];
      });
    },
    [routeKey],
  );

  const removeBanner = useCallback((id: string) => {
    setBanners((prev) => {
      const removedDuplicate = prev.filter((bann) => bann.id !== id);
      return removedDuplicate;
    });
  }, []);

  const dismissBanner = useCallback(
    (id: string) => {
      setBanners((prev) => {
        const toDismiss = prev.find((bann) => bann.id === id);
        if (toDismiss) {
          markDismissed(id);
        }
        return prev.filter((bann) => bann.id !== id);
      });
    },
    [routeKey],
  );

  const nowVisible = banners
    .filter((bann) => bann.scope === 'global' || bann.__route === routeKey)
    .filter((bann) => !isDismissed(bann.id))
    .sort((a, b) => Number(Boolean(b.sticky)) - Number(Boolean(a.sticky)));

  return (
    <BannerContext.Provider value={{ addBanner, removeBanner, dismissBanner }}>
      <div className='h-full w-full'>
        <div className={cn('w-full space-y-0 overflow-hidden p-0', nowVisible.length && 'border-b')}>
          {nowVisible.map((banner) => (
            <BannerBanner key={banner.id} banner={banner} banners={nowVisible} />
          ))}
        </div>
        {children}
      </div>
    </BannerContext.Provider>
  );
}

export function useBannerContext() {
  return React.useContext(BannerContext);
}

type BannerBannerProps = {
  banner: Banner;
  banners: Banner[];
};

export function BannerBanner({ banner, banners }: BannerBannerProps) {
  const { dismissBanner } = useBannerContext();
  const { id, level, title, description, action, custom, dismissible, showIcon = true } = banner;

  if (custom) return <>{custom}</>;

  const bgClasses = cn('box-border w-full px-3 py-1.5 text-xs sm:px-6 border-b', {
    'bg-primary text-white': level === 'info',
    'dark:bg-amber-500 bg-amber-500/70 text-black': level === 'warning',
    'dark:bg-red-500 bg-red-500/80 text-black': level === 'error',
    'dark:bg-green-500 bg-green-500/70 text-black': level === 'success',
    'border-b': banners.length > 0,
  });

  const icons = {
    info: <InfoIcon className='h-4 w-4' />,
    warning: <AlertTriangleIcon className='h-4 w-4' />,
    error: <AlertCircleIcon className='h-4 w-4' />,
    success: <CheckCircleIcon className='h-4 w-4' />,
  };

  return (
    <div className={bgClasses}>
      <div className='sm:hidden'>
        <MobileBannerContent
          id={id}
          title={title}
          description={description}
          action={action}
          dismissible={dismissible}
          onDismiss={() => dismissBanner(id)}
        />
      </div>

      <div className='hidden sm:block'>
        <DesktopBannerContent
          showIcon={showIcon}
          title={title}
          description={description}
          action={action}
          dismissible={dismissible}
          icon={icons[level]}
          onDismiss={() => dismissBanner(id)}
        />
      </div>
    </div>
  );
}

type BannerContentBaseProps = {
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  dismissible?: boolean;
  onDismiss: () => void;
  showIcon?: boolean;
  icon?: React.ReactNode;
};

type MobileBannerContentProps = BannerContentBaseProps & { id: string };

function MobileBannerContent({
  id,
  title,
  description,
  action,
  dismissible,
  onDismiss,
}: MobileBannerContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className='flex w-full items-center gap-2'>
        <div className='min-w-0 flex-1'>
          {title && (
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className='flex h-auto w-full items-center gap-1 p-0 text-left text-xs leading-snug font-semibold text-current'
              aria-expanded={isExpanded}
              aria-controls={`banner-desc-${id}`}
              aria-label={isExpanded ? 'Hide details' : 'Show details'}
            >
              <span className='truncate'>{title}</span>
              {description && (
                <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-180')} />
              )}
            </button>
          )}
        </div>

        {action && (
          <div className='h-7 shrink-0 [&>*]:h-7 [&>*]:min-h-0 [&>*]:px-2 [&>*]:py-0 [&>*]:text-xs [&>*]:leading-none'>
            {action}
          </div>
        )}

        {dismissible && (
          <Button
            variant='ghost'
            size='icon'
            onClick={onDismiss}
            className='hover:bg-accent/20 dark:hover:bg-accent/20 h-7 w-7 cursor-pointer rounded-md text-current hover:text-current'
            aria-label='Dismiss banner'
          >
            ✕
          </Button>
        )}
      </div>

      {description && (
        <div
          id={`banner-desc-${id}`}
          className={cn(
            'mt-1 text-left text-xs leading-snug transition-all duration-200',
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 overflow-hidden opacity-0',
          )}
          onClick={() => setIsExpanded((v) => !v)}
        >
          <span>{description}</span>
        </div>
      )}
    </>
  );
}

function DesktopBannerContent({
  title,
  description,
  action,
  dismissible,
  onDismiss,
  showIcon,
  icon,
}: BannerContentBaseProps) {
  return (
    <div className='flex w-full items-center gap-2'>
      {showIcon && icon}
      <div className='min-w-0 flex-1'>
        <div className='flex min-w-0 items-center'>
          {title && <span className='text-xs leading-snug font-semibold'>{title}</span>}
          {description && <span className='text-xs leading-snug'>{': ' + description}</span>}
        </div>
      </div>
      {action && (
        <div className='h-7 shrink-0 [&>*]:h-7 [&>*]:min-h-0 [&>*]:px-2 [&>*]:py-0 [&>*]:text-xs [&>*]:leading-none'>
          {action}
        </div>
      )}
      {dismissible && (
        <Button
          variant='ghost'
          size='icon'
          onClick={onDismiss}
          className='hover:bg-accent/20 dark:hover:bg-accent/20 h-7 w-7 cursor-pointer rounded-md text-current hover:text-current'
          aria-label='Dismiss banner'
        >
          ✕
        </Button>
      )}
    </div>
  );
}
