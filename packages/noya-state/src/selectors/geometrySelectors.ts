import type { CanvasKit } from 'canvaskit';
import Sketch from 'noya-file-format';
import {
  AffineTransform,
  createRect,
  createRectFromBounds,
  getRectCornerPoints,
  Insets,
  Point,
  Rect,
  rectContainsPoint,
  rectsContainsRect,
  rectsIntersect,
  rotatedRectContainsPoint,
  Size,
  transformRect,
} from 'noya-geometry';
import { measureLayout, YogaNode } from 'noya-layout';
import { IFontManager } from 'noya-renderer';
import * as Primitives from 'noya-state';
import {
  elementLayerToLayoutNode,
  getSourceFileForId,
  ScalingOptions,
} from 'noya-state';
import {
  ElementLayer,
  getComponentLayer,
  TypescriptEnvironment,
} from 'noya-typescript';
import { isShallowEqual, zip } from 'noya-utils';
import { SKIP, STOP, VisitOptions, withOptions } from 'tree-visit';
import { ApplicationState, Layers, PageLayer } from '../index';
import { visitReversed } from '../layers';
import { CompassDirection } from '../reducers/interactionReducer';
import { getDragHandles } from '../selection';
import { ElementLayerPath, parseObjectId } from './componentSelectors';
import { getSelectedLayerIndexPaths } from './indexPathSelectors';
import {
  getCurrentPage,
  getCurrentPageMetadata,
  getCurrentPageZoom,
} from './pageSelectors';
import {
  getArtboardLabelParagraphSize,
  getArtboardLabelRect,
  getArtboardLabelTransform,
} from './textSelectors';
import {
  getCanvasTransform,
  getLayerFlipTransform,
  getLayerRotationTransform,
  getLayerTransformAtIndexPathReversed,
  getScreenTransform,
} from './transformSelectors';

export type LayerTraversalOptions = {
  /**
   * The default is false
   */
  includeHiddenLayers?: boolean;

  /**
   * The default is true
   */
  includeLockedLayers?: boolean;

  /**
   * The default is false
   */
  includeElements?: boolean;

  /**
   * The TypescriptEnvironment is required to traverse into elements
   */
  typescriptEnvironment?: TypescriptEnvironment | false;

  /**
   * The default is `groupOnly`
   */
  groups?: 'groupOnly' | 'childrenOnly' | 'groupAndChildren';

  /**
   * The default is `childrenOnly`
   *
   * We use `emptyOrContainedArtboardOrChildren` when we're working with user interactions.
   * This will select empty artboards, artboards fully contained by the user's marquee, or
   * artboards where the label contains the mouse.
   */
  artboards?:
    | 'artboardOnly'
    | 'childrenOnly'
    | 'artboardAndChildren'
    | 'emptyOrContainedArtboardOrChildren';
};

const DEFAULT_TRAVERSAL_OPTIONS: Required<LayerTraversalOptions> = {
  includeHiddenLayers: false,
  includeLockedLayers: true,
  includeElements: false,
  groups: 'groupOnly',
  artboards: 'childrenOnly',
  typescriptEnvironment: false,
};

function shouldVisitChildren(
  layer: Sketch.AnyLayer,
  traversalOptions: LayerTraversalOptions,
) {
  const options: Required<LayerTraversalOptions> = {
    ...DEFAULT_TRAVERSAL_OPTIONS,
    ...traversalOptions,
  };

  switch (layer._class) {
    case 'symbolMaster':
    case 'artboard':
      return options.artboards !== 'artboardOnly';
    case 'group':
      return options.groups !== 'groupOnly' || layer.hasClickThrough;
    case 'slice':
      return options.groups !== 'groupOnly';
    default:
      return false;
  }
}

