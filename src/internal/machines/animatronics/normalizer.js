import Debug from 'debug'

import {
  createTransformFashion,
  createUnitFashion,
  haveConvertibleUnits,
  parseInnerTransformValue,
  parseStyle,
  parseTransformsSeparately,
  splitTransforms,
  stringifyFashion,
} from '../../fashionistas/common'

import {
  TRANSFORM,
} from '../../constants'

import {
  makeError,
  stringify,
} from '../../utils'

const debug = Debug('react-animatronics:machines:animatronics:normalizer');

const parseAnimationTransforms = (animation, type) => {
  const transforms = splitTransforms(animation[type].transform)
    .map(createTransformFashion);
  return transforms;
};

const normalizeTransform = (getComputedStyle, node, fashions) => {
  const normalized = fashions
    .reduce((result, fashion) => {
      // NOTE: There should only ever be one name and style at this point.
      const name = fashion.names[0];
      const style = fashion.styles[0];
      const transform = stringifyFashion(fashion);
      if (style.isUnitType || style.isCalcType) {
        const styleStr = stringifyFashion(style);
        const currentLength = node.style.transform;
        //node.style[domLengthAttr] = styleStr;
        node.style.transform = transform;

        const updatedMatrix = getComputedStyle(node).transform;
        const matrix = parseInnerTransformValue(updatedMatrix);
        const matrixValues = matrix.split(', ');
        node.style.transform = currentLength;

        // FIXME: using static checks? Can probably implement a more generic solution
        // by operating on the matrices.
        const updatedLength = (
          name === 'translateX' ?
            matrixValues[4]
          : name === 'translateY' ?
            matrixValues[5]
          : name === 'translateZ' ?
            matrixValues[6]
          :
            null
        );

        if (updatedLength === null) {
          throw makeError(
            `Attempted to normalize a transform but react-animatronics does`,
            `not know how to deal with "${ name }".`
          );
        }

        result[name] = stringifyFashion({
          ...fashion,
          styles: [parseStyle(`${ updatedLength }px`)]
        });
      } else {
        result[name] = stringifyFashion(fashion);
      }
      return result;
    }, {});
  return normalized;
};

export const normalizeCombinedTransforms = (
  getComputedStyle,
  node,
  animation,
) => {
  const fromFashions = parseAnimationTransforms(animation, 'from');
  const toFashions = parseAnimationTransforms(animation, 'to');

  if (fromFashions.length !== toFashions.length) {
    const fromTransforms = animation.from.transform.join(' ');
    const toTransforms = animations.to.transform.join(' ');
    throw makeError(
      `You've declared an animation with transforms in "from" and`,
      `"to" that do not match up:\n`,
      `from: ${ fromTransforms }\n`,
      `to:   ${ toTransforms }\n`,
      `and react-animatronics cannot animate between transforms`,
      `unless they contain the same transformations.`
    );
  }

  const normalizedFromTransform = normalizeTransform(getComputedStyle, node, fromFashions);
  const normalizedToTransform = normalizeTransform(getComputedStyle, node, toFashions);
  return { normalizedFromTransform, normalizedToTransform };
}

export const normalizeStyles = ({
  componentName,
  getComputedStyle,
  node,
  fromStyles,
  toStyles,
  animation,
}) => {
  const normalizedFrom = { ...fromStyles };
  const normalizedTo = { ...toStyles };
  Object.keys(normalizedFrom).map(styleName => {
    const rawFromStyle = normalizedFrom[styleName];
    const rawToStyle = normalizedTo[styleName];
    if (!haveConvertibleUnits(rawFromStyle, rawToStyle, styleName)) return;
    if (!node && styleName !== TRANSFORM) {
      // FIXME: More detailed error detection for transform styles? It's
      // tough to know whether or not we need to throw an error when using a
      // transform style since we need to know whether each individual
      // transformation pair is actually using a different unit.
      if (styleName !== TRANSFORM) {
        throw makeError(
          `You specified "from" and "to" styles that have different units, but there`
          + ` is no ref available for the component "${ componentName }". You must`
          + ` either change one of the styles [`
            + `{${styleName}: ${rawFromStyle}}, `
            + `{${styleName}: ${rawToStyle}}`
          + `] so they have the same units or make the ${ componentName }`
          + ` component a class component.`
        );
      }
    }

    if (!node && styleName === TRANSFORM) {
      normalizedFrom.transform = parseTransformsSeparately(animation.from.transform);
      normalizedTo.transform = parseTransformsSeparately(animation.to.transform);
    } else if (styleName === TRANSFORM && animation.from.transform) {
      const { normalizedFromTransform, normalizedToTransform } = normalizeCombinedTransforms(
        getComputedStyle,
        node,
        animation,
      );
      normalizedFrom.transform = normalizedFromTransform;
      normalizedTo.transform = normalizedToTransform;
    } else {
      node.style[styleName] = rawToStyle;
      const computedTo = getComputedStyle(node);
      normalizedTo[styleName] = computedTo[styleName];

      // FIXME: can make more efficient by not calling getComputedStyle more than twice
      node.style[styleName] = rawFromStyle;
      const computedFrom = getComputedStyle(node);
      normalizedFrom[styleName] = computedFrom[styleName];
    }
  });
  return { normalizedFrom, normalizedTo };
}

