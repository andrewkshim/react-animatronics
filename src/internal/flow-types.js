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
  ColorType: true,
  value: string,
|}

export type NumberStyle = {|
  NumberType: true,
  value: number,
|}

export type UnitStyle = {|
  UnitType: true,
  value: number,
  unit: string,
|}

export type BasicStyle = ColorStyle | NumberStyle | UnitStyle;

export type TransformStyle = {|
  TransformType: true,
  names: Array<string>,
  styles: Array<BasicStyle>,
|}

export type Style = BasicStyle | TransformStyle;
