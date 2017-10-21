// @flow
/**
 * Utils: provides helper functions for other modules.
 *
 * @module internal/utils
 */

const PACKAGE_PREFIX: string = '@@animatronics';

export const createPackageString = (str: string): string => `${ PACKAGE_PREFIX }/${ str }`;

export const noop = (): void => {};

export const isStatelessComponent = Component => !Component.prototype.render;
