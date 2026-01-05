/**
 * Performance Profiler for AnimatedNumber
 * 
 * Instructions:
 * 1. Open Browser Console
 * 2. Copy and paste this script
 * 3. Run `startProfiler()`
 * 4. Interact with the slider for 5-10 seconds
 * 5. Run `stopProfiler()` to see results
 */

let frameTimes = [];
let longTasks = [];
let startTime = 0;
let isProfiling = false;
let lastFrameTime = performance.now();

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (isProfiling) {
      longTasks.push(entry.duration);
      console.warn(`[Long Task] ${entry.duration.toFixed(2)}ms detected`);
    }
  }
});

function tick() {
  if (!isProfiling) return;
  const now = performance.now();
  const delta = now - lastFrameTime;
  frameTimes.push(delta);
  lastFrameTime = now;
  requestAnimationFrame(tick);
}

window.startProfiler = () => {
  frameTimes = [];
  longTasks = [];
  startTime = performance.now();
  isProfiling = true;
  lastFrameTime = performance.now();
  observer.observe({ entryTypes: ['longtask'] });
  requestAnimationFrame(tick);
  console.log("%c Profiling Started... Interact with the slider now! ", "background: #222; color: #bada55; padding: 5px;");
};

window.stopProfiler = () => {
  isProfiling = false;
  observer.disconnect();
  const totalDuration = (performance.now() - startTime) / 1000;
  
  // Calculate stats
  const avgFrame = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  const maxFrame = Math.max(...frameTimes);
  const droppedFrames = frameTimes.filter(f => f > 16.7).length;
  const dropRate = (droppedFrames / frameTimes.length * 100).toFixed(1);
  const totalLongTasks = longTasks.reduce((a, b) => a + b, 0);

  console.log(`
%c --- Profiling Results ---
Duration: ${totalDuration.toFixed(2)}s
Avg Frame Time: ${avgFrame.toFixed(2)}ms (~${Math.round(1000/avgFrame)} FPS)
Peak Frame Time: ${maxFrame.toFixed(2)}ms
Frame Drops (>16.7ms): ${droppedFrames} (${dropRate}%)
Long Tasks Total: ${totalLongTasks.toFixed(2)}ms (${longTasks.length} tasks)
  `, "color: #1a73e8; font-weight: bold; font-size: 1.2em;");
  
  return { avgFrame, maxFrame, droppedFrames, dropRate, longTasks };
};
