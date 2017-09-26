/**
 * Utils: provides helper functions for other modules.
 * @module utils
 */

const MODULE_PREFIX = '@@animatronics';

export const createModuleString = str => `${ MODULE_PREFIX }/${ str }`;

export const IS_RAF_AVAILABLE = (
  typeof window !== 'undefined'
  && window.requestAnimationFrame
);

export const DEFAULT_REQUEST_ANIMATION_FRAME = IS_RAF_AVAILABLE
  ? requestAnimationFrame
  : callback => setTimeout(callback, MS_PER_ANIMATION_FRAME)

export const DEFAULT_CANCEL_ANIMATION_FRAME = IS_RAF_AVAILABLE
  ? cancelAnimationFrame
  : clearTimeout

export const ensureIsFunction = possibleFn => typeof possibleFn === 'function'
  ? possibleFn
  : () => {};

export const isStatelessComponent = Component => !Component.prototype.render;

export const removeKeyFromObject = (obj, keyToRemove) =>
  Object.keys(obj)
    .filter(key => key === keyToRemove)
    .reduce((newObj, key) => ({ ...newObj, [key]: obj[key] }), {})
;
