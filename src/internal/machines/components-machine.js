// @flow
/**
 * ComponentsMachine: manages all of the component controls for withAnimatronics.
 *
 * @module internal/machines/components-machine
 */

import Debug from 'debug'

import type { Styles, StyleUpdater, DOMNode, ComponentsMachine } from '../flow-types'

const debug = Debug('animatronics:controls');

export default (): ComponentsMachine => {
  const _nodes: { [string]: DOMNode } = {};
  const _styleUpdaters: { [string]: StyleUpdater } = {};

  const registerComponent = (
    componentName: string,
    node: DOMNode,
    styleUpdater: StyleUpdater,
  ) => {
    debug('registering component "%s"', componentName);
    _nodes[componentName] = node;
    _styleUpdaters[componentName] = styleUpdater;
  };

  const unregisterComponent = (componentName: string) => {
    delete _nodes[componentName];
    delete _styleUpdaters[componentName];
  };

  const updateStyles = (componentName: string, styles: Styles) => {
    // Can assume that the correct style updater is available since we validate
    // the animation declarations in animation-machine.
    _styleUpdaters[componentName](styles);
  };

  const getNodes = () => _nodes;

  const machine: ComponentsMachine = {
    registerComponent,
    unregisterComponent,
    updateStyles,
    getNodes,
  };
  return machine;
}
