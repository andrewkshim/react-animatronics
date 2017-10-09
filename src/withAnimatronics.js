/**
 * TODO: improve docs
 * withAnimatronics: (createAnimationStages, options) => higher-order component
 * @module withAnimatronics
 */

import React from 'react'

import Animator from './internal/animator'
import ContextTypes from './internal/context-types'
import { ControlsMachine } from './internal/machines/controls-machine'

import Polyfills from './internal/polyfills'

const withAnimatronics = (
  createAnimationStages,
  {
    requestAnimationFrame = Polyfills.DEFAULT_REQUEST_ANIMATION_FRAME,
    cancelAnimationFrame = Polyfills.DEFAULT_CANCEL_ANIMATION_FRAME,
  } = {}
) => {

  return BaseComponent => {

    const controls = ControlsMachine();

    class AnimatorComponent extends React.Component {
      constructor(props) {
        super(props);
        this.isAnimatronic = true;
        this._playAnimation = this._playAnimation.bind(this);
        this._rewindAnimation = this._rewindAnimation.bind(this);
        this._cancelAnimation = this._cancelAnimation.bind(this);
      }

      getChildContext() {
        return {
          animatronics: {
            registerComponent: controls.registerComponent,
            unregisterComponent: controls.unregisterComponent,
          }
        };
      }

      _rewindAnimation() {
        const rawAnimationStages = createAnimationStages(controls.getNodes());
        const createStages = typeof rawAnimationStages === 'function'
          ? rawAnimationStages
          : () => rawAnimationStages;
        Animator.rewindAnimation(
          createStages(),
          controls,
          requestAnimationFrame,
          cancelAnimationFrame,
          () => {},
        )
      }

      _playAnimation() {
        // TODO: warn when an event might have been passed in
        const rawAnimationStages = createAnimationStages(controls.getNodes());
        const createStages = typeof rawAnimationStages === 'function'
          ? rawAnimationStages
          : () => rawAnimationStages;
        Animator.playAnimation(
          createStages(),
          controls,
          requestAnimationFrame,
          cancelAnimationFrame,
          () => {},
        );
      }

      _cancelAnimation() {
        controls.stopAnimation();
        controls.clearAnimation();
      }

      render() {
        const { ...props } = this.props;
        return (
          <BaseComponent
            playAnimation={ this._playAnimation }
            rewindAnimation={ this._rewindAnimation }
            cancelAnimation={ this._cancelAnimation }
            { ...props }
          />
        );
      }
    };

    AnimatorComponent.childContextTypes = ContextTypes;

    return AnimatorComponent;

  };

};

export default withAnimatronics;
