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
  names: string[],
  styles: BasicFashion[],
|}

export type Fashion = BasicFashion | TransformFashion;

export type Styles = { [string]: string | number };

export type StyleUpdater = (styles: Styles) => void;

export type DOMNode = Object;

export type Animation = {
  duration?: number,
  delay?: number,
  stiffness?: number,
  damping?: number,
  from: Object,
  end: Object,
}

export type AnimationPhase = { [string]: Animation };


//==========================================================
// Machine
//==========================================================

export type TimeMachine = {
  isStopped: () => boolean,
  do: (job: Function, onFrame?: VoidFn) => TimeMachine,
  run: (onComplete?: VoidFn) => TimeMachine,
  stop: VoidFn,
};

export type SpringMachine = {
  isStopped: ()=> boolean,
  next: (onNext: Function, onComplete: Function) => void,
}

export type AnimationMachine = {
  play: (animationName: string, components: ComponentsMachine, onComplete: Function) => void,
  rewind: (animationName: string, components: ComponentsMachine, onComplete: Function) => void,
  stop: () => void,
  setCreateAnimationSequences: (createAnimationSequences: Function) => void,
}

export type ComponentsMachine = {
  registerComponent: (componentName: string, node: DOMNode, styleUpdater: StyleUpdater) => void,
  unregisterComponent: (componentName: string) => void,
  updateStyles: (componentName: string, styles: Styles) => void,
  getNodes: () => { [string]: DOMNode },
}
