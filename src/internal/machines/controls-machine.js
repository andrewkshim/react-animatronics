// @flow
/**
 * ControlsMachine: manages all of the component controls for withAnimatronics.
 *
 * @module internal/machines/controls-machine
 */

import type { Styles, StyleUpdater, DOMNode } from '../flow-types'

export const ControlsMachine = () => {
  const nodes: { [string]: DOMNode } = {};
  const styleUpdaters: { [string]: StyleUpdater } = {};

  const registerComponent = (
    componentName: string,
    node: DOMNode,
    styleUpdater: StyleUpdater,
  ) => {
    nodes[componentName] = node;
    styleUpdaters[componentName] = styleUpdater;
  };

  const unregisterComponent = (componentName: string) => {
    delete nodes[componentName];
    delete styleUpdaters[componentName];
  };

  const updateStyles = (componentName: string, styles: Styles) => {
    styleUpdaters[componentName](styles);
  }

  const machine = { registerComponent, unregisterComponent, updateStyles };
  return machine;
}
