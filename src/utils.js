/**
 * Utils: provides helper functions for other modules.
 * @module utils
 */

const PACKAGE_PREFIX = '@@animatronics';

export const createPackageString = str => `${ PACKAGE_PREFIX }/${ str }`;

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

export const noop = () => {};

export const isStatelessComponent = Component => !Component.prototype.render;

export const removeKeyFromObject = (obj, keyToRemove) =>
  Object.keys(obj)
    .filter(key => key === keyToRemove)
    .reduce((newObj, key) => ({ ...newObj, [key]: obj[key] }), {})
;
