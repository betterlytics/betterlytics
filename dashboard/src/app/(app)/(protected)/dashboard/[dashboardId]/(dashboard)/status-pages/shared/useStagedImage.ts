'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** A pending change to one image, relative to what's persisted on the server. null = no change. */
export type StagedImageChange = { kind: 'set'; blob: Blob } | { kind: 'remove' } | null;

export type StagedImage = {
  url: string | null;
  change: StagedImageChange;
  dirty: boolean;
  stage: (blob: Blob) => void;
  remove: () => void;
  commit: (savedUrl: string | null) => void;
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
