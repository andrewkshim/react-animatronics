/**
 * @module withAnimatronics
 */

import React from 'react'

import AnimationMachine from './internal/machines/animation-machine'
import ComponentsMachine from './internal/machines/components-machine'
import Constants from './internal/constants'
import ContextTypes from './internal/context-types'
import Polyfills from './internal/polyfills'
import { noop } from './internal/utils'

const withAnimatronics = (
  createAnimationSequences,
  {
    requestAnimationFrame = Polyfills.DEFAULT_REQUEST_ANIMATION_FRAME,
    cancelAnimationFrame = Polyfills.DEFAULT_CANCEL_ANIMATION_FRAME,
  } = {}
) => {

  const components = ComponentsMachine();

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
            registerComponent: components.registerComponent,
            unregisterComponent: components.unregisterComponent,
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
        animation.play(animationName, components, onComplete);
      }

      _rewindAnimation(animationName = Constants.DEFAULT_ANIMATION_NAME, onComplete = noop) {
        if (typeof animationName === 'function') {
          onComplete = animationName;
          animationName = Constants.DEFAULT_ANIMATION_NAME;
        }
        animation.rewind(animationName, components, onComplete);
      }

      _cancelAnimation() {
        animation.stop();
      }

      render() {
        return (
          <BaseComponent
            playAnimation={ this._playAnimation }
            rewindAnimation={ this._rewindAnimation }
            cancelAnimation={ this._cancelAnimation }
            { ...this.props }
          />
        );
      }
    };

    AnimatronicsComponent.childContextTypes = ContextTypes;

    return AnimatronicsComponent;
  };

};

export default withAnimatronics;