function shouldVisitLayer(
  layer: Sketch.AnyLayer,
  traversalOptions: LayerTraversalOptions,
) {
  const options: Required<LayerTraversalOptions> = {
    ...DEFAULT_TRAVERSAL_OPTIONS,
    ...traversalOptions,
  };

  return (
    (layer.isVisible || options.includeHiddenLayers) &&
    (!layer.isLocked || options.includeLockedLayers)
  );
}

function visitLayersReversed(
  rootLayer: Sketch.AnyLayer,
  options: LayerTraversalOptions,
  onEnter: NonNullable<VisitOptions<Sketch.AnyLayer>['onEnter']>,
) {
  visitReversed(rootLayer, {
    onEnter: (layer, indexPath) => {
      if (Layers.isPageLayer(layer)) return;

      if (!shouldVisitLayer(layer, options)) return SKIP;

      const result = onEnter(layer, indexPath);

      if (result === STOP) return result;

      if (!shouldVisitChildren(layer, options)) return SKIP;

      return result;
    },
  });
}

export function getLayersInRect(
  state: ApplicationState,
  page: Sketch.Page,
  insets: Insets,
  rect: Rect,
  options: LayerTraversalOptions = {},
): PageLayer[] {
  let found: Sketch.AnyLayer[] = [];

  const screenTransform = getScreenTransform(insets);
  const screenRect = transformRect(rect, screenTransform);

  const canvasTransform = getCanvasTransform(state, insets);

  visitLayersReversed(page, options, (layer, indexPath) => {
    const transform = getLayerTransformAtIndexPathReversed(
      page,
      indexPath,
      canvasTransform,
    );
    const transformedFrame = transformRect(layer.frame, transform);

    // TODO: Handle rotated rectangle collision
    const hasIntersect = rectsIntersect(transformedFrame, screenRect);

    if (!hasIntersect) return SKIP;

    const includeSelf =
      (Layers.isGroup(layer) && options.groups === 'groupAndChildren') ||
      (Layers.isSymbolMasterOrArtboard(layer) &&
        (options.artboards === 'artboardAndChildren' ||
          (options.artboards === 'emptyOrContainedArtboardOrChildren' &&
            (layer.layers.length === 0 ||
              rectsContainsRect(screenRect, transformedFrame)))));

    // Traverse into children and return some of them, instead of returning this layer
    if (!includeSelf && shouldVisitChildren(layer, options)) return;

    found.push(layer);
  });

  return found as PageLayer[];
}

export function artboardLabelContainsPoint(
  CanvasKit: CanvasKit,
  fontManager: IFontManager,
  layer: Sketch.Artboard | Sketch.SymbolMaster | Sketch.ComponentContainer,
  canvasTransform: AffineTransform,
  screenPoint: Point,
  zoom: number,
): boolean {
  const paragraphSize = getArtboardLabelParagraphSize(
    CanvasKit,
    fontManager,
    layer.name,
  );

  const rect = getArtboardLabelRect(layer.frame, paragraphSize);

  const zoomRect = transformRect(rect, getArtboardLabelTransform(rect, zoom));

  const labelRect = transformRect(zoomRect, canvasTransform);

  return rectContainsPoint(labelRect, screenPoint);
}

