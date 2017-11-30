// @flow
/**
 * @module Animatronics
 */

import type { Element } from 'react'

import type {
  Machinist,
  AnimatronicsMachine,
} from './internal/flow-types'

import React from 'react'

import ContextTypes from './internal/context-types'

import { makeMachinist } from './internal/machines/machinist'

import {
  DEFAULT_CANCEL_ANIMATION_FRAME,
  DEFAULT_CLEAR_TIMEOUT,
  DEFAULT_NOW,
  DEFAULT_REQUEST_ANIMATION_FRAME,
  DEFAULT_SET_TIMEOUT,
  IS_PRODUCTION,
} from './internal/constants'

import {
  makeError,
} from './internal/utils'

type Props = {
  animations: Function,
  children: Function,
  requestAnimationFrame?: Function,
  cancelAnimationFrame?: Function,
  setTimeout?: Function,
  clearTimeout?: Function,
  now?: Function,
};

class Animatronics extends React.Component<Props> {

  static childContextTypes: Object = ContextTypes

  static defaultProps: Object = {
    requestAnimationFrame: DEFAULT_REQUEST_ANIMATION_FRAME,
    cancelAnimationFrame: DEFAULT_CANCEL_ANIMATION_FRAME,
    setTimeout: DEFAULT_SET_TIMEOUT,
    clearTimeout: DEFAULT_CLEAR_TIMEOUT,
    now: DEFAULT_NOW,
  }

  _animatronics: AnimatronicsMachine
  _setAnimations: Function

  constructor(props: Props) {
    super(props);

    const {
      animations,
      children,
      requestAnimationFrame,
      cancelAnimationFrame,
      setTimeout,
      clearTimeout,
      now,
    } = props;

    if (!IS_PRODUCTION) {
      if (typeof children !== 'function') {
        throw makeError(
          `<Animatronics> must receive a function "children" prop that returns a`,
          `single React element.`
        );
      }
      if (typeof animations !== 'function') {
        throw makeError(
          `<Animatronics> must receive a function "animations" prop`,
          `that returns you animation declarations.` // TODO: link to docs
        );
      }
    }

    const machinist = makeMachinist(
      requestAnimationFrame,
      cancelAnimationFrame,
      setTimeout,
      clearTimeout,
      now
    );

    this._animatronics = machinist.makeAnimatronicsMachine(animations);
    this._setAnimations = this._setAnimations.bind(this);
  }

  _setAnimations() {
    const { animations } = this.props;
    if (animations != null) {
      this._animatronics.setAnimations(animations);
    }
  }

  getChildContext() {
    return {
      animatronics: {
        registerComponent: this._animatronics.registerComponent,
        unregisterComponent: this._animatronics.unregisterComponent,
      }
    };
  }

  componentWillMount() {
    this._setAnimations();
  }

  componentWillReceiveProps(nextProps: Props) {
    this._setAnimations();
  }

  componentWillUnmount() {
    this._animatronics.cancelAnimation();
  }

  render() {
    const { children } = this.props;
    return children({
      playAnimation: this._animatronics.playAnimation,
      cancelAnimation: this._animatronics.cancelAnimation,
      resetAnimation: this._animatronics.resetAnimation,
    });
  }
}

export default Animatronics;
