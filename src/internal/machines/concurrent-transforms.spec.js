import { createTransformFashion } from '../fashionistas/common'

import {
  makeInitialState,
  makeMutators,
} from './concurrent-transforms'

describe('makeMutators', () => {
  const machinist = {};

  test('registerTransform', () => {
    const state = makeInitialState();
    const mutators = makeMutators(machinist, state);

    mutators.registerTransforms({
      fromTransforms: {
        scale: 'scale(0)',
        translateX: 'translateX(0px)',
      },
      toTransforms: {
        scale: 'scale(1)',
        translateX: 'translateX(100px)',
      },
      updatedTransforms: 'scale(0.5) translateX(25px)',
    });
    expect(state.updatedFashions).toEqual({
      scale: createTransformFashion('scale(0.5)'),
      translateX: createTransformFashion('translateX(25px)')
    });

    mutators.registerTransforms({
      fromTransforms: {
        translateX: 'translateX(0px)',
      },
      toTransforms: {
        translateX: 'translateX(100px)',
      },
      updatedTransforms: 'translateX(50px)',
    });
    expect(state.updatedFashions).toEqual({
      scale: createTransformFashion('scale(0.5)'),
      translateX: createTransformFashion('translateX(50px)'),
    });
  });

  test('getTransformString', () => {
    const state = makeInitialState();
    const mutators = makeMutators(machinist, state);

    expect(mutators.getTransformString()).toBe('');

    mutators.registerTransforms({
      fromTransforms: {
        scale: 'scale(0)',
      },
      toTransforms: {
        scale: 'scale(1)',
      },
      updatedTransforms: 'scale(0.5)',
    });
    mutators.registerTransforms({
      fromTransforms: {
        translateX: 'translateX(0px)',
      },
      toTransforms: {
        translateX: 'translateX(100px)',
      },
      updatedTransforms: 'translateX(25px)',
    });

    expect(mutators.getTransformString()).toBe('scale(0.5) translateX(25px)');
  });

  test('checkHasConvertibleUnits', () => {
    const state = makeInitialState();
    const mutators = makeMutators(machinist, state);
    mutators.registerTransforms({
      fromTransforms: {
        translateX: 'translateX(0px)',
        translateY: 'translateY(0px)',
      },
      toTransforms: {
        translateX: 'translateX(10rem)',
        translateY: 'translateY(100px)',
      },
      updatedTransforms: 'translateX(20px) translateY(20px)',
    });
    expect(mutators.checkHasConvertibleUnits()).toBe(true);
  });

});
