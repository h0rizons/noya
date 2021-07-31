import type { CanvasKit as CanvasKitType } from 'canvaskit';
import { loadCanvasKit } from 'noya-renderer';
import { debugDescription, SketchModel } from 'noya-sketch-model';
import { createInitialState, createSketchFile, Selectors } from 'noya-state';
import {
  Action,
  applicationReducer,
  ApplicationReducerContext,
  ApplicationState,
} from '../applicationReducer';

let CanvasKit: CanvasKitType;

beforeAll(async () => {
  CanvasKit = await loadCanvasKit();
});

const context: ApplicationReducerContext = {
  canvasSize: { width: 1000, height: 1000 },
};

function run(state: ApplicationState, actions: Action[]) {
  return actions.reduce(
    (result, action) => applicationReducer(result, action, CanvasKit, context),
    state,
  );
}

const rectangle = SketchModel.rectangle({
  frame: SketchModel.rect({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  }),
});

const oval = SketchModel.oval({
  frame: SketchModel.rect({
    x: 200,
    y: 200,
    width: 100,
    height: 100,
  }),
});

describe('move', () => {
  test('move one layer', () => {
    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [rectangle] })),
    );
    state.selectedObjects = [rectangle.do_objectID];

    const updated = run(state, [
      ['interaction', ['maybeMove', { x: 10, y: 10 }]],
      ['interaction', ['updateMoving', { x: 25, y: 25 }]],
    ]);

    expect(
      debugDescription([
        Selectors.getCurrentPage(state),
        Selectors.getCurrentPage(updated),
      ]),
    ).toMatchSnapshot();
  });

  test('move multiple layers', () => {
    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [rectangle, oval] })),
    );
    state.selectedObjects = [rectangle.do_objectID, oval.do_objectID];

    const updated = run(state, [
      ['interaction', ['maybeMove', { x: 10, y: 10 }]],
      ['interaction', ['updateMoving', { x: 25, y: 25 }]],
    ]);

    expect(
      debugDescription([
        Selectors.getCurrentPage(state),
        Selectors.getCurrentPage(updated),
      ]),
    ).toMatchSnapshot();
  });

  test('move with snap', () => {
    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [rectangle, oval] })),
    );
    state.selectedObjects = [rectangle.do_objectID];

    const mouseOriginX = 10;

    const updated = run(state, [
      ['interaction', ['maybeMove', { x: mouseOriginX, y: 10 }]],
      [
        'interaction',
        ['updateMoving', { x: oval.frame.x + mouseOriginX - 3, y: 25 }],
      ],
    ]);

    expect(
      debugDescription([
        Selectors.getCurrentPage(state),
        Selectors.getCurrentPage(updated),
      ]),
    ).toMatchSnapshot();
  });

  test('move layer in artboard', () => {
    const artboard = SketchModel.artboard({
      frame: SketchModel.rect({
        x: 450,
        y: 450,
        width: 300,
        height: 300,
      }),
      layers: [rectangle],
    });

    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [artboard] })),
    );
    state.selectedObjects = [rectangle.do_objectID];

    const updated = run(state, [
      ['interaction', ['maybeMove', { x: 460, y: 460 }]],
      ['interaction', ['updateMoving', { x: 475, y: 475 }]],
    ]);

    expect(
      debugDescription([
        Selectors.getCurrentPage(state),
        Selectors.getCurrentPage(updated),
      ]),
    ).toMatchSnapshot();
  });
});

