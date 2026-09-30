import type { SVGProps } from 'react';

/*
 * The flags the illustrations show, from country-flag-icons (MIT, © 2020 catamphetamine).
 * Kept here rather than imported: the app imports the package's whole flag set, so any
 * import of it pulls every flag (~50 kB gzipped) into the landing's bundle for these few.
 */

type FlagProps = SVGProps<SVGSVGElement> & { title?: string };

function BR({ title, ...props }: FlagProps) {
  return (
    <svg viewBox='0 0 513 342' {...props}>
      {title ? <title>{title}</title> : null}
      <path fill='#009b3a' d='M0 0h513v342H0z' />
      <path fill='#fedf00' d='m256.5 19.3 204.9 151.4L256.5 322 50.6 170.7z' />
      <circle fill='#FFF' cx='256.5' cy='171' r='80.4' />
      <path
        fill='#002776'
        d='M215.9 165.7c-13.9 0-27.4 2.1-40.1 6 .6 43.9 36.3 79.3 80.3 79.3 27.2 0 51.3-13.6 65.8-34.3-24.9-31-63.2-51-106-51zM334.9 186c.9-5 1.5-10.1 1.5-15.4 0-44.4-36-80.4-80.4-80.4-33.1 0-61.5 20.1-73.9 48.6 10.9-2.2 22.1-3.4 33.6-3.4 46.8.1 89 19.5 119.2 50.6z'
      />
    </svg>
  );
}

function CA({ title, ...props }: FlagProps) {
  return (
    <svg viewBox='0 0 513 342' {...props}>
      {title ? <title>{title}</title> : null}
      <path fill='#FFF' d='M0 0h513v342H0z' />
      <g fill='red'>
        <path d='M0 0h142v342H0zM371 0h142v342H371zM306.5 206l50.4-25.2-25.2-12.6V143l-50.4 25.2 25.2-50.4h-25.2L256.1 80l-25.2 37.8h-25.2l25.2 50.4-50.4-25.2v25.2l-25.2 12.6 50.4 25.2-12.6 25.2h50.4V269h25.2v-37.8h50.4z' />
      </g>
    </svg>
  );
}

function DE({ title, ...props }: FlagProps) {
  return (
    <svg viewBox='0 0 513 342' {...props}>
      {title ? <title>{title}</title> : null}
      <path fill='#D80027' d='M0 0h513v342H0z' />
      <path d='M0 0h513v114H0z' />
      <path fill='#FFDA44' d='M0 228h513v114H0z' />
    </svg>
  );
}

function DK({ title, ...props }: FlagProps) {
  return (
    <svg viewBox='0 0 513 342' {...props}>
      {title ? <title>{title}</title> : null}
      <path fill='#c60c30' d='M0 0h513v342H0z' />
      <path fill='#FFF' d='M190 0h-60v140H0v60h130v142h60V200h323v-60H190z' />
    </svg>
  );
}

function FR({ title, ...props }: FlagProps) {
  return (
    <svg viewBox='0 0 513 342' {...props}>
      {title ? <title>{title}</title> : null}
      <path fill='#FFF' d='M0 0h513v342H0z' />
      <path fill='#00318A' d='M0 0h171v342H0z' />
      <path fill='#D80027' d='M342 0h171v342H342z' />
    </svg>
  );
}

function GB({ title, ...props }: FlagProps) {
  return (
    <svg viewBox='0 0 513 342' {...props}>
      {title ? <title>{title}</title> : null}
      <g fill='#FFF'>
        <path d='M0 0h513v341.3H0V0z' />
        <path d='M311.7 230 513 341.3v-31.5L369.3 230h-57.6zM200.3 111.3 0 0v31.5l143.7 79.8h56.6z' />
      </g>
      <g fill='#012169'>
        <path d='M393.8 230 513 295.7V230H393.8zm-82.1 0L513 341.3v-31.5L369.3 230h-57.6zm146.9 111.3-147-81.7v81.7h147zM90.3 230 0 280.2V230h90.3zm110 14.2v97.2H25.5l174.8-97.2zM118.2 111.3 0 45.6v65.7h118.2zm82.1 0L0 0v31.5l143.7 79.8h56.6zM53.4 0l147 81.7V0h-147zM421.7 111.3 513 61.1v50.2h-91.3zm-110-14.2V0h174.9L311.7 97.1z' />
      </g>
      <g fill='#c8102e'>
        <path d='M288 0h-64v138.7H0v64h224v138.7h64V202.7h224v-64H288V0z' />
        <path d='M311.7 230 513 341.3v-31.5L369.3 230h-57.6zM143.7 230 0 309.9v31.5L200.3 230h-56.6zM200.3 111.3 0 0v31.5l143.7 79.8h56.6zM368.3 111.3 513 31.5V0L311.7 111.3h56.6z' />
      </g>
    </svg>
  );
}

