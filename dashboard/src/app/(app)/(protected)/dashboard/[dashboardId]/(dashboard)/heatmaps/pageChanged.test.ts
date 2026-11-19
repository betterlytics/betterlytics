import { describe, expect, it } from 'vitest';
import { EventType, type eventWithTime } from '@rrweb/types';
import { pageChangedSinceCapture, snapshotWindowHeight } from './pageChanged';

const capture = { path: '/pricing', documentHeight: 3000 };
const windowHeight = 900;

describe('pageChangedSinceCapture', () => {
  it('flags a page that grew or shrank by more than 15%', () => {
    expect(pageChangedSinceCapture(capture, windowHeight, 4000)).toBe(true);
    expect(pageChangedSinceCapture(capture, windowHeight, 2400)).toBe(true);
  });

  it('leaves a page within 15% alone', () => {
    expect(pageChangedSinceCapture(capture, windowHeight, 3000)).toBe(false);
    expect(pageChangedSinceCapture(capture, windowHeight, 3420)).toBe(false);
    expect(pageChangedSinceCapture(capture, windowHeight, 2580)).toBe(false);
  });

  it('says nothing without a height to compare with', () => {
    expect(pageChangedSinceCapture(capture, windowHeight, null)).toBe(false);
    expect(pageChangedSinceCapture(capture, windowHeight, undefined)).toBe(false);
    expect(pageChangedSinceCapture(capture, undefined, 4000)).toBe(false);
  });

  it('says nothing for a grouped page path or a page that fits its window', () => {
    expect(pageChangedSinceCapture({ path: '/blog/*', documentHeight: 3000 }, windowHeight, 4000)).toBe(false);
    expect(pageChangedSinceCapture({ path: '/contact', documentHeight: 1000 }, windowHeight, 1400)).toBe(false);
  });
});

describe('snapshotWindowHeight', () => {
  it('reads the height from the Meta event', () => {
    const events = [
      { type: EventType.Meta, data: { href: 'https://example.com/', width: 1280, height: 720 }, timestamp: 1 },
    ] as eventWithTime[];
    expect(snapshotWindowHeight(events)).toBe(720);
    expect(snapshotWindowHeight(undefined)).toBeUndefined();
  });
});