describe('movingPoint', () => {
  test('move one point', () => {
    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [rectangle] })),
    );
    state.selectedObjects = [rectangle.do_objectID];

    const updated = run(state, [
      ['interaction', ['editPath']],
      ['selectPoint', [rectangle.do_objectID, 0]],
      ['interaction', ['maybeMovePoint', { x: 0, y: 0 }]],
      ['interaction', ['movingPoint', { x: 0, y: 0 }, { x: 25, y: 25 }]],
    ]);

    expect(
      debugDescription(
        [Selectors.getCurrentPage(state), Selectors.getCurrentPage(updated)],
        { points: true },
      ),
    ).toMatchSnapshot();
  });

  test('move point in artboard', () => {
    const artboard = SketchModel.artboard({
      frame: SketchModel.rect({
        x: 100,
        y: 100,
        width: 300,
        height: 300,
      }),
      layers: [rectangle],
    });

    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [artboard] })),
    );

    state.selectedObjects = [rectangle.do_objectID];

    const updated = run(state, [
      ['interaction', ['editPath']],
      ['selectPoint', [rectangle.do_objectID, 0]],
      ['interaction', ['maybeMovePoint', { x: 0, y: 0 }]],
      ['interaction', ['movingPoint', { x: 0, y: 0 }, { x: 25, y: 25 }]],
    ]);

    expect(
      debugDescription(
        [Selectors.getCurrentPage(state), Selectors.getCurrentPage(updated)],
        { points: true },
      ),
    ).toMatchSnapshot();
  });
});

describe('movingControlPoint', () => {
  test('move one control point', () => {
    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [oval] })),
    );
    state.selectedObjects = [oval.do_objectID];

    const updated = run(state, [
      ['interaction', ['editPath']],
      ['selectControlPoint', oval.do_objectID, 0, 'curveFrom'],
      ['interaction', ['maybeMoveControlPoint', { x: 0, y: 0 }]],
      ['interaction', ['movingControlPoint', { x: 0, y: 0 }, { x: 25, y: 25 }]],
    ]);

    expect(
      debugDescription(
        [Selectors.getCurrentPage(state), Selectors.getCurrentPage(updated)],
        { points: true },
      ),
    ).toMatchSnapshot();
  });

  test('move control point in artboard', () => {
    const artboard = SketchModel.artboard({
      frame: SketchModel.rect({
        x: 100,
        y: 100,
        width: 300,
        height: 300,
      }),
      layers: [oval],
    });

    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [artboard] })),
    );

    state.selectedObjects = [oval.do_objectID];

    const updated = run(state, [
      ['interaction', ['editPath']],
      ['selectControlPoint', oval.do_objectID, 0, 'curveFrom'],
      ['interaction', ['maybeMoveControlPoint', { x: 0, y: 0 }]],
      ['interaction', ['movingControlPoint', { x: 0, y: 0 }, { x: 25, y: 25 }]],
    ]);

    expect(
      debugDescription(
        [Selectors.getCurrentPage(state), Selectors.getCurrentPage(updated)],
        { points: true },
      ),
    ).toMatchSnapshot();
  });
});

