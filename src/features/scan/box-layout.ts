import type { BoundingBox } from './types';

export type Size = { width: number; height: number };

export type Rect = { left: number; top: number; width: number; height: number };

/**
 * Where an image of `image` size lands inside `container` with contentFit="contain":
 * scaled to fit entirely, centred, letterboxed on one axis.
 */
export function containRect(image: Size, container: Size): Rect {
  if (image.width <= 0 || image.height <= 0 || container.width <= 0 || container.height <= 0)
    return { left: 0, top: 0, width: 0, height: 0 };

  const scale = Math.min(container.width / image.width, container.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    left: (container.width - width) / 2,
    top: (container.height - height) / 2,
    width,
    height,
  };
}

/**
 * Maps a detection box from the backend's coordinate space (`image`, i.e.
 * imageWidth x imageHeight: EXIF-upright, resized) onto the on-screen rect the
 * photo occupies. Scaling by ratio makes the resize invisible to the client.
 */
export function mapBox(box: BoundingBox, image: Size, shown: Rect): Rect {
  const sx = shown.width / image.width;
  const sy = shown.height / image.height;
  const x1 = Math.max(0, Math.min(box.x1, image.width));
  const y1 = Math.max(0, Math.min(box.y1, image.height));
  const x2 = Math.max(x1, Math.min(box.x2, image.width));
  const y2 = Math.max(y1, Math.min(box.y2, image.height));
  return {
    left: shown.left + x1 * sx,
    top: shown.top + y1 * sy,
    width: (x2 - x1) * sx,
    height: (y2 - y1) * sy,
  };
}
