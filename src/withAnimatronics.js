/**
 * TODO: improve docs
 * withAnimatronics: (createAnimationSequences, options) => higher-order component
 * @module withAnimatronics
 */

import React from 'react'

import Constants from './internal/constants'
import ContextTypes from './internal/context-types'
import ControlsMachine from './internal/machines/controls-machine'
import AnimationMachine from './internal/machines/animation-machine'
import { noop } from './internal/utils'

import Polyfills from './internal/polyfills'

const withAnimatronics = (
  createAnimationSequences,
  {
    requestAnimationFrame = Polyfills.DEFAULT_REQUEST_ANIMATION_FRAME,
    cancelAnimationFrame = Polyfills.DEFAULT_CANCEL_ANIMATION_FRAME,
  } = {}
) => {

  const controls = ControlsMachine();

  const animation = AnimationMachine(
    createAnimationSequences,
    requestAnimationFrame,
    cancelAnimationFrame,
  );

  return BaseComponent => {

    class AnimatronicsComponent extends React.Component {
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

      componentWillReceiveProps(nextProps) {
        const { createAnimationSequences } = nextProps;
        if (typeof createAnimationSequences === 'function') {
          animation.setCreateAnimationSequences(createAnimationSequences);
        } else {
          // TODO: better error handling
        }
      }

      componentWillUnmount() {
        animation.stop();
      }

      _playAnimation(animationName = Constants.DEFAULT_ANIMATION_NAME, onComplete = noop) {
        if (typeof animationName === 'function') {
          onComplete = animationName;
          animationName = Constants.DEFAULT_ANIMATION_NAME;
        }
        // TODO: warn when an event might have been passed in
        animation.play(animationName, controls, onComplete);
      }

      _rewindAnimation(animationName = Constants.DEFAULT_ANIMATION_NAME, onComplete = noop) {
        if (typeof animationName === 'function') {
          onComplete = animationName;
          animationName = Constants.DEFAULT_ANIMATION_NAME;
        }
        animation.rewind(animationName, controls, onComplete);
      }

      _cancelAnimation() {
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

    AnimatronicsComponent.childContextTypes = ContextTypes;

    return AnimatronicsComponent;

  };

};

export default withAnimatronics;
