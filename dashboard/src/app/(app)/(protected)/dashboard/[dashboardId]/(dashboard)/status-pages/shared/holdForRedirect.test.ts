import { afterEach, beforeEach, describe, it, expect, vi, type Mock } from 'vitest';
import { holdForRedirect, RedirectAbandonedError, retryUnlessRedirectAbandoned } from './holdForRedirect';

class FakePageTransitionEvent extends Event {
  persisted: boolean;
  constructor(type: string, init: { persisted: boolean }) {
    super(type);
    this.persisted = init.persisted;
  }
}

function fireBeforeUnload({ prompted }: { prompted: boolean }) {
  const event = new Event('beforeunload', { cancelable: true });
  if (prompted) event.preventDefault();
  window.dispatchEvent(event);
}

async function trackSettled(promise: Promise<unknown>) {
  const state = { settled: false, error: undefined as unknown };
  promise.then(
    () => (state.settled = true),
    (error) => {
      state.settled = true;
      state.error = error;
    },
  );
  await vi.advanceTimersByTimeAsync(0);
  return state;
}

describe('holdForRedirect', () => {
  let pageshow: Mock<(event: PageTransitionEvent) => void>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('PageTransitionEvent', FakePageTransitionEvent);
    pageshow = vi.fn<(event: PageTransitionEvent) => void>();
    window.addEventListener('pageshow', pageshow);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('passes a real result through, including null', async () => {
    await expect(holdForRedirect(Promise.resolve({ available: true }))).resolves.toEqual({ available: true });
    await expect(holdForRedirect(Promise.resolve(null))).resolves.toBeNull();
  });

  it('passes a failure through', async () => {
    await expect(holdForRedirect(Promise.reject(new Error('failed')))).rejects.toThrow('failed');
  });

  it('stays pending while a redirect loads with no prompt, however slowly', async () => {
    const state = await trackSettled(holdForRedirect(Promise.resolve(undefined)));

    fireBeforeUnload({ prompted: false });
    await vi.advanceTimersByTimeAsync(60_000);

    expect(state.settled).toBe(false);
    expect(pageshow).not.toHaveBeenCalled();
  });

  it('rejects without a message and clears the router once the prompt is declined', async () => {
    const state = await trackSettled(holdForRedirect(Promise.resolve(undefined)));

    fireBeforeUnload({ prompted: true });
    await vi.advanceTimersByTimeAsync(1000);
    expect(state.settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1000);
    expect(state.error).toBeInstanceOf(RedirectAbandonedError);
    expect((state.error as Error).message).toBe('');
    expect(pageshow).toHaveBeenCalledTimes(1);
    expect(pageshow.mock.calls[0][0].persisted).toBe(true);
  });

  it('rejects when no page load starts at all', async () => {
    const state = await trackSettled(holdForRedirect(Promise.resolve(undefined)));

    await vi.advanceTimersByTimeAsync(2000);

    expect(state.error).toBeInstanceOf(RedirectAbandonedError);
    expect(pageshow).toHaveBeenCalledTimes(1);
  });

  it('stops listening once it has rejected', async () => {
    const state = await trackSettled(holdForRedirect(Promise.resolve(undefined)));
    await vi.advanceTimersByTimeAsync(2000);
    expect(state.settled).toBe(true);

    fireBeforeUnload({ prompted: true });
    await vi.advanceTimersByTimeAsync(10_000);

    expect(pageshow).toHaveBeenCalledTimes(1);
  });
});

describe('retryUnlessRedirectAbandoned', () => {
  it('keeps the one retry for ordinary failures but not for an abandoned redirect', () => {
    expect(retryUnlessRedirectAbandoned(0, new Error('failed'))).toBe(true);
    expect(retryUnlessRedirectAbandoned(1, new Error('failed'))).toBe(false);
    expect(retryUnlessRedirectAbandoned(0, new RedirectAbandonedError())).toBe(false);
  });
});
