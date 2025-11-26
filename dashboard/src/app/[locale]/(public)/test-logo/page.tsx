'use client';

import { AnimatedDashboardLogo } from '@/components/loading/AnimatedDashboardLogo';
import { AnimatedDashboardLogoOld } from '@/components/loading/AnimatedDashboardLogoOld';
import { AnimatedDashboardLogoCube, PATTERNS, PatternName } from '@/components/loading/AnimatedDashboardLogoCube';
import { useEffect, useState } from 'react';

const patternNames = Object.keys(PATTERNS) as PatternName[];

export default function TestLogoPage() {
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showCube, setShowCube] = useState(true);
  const [showAllPatterns, setShowAllPatterns] = useState(true);
  const [selectedPattern, setSelectedPattern] = useState<PatternName>('snake');

  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    let animationId: number;

    const measureFps = () => {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frames);
        setFrameCount((prev) => prev + frames);
        frames = 0;
        lastTime = now;
      }
      animationId = requestAnimationFrame(measureFps);
    };

    animationId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className='min-h-screen bg-background p-8'>
      <div className='fixed top-4 right-4 bg-black text-white p-4 rounded-lg font-mono z-50'>
        <div className='text-xl font-bold'>FPS: {fps}</div>
        <div className='text-sm'>Total frames: {frameCount}</div>
      </div>

      <h1 className='text-2xl font-bold mb-4'>Logo Animation Test Page</h1>

      {/* Toggle controls */}
      <div className='mb-4 flex gap-2 flex-wrap'>
        <button
          onClick={() => setShowAllPatterns(!showAllPatterns)}
          className={`px-4 py-2 rounded ${showAllPatterns ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          All Patterns
        </button>
        <button
          onClick={() => setShowCube(!showCube)}
          className={`px-4 py-2 rounded ${showCube ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Single Pattern
        </button>
        <button
          onClick={() => setShowCurrent(!showCurrent)}
          className={`px-4 py-2 rounded ${showCurrent ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Current (mask)
        </button>
        <button
          onClick={() => setShowOld(!showOld)}
          className={`px-4 py-2 rounded ${showOld ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Old
        </button>
      </div>

      {/* All Patterns Grid */}
      {showAllPatterns && (
        <section className='mb-12'>
          <h2 className='text-xl font-semibold mb-4 text-purple-500'>
            All Cube Patterns
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {patternNames.map((patternName) => (
              <div
                key={patternName}
                className='p-4 border-2 border-purple-500/50 rounded-lg bg-black/5 flex flex-col items-center'
              >
                <AnimatedDashboardLogoCube size={150} pattern={patternName} />
                <div className='mt-3 text-center'>
                  <div className='font-semibold text-sm'>{patternName}</div>
                  <div className='text-xs text-muted-foreground'>{PATTERNS[patternName].label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Single Pattern Selection */}
      {showCube && !showAllPatterns && (
        <section className='mb-12'>
          <h2 className='text-xl font-semibold mb-4 text-indigo-500'>
            Single Pattern View
          </h2>
          <div className='mb-4 flex gap-2 flex-wrap'>
            {patternNames.map((patternName) => (
              <button
                key={patternName}
                onClick={() => setSelectedPattern(patternName)}
                className={`px-3 py-1 rounded text-sm ${selectedPattern === patternName ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                {patternName}
              </button>
            ))}
          </div>
          <div className='p-6 border-2 border-indigo-500 rounded-lg bg-black/5 inline-block'>
            <AnimatedDashboardLogoCube size={200} pattern={selectedPattern} />
            <div className='mt-4 text-center text-sm text-muted-foreground'>
              {PATTERNS[selectedPattern].label}
            </div>
          </div>
        </section>
      )}

      {/* Current Animation */}
      {showCurrent && (
        <section className='mb-12'>
          <h2 className='text-xl font-semibold mb-4 text-green-600'>
            Current: Mask Fill Animation
          </h2>
          <div className='p-4 border-2 border-green-500 rounded-lg inline-block'>
            <AnimatedDashboardLogo size={150} />
          </div>
        </section>
      )}

      {/* Old Animation */}
      {showOld && (
        <section className='mb-12'>
          <h2 className='text-xl font-semibold mb-4 text-orange-600'>
            Old: translateY + translateZ
          </h2>
          <div className='p-4 border-2 border-orange-500 rounded-lg inline-block'>
            <AnimatedDashboardLogoOld size={150} />
          </div>
        </section>
      )}

      {/* Grid reference */}
      <div className='mt-8 p-4 bg-muted rounded-lg'>
        <h3 className='font-semibold mb-2'>Grid Reference:</h3>
        <pre className='text-sm font-mono'>
{`┌───┬───┬───┐
│ 1 │ 2 │ 3 │  (indices 0, 1, 2)
├───┼───┼───┤
│ 4 │ 5 │ 6 │  (indices 3, 4, 5)
└───┴───┴───┘`}
        </pre>
      </div>
    </div>
  );
}
