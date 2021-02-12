import Sketch from '@sketch-hq/sketch-file-format-ts';
import produce from 'immer';
import type { PageLayer } from '..';
import { Point, Rect, UUID } from '../types';
import * as Models from '../models';

export type ShapeType = 'rectangle' | 'oval' | 'text';

export type InteractionAction =
  | ['reset']
  | [`insert${Capitalize<ShapeType>}`]
  | [type: 'startDrawing', shapeType: ShapeType, id: UUID, point: Point]
  | [type: 'updateDrawing', point: Point]
  | [type: 'maybeMove', origin: Point]
  | [type: 'startMoving', point: Point]
  | [type: 'updateMoving', point: Point];

export type InteractionState =
  | {
      type: 'none';
    }
  | {
      type: `insert${Capitalize<ShapeType>}`;
    }
  | {
      type: 'drawing';
      origin: Point;
      value: PageLayer;
    }
  | { type: 'maybeMove'; origin: Point }
  | { type: 'moving'; previous: Point; next: Point };

/**
 * Create a rectangle with a non-negative width and height
 */
function createRect(initialPoint: Point, finalPoint: Point): Rect {
  return {
    width: Math.abs(finalPoint.x - initialPoint.x),
    height: Math.abs(finalPoint.y - initialPoint.y),
    x: Math.min(finalPoint.x, initialPoint.x),
    y: Math.min(finalPoint.y, initialPoint.y),
  };
}

function createShape(
  shapeType: ShapeType,
): Sketch.Oval | Sketch.Rectangle | Sketch.Text {
  switch (shapeType) {
    case 'oval':
      return Models.oval;
    case 'rectangle':
      return Models.rectangle;
    case 'text':
      return Models.text;
  }
}

export function interactionReducer(
  state: InteractionState,
  action: InteractionAction,
): InteractionState {
  switch (action[0]) {
    case 'insertOval':
    case 'insertRectangle':
    case 'insertText': {
      return { type: action[0] };
    }
    case 'startDrawing': {
      const [, shapeType, id, point] = action;

      let layer = produce(createShape(shapeType), (layer) => {
        layer.do_objectID = id;
        layer.frame = {
          _class: 'rect',
          constrainProportions: false,
          ...createRect(point, point),
        };
      });

      return {
        type: 'drawing',
        value: layer,
        origin: point,
      };
    }
    case 'updateDrawing': {
      if (state.type !== 'drawing') return state;

      const [, point] = action;

      const rect = createRect(state.origin, point);

      return produce(state, (state) => {
        state.value.frame = {
          ...state.value.frame,
          ...rect,
        };
      });
    }
    case 'maybeMove': {
      const [, origin] = action;

      return { type: 'maybeMove', origin };
    }
    case 'startMoving': {
      const [, point] = action;

      if (state.type !== 'maybeMove') {
        throw new Error('Bad interaction state - should be in `maybeMove`');
      }

      return {
        type: 'moving',
        previous: state.origin,
        next: point,
      };
    }
    case 'updateMoving': {
      const [, point] = action;

      if (state.type !== 'moving') {
        throw new Error('Bad interaction state - should be in `moving`');
      }

      return {
        type: 'moving',
        previous: state.next,
        next: point,
      };
    }
    case 'reset': {
      return { type: 'none' };
    }
    default:
      return state;
  }
}

export function createInitialInteractionState(): InteractionState {
  return { type: 'none' };
}
