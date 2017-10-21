// @flow
/**
 * @module withAnimatronics
 */

import React from 'react'

import type { VoidFn } from './internal/flow-types'

import AnimationMachine from './internal/machines/animation-machine'
import ComponentsMachine from './internal/machines/components-machine'
import Constants from './internal/constants'
import ContextTypes from './internal/context-types'
import Polyfills from './internal/polyfills'
import { IS_DEVELOPMENT, makeError, noop } from './internal/utils'

type Options = {
  requestAnimationFrame?: Function,
  cancelAnimationFrame?: Function,
};

type Props = {
  createAnimationSequences?: Function,
};

const withAnimatronics = (
  createAnimationSequences: Function,
  {
    requestAnimationFrame = Polyfills.DEFAULT_REQUEST_ANIMATION_FRAME,
    cancelAnimationFrame = Polyfills.DEFAULT_CANCEL_ANIMATION_FRAME,
  }: Options = {}
) => {

  const components = ComponentsMachine();

  const animation = AnimationMachine(
    createAnimationSequences,
    requestAnimationFrame,
    cancelAnimationFrame,
  );

  const playAnimation = (
    animationName: string = Constants.DEFAULT_ANIMATION_NAME,
    onComplete: VoidFn = noop
  ) => {
    if (typeof animationName === 'function') {
      onComplete = animationName;
      animationName = Constants.DEFAULT_ANIMATION_NAME;
    }
    if (IS_DEVELOPMENT) {
      if (typeof animationName !== 'string') {
        throw makeError(
          `playAnimation() expects its first argument to be the string name of`,
          `your animation, but it received: ${ animationName }. You might be`,
          `passing playAnimation directly into an event handler e.g.`,
          `\n`,
          `    onClick={playAnimation}`,
          `\n`,
          `but that will pass in the event as the first argument, so you should`,
          `instead be calling playAnimation directly e.g.`,
          `\n`,
          `    onClick={() => playAnimation()}`,
          `\n`,
        );
      }
    }
    animation.play(animationName, components, onComplete);
  }

  const rewindAnimation = (
    animationName: string = Constants.DEFAULT_ANIMATION_NAME,
    onComplete: VoidFn = noop
  ) => {
    if (typeof animationName === 'function') {
      onComplete = animationName;
      animationName = Constants.DEFAULT_ANIMATION_NAME;
    }
    animation.rewind(animationName, components, onComplete);
  }

  const cancelAnimation = () => {
    animation.stop();
  }

  return (BaseComponent: Object): Object => {

    class AnimatronicsComponent extends React.Component<Props> {
      constructor(props: Props) {
        super(props);
      }

      getChildContext() {
        return {
          animatronics: {
            registerComponent: components.registerComponent,
            unregisterComponent: components.unregisterComponent,
          }
        };
      }

      componentWillReceiveProps(nextProps: Props) {
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

      _playAnimation(
        animationName: string = Constants.DEFAULT_ANIMATION_NAME,
        onComplete: VoidFn = noop
      ) {
        if (typeof animationName === 'function') {
          onComplete = animationName;
          animationName = Constants.DEFAULT_ANIMATION_NAME;
        }
        // TODO: warn when an event might have been passed in
        animation.play(animationName, components, onComplete);
      }


      render() {
        return (
          <BaseComponent
            playAnimation={ playAnimation }
            rewindAnimation={ rewindAnimation }
            cancelAnimation={ cancelAnimation }
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
