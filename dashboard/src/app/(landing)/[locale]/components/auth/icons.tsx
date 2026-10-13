type IconProps = { className?: string };

export function GoogleMark({ className }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 24 24' aria-hidden>
      <path
        fill='#4285F4'
        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.31v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z'
      />
      <path
        fill='#34A853'
        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z'
      />
      <path fill='#FBBC05' d='M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z' />
      <path
        fill='#EA4335'
        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z'
      />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <path d='M1.75 10S4.75 4.25 10 4.25 18.25 10 18.25 10 15.25 15.75 10 15.75 1.75 10 1.75 10Z' />
      <circle cx='10' cy='10' r='2.75' />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <path d='M8.2 4.45A8.6 8.6 0 0 1 10 4.25c5.25 0 8.25 5.75 8.25 5.75a14.4 14.4 0 0 1-2.1 2.86M11.95 11.95A2.75 2.75 0 0 1 8.05 8.05M5.2 5.7C2.97 7.17 1.75 10 1.75 10s3 5.75 8.25 5.75a8.3 8.3 0 0 0 4.4-1.25M2.5 2.5l15 15' />
    </svg>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <path d='M13 8H3M7 4 3 8l4 4' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

export function AlertIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <circle cx='8' cy='8' r='6.25' />
      <path d='M8 4.75v3.75' strokeLinecap='round' />
      <circle cx='8' cy='11' r='.75' fill='currentColor' stroke='none' />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <path
        d='M10 1.75 3.25 4.5v4.75c0 4.1 2.85 7.6 6.75 9 3.9-1.4 6.75-4.9 6.75-9V4.5L10 1.75Z'
        strokeLinejoin='round'
      />
      <path d='m7 10 2.1 2.1L13.25 8' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='1.6' aria-hidden>
      <path d='m3.5 8.5 3 3 6-7' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

export function Spinner({ className }: IconProps) {
  return (
    <svg className={className} viewBox='0 0 16 16' fill='none' aria-hidden>
      <circle cx='8' cy='8' r='6.25' stroke='currentColor' strokeOpacity='.25' strokeWidth='1.5' />
      <path d='M14.25 8A6.25 6.25 0 0 0 8 1.75' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
    </svg>
  );
}