function IN({ title, ...props }: FlagProps) {
  return (
    <svg viewBox='0 0 513 342' {...props}>
      {title ? <title>{title}</title> : null}
      <path fill='#ff6820' d='M0 0h513v114H0V0z' />
      <path fill='#FFF' d='M0 114h513v114H0V114z' />
      <path fill='#046a38' d='M0 228h513v114H0V228z' />
      <path
        fill='none'
        stroke='#07038d'
        strokeWidth='4'
        d='M256.5 136.8c18.9 0 34.2 15.3 34.2 34.2s-15.3 34.2-34.2 34.2-34.2-15.3-34.2-34.2 15.3-34.2 34.2-34.2z'
      />
      <g stroke='#07038d' strokeWidth='2'>
        <path d='m265.3 138.2-17.6 65.7m17.6-65.7-17.6 65.7M273.5 141.6l-34 58.9M280.5 147l-48 48M285.9 154 227 188M289.3 162.2l-65.7 17.6M290.5 171h-68M289.3 179.8l-65.7-17.6M285.9 188 227 154M280.5 195l-48-48M273.5 200.4l-34-58.9M265.3 203.8l-17.6-65.7M256.5 205v-68M247.7 203.8l17.6-65.7M239.5 200.4l34-58.9M232.5 195l48.1-48.1M227.1 188l58.9-34M223.7 179.8l65.7-17.6M222.5 171h68M223.7 162.2l65.7 17.6M227.1 154l58.9 34M232.5 147l48.1 48.1M239.5 141.6l34 58.9M247.7 138.2l17.6 65.7' />
      </g>
    </svg>
  );
}

function JP({ title, ...props }: FlagProps) {
  return (
    <svg viewBox='0 0 513 342' {...props}>
      {title ? <title>{title}</title> : null}
      <path fill='#FFF' d='M0 0h512v342H0z' />
      <circle fill='#D80027' cx='256.5' cy='171' r='96' />
    </svg>
  );
}

function NL({ title, ...props }: FlagProps) {
  return (
    <svg viewBox='0 0 513 342' {...props}>
      {title ? <title>{title}</title> : null}
      <path fill='#FFF' d='M0 114h513v114H0z' />
      <path fill='#cd1f2a' d='M0 0h513v114H0z' />
      <path fill='#1d4185' d='M0 228h513v114H0z' />
    </svg>
  );
}

function SE({ title, ...props }: FlagProps) {
  return (
    <svg viewBox='0 0 513 342' {...props}>
      {title ? <title>{title}</title> : null}
      <path fill='#004F8E' d='M0 0h513v342H0z' />
      <path fill='#F6C500' d='M192.4.3h-64.2v138.8H0v64.1h128.2V342h64.2V203.2H513v-64.1H192.4z' />
    </svg>
  );
}

function US({ title, ...props }: FlagProps) {
  return (
    <svg viewBox='0 0 513 342' {...props}>
      {title ? <title>{title}</title> : null}
      <path fill='#FFF' d='M0 0h513v342H0z' />
      <g fill='#D80027'>
        <path d='M0 0h513v26.3H0zM0 52.6h513v26.3H0zM0 105.2h513v26.3H0zM0 157.8h513v26.3H0zM0 210.5h513v26.3H0zM0 263.1h513v26.3H0zM0 315.7h513V342H0z' />
      </g>
      <path fill='#2E52B2' d='M0 0h256.5v184.1H0z' />
      <g fill='#FFF'>
        <path d='m47.8 138.9-4-12.8-4.4 12.8H26.2l10.7 7.7-4 12.8 10.9-7.9 10.6 7.9-4.1-12.8 10.9-7.7zM104.1 138.9l-4.1-12.8-4.2 12.8H82.6l10.7 7.7-4 12.8 10.7-7.9 10.8 7.9-4-12.8 10.7-7.7zM160.6 138.9l-4.3-12.8-4 12.8h-13.5l11 7.7-4.2 12.8 10.7-7.9 11 7.9-4.2-12.8 10.7-7.7zM216.8 138.9l-4-12.8-4.2 12.8h-13.3l10.8 7.7-4 12.8 10.7-7.9 10.8 7.9-4.3-12.8 11-7.7zM100 75.3l-4.2 12.8H82.6L93.3 96l-4 12.6 10.7-7.8 10.8 7.8-4-12.6 10.7-7.9h-13.4zM43.8 75.3l-4.4 12.8H26.2L36.9 96l-4 12.6 10.9-7.8 10.6 7.8L50.3 96l10.9-7.9H47.8zM156.3 75.3l-4 12.8h-13.5l11 7.9-4.2 12.6 10.7-7.8 11 7.8-4.2-12.6 10.7-7.9h-13.2zM212.8 75.3l-4.2 12.8h-13.3l10.8 7.9-4 12.6 10.7-7.8 10.8 7.8-4.3-12.6 11-7.9h-13.5zM43.8 24.7l-4.4 12.6H26.2l10.7 7.9-4 12.7L43.8 50l10.6 7.9-4.1-12.7 10.9-7.9H47.8zM100 24.7l-4.2 12.6H82.6l10.7 7.9-4 12.7L100 50l10.8 7.9-4-12.7 10.7-7.9h-13.4zM156.3 24.7l-4 12.6h-13.5l11 7.9-4.2 12.7 10.7-7.9 11 7.9-4.2-12.7 10.7-7.9h-13.2zM212.8 24.7l-4.2 12.6h-13.3l10.8 7.9-4 12.7 10.7-7.9 10.8 7.9-4.3-12.7 11-7.9h-13.5z' />
      </g>
    </svg>
  );
}

export const FLAGS = { BR, CA, DE, DK, FR, GB, IN, JP, NL, SE, US } as const;

export type FlagCode = keyof typeof FLAGS;