describe('scale', () => {
  test('scale one layer se', () => {
    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [rectangle] })),
    );
    state.selectedObjects = [rectangle.do_objectID];

    const updated = run(state, [
      ['interaction', ['maybeScale', { x: 100, y: 100 }, 'se']],
      ['interaction', ['updateScaling', { x: 125, y: 125 }]],
    ]);

    expect(
      debugDescription([
        Selectors.getCurrentPage(state),
        Selectors.getCurrentPage(updated),
      ]),
    ).toMatchSnapshot();
  });

  test('scale one layer ne', () => {
    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [rectangle] })),
    );
    state.selectedObjects = [rectangle.do_objectID];

    const updated = run(state, [
      ['interaction', ['maybeScale', { x: 100, y: 100 }, 'ne']],
      ['interaction', ['updateScaling', { x: 125, y: 125 }]],
    ]);

    expect(
      debugDescription([
        Selectors.getCurrentPage(state),
        Selectors.getCurrentPage(updated),
      ]),
    ).toMatchSnapshot();
  });

  test('scale one layer nw', () => {
    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [rectangle] })),
    );
    state.selectedObjects = [rectangle.do_objectID];

    const updated = run(state, [
      ['interaction', ['maybeScale', { x: 100, y: 100 }, 'nw']],
      ['interaction', ['updateScaling', { x: 125, y: 125 }]],
    ]);

    expect(
      debugDescription([
        Selectors.getCurrentPage(state),
        Selectors.getCurrentPage(updated),
      ]),
    ).toMatchSnapshot();
  });

  test('scale one layer sw', () => {
    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [rectangle] })),
    );
    state.selectedObjects = [rectangle.do_objectID];

    const updated = run(state, [
      ['interaction', ['maybeScale', { x: 100, y: 100 }, 'sw']],
      ['interaction', ['updateScaling', { x: 125, y: 125 }]],
    ]);

    expect(
      debugDescription([
        Selectors.getCurrentPage(state),
        Selectors.getCurrentPage(updated),
      ]),
    ).toMatchSnapshot();
  });

  test('scale multiple layer', () => {
    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [rectangle, oval] })),
    );
    state.selectedObjects = [rectangle.do_objectID, oval.do_objectID];

    const updated = run(state, [
      ['interaction', ['maybeScale', { x: 100, y: 100 }, 'se']],
      ['interaction', ['updateScaling', { x: 125, y: 125 }]],
    ]);

    expect(
      debugDescription([
        Selectors.getCurrentPage(state),
        Selectors.getCurrentPage(updated),
      ]),
    ).toMatchSnapshot();
  });

  test('scale one layer in artboard', () => {
    const artboard = SketchModel.artboard({
      frame: SketchModel.rect({
        x: 450,
        y: 450,
        width: 300,
        height: 300,
      }),
      layers: [rectangle],
    });
    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [artboard] })),
    );
    state.selectedObjects = [rectangle.do_objectID];

    const updated = run(state, [
      ['interaction', ['maybeScale', { x: 100, y: 100 }, 'se']],
      ['interaction', ['updateScaling', { x: 125, y: 125 }]],
    ]);

    expect(
      debugDescription([
        Selectors.getCurrentPage(state),
        Selectors.getCurrentPage(updated),
      ]),
    ).toMatchSnapshot();
  });

  test('scale layers in different parents', () => {
    const artboard = SketchModel.artboard({
      frame: SketchModel.rect({
        x: 450,
        y: 450,
        width: 300,
        height: 300,
      }),
      layers: [rectangle],
    });
    const state = createInitialState(
      createSketchFile(SketchModel.page({ layers: [artboard, oval] })),
    );
    state.selectedObjects = [rectangle.do_objectID, oval.do_objectID];

    const updated = run(state, [
      ['interaction', ['maybeScale', { x: 100, y: 100 }, 'se']],
      ['interaction', ['updateScaling', { x: 125, y: 125 }]],
    ]);

    expect(
      debugDescription([
        Selectors.getCurrentPage(state),
        Selectors.getCurrentPage(updated),
      ]),
    ).toMatchSnapshot();
  });
});

describe('drawing', () => {
  test('draw rectangle layer', () => {
    const state = createInitialState(createSketchFile(SketchModel.page()));

    const updated = run(state, [
      ['interaction', ['startDrawing', 'rectangle', { x: 0, y: 0 }]],
      ['interaction', ['updateDrawing', { x: 100, y: 100 }]],
      ['addDrawnLayer'],
    ]);

    expect(
      debugDescription([
        Selectors.getCurrentPage(state),
        Selectors.getCurrentPage(updated),
      ]),
    ).toMatchSnapshot();
  });

  test('draw oval layer', () => {
    const state = createInitialState(createSketchFile(SketchModel.page()));

    const updated = run(state, [
      ['interaction', ['startDrawing', 'oval', { x: 0, y: 0 }]],
      ['interaction', ['updateDrawing', { x: 100, y: 100 }]],
      ['addDrawnLayer'],
    ]);

    expect(
      debugDescription([
        Selectors.getCurrentPage(state),
        Selectors.getCurrentPage(updated),
      ]),
    ).toMatchSnapshot();
  });

  test('draw line layer', () => {
    const state = createInitialState(createSketchFile(SketchModel.page()));

    const updated = run(state, [
      ['interaction', ['startDrawing', 'line', { x: 0, y: 0 }]],
      ['interaction', ['updateDrawing', { x: 100, y: 100 }]],
      ['addDrawnLayer'],
    ]);

    expect(
      debugDescription(
        [Selectors.getCurrentPage(state), Selectors.getCurrentPage(updated)],
        { points: true },
      ),
    ).toMatchSnapshot();
  });
});
