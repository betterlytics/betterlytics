'use client';

import { AnimatedDashboardLogo } from '@/components/loading/AnimatedDashboardLogo';
import { AnimatedDashboardLogoCube, PATTERNS as CUBE_PATTERNS, PatternName as CubePatternName } from '@/components/loading/AnimatedDashboardLogoCube';
import { AnimatedDashboardLogoPuzzle } from '@/components/loading/AnimatedDashboardLogoPuzzle';
import { useEffect, useState } from 'react';

const cubePatternNames = Object.keys(CUBE_PATTERNS) as CubePatternName[];

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 3];

export default function TestLogoPage() {
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [showPuzzle, setShowPuzzle] = useState(true);
  const [showCube, setShowCube] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [speed, setSpeed] = useState(2); // Default to 2x as requested

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
      <div className='mb-6 flex gap-2 flex-wrap'>
        <button
          onClick={() => setShowPuzzle(!showPuzzle)}
          className={`px-4 py-2 rounded ${showPuzzle ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Puzzle (NEW)
        </button>
        <button
          onClick={() => setShowCube(!showCube)}
          className={`px-4 py-2 rounded ${showCube ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          3D Cube
        </button>
        <button
          onClick={() => setShowCurrent(!showCurrent)}
          className={`px-4 py-2 rounded ${showCurrent ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Current (mask)
        </button>
      </div>

      {/* Puzzle Animation - 2 Phase: Scatter then Assemble */}
      {showPuzzle && (
        <section className='mb-12'>
          <h2 className='text-xl font-semibold mb-4 text-pink-500'>
            2D Puzzle Animation (Scatter → Assemble)
          </h2>
          <p className='text-sm text-muted-foreground mb-4'>
            Phase 1: Pieces scatter from center outward | Phase 2: Pieces slide into place
          </p>
          {/* Speed controller */}
          <div className='flex items-center gap-4 mb-4'>
            <span className='text-sm font-medium'>Speed:</span>
            <div className='flex gap-1'>
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-3 py-1 rounded text-sm ${
                    speed === s
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
          {/* Large centered display */}
          <div className='flex justify-center items-center p-8 border-2 border-pink-500/50 rounded-lg bg-black/5 min-h-[600px]'>
            <AnimatedDashboardLogoPuzzle size={500} speed={speed} />
          </div>
        </section>
      )}

      {/* 3D Cube Patterns */}
      {showCube && (
        <section className='mb-12'>
          <h2 className='text-xl font-semibold mb-4 text-purple-500'>
            3D Cube Roll Patterns
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {cubePatternNames.map((patternName) => (
              <div
                key={patternName}
                className='p-4 border-2 border-purple-500/50 rounded-lg bg-black/5 flex flex-col items-center'
              >
                <AnimatedDashboardLogoCube size={150} pattern={patternName} />
                <div className='mt-3 text-center'>
                  <div className='font-semibold text-sm'>{patternName}</div>
                  <div className='text-xs text-muted-foreground'>{CUBE_PATTERNS[patternName].label}</div>
                </div>
              </div>
            ))}
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

      {/* Piece reference */}
      <div className='mt-8 p-4 bg-muted rounded-lg'>
        <h3 className='font-semibold mb-2'>Puzzle Pieces (9 total):</h3>
        <pre className='text-xs font-mono'>
{`┌──────────────┬──────────────┬──────────────┐
│ 0: left-dark │ 3: mid-dark  │ 6: right-dark│
│              │              │   (B curve)  │
│     ● 2      │              │      ● 8     │
├──────────────┼──────────────┼──────────────┤
│ 1: left-blue │ 4: mid-blue  │ 7: right-blue│
│              │     ● 5      │   (B bulge)  │
└──────────────┴──────────────┴──────────────┘

● = circles (data points on the analytics line)`}
        </pre>
      </div>
    </div>
  );
}
