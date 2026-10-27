import { Readable, Transform, pipeline } from 'node:stream';
import { ReadableStream as NodeReadableStream } from 'node:stream/web';

// pipeline (not .pipe) so a source error errors the returned stream and a consumer
// cancel destroys the source; onDone fires exactly once on end, error, cancel, or idle timeout.
// The watchdog sits after the transform, so it counts wire-sized chunks: it fires only when
// nothing reaches the consumer for idleTimeoutMs, whichever end stalled.
export function throughNodeTransform(
  source: ReadableStream<Uint8Array>,
  transform: Transform,
  onDone: (error?: Error | null) => void,
  idleTimeoutMs: number,
): ReadableStream<Uint8Array> {
  let idle: NodeJS.Timeout | undefined;
  const watchdog = new Transform({
    transform(chunk, _encoding, callback) {
      touch();
      callback(null, chunk);
    },
  });
  const touch = () => {
    clearTimeout(idle);
    idle = setTimeout(() => watchdog.destroy(new Error('Stream idle timeout')), idleTimeoutMs);
  };
  touch();

  const out = pipeline(
    Readable.fromWeb(source as unknown as NodeReadableStream<Uint8Array>),
    transform,
    watchdog,
    (error) => {
      clearTimeout(idle);
      onDone(error);
    },
  );
  // Not Readable.toWeb: Node 20's default buffers the whole source, and with an explicit
  // strategy it throws ERR_INVALID_STATE when Next aborts a response mid-download
  return NodeReadableStream.from<Uint8Array>(out) as unknown as ReadableStream<Uint8Array>;
}
