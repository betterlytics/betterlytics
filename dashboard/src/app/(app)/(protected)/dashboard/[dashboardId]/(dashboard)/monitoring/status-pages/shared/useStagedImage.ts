'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** A pending change to one image, relative to what's persisted on the server. null = no change. */
export type StagedImageChange = { kind: 'set'; blob: Blob } | { kind: 'remove' } | null;

export type StagedImage = {
  /** URL to display: the server URL, a local object URL for a staged file, or null when absent. */
  url: string | null;
  /** The pending change to flush on save; null = unchanged. */
  change: StagedImageChange;
  /** True while an unsaved change is staged. */
  dirty: boolean;
  /** Stage a freshly-selected (already-resized) blob for upload on the next save. */
  stage: (blob: Blob) => void;
  /** Stage removal of the current image. */
  remove: () => void;
  /** Apply a successful save: the staged change becomes the server truth at `savedUrl`. */
  commit: (savedUrl: string | null) => void;
  /** Discard the staged change, restoring the last saved state. */
  reset: () => void;
};

export function useStagedImage(initialUrl: string | null): StagedImage {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [change, setChange] = useState<StagedImageChange>(null);
  const savedUrlRef = useRef<string | null>(initialUrl);
  const objectUrlRef = useRef<string | null>(null);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stage = useCallback(
    (blob: Blob) => {
      revokeObjectUrl();
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      setUrl(objectUrl);
      setChange({ kind: 'set', blob });
    },
    [revokeObjectUrl],
  );

  const remove = useCallback(() => {
    revokeObjectUrl();
    setUrl(null);
    setChange({ kind: 'remove' });
  }, [revokeObjectUrl]);

  const commit = useCallback(
    (savedUrl: string | null) => {
      revokeObjectUrl();
      savedUrlRef.current = savedUrl;
      setUrl(savedUrl);
      setChange(null);
    },
    [revokeObjectUrl],
  );

  const reset = useCallback(() => {
    revokeObjectUrl();
    setUrl(savedUrlRef.current);
    setChange(null);
  }, [revokeObjectUrl]);

  useEffect(() => revokeObjectUrl, [revokeObjectUrl]);

  return { url, change, dirty: change != null, stage, remove, commit, reset };
}
