'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  removeStatusPageLogoAction,
  uploadStatusPageLogoAction,
} from '@/app/actions/analytics/statusPage.actions';

// Generous guard so we don't read an enormous file into the tab before resizing; the canvas
// step shrinks the logo to well under STATUS_PAGE_LIMITS.LOGO_MAX_BYTES regardless.
const MAX_ORIGINAL_LOGO_BYTES = 10 * 1024 * 1024;
const LOGO_MAX_DIMENSION = 128;

/** Downscale to a small square-bounded WebP on the client so the server only ever stores a tiny blob. */
async function resizeToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, LOGO_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unsupported');
    context.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Encode failed'))), 'image/webp', 0.9);
    });
  } finally {
    bitmap.close();
  }
}

type UseStatusPageLogoParams = {
  dashboardId: string;
  statusPageId: string;
  /** Syncs the new logo URL (or null) into local state so the live preview updates immediately. */
  onChange: (logoUrl: string | null) => void;
};

/**
 * Client-side logo lifecycle for a status page: resize-to-WebP + upload and remove, each via its
 * own binary action (independent of the editor's JSON autosave). Refreshes the route on success
 * and reports the new URL through {@link UseStatusPageLogoParams.onChange}.
 */
export function useStatusPageLogo({ dashboardId, statusPageId, onChange }: UseStatusPageLogoParams) {
  const t = useTranslations('statusPagesPage.editor');
  const router = useRouter();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const blob = await resizeToWebp(file);
      const formData = new FormData();
      formData.append('logo', blob, 'logo.webp');
      return uploadStatusPageLogoAction(dashboardId, statusPageId, formData);
    },
    onSuccess: (result) => {
      onChange(result.logoUrl);
      router.refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const removeMutation = useMutation({
    mutationFn: async () => removeStatusPageLogoAction(dashboardId, statusPageId),
    onSuccess: () => {
      onChange(null);
      router.refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const selectLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (file.size > MAX_ORIGINAL_LOGO_BYTES) {
      toast.error(t('logoTooLarge'));
      return;
    }
    uploadMutation.mutate(file);
  };

  return {
    selectLogo,
    removeLogo: () => removeMutation.mutate(),
    uploading: uploadMutation.isPending,
    busy: uploadMutation.isPending || removeMutation.isPending,
  };
}
