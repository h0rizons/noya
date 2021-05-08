import type Sketch from '@sketch-hq/sketch-file-format-ts';
import { AffineTransform, createBounds } from 'noya-geometry';
import { IndexPath } from 'tree-visit';
import { ApplicationState, Layers } from '../index';
import { CanvasInsets } from '../reducers/workspace';
import { toRadians } from '../utils/radians';
import { getCurrentPageMetadata } from './pageSelectors';

export function getLayerTransform(
  ctm: AffineTransform,
  layer: Sketch.AnyLayer,
): AffineTransform {
  const rotation = getLayerRotationTransform(layer);
  const translation = getLayerTranslationTransform(layer);

  return AffineTransform.multiply(ctm, rotation, translation);
}

export function getLayerTranslationTransform(
  layer: Sketch.AnyLayer,
): AffineTransform {
  return AffineTransform.translation(layer.frame.x, layer.frame.y);
}

export function getLayerRotationTransform(
  layer: Sketch.AnyLayer,
): AffineTransform {
  const bounds = createBounds(layer.frame);
  const midpoint = { x: bounds.midX, y: bounds.midY };
  const rotation = getLayerRotationRadians(layer);

  return AffineTransform.rotation(rotation, midpoint.x, midpoint.y);
}

export function getLayerTransformAtIndexPath(
  node: Sketch.AnyLayer,
  indexPath: IndexPath,
  ctm: AffineTransform,
): AffineTransform {
  const path = Layers.accessPath(node, indexPath).slice(1, -1);

  return path.reduce((result, layer) => getLayerTransform(result, layer), ctm);
}

export function getLayerTransformAtIndexPathReversed(
  node: Sketch.AnyLayer,
  indexPath: IndexPath,
  ctm: AffineTransform,
): AffineTransform {
  const path = Layers.accessPathReversed(node, indexPath).slice(1, -1);

  return path.reduce((result, layer) => getLayerTransform(result, layer), ctm);
}

export function getLayerRotationMultiplier(layer: Sketch.AnyLayer): number {
  return layer._class === 'group' ? -1 : 1;
}

export function getLayerRotation(layer: Sketch.AnyLayer): number {
  return layer.rotation * getLayerRotationMultiplier(layer);
}

export function getLayerRotationRadians(layer: Sketch.AnyLayer): number {
  return toRadians(getLayerRotation(layer));
}

export function getScreenTransform(insets: CanvasInsets) {
  return AffineTransform.translation(insets.left, 0);
}

export function getCanvasTransform(
  state: ApplicationState,
  insets: CanvasInsets,
) {
  const { scrollOrigin, zoomValue } = getCurrentPageMetadata(state);

  return AffineTransform.multiply(
    getScreenTransform(insets),
    AffineTransform.translation(scrollOrigin.x, scrollOrigin.y),
    AffineTransform.scale(zoomValue),
  );
}
