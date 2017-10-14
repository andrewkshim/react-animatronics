// @flow
/**
 * ControlsMachine: manages all of the component controls for withAnimatronics.
 *
 * @module internal/machines/controls-machine
 */

import Debug from 'debug'

import type { Styles, StyleUpdater, DOMNode, Controls } from '../flow-types'

const debug = Debug('animatronics:controls');

export const ControlsMachine = (): Controls => {
  const _nodes: { [string]: DOMNode } = {};
  const _styleUpdaters: { [string]: StyleUpdater } = {};

  const registerComponent = (
    componentName: string,
    node: DOMNode,
    styleUpdater: StyleUpdater,
  ) => {
    debug('registering component "%s"', componentName,);
    _nodes[componentName] = node;
    _styleUpdaters[componentName] = styleUpdater;
  };

  const unregisterComponent = (componentName: string) => {
    delete _nodes[componentName];
    delete _styleUpdaters[componentName];
  };

  const updateStyles = (componentName: string, styles: Styles) => {
    if (!_styleUpdaters[componentName]) {
      // TODO: if the style updater doesn't exist, user might have misspelled rig name
      // TODO: better error message
      console.warn('_styleUpdates does not have componentName', componentName);
    } else {
      _styleUpdaters[componentName](styles);
    }
  };

  const getNodes = () => _nodes;

  const machine: Controls = {
    registerComponent,
    unregisterComponent,
    updateStyles,
    getNodes,
  };
  return machine;
}
