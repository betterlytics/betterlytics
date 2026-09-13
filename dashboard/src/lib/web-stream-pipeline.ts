import { Readable, pipeline, type Transform } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

// pipeline (not .pipe) so a source error errors the returned stream and a consumer
// cancel destroys the source; onDone fires exactly once on end, error, or cancel.
export function throughNodeTransform(
  source: ReadableStream<Uint8Array>,
  transform: Transform,
  onDone: (error?: Error | null) => void,
): ReadableStream<Uint8Array> {
  const out = pipeline(Readable.fromWeb(source as unknown as NodeReadableStream<Uint8Array>), transform, (error) =>
    onDone(error),
  );
  return Readable.toWeb(out) as unknown as ReadableStream<Uint8Array>;
}
