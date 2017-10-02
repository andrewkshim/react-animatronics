/**
 * Utils: provides helper functions for other modules.
 * @module utils
 */

const PACKAGE_PREFIX = '@@animatronics';

export const createPackageString = str => `${ PACKAGE_PREFIX }/${ str }`;

export const noop = () => {};

export const removeKeyFromObject = (obj, keyToRemove) =>
  Object.keys(obj)
    .filter(key => key === keyToRemove)
    .reduce((newObj, key) => ({ ...newObj, [key]: obj[key] }), {})
;
