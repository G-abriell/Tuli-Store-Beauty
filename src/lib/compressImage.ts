import imageCompression from 'browser-image-compression';

/**
 * Compress an image file client‑side.
 * Uses `browser-image-compression` with preset options:
 *   - maxSizeMB: 0.3 (≈300 KB)
 *   - maxWidthOrHeight: 1000px (preserves aspect ratio)
 *   - useWebWorker: true for non‑blocking UI
 *   - fileType: 'image/jpeg' (output as JPEG)
 * Returns the compressed File. If compression fails, the original file is returned.
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/jpeg',
    // Reduce quality to achieve target size faster
    initialQuality: 0.6,
  } as const;
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Image compression error:', error);
    return file; // fallback to original
  }
}
