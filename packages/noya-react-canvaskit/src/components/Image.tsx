import { CanvasKit, Paint, Rect } from 'canvaskit-types';
import { useCanvasKit } from 'noya-renderer';
import { createElement, memo, useMemo } from 'react';
import { memoize } from 'noya-utils';
import usePaint, { PaintParameters } from '../hooks/usePaint';
import useRect from '../hooks/useRect';
import { ImageComponentProps } from '../types';

const decodeImage = memoize((CanvasKit: CanvasKit, data: ArrayBuffer) => {
  return CanvasKit.MakeImageFromEncoded(data);
});

interface ImageProps {
  image: ArrayBuffer;
  rect: Rect;
  paint: Paint | PaintParameters;
  resample?: boolean;
}

export default memo(function Image(props: ImageProps) {
  const CanvasKit = useCanvasKit();

  const rect = useRect(props.rect);
  const paint = usePaint(props.paint);
  const image = useMemo(
    () => decodeImage(CanvasKit, props.image),
    [CanvasKit, props.image],
  );

  const elementProps: ImageComponentProps | undefined = useMemo(
    () =>
      image
        ? {
            rect,
            paint,
            image,
            resample: props.resample,
          }
        : undefined,
    [rect, paint, image, props.resample],
  );

  if (!elementProps) return null;

  return createElement('Image', elementProps);
});
