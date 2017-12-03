import { BETWEEN_PAREN_REGEX } from '../utils'

import {
  parseTransformName,
  createTransformFashion,
  stringifyFashion,
  parseTransformsSeparately
} from '../fashionistas/common'

const setParsedTransforms = (state, transforms, type) => {
  Object.keys(transforms).forEach(name => {
    state[type][name] = createTransformFashion(transforms[name]);
  });
};

const registerTransforms = (state, mutators) => ({
  fromTransforms,
  toTransforms,
  updatedTransforms,
}) => {
  mutators.registerTransforms({
    fromTransforms,
    toTransforms,
    updatedTransforms,
  });
};

export const makeMutators = (machinist, state) => ({
  registerTransforms: action => {
    const { fromTransforms, toTransforms, updatedTransforms } = action;
    setParsedTransforms(state, fromTransforms, 'fromFashions');
    setParsedTransforms(state, toTransforms, 'toFashions');
    setParsedTransforms(
      state,
      parseTransformsSeparately(updatedTransforms),
      'updatedFashions'
    );
  },

  getTransformString: () => {
    const transformString = Object.values(state.updatedFashions)
      .map(stringifyFashion)
      .join(' ');
    return transformString;
  },

  checkHasConvertibleUnits: () => {
    const hasConvertibleUnits = Object.keys(state.fromFashions)
      .reduce((results, name, index) => {
        const fromUnit = state.fromFashions[name].styles[0].unit;
        const toUnit = state.toFashions[name].styles[0].unit;
        const isConvertible = fromUnit && toUnit && fromUnit !== toUnit;
        return results.concat(isConvertible);
      }, [])
      .some(isConvertible => isConvertible);
    return hasConvertibleUnits;
  },
});

export const makeInitialState = () => ({
  fromFashions: {},
  toFashions: {},
  updatedFashions: {},
});

export const makeConcurrentTransformsMachine = machinist => count => {
  const state = makeInitialState();

  const mutators = makeMutators(machinist, state);

  const concurrentTransformsMachine = {
    registerTransforms: registerTransforms(state, mutators),
    getTransformString: mutators.getTransformString,
    checkHasConvertibleUnits: mutators.checkHasConvertibleUnits,
  };

  return concurrentTransformsMachine;
}
