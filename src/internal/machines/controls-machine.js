// @flow
/**
 * ControlsMachine: manages all of the component controls for withAnimatronics.
 *
 * @module internal/machines/controls-machine
 */

import type { Styles, StyleUpdater, DOMNode, Controls } from '../flow-types'

export const ControlsMachine = (): Controls => {
  const _nodes: { [string]: DOMNode } = {};
  const _styleUpdaters: { [string]: StyleUpdater } = {};
  let _animationMachine = null;

  const registerComponent = (
    componentName: string,
    node: DOMNode,
    styleUpdater: StyleUpdater,
  ) => {
    _nodes[componentName] = node;
    _styleUpdaters[componentName] = styleUpdater;
  };

  const unregisterComponent = (componentName: string) => {
    delete _nodes[componentName];
    delete _styleUpdaters[componentName];
  };

  const updateStyles = (componentName: string, styles: Styles) => {
    _styleUpdaters[componentName](styles);
  };

  const setAnimation = (animationMachine) => {
    _animationMachine = animationMachine;
  };

  const stopAnimation = () => {
    _animationMachine && _animationMachine.stop();
  };

  const clearAnimation = () => {
    _animationMachine = null;
  };

  const getNodes = () => _nodes;

  const machine: Controls = {
    registerComponent,
    unregisterComponent,
    updateStyles,
    setAnimation,
    stopAnimation,
    clearAnimation,
    getNodes,
  };
  return machine;
}