export function getLayerAtPoint(
  CanvasKit: CanvasKit,
  fontManager: IFontManager,
  state: ApplicationState,
  insets: Insets,
  point: Point,
  options: LayerTraversalOptions = {},
): PageLayer | undefined {
  const page = getCurrentPage(state);
  const { zoomValue } = getCurrentPageMetadata(state);
  const canvasTransform = getCanvasTransform(state, insets);
  const screenTransform = getScreenTransform(insets);

  let found: Sketch.AnyLayer | undefined;

  const screenPoint = screenTransform.applyTo(point);

  visitLayersReversed(page, options, (layer, indexPath) => {
    const transform = AffineTransform.multiply(
      getLayerTransformAtIndexPathReversed(page, indexPath, canvasTransform),
      getLayerFlipTransform(layer),
      getLayerRotationTransform(layer),
    );

    const framePoints = getRectCornerPoints(layer.frame);
    const localPoints = framePoints.map((point) => transform.applyTo(point));

    const frameContainsPoint = rotatedRectContainsPoint(
      localPoints,
      screenPoint,
    );

    if (!frameContainsPoint) {
      if (
        Layers.isSymbolMasterOrArtboardOrComponentContainer(layer) &&
        options.artboards === 'emptyOrContainedArtboardOrChildren' &&
        artboardLabelContainsPoint(
          CanvasKit,
          fontManager,
          layer,
          canvasTransform,
          screenPoint,
          zoomValue,
        )
      ) {
        found = layer;

        return STOP;
      }

      return SKIP;
    }

    const includeArtboard =
      Layers.isSymbolMasterOrArtboard(layer) &&
      (options.artboards === 'artboardAndChildren' ||
        (options.artboards === 'emptyOrContainedArtboardOrChildren' &&
          layer.layers.length === 0));

    // Traverse into children and return one of them, instead of returning this layer
    if (!includeArtboard && shouldVisitChildren(layer, options)) return;

    switch (layer._class) {
      case 'rectangle':
      case 'oval': {
        const pathPoint = transform.invert().applyTo(screenPoint);

        const path = Primitives.path(
          CanvasKit,
          layer.points,
          layer.frame,
          layer.isClosed,
        );

        if (!path.contains(pathPoint.x, pathPoint.y)) return;

        break;
      }
      default:
        break;
    }

    found = layer;

    return STOP;
  });

  return found as PageLayer;
}

/**
 * Returns an axis-aligned Rect that contains all layers passed via `layerIds`,
 * or undefined if no layers were passed.
 */
export function getBoundingRect(
  rootLayer: Sketch.AnyLayer,
  layerIds: string[],
  options: LayerTraversalOptions = {},
): Rect | undefined {
  let bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  visitLayersReversed(rootLayer, options, (layer, indexPath) => {
    if (
      options.includeElements &&
      options.typescriptEnvironment &&
      Layers.isComponentContainer(layer)
    ) {
      const elementPaths: ElementLayerPath[] = layerIds
        .filter((id) => id.startsWith(layer.do_objectID))
        .map(parseObjectId)
        .flatMap(({ indexPath, layerId }) =>
          indexPath ? [{ indexPath, layerId }] : [],
        );

      const sourceFile = getSourceFileForId(
        options.typescriptEnvironment,
        layer.do_objectID,
      );

      if (!sourceFile) return;

      const componentLayer = getComponentLayer(sourceFile);

      if (!componentLayer) return;

      const layoutNode = elementLayerToLayoutNode(componentLayer.element);

      const measuredLayout = measureLayout(layoutNode, layer.frame);

      visitElementLayers(
        layer.frame,
        componentLayer.element,
        measuredLayout,
        (elementLayer, rect) => {
          if (
            !elementPaths.some((elementPath) =>
              isShallowEqual(elementLayer.indexPath, elementPath.indexPath),
            )
          )
            return;

          const localPoints = getRectCornerPoints(rect);
          const xs = localPoints.map((point) => point.x);
          const ys = localPoints.map((point) => point.y);

          bounds.minX = Math.min(bounds.minX, ...xs);
          bounds.minY = Math.min(bounds.minY, ...ys);
          bounds.maxX = Math.max(bounds.maxX, ...xs);
          bounds.maxY = Math.max(bounds.maxY, ...ys);
        },
      );
    }

    if (!layerIds.includes(layer.do_objectID)) return;

    const transform = AffineTransform.multiply(
      getLayerTransformAtIndexPathReversed(rootLayer, indexPath),
      getLayerFlipTransform(layer),
      getLayerRotationTransform(layer),
    );

    const framePoints = getRectCornerPoints(layer.frame);
    const localPoints = framePoints.map((point) => transform.applyTo(point));

    const xs = localPoints.map((point) => point.x);
    const ys = localPoints.map((point) => point.y);

    bounds.minX = Math.min(bounds.minX, ...xs);
    bounds.minY = Math.min(bounds.minY, ...ys);
    bounds.maxX = Math.max(bounds.maxX, ...xs);
    bounds.maxY = Math.max(bounds.maxY, ...ys);
  });

  // Check that at least one layer had a non-zero size
  if (!Object.values(bounds).every(isFinite)) return undefined;

  return createRectFromBounds(bounds);
}

