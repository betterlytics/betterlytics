/** Downscales an image to a small WebP blob client-side; re-encoding strips EXIF/metadata. */
export async function resizeImageToWebp(
  file: File,
  { maxDimension, square }: { maxDimension: number; square?: boolean },
): Promise<Blob> {
  // `from-image` applies any EXIF orientation so camera/phone exports aren't stored rotated.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unsupported');
    context.imageSmoothingQuality = 'high';

    if (square) {
      const side = Math.min(bitmap.width, bitmap.height);
      const sx = (bitmap.width - side) / 2;
      const sy = (bitmap.height - side) / 2;
      const target = Math.max(1, Math.min(side, maxDimension));
      canvas.width = target;
      canvas.height = target;
      context.drawImage(bitmap, sx, sy, side, side, 0, 0, target, target);
    } else {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    }

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Encode failed'))), 'image/webp', 0.9);
    });
  } finally {
    bitmap.close();
  }
}
