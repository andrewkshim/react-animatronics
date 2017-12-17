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

export type CalcFashion = {|
  isBasicType: true,
  isCalcType: true,
  value: string,
|}

export type StaticFashion = {|
  isBasicType: true,
  isStaticType: true,
  value: string,
|}

export type BasicFashion = ColorFashion|NumberFashion|UnitFashion;

export type CompositeFashion = {|
  isCompositeType: true,
  isCommaType?: boolean,
  names?: string[],
  styles: Fashion[],
|}

export type Fashion = BasicFashion|CompositeFashion|StaticFashion;

export type Styles = { [string]: string|number };

export type DOMNode = Object;

export type Animation = {
  duration?: number,
  delay?: number,
  stiffness?: number,
  damping?: number,
  from: Object,
  to: Object,
}

export type AnimationPhase = { [string]: Animation };


//==========================================================
// Machine
//==========================================================

export type Machinist = Object;

export type AnimatronicsMachine = Object;
