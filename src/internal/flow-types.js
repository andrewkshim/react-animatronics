// @flow
/**
 * Internal Flow type definitions.
 * @module flow-types
 */


//==========================================================
// General
//==========================================================

export type VoidFn = () => void;


//==========================================================
// Machine
//==========================================================

export type MotionMachine = {
  isStopped: () => boolean,
  do: (job: Function, onFrame?: VoidFn) => MotionMachine,
  run: (onComplete?: VoidFn) => MotionMachine,
  stop: VoidFn,
};

export type SpringMachine = {
  isStopped: ()=> boolean,
  next: (onNext: Function, onComplete: Function) => void,
}


//==========================================================
// Fashionista
//
// "Fashions" are object-representations of CSS styles.
//==========================================================

export type ColorFashion = {|
  isBasicType: true,
  isColorType: true,
  value: string,
|}

export type NumberFashion = {|
  isBasicType: true,
  isNumberType: true,
  value: number,
|}

export type UnitFashion = {|
  isBasicType: true,
  isUnitType: true,
  value: number,
  unit: string,
|}

export type BasicFashion = ColorFashion | NumberFashion | UnitFashion;

export type TransformFashion = {|
  isTransformType: true,
  names: Array<string>,
  styles: Array<BasicFashion>,
|}

export type Fashion = BasicFashion | TransformFashion;

export type CSS = { [string]: string | number };
