import * as AspectRatio from '@radix-ui/react-aspect-ratio';
import Sketch from 'noya-file-format';
import { LayerPreview as RCKLayerPreview } from 'noya-renderer';
import { PageLayer } from 'noya-state';
import { memo, useCallback } from 'react';
import { usePreviewLayer } from '../../hooks/usePreviewLayer';
import CanvasGridItem from '../theme/CanvasGridItem';

interface Props {
  layer: PageLayer;
  page: Sketch.Page;
}

export default memo(function ExportPreviewRow({ layer, page }: Props) {
  const preview = usePreviewLayer({ layer, page });

  return (
    <AspectRatio.Root
      ratio={Math.max(1, layer.frame.width / layer.frame.height)}
    >
      <CanvasGridItem
        renderContent={useCallback(
          (size) => (
            <RCKLayerPreview
              layer={preview.layer}
              layerFrame={preview.frame}
              backgroundColor={preview.backgroundColor}
              previewSize={size}
              showCheckeredBackground
            />
          ),
          [preview.backgroundColor, preview.frame, preview.layer],
        )}
      />
    </AspectRatio.Root>
  );
});
