import React, { memo, useMemo } from 'react';

import Sketch from 'noya-file-format';
import { getRectCornerPoints } from 'noya-geometry';
import { makePath } from 'noya-react-canvaskit';
import { SketchModel } from 'noya-sketch-model';
import { Primitives } from 'noya-state';
import { useSketchImage } from '../../contexts/ImageCacheContext';
import { Group, Image } from '../../contexts/ComponentsContext';
import { useZoom } from '../../contexts/ZoomContext';
import { useCanvasKit } from '../../hooks/useCanvasKit';
import BlurGroup from '../effects/BlurGroup';
import SketchBorder from '../effects/SketchBorder';
import DropShadowGroup from '../effects/DropShadowGroup';
import ColorControlsGroup from '../effects/ColorControlsGroup';
import { SHOW_PIXELS_ZOOM_THRESHOLD } from '../PixelGrid';

interface Props {
  layer: Sketch.Bitmap;
}

const SketchBitmap: React.FC<Props> = (props) => {
  const { layer } = props;
  const CanvasKit = useCanvasKit();
  const zoom = useZoom();

  const image = useSketchImage(layer.image);

  const paint = useMemo(() => {
    return new CanvasKit.Paint();
  }, [CanvasKit]);

  const path = useMemo(() => {
    const path = makePath(CanvasKit, getRectCornerPoints(layer.frame));

    path.setFillType(CanvasKit.FillType.EvenOdd);

    return path;
  }, [CanvasKit, layer.frame]);

  const blur = useMemo(
    () => layer.style?.blur ?? SketchModel.blur({ isEnabled: false }),
    [layer.style?.blur],
  );

  if (!layer.style || !image) return null;

  const imageElement = (
    <Image
      rect={Primitives.rect(CanvasKit, layer.frame)}
      image={image}
      paint={paint}
      resample={zoom < SHOW_PIXELS_ZOOM_THRESHOLD}
    />
  );

  const borders = (layer.style.borders ?? []).filter((x) => x.isEnabled);
  const shadows = (layer.style.shadows ?? []).filter((x) => x.isEnabled);
  const borderOptions = layer.style.borderOptions ?? {};

  const element = (
    <>
      {shadows.map((shadow, index) => (
        <DropShadowGroup shadow={shadow} key={`shadow-${index}`}>
          {imageElement}
        </DropShadowGroup>
      ))}
      <ColorControlsGroup colorControls={layer.style.colorControls}>
        {imageElement}
      </ColorControlsGroup>
      {borders.map((border, index) => (
        <SketchBorder
          key={`border-${index}`}
          borderOptions={borderOptions}
          path={path}
          border={border}
          frame={layer.frame}
        />
      ))}
    </>
  );

  const opacity = layer.style?.contextSettings?.opacity ?? 1;

  const needsGroup = opacity < 1 || shadows.length > 0;

  return (
    <BlurGroup blur={blur}>
      {needsGroup ? <Group opacity={opacity}>{element}</Group> : element}
    </BlurGroup>
  );
};

export default memo(SketchBitmap);
