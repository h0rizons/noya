import React, { memo, PropsWithChildren } from 'react';

import { ColorFilter, ImageFilter } from 'canvaskit';
import { AffineTransform } from 'noya-geometry';
import {
  Drawing,
  useDrawing,
  selectPaint,
  processPaint,
  skiaMatrix3,
} from '@shopify/react-native-skia';
import { processChildren } from '@shopify/react-native-skia/src/renderer/Host';
import { ClipProps } from '../types';

interface GroupProps {
  opacity?: number;
  transform?: AffineTransform;
  clip?: ClipProps;
  colorFilter?: ColorFilter;
  imageFilter?: ImageFilter;
  backdropImageFilter?: ImageFilter;
}

const Group: React.FC<PropsWithChildren<GroupProps>> = (props) => {
  const onDraw = useDrawing(
    props,
    (
      ctx,
      {
        opacity,
        transform,
        clip,
        colorFilter,
        imageFilter,
        backdropImageFilter,
      },
      children,
    ) => {
      const { canvas } = ctx;
      const paint = selectPaint(ctx.paint, { opacity });
      processPaint(paint, ctx.opacity, { opacity });

      canvas.save();

      if (clip) {
        canvas.clipPath(clip.path._path, clip.op.value, clip.antiAlias);
      }

      if (transform) {
        const { m00, m01, m02, m10, m11, m12 } = transform;
        canvas.concat(
          skiaMatrix3([
            [m00, m01, m02],
            [m10, m11, m12],
            [0, 0, 1],
          ]),
        );
      }

      processChildren(
        {
          ...ctx,
          paint,
          opacity: opacity ? opacity * ctx.opacity : ctx.opacity,
        },
        children,
      );
    },
  );

  return <Drawing onDraw={onDraw} {...props} skipProcessing />;
};

export default memo(Group);
