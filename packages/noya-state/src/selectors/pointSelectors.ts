import {
  parseCurvePoint,
  ParsedCurvePoint,
} from 'noya-renderer/src/primitives';
import { ApplicationState, Layers } from '../index';
import { visit } from '../layers';
import { getCurrentPage } from './pageSelectors';
import { getBoundingRectMap } from './selectors';

export const getSelectedPoints = (
  state: ApplicationState,
): ParsedCurvePoint[] => {
  const page = getCurrentPage(state);
  const boundingRects = getBoundingRectMap(
    getCurrentPage(state),
    Object.keys(state.selectedPointLists),
    {
      clickThroughGroups: true,
      includeArtboardLayers: false,
      includeHiddenLayers: false,
    },
  );

  const points: ParsedCurvePoint[] = [];

  visit(page, (layer) => {
    const boundingRect = boundingRects[layer.do_objectID];
    const pointList = state.selectedPointLists[layer.do_objectID];

    if (
      !boundingRect ||
      !pointList ||
      pointList.length === 0 ||
      !Layers.isPointsLayer(layer)
    )
      return;

    const selectedPoints = layer.points.filter((_, index) =>
      pointList.includes(index),
    );

    if (selectedPoints.length === 0) return;

    const parsedPoints = selectedPoints.map((point) =>
      parseCurvePoint(point, boundingRect),
    );

    points.push(...parsedPoints);
  });

  return points;
};