export function getBoundingPoints(
  rootLayer: Sketch.AnyLayer,
  layerId: string,
  options: LayerTraversalOptions = {},
): Point[] {
  let points: Point[] = [];

  visitLayersReversed(rootLayer, options, (layer, indexPath) => {
    if (layerId !== layer.do_objectID) return;

    const transform = AffineTransform.multiply(
      getLayerTransformAtIndexPathReversed(rootLayer, indexPath),
      getLayerFlipTransform(layer),
      getLayerRotationTransform(layer),
    );

    const framePoints = getRectCornerPoints(layer.frame);
    points = framePoints.map((point) => transform.applyTo(point));

    return STOP;
  });

  return points;
}

export function getScaleDirectionAtPoint(
  state: ApplicationState,
  point: Point,
): CompassDirection | undefined {
  const page = getCurrentPage(state);
  const boundingRect = getBoundingRect(page, state.selectedLayerIds);

  if (!boundingRect) return;

  const handles = getDragHandles(
    state,
    boundingRect,
    getCurrentPageZoom(state),
  );

  const handle = handles.find((handle) =>
    rectContainsPoint(handle.rect, point),
  );

  return handle?.compassDirection;
}

export const getSelectedRect = (state: ApplicationState): Rect => {
  const page = getCurrentPage(state);
  const layerIndexPaths = getSelectedLayerIndexPaths(state);
  const layerIds = layerIndexPaths.map(
    (indexPath) => Layers.access(page, indexPath).do_objectID,
  );
  return getBoundingRect(page, layerIds)!;
};

export function getBoundingRectMap(
  rootLayer: Sketch.AnyLayer,
  layerIds: string[],
  options: LayerTraversalOptions,
) {
  const rectMap: Record<string, Rect> = {};

  layerIds.forEach((layerId) => {
    if (layerId in rectMap) return;

    const rect = getBoundingRect(rootLayer, [layerId], options);

    if (!rect) return;

    rectMap[layerId] = rect;
  });

  return rectMap;
}

export function getPageContentBoundingRect(page: Sketch.Page) {
  return getBoundingRect(
    page,
    Layers.findAll(page, () => true).map((l) => l.do_objectID),
  );
}

export function getClippedLayerMap(
  state: ApplicationState,
  canvasSize: Size,
  canvasInsets: Insets,
) {
  const page = getCurrentPage(state);

  const allLayerIds = Layers.findAll(
    page,
    (layer) => !Layers.isPageLayer(layer),
  ).map((layer) => layer.do_objectID);

  const visibleRect = {
    x: -canvasInsets.left,
    y: -canvasInsets.top,
    width: canvasSize.width + canvasInsets.left + canvasInsets.right,
    height: canvasSize.height + canvasInsets.top + canvasInsets.bottom,
  };

  const visibleLayerSet = getLayersInRect(
    state,
    page,
    canvasInsets,
    visibleRect,
    {
      groups: 'groupAndChildren',
      artboards: 'artboardAndChildren',
    },
  ).map((layer) => layer.do_objectID);

  const result: Record<string, boolean> = {};

  allLayerIds.forEach((id) => {
    result[id] = true;
  });

  visibleLayerSet.forEach((id) => {
    result[id] = false;
  });

  return result;
}

