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

export type Machine = {
  isStopped: () => boolean,
  do: (job: VoidFn) => Machine,
  run: (onComplete?: VoidFn) => Machine,
  stop: VoidFn,
};


//==========================================================
// Stylist
//==========================================================

export type ColorStyle = {|
  isBasicType: true,
  isColorType: true,
  value: string,
|}

export type NumberStyle = {|
  isBasicType: true,
  isNumberType: true,
  value: number,
|}

export type UnitStyle = {|
  isBasicType: true,
  isUnitType: true,
  value: number,
  unit: string,
|}

export type BasicStyle = ColorStyle | NumberStyle | UnitStyle;

export type TransformStyle = {|
  isTransformType: true,
  names: Array<string>,
  styles: Array<BasicStyle>,
|}

export type Style = BasicStyle | TransformStyle;

export type CSS = { [string]: string | number };
