import { ColorFilter, ImageFilter, Matrix } from 'canvaskit-types';
import { AffineTransform } from 'noya-geometry';
import { createElement, memo, ReactNode, useMemo } from 'react';
import { ClipProps, GroupComponentProps } from '../types';

interface GroupProps {
  opacity?: number;
  transform?: AffineTransform;
  children?: ReactNode;
  clip?: ClipProps;
  colorFilter?: ColorFilter;
  imageFilter?: ImageFilter;
  backdropImageFilter?: ImageFilter;
}

export default memo(function Group(props: GroupProps) {
  const transform = useMemo(
    () =>
      props.transform
        ? (props.transform.float32Array as unknown as Matrix)
        : undefined,
    [props.transform],
  );

  const elementProps: GroupComponentProps = useMemo(
    () => ({
      transform,
      children: props.children,
      opacity: props.opacity ?? 1,
      clip: props.clip,
      colorFilter: props.colorFilter,
      imageFilter: props.imageFilter,
      backdropImageFilter: props.backdropImageFilter,
    }),
    [
      transform,
      props.children,
      props.opacity,
      props.clip,
      props.colorFilter,
      props.imageFilter,
      props.backdropImageFilter,
    ],
  );

  return createElement('Group', elementProps);
});
