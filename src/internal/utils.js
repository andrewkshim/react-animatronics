// @flow
/**
 * Utils: provides helper functions for other modules.
 *
 * @module internal/utils
 */

export const ALL_COMMAS_REGEX: RegExp = /, /g;
export const NUMBER_REGEX: RegExp = /(-)?\d+(\.\d+)?/;
export const NON_NUMER_REGEX: RegExp = /\D+/;

export const noop = (): void => {};

export const isStatelessComponent = (Component: Object): boolean => !Component.prototype.render;

export const isReactComponent = (MaybeComponent: Object): boolean => (
  MaybeComponent != null
  && (
    typeof MaybeComponent === 'function'
    || !!(MaybeComponent.prototype && MaybeComponent.prototype.render)
  )
);

export const makeError = (...messages: string[]): Error => {
  const err = new Error(messages.reduce((result, segment) => (
    result === '' ?
      segment
    : result.charAt(result.length - 1) === '\n' ?
      `${ result }${ segment }`
    : segment === '\n' ?
      `${ result }${ segment }`
    :
      `${ result } ${ segment }`
  ), ''));
  const actualStack = err.stack.split('\n');
  const poppedStack = actualStack
    .slice(0, messages.length)
    .concat(
      actualStack.slice(messages.length + 1)
    );
  err.stack = poppedStack.join('\n');
  return err;
}

export const flatten = <T>(arrays: Array<Array<T>>): Array<T> =>
  arrays.reduce((flat, arr) => flat.concat(arr), []);

export const stringify = (obj: Object): string => JSON.stringify(obj, null, 2);

export const isUsingTime = (animation: Object): boolean =>
  animation.duration != null;

export const isUsingSpring = (animation: Object): boolean =>
  animation.stiffness != null && animation.damping != null;

export const getDisplayName = (Component: Object|string): string =>
  typeof Component === 'string' ?
    Component
  : !Component ?
    'undefined'
  :
    Component.displayName || Component.name || 'Unknown'