export function getDrawnLayerRect(
  origin: Point,
  current: Point,
  { scalingOriginMode, constrainProportions }: ScalingOptions,
): Rect {
  if (constrainProportions) {
    const delta = {
      x: current.x - origin.x,
      y: current.y - origin.y,
    };

    const max = Math.max(Math.abs(delta.x), Math.abs(delta.y));

    current = {
      x: origin.x + (delta.x < 0 ? -max : max),
      y: origin.y + (delta.y < 0 ? -max : max),
    };
  }

  if (scalingOriginMode === 'center') {
    const delta = {
      x: current.x - origin.x,
      y: current.y - origin.y,
    };

    origin = {
      x: origin.x - delta.x,
      y: origin.y - delta.y,
    };
  }

  return createRect(origin, current);
}

type ElementLayoutPair = [ElementLayer, YogaNode];

const ElementLayoutPairs = withOptions<ElementLayoutPair>({
  getChildren: ([elementLayer, yogaNode]) => {
    const yogaChildren: YogaNode[] = [];
    for (let i = 0; i < yogaNode.getChildCount(); i++) {
      yogaChildren.push(yogaNode.getChild(i));
    }
    return zip(elementLayer.children, yogaChildren);
  },
});

function visitElementLayers(
  initialOffset: Point,
  elementLayer: ElementLayer,
  measuredLayout: YogaNode,
  f: (elementLayer: ElementLayer, rect: Rect) => void,
) {
  let offset = { ...initialOffset };

  ElementLayoutPairs.visit([elementLayer, measuredLayout], {
    onEnter: ([elementLayer, yogaNode]) => {
      const left = yogaNode.getComputedLeft();
      const top = yogaNode.getComputedTop();
      const width = yogaNode.getComputedWidth();
      const height = yogaNode.getComputedHeight();

      offset.x += left;
      offset.y += top;

      const rect = { ...offset, width, height };

      f(elementLayer, rect);
    },
    onLeave: ([, yogaNode]) => {
      const left = yogaNode.getComputedLeft();
      const top = yogaNode.getComputedTop();

      offset.x -= left;
      offset.y -= top;
    },
  });
}

export function findInElementLayer<T>(
  initialOffset: Point,
  elementLayer: ElementLayer,
  measuredLayout: YogaNode,
  f: (elementLayer: ElementLayer, rect: Rect) => T | undefined,
): T | undefined {
  let found: T[] = [];

  visitElementLayers(
    initialOffset,
    elementLayer,
    measuredLayout,
    (elementLayer, rect) => {
      let result = f(elementLayer, rect);

      if (result !== undefined) {
        found.push(result);
      }
    },
  );

  return found.length > 0 ? found[found.length - 1] : undefined;
}

export function getElementAtPoint(
  CanvasKit: CanvasKit,
  fontManager: IFontManager,
  state: ApplicationState,
  insets: Insets,
  point: Point,
  layer: Sketch.ComponentContainer,
  typescriptEnvironment: TypescriptEnvironment,
): ElementLayer | undefined {
  // const page = getCurrentPage(state);
  // const { zoomValue } = getCurrentPageMetadata(state);
  const canvasTransform = getCanvasTransform(state, insets);
  const screenTransform = getScreenTransform(insets);

  const screenPoint = screenTransform.applyTo(point);

  const sourceFile = getSourceFileForId(
    typescriptEnvironment,
    layer.do_objectID,
  );

  if (!sourceFile) return;

  const componentLayer = getComponentLayer(sourceFile);

  if (!componentLayer) return;

  const layoutNode = elementLayerToLayoutNode(componentLayer.element);

  const measuredLayout = measureLayout(layoutNode, layer.frame);

  return findInElementLayer(
    layer.frame,
    componentLayer.element,
    measuredLayout,
    (elementLayer, rect) => {
      if (
        rectContainsPoint(transformRect(rect, canvasTransform), screenPoint)
      ) {
        return elementLayer;
      }
    },
  );
}
