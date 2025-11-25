'use client';

import React, { memo, useId } from 'react';

interface AnimatedDashboardLogoProps {
  size?: number;
  className?: string;
}

export const AnimatedDashboardLogo = memo(function AnimatedDashboardLogo({
  size = 80,
  className = '',
}: AnimatedDashboardLogoProps) {
  const id = useId();
  const maskId = `logoMask-${id}`;

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: size,
        height: size,
        contain: 'layout style paint',
      }}
    >
      <svg width={size} height={size} viewBox='0 0 1071 1069' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <defs>
          <mask id={maskId}>
            <rect x='0' y='0' width='375' height='1069' fill='white' className='animate-fill-up-1' />
            <rect x='375' y='0' width='375' height='1069' fill='white' className='animate-fill-up-2' />
            <rect x='750' y='0' width='321' height='1069' fill='white' className='animate-fill-up-3' />
          </mask>
        </defs>

        <g mask={`url(#${maskId})`}>
          {/* Left side shape */}
          <path
            d='M322 0H2V640l4-2c3-3 67-70 70-73 1-4 1-5-1-8-11-21-15-44-10-67 7-27 21-49 45-64 23-13 49-18 75-12l3 1c17 5 36 15 47 29l3 4c3 4 7 8 9 12 12 21 16 48 10 71l-4 18 58 44c3 2 5 4 8 5V0Z'
            className='fill-foreground'
          />
          <path
            d='M230.956 595.875s-5.14-4.399-8.364-5.639c0 0-2.011-.236-5.148 1.886-9.245 6.015-9.245 6.015-19.34 10.562-20.592 8.9-45.916 9.678-66.912 1.701-5.445-2.128-10.794-4.523-16.611-5.385-2.75 1.725-106.364 111.463-108.777 113.643-6.06 6.809-6.06 6.809-5.654 34.792C.215 751.654 1.58 1068 1.58 1068h320.001s1.516-394.198 1.108-398.532c-1.784-5.583-5.439-7.858-10.207-10.801-2.808-1.522-2.808-1.522-4.788-3.142z'
            fill='#1E78C6'
          />
          <circle cx='161' cy='509' r='48' fill='#2073BC' />

          {/* Middle vertical bar */}
          <path
            d='M697 0H376v639l3 3 96 76c2-1 4-2 6-3 4-3 8-5 12-6 23-11 49-13 73-5l11 3 112-139c5-6 5-6 5-25V0Z'
            className='fill-foreground'
          />
          <path
            d='M697 646h-3l-70 86c-3 3-6 6-6 10l2 2c12 19 16 38 15 59-1 22-10 46-26 61l-2 2c-21 19-44 31-73 30-25-1-49-11-67-29l-2-2c-10-11-18-22-22-36l-1-2c-6-18-6-37-1-55l3-13-59-45c-3-2-5-3-9-4v359h321V646Z'
            fill='#1E78C6'
          />
          <circle cx='536' cy='800' r='48' fill='#2580CD' />

          {/* Right shape */}
          <path
            d='M941 44C884 3 819 0 751 0v493h2l185-225 4-4c0-3 0-5-2-8-10-16-15-36-14-55v-2c1-23 11-46 27-63l2-2c14-13 31-21 49-26l3-1c0-3 0-3-1-5-4-4-8-8-12-13s-9-10-14-15l-2-1c-10-8-21-16-32-24-2-1-4-2-5-4Z'
            className='fill-foreground'
          />
          <path
            d='M1050.71 386.68c12.41-29.545 20.99-63.469 19.62-95.68-21.33 5.938-42.33 13.5-73.876 5.938-4.419-1.441-8.502-2.508-13.125-2.938-2.228 1.902-226.431 275.795-228.473 277.898-5.02 5.939-5.02 5.939-4.776 22.166.032 1.967.83 332.002.826 333.97.093 46.656.252 93.306.423 139.966 7.188.04 14.376.08 21.564.1 3.688.01 7.376.02 11.064.04 14.762.09 29.519.48 44.17-1.61h.006c1.611-.27 1.613-.27 3.196-.53 33.579-5.2 66.21-16.06 95.849-32.78.731-.42 1.441-.82 2.151-1.22 11.993-6.61 23.055-14.07 33.928-22.4.704-.54 1.388-1.07 2.072-1.6 8.614-6.64 16.439-13.83 23.562-22.062 1.73-2.016 3.47-3.97 5.332-5.864 15.037-14.797 27.837-31.295 38.577-49.449.52-.892 1.03-1.759 1.53-2.625 25.75-44.115 38.41-96.868 37.07-147.83-.03-.738-.05-1.454-.07-2.17-.81-28.95-6.53-57.445-16.12-84.734-.88-2.469-1.77-4.935-2.61-7.416-7.07-21.151-17.81-40.798-30.83-58.86-.49-.677-.96-1.333-1.44-1.99-5.43-7.539-10.9-14.959-17.19-21.812-2.46-2.621-4.847-5.232-7.116-8.024-6.17-7.793-12.911-13.95-20.633-20.164l-5.062-4c-5.507-4.496-11.076-8.827-16.875-12.938-3.422-2.419-6.833-4.845-10.195-7.347a850 850 0 0 0-20.289-14.844L920.329 534c6.383-5.078 12.78-9.966 19.687-14.312 14.513-9.109 29.419-19.258 41.372-31.614l1.692-1.807.249-.267c5.355-5.716 10.692-11.446 15.812-17.375 1.559-1.806 3.119-3.558 4.819-5.238 3.62-3.497 6.91-7.105 10-11.08.53-.699 1.04-1.378 1.56-2.057 12.51-16.479 24.1-34.625 31.56-54 1.16-3.223 2.32-6.409 3.63-9.57'
            fill='#1E78C6'
          />
          <circle cx='1024' cy='201' r='47' fill='#1E72BC' />
        </g>
      </svg>

      <style jsx>{`
        @keyframes fill-up {
          0% {
            transform: translateY(100%) translateZ(0);
          }
          35% {
            transform: translateY(0%) translateZ(0);
          }
          65% {
            transform: translateY(0%) translateZ(0);
          }
          100% {
            transform: translateY(100%) translateZ(0);
          }
        }

        .animate-fill-up-1,
        .animate-fill-up-2,
        .animate-fill-up-3 {
          will-change: transform;
          backface-visibility: hidden;
        }

        .animate-fill-up-1 {
          animation: fill-up 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .animate-fill-up-2 {
          animation: fill-up 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: 0.12s;
        }

        .animate-fill-up-3 {
          animation: fill-up 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: 0.24s;
        }
      `}</style>
    </div>
  );
});
