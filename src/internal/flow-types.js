// @flow
/**
 * Internal Flow type definitions.
 *
 * @module internal/flow-types
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

export type Spring = {
  isStopped: ()=> boolean,
  next: (onNext: Function, onComplete: Function) => void,
}


//==========================================================
// Fashionista
//
// "Fashions" are object-representations of CSS styles.
//==========================================================

type ChromaColor = {
  name: Function,
}

export type ColorFashion = {|
  isBasicType: true,
  isColorType: true,
  value: ChromaColor,
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
