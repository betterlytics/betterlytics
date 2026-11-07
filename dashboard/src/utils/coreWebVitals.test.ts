import { describe, expect, it } from 'vitest';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import { getPerformanceGrade, getPerformanceScore } from './coreWebVitals';

const at = (index: 0 | 1) => ({
  LCP: CWV_THRESHOLDS.LCP[index],
  INP: CWV_THRESHOLDS.INP[index],
  CLS: CWV_THRESHOLDS.CLS[index],
  FCP: CWV_THRESHOLDS.FCP[index],
  TTFB: CWV_THRESHOLDS.TTFB[index],
});

describe('getPerformanceScore', () => {
  it('scores instant metrics 100', () => {
    expect(getPerformanceScore({ LCP: 0, INP: 0, CLS: 0, FCP: 0, TTFB: 0 })).toBe(100);
  });

  it('scores every metric at its good threshold 90', () => {
    expect(getPerformanceScore(at(0))).toBeCloseTo(90);
  });

  it('scores every metric at its fair threshold 50', () => {
    expect(getPerformanceScore(at(1))).toBeCloseTo(50);
  });

  it('reaches 0 at twice the fair threshold', () => {
    expect(getPerformanceScore({ LCP: CWV_THRESHOLDS.LCP[1] * 2 })).toBe(0);
  });

  it('weights LCP at 30%', () => {
    expect(getPerformanceScore({ LCP: CWV_THRESHOLDS.LCP[1], INP: 0, CLS: 0, FCP: 0, TTFB: 0 })).toBeCloseTo(85);
  });

  it('leaves missing metrics out of the weighting', () => {
    expect(getPerformanceScore({ LCP: CWV_THRESHOLDS.LCP[0], CLS: null })).toBeCloseTo(90);
    expect(getPerformanceScore({})).toBe(0);
  });
});

describe('getPerformanceGrade', () => {
  it('grades 90 and up great, 50 and up okay, the rest poor', () => {
    expect(getPerformanceGrade(90)).toBe('great');
    expect(getPerformanceGrade(89.9)).toBe('okay');
    expect(getPerformanceGrade(50)).toBe('okay');
    expect(getPerformanceGrade(49.9)).toBe('poor');
  });
});
