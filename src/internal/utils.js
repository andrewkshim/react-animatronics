// @flow
/**
 * Utils: provides helper functions for other modules.
 *
 * @module internal/utils
 */

export const BETWEEN_PAREN_REGEX: RegExp = /\(([^)]+)\)/;
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

// IMPROVE: If performance becomes an issue, look into using gl-matrix.
export const multiplyMatrices = (matrixA, matrixB) => {
  const [
    ac0r0, ac1r0, ac2r0, ac3r0,
    ac0r1, ac1r1, ac2r1, ac3r1,
    ac0r2, ac1r2, ac2r2, ac3r2,
    ac0r3, ac1r3, ac2r3, ac3r3,
  ] = matrixA;

  const [
    bc0r0, bc1r0, bc2r0, bc3r0,
    bc0r1, bc1r1, bc2r1, bc3r1,
    bc0r2, bc1r2, bc2r2, bc3r2,
    bc0r3, bc1r3, bc2r3, bc3r3,
  ] = matrixB;

  const c0r0 = (ac0r0 * bc0r0) + (ac1r0 * bc0r1) + (ac2r0 * bc0r2) + (ac3r0 * bc0r3);
  const c1r0 = (ac0r0 * bc1r0) + (ac1r0 * bc1r1) + (ac2r0 * bc1r2) + (ac3r0 * bc1r3);
  const c2r0 = (ac0r0 * bc2r0) + (ac1r0 * bc2r1) + (ac2r0 * bc2r2) + (ac3r0 * bc2r3);
  const c3r0 = (ac0r0 * bc3r0) + (ac1r0 * bc3r1) + (ac2r0 * bc3r2) + (ac3r0 * bc3r3);

  const c0r1 = (ac0r1 * bc0r0) + (ac1r1 * bc0r1) + (ac2r1 * bc0r2) + (ac3r1 * bc0r3);
  const c1r1 = (ac0r1 * bc1r0) + (ac1r1 * bc1r1) + (ac2r1 * bc1r2) + (ac3r1 * bc1r3);
  const c2r1 = (ac0r1 * bc2r0) + (ac1r1 * bc2r1) + (ac2r1 * bc2r2) + (ac3r1 * bc2r3);
  const c3r1 = (ac0r1 * bc3r0) + (ac1r1 * bc3r1) + (ac2r1 * bc3r2) + (ac3r1 * bc3r3);

  const c0r2 = (ac0r2 * bc0r0) + (ac1r2 * bc0r1) + (ac2r2 * bc0r2) + (ac3r2 * bc0r3);
  const c1r2 = (ac0r2 * bc1r0) + (ac1r2 * bc1r1) + (ac2r2 * bc1r2) + (ac3r2 * bc1r3);
  const c2r2 = (ac0r2 * bc2r0) + (ac1r2 * bc2r1) + (ac2r2 * bc2r2) + (ac3r2 * bc2r3);
  const c3r2 = (ac0r2 * bc3r0) + (ac1r2 * bc3r1) + (ac2r2 * bc3r2) + (ac3r2 * bc3r3);

  const c0r3 = (ac0r3 * bc0r0) + (ac1r3 * bc0r1) + (ac2r3 * bc0r2) + (ac3r3 * bc0r3);
  const c1r3 = (ac0r3 * bc1r0) + (ac1r3 * bc1r1) + (ac2r3 * bc1r2) + (ac3r3 * bc1r3);
  const c2r3 = (ac0r3 * bc2r0) + (ac1r3 * bc2r1) + (ac2r3 * bc2r2) + (ac3r3 * bc2r3);
  const c3r3 = (ac0r3 * bc3r0) + (ac1r3 * bc3r1) + (ac2r3 * bc3r2) + (ac3r3 * bc3r3);

  return [
    c0r0, c1r0, c2r0, c3r0,
    c0r1, c1r1, c2r1, c3r1,
    c0r2, c1r2, c2r2, c3r2,
    c0r3, c1r3, c2r3, c3r3,
  ];
};

