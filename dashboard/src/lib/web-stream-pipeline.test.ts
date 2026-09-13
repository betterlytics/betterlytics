import { describe, it, expect, vi } from 'vitest';
import { PassThrough } from 'node:stream';
import { throughNodeTransform } from './web-stream-pipeline';

const encoder = new TextEncoder();

function sourceOf(chunks: string[], opts: { failAfter?: number; onCancel?: () => void } = {}) {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (opts.failAfter !== undefined && index >= opts.failAfter) {
        controller.error(new Error('source failed'));
        return;
      }
      if (index >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunks[index++]));
    },
    cancel: opts.onCancel,
  });
}

async function drain(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  let text = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return text;
    text += new TextDecoder().decode(value);
  }
}

describe('throughNodeTransform', () => {
  it('passes chunks through and calls onDone once without an error', async () => {
    const onDone = vi.fn();
    const out = throughNodeTransform(sourceOf(['a\n', 'b\n']), new PassThrough(), onDone);
    await expect(drain(out)).resolves.toBe('a\nb\n');
    await vi.waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onDone.mock.calls[0][0]).toBeFalsy();
  });

  it('rejects the consumer read and reports the error when the source fails', async () => {
    const onDone = vi.fn();
    const out = throughNodeTransform(sourceOf(['a\n', 'b\n', 'c\n'], { failAfter: 2 }), new PassThrough(), onDone);
    await expect(drain(out)).rejects.toThrow('source failed');
    await vi.waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onDone.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('cancels the source and calls onDone when the consumer cancels', async () => {
    const onDone = vi.fn();
    const onCancel = vi.fn();
    const chunks = Array.from({ length: 1000 }, (_, i) => `${i}\n`);
    const out = throughNodeTransform(sourceOf(chunks, { onCancel }), new PassThrough(), onDone);
    const reader = out.getReader();
    await reader.read();
    await reader.cancel();
    await vi.waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
  });
});
