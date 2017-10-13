/**
 * TODO: improve docs
 * withAnimatronics: (createAnimationStages, options) => higher-order component
 * @module withAnimatronics
 */

import React from 'react'

import Animator from './internal/animator'
import Constants from './internal/constants'
import ContextTypes from './internal/context-types'
import { ControlsMachine } from './internal/machines/controls-machine'
import { AnimationMachine } from './internal/machines/animation-machine'
import { noop } from './internal/utils'

import Polyfills from './internal/polyfills'

const withAnimatronics = (
  createAnimationStages,
  {
    requestAnimationFrame = Polyfills.DEFAULT_REQUEST_ANIMATION_FRAME,
    cancelAnimationFrame = Polyfills.DEFAULT_CANCEL_ANIMATION_FRAME,
  } = {}
) => {

  const controls = ControlsMachine();
  const animation = AnimationMachine(requestAnimationFrame, cancelAnimationFrame);

  return BaseComponent => {

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

      _playAnimation(
        animationName = Constants.DEFAULT_ANIMATION_NAME,
        onComplete = noop
      ) {
        // TODO: warn when an event might have been passed in
        const rawAnimationStages = createAnimationStages(controls.getNodes());
        const stages = rawAnimationStages[animationName] || rawAnimationStages;

        // TODO: better error handling
        if (!Array.isArray(stages)) {
          throw new Error('stages is not an array');
        }

        Animator.playAnimation(
          stages,
          controls,
          animation,
          onComplete,
        );
      }

      _rewindAnimation(
        animationName = Constants.DEFAULT_ANIMATION_NAME,
        onComplete = noop,
      ) {
        const rawAnimationStages = createAnimationStages(controls.getNodes());
        const stages = rawAnimationStages[animationName] || rawAnimationStages;

        // TODO: better error handling
        if (!Array.isArray(stages)) {
          throw new Error('stages is not an array');
        }

        Animator.rewindAnimation(
          stages,
          controls,
          animation,
          onComplete,
        )
      }

      _cancelAnimation() {
        animation.stop();
      }

      componentWillUnmount() {
        animation.stop();
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
