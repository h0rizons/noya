import { AffineTransform } from 'noya-geometry';
import { isNumberEqual } from 'noya-utils';
import { Bounds, Point, Rect, Size } from './types';

export function transformRect(
  rect: Rect,
  transform: AffineTransform,
  normalized: boolean = true,
): Rect {
  const bounds = createBounds(rect);
  const p1 = transform.applyTo({
    x: bounds.minX,
    y: bounds.minY,
  });
  const p2 = transform.applyTo({
    x: bounds.maxX,
    y: bounds.maxY,
  });
  return createRect(p1, p2, normalized);
}

/**
 * Create a rectangle with a non-negative width and height
 */
export function createRect(
  initialPoint: Point,
  finalPoint: Point,
  normalized: boolean = true,
): Rect {
  if (normalized) {
    return {
      x: Math.min(finalPoint.x, initialPoint.x),
      y: Math.min(finalPoint.y, initialPoint.y),
      width: Math.abs(finalPoint.x - initialPoint.x),
      height: Math.abs(finalPoint.y - initialPoint.y),
    };
  } else {
    return {
      x: initialPoint.x,
      y: initialPoint.y,
      width: finalPoint.x - initialPoint.x,
      height: finalPoint.y - initialPoint.y,
    };
  }
}

export function createRectFromBounds(
  bounds: Omit<Bounds, 'midX' | 'midY'>,
): Rect {
  return {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
}

export function getRectCornerPoints(rect: Rect): [Point, Point, Point, Point] {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
}

export function getRectEdgeMidPoints(rect: Rect): [Point, Point, Point, Point] {
  const { minX, minY, midX, midY, maxX, maxY } = createBounds(rect);

  return [
    { x: midX, y: minY },
    { x: maxX, y: midY },
    { x: midX, y: maxY },
    { x: minX, y: midY },
  ];
}

function areaOfTriangle(p1: Point, p2: Point, p3: Point): number {
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  const { x: x3, y: y3 } = p3;

  return (
    Math.abs(x1 * y2 + x2 * y3 + x3 * y1 - y1 * x2 - y2 * x3 - y3 * x1) / 2
  );
}

// https://stackoverflow.com/a/17146376
export function rotatedRectContainsPoint(points: Point[], p: Point): boolean {
  const [a, b, c, d] = points;

  // Calculate the sum of areas of △APD, △DPC, △CPB, △BPA.
  const triangleArea =
    areaOfTriangle(a, p, d) +
    areaOfTriangle(d, p, c) +
    areaOfTriangle(c, p, b) +
    areaOfTriangle(b, p, a);

  const rectangleArea = areaOfTriangle(a, b, c) + areaOfTriangle(a, c, d);

  if (isNumberEqual(triangleArea, rectangleArea)) return true;

  // If this sum is greater than the area of the rectangle:
  // Then point P(x,y) is outside the rectangle.
  // Else it is in or on the rectangle.
  return !(triangleArea > rectangleArea);
}

export function createBounds(rect: Rect | Size): Bounds {
  if (!('x' in rect && 'y' in rect)) {
    return createBounds({ x: 0, y: 0, ...rect });
  }

  const minX = Math.min(rect.x, rect.x + rect.width);
  const minY = Math.min(rect.y, rect.y + rect.height);
  const maxX = Math.max(rect.x, rect.x + rect.width);
  const maxY = Math.max(rect.y, rect.y + rect.height);

  const midX = (maxX + minX) / 2;
  const midY = (maxY + minY) / 2;

  return {
    minX,
    midX,
    maxX,
    minY,
    midY,
    maxY,
  };
}

export function rectContainsPoint(rect: Rect, point: Point): boolean {
  return (
    rect.x <= point.x &&
    point.x <= rect.x + rect.width &&
    rect.y <= point.y &&
    point.y <= rect.y + rect.height
  );
}

// https://searchfox.org/mozilla-beta/source/toolkit/modules/Geometry.jsm
export function rectsIntersect(a: Rect, b: Rect): boolean {
  const x1 = Math.max(a.x, b.x);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y1 = Math.max(a.y, b.y);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  return x1 < x2 && y1 < y2;
}

export function rectsContainsRect(outer: Rect, inner: Rect): boolean {
  const outerBounds = createBounds(outer);
  const innerBounds = createBounds(inner);

  return (
    outerBounds.minX <= innerBounds.minX &&
    innerBounds.maxX <= outerBounds.maxX &&
    outerBounds.minY <= innerBounds.minY &&
    innerBounds.maxY <= outerBounds.maxY
  );
}

/**
 * Ensure a rect has a non-negative width and height
 */
export function normalizeRect(rect: Rect): Rect {
  return {
    x: Math.min(rect.x + rect.width, rect.x),
    y: Math.min(rect.y + rect.height, rect.y),
    width: Math.abs(rect.width),
    height: Math.abs(rect.height),
  };
}

export function insetRect<T extends Rect>(rect: T, dx: number, dy = dx): T {
  return {
    ...rect,
    x: rect.x + dx,
    y: rect.y + dy,
    width: rect.width - dx * 2,
    height: rect.height - dy * 2,
  };
}

export function unionRects(...rects: Rect[]): Rect {
  function union(a: Rect, b: Rect) {
    const minX = Math.min(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxX = Math.max(a.x + a.width, b.x + b.width);
    const maxY = Math.max(a.y + a.height, b.y + b.height);

    return createRectFromBounds({ minX, minY, maxX, maxY });
  }

  if (rects.length === 0) {
    console.error('No rects to union');
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return rects.reduce((acc, rect) => union(acc, rect), rects[0]);
}

export function computeBoundsFromPoints(points: Point[]): Rect {
  const x = Math.min(...points.map((point) => point.x));
  const y = Math.min(...points.map((point) => point.y));
  const width = Math.max(...points.map((point) => point.x)) - x;
  const height = Math.max(...points.map((point) => point.y)) - y;

  return { x, y, width, height };
}

export function LTRBArrayToRect(inRect: number[]): Rect {
  const [left, top, right, bottom] = inRect;

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

export function RectToLTRBArray(inRect: Rect): number[] {
  return [
    inRect.x,
    inRect.y,
    inRect.x + inRect.width,
    inRect.y + inRect.height,
  ];
}
