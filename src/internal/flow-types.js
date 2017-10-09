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

export type BasicFashion = ColorFashion | NumberFashion | UnitFashion;

export type TransformFashion = {|
  isTransformType: true,
  names: Array<string>,
  styles: Array<BasicFashion>,
|}

export type Fashion = BasicFashion | TransformFashion;

export type Styles = { [string]: string | number };

export type StyleUpdater = (styles: Styles) => void;

export type DOMNode = Object;

export type AnimationStage = Object;


//==========================================================
// Machine
//==========================================================

export type Time = {
  isStopped: () => boolean,
  do: (job: Function, onFrame?: VoidFn) => Time,
  run: (onComplete?: VoidFn) => Time,
  stop: VoidFn,
};

export type Spring = {
  isStopped: ()=> boolean,
  next: (onNext: Function, onComplete: Function) => void,
}

export type Animation = {
  run: (onComponentFrame: Function, onComplete: Function) => void,
}

export type Controls = {
  registerComponent: (componentName: string, node: DOMNode, styleUpdater: StyleUpdater) => void,
  unregisterComponent: (componentName: string) => void,
  updateStyles: (componentName: string, styles: Styles) => void,
}
