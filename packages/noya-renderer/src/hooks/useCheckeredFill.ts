import { useMemo } from 'react';
import { useTheme } from 'styled-components';

import { useDeletable } from 'noya-react-canvaskit';
import { CHECKERED_BACKGROUND_BYTES } from 'noya-state';
import { useCanvasKit } from './useCanvasKit';

export default function useCheckeredFill() {
  const CanvasKit = useCanvasKit();
  const { transparentChecker } = useTheme().colors;

  const paint = useMemo(() => {
    const paint = new CanvasKit.Paint();
    const image = CanvasKit.MakeImageFromEncoded(CHECKERED_BACKGROUND_BYTES);

    if (!image) return paint;

    const imageShader = image.makeShaderCubic(
      CanvasKit.TileMode.Repeat,
      CanvasKit.TileMode.Repeat,
      1 / 3,
      1 / 3,
      CanvasKit.CreateMatrix(CanvasKit.Matrix.scaled(0.5, 0.5)),
    );

    const colorShader = CanvasKit.Shader.MakeColor(
      CanvasKit.parseColorString(transparentChecker),
      CanvasKit.ColorSpace.SRGB,
    );

    paint.setShader(
      CanvasKit.Shader.MakeBlend(
        CanvasKit.BlendMode.DstATop,
        colorShader,
        imageShader,
      ),
    );

    return paint;
  }, [CanvasKit, transparentChecker]);

  useDeletable(paint);

  return paint;
}
