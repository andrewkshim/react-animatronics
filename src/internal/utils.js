// @flow
/**
 * Utils: provides helper functions for other modules.
 *
 * @module internal/utils
 */

const PACKAGE_PREFIX: string = '@@animatronics';

export const createPackageString = (str: string): string => `${ PACKAGE_PREFIX }/${ str }`;

export const noop = (): void => {};

export const isStatelessComponent = (Component: Object): boolean => !Component.prototype.render;

export const makeError = (...messages: string[]): Error => {
  const err = new Error(messages.join(' '));
  const actualStack = err.stack.split('\n');
  const poppedStack = actualStack
    .slice(0, messages.length)
    .concat(
      actualStack.slice(messages.length + 1)
    );
  err.stack = poppedStack.join('\n');
  return err;
}

export const IS_DEVELOPMENT = process.env.NODE_ENV !== 'development';
