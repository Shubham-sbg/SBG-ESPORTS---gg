/**
 * Client-side background removal using Canvas flood-fill.
 * Works best for logos/images with solid or near-solid backgrounds
 * (white, black, any single color). Removes from all 4 corners outward.
 */

interface RGB { r: number; g: number; b: number }

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function getPixel(data: Uint8ClampedArray, idx: number): RGB {
  return { r: data[idx * 4], g: data[idx * 4 + 1], b: data[idx * 4 + 2] };
}

/**
 * Flood-fill background removal from all four corners.
 * @param dataUrl  Source image (any format the browser supports)
 * @param tolerance  Color similarity threshold 0-255 (default 35 — good for white/solid bg)
 * @param featherEdge  Smooth edges by fading near-tolerance pixels (default true)
 * @returns  Promise<string> — transparent PNG as data URL
 */
export function removeBackground(
  dataUrl: string,
  tolerance = 35,
  featherEdge = true,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No 2D context')); return; }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;

      const totalPixels = width * height;
      const visited = new Uint8Array(totalPixels);
      const transparent = new Uint8Array(totalPixels);

      // Sample background color from all 4 corners and use average
      const corners = [
        getPixel(data, 0),
        getPixel(data, width - 1),
        getPixel(data, (height - 1) * width),
        getPixel(data, (height - 1) * width + width - 1),
      ];
      const bg: RGB = {
        r: Math.round(corners.reduce((s, c) => s + c.r, 0) / corners.length),
        g: Math.round(corners.reduce((s, c) => s + c.g, 0) / corners.length),
        b: Math.round(corners.reduce((s, c) => s + c.b, 0) / corners.length),
      };

      // BFS flood-fill from all corners
      const queue: number[] = [
        0, width - 1,
        (height - 1) * width,
        (height - 1) * width + width - 1,
      ];

      while (queue.length > 0) {
        const idx = queue.pop()!;
        if (idx < 0 || idx >= totalPixels || visited[idx]) continue;
        visited[idx] = 1;

        const px = getPixel(data, idx);
        const dist = colorDistance(px, bg);

        if (dist <= tolerance) {
          transparent[idx] = 1;
          const x = idx % width;
          const y = Math.floor(idx / width);
          if (x > 0) queue.push(idx - 1);
          if (x < width - 1) queue.push(idx + 1);
          if (y > 0) queue.push(idx - width);
          if (y < height - 1) queue.push(idx + width);
        } else if (featherEdge && dist <= tolerance * 1.5) {
          // Partial transparency for near-edge pixels
          transparent[idx] = 2;
        }
      }

      // Apply transparency
      for (let i = 0; i < totalPixels; i++) {
        if (transparent[i] === 1) {
          data[i * 4 + 3] = 0;
        } else if (transparent[i] === 2) {
          const px = getPixel(data, i);
          const dist = colorDistance(px, bg);
          const alpha = Math.round(((dist - tolerance) / (tolerance * 0.5)) * 255);
          data[i * 4 + 3] = Math.min(255, Math.max(0, alpha));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataUrl;
  });
}

/**
 * Convert any image DataURL to PNG DataURL (for format normalization).
 */
export function toPng(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No 2D context')); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataUrl;
  });
}

import { uploadFileToServer } from './uploadService';

/**
 * Upload an image DataURL or Blob to the server upload endpoint.
 * Returns the server-hosted URL (e.g. /api/uploads/uuid.png).
 */
export async function uploadImageToServer(dataUrl: string, filename = 'image.png'): Promise<string> {
  const result = await uploadFileToServer(dataUrl, { filename });
  return result.url;
}
