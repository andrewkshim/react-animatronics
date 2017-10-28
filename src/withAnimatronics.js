// @flow
/**
 * @module withAnimatronics
 */

import React from 'react'

import type { VoidFn } from './internal/flow-types'

import Constants from './internal/constants'
import ContextTypes from './internal/context-types'
import Polyfills from './internal/polyfills'
import { IS_DEVELOPMENT, makeError, noop } from './internal/utils'
import { makeMachinist } from './internal/machines/machinist'

type Options = {
  requestAnimationFrame?: Function,
  cancelAnimationFrame?: Function,
  setTimeout?: Function,
  clearTimeout?: Function,
  now?: Function,
};

type Props = {
  createAnimationSequences?: Function,
};

const withAnimatronics = (
  createAnimationSequences: Function,
  {
    requestAnimationFrame = Polyfills.DEFAULT_REQUEST_ANIMATION_FRAME,
    cancelAnimationFrame = Polyfills.DEFAULT_CANCEL_ANIMATION_FRAME,
    setTimeout = window.setTimeout,
    clearTimeout = window.clearTimeout,
    now = Date.now,
  }: Options = {}
) => {
  if (IS_DEVELOPMENT) {
    if (typeof createAnimationSequences !== 'function') {
      throw makeError(
        `withAnimatronics() expects its first argument to be a function,`,
        `but it received: ${ createAnimationSequences }.`,
      );
    }
  }

  const machinist = makeMachinist();
  const animatronics = machinist.makeAnimatronicsMachine(
    createAnimationSequences,
    requestAnimationFrame.bind(window),
    cancelAnimationFrame.bind(window),
    now,
    setTimeout.bind(window),
    clearTimeout.bind(window),
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
          `passing playAnimation directly into an event handler e.g.\n`,
          `    onClick={playAnimation}`,
          `\nbut that will pass in the event as the first argument, so you should`,
          `instead be calling playAnimation directly e.g.\n`,
          `    onClick={() => playAnimation()}`,
          `\n`,
        );
      }
    }
    animatronics.play(animationName, onComplete);
  }

  const cancelAnimation = () => {
    animatronics.stop();
  }

  return (BaseComponent: Object): Object => {

    class AnimatronicsComponent extends React.Component<Props> {
      constructor(props: Props) {
        super(props);
      }

      getChildContext() {
        return {
          animatronics: {
            registerComponent: animatronics.registerComponent,
            unregisterComponent: animatronics.unregisterComponent,
          }
        };
      }

      componentWillMount() {
        const { createAnimationSequences } = this.props;
        if (createAnimationSequences != null) {
          animatronics.setCreateAnimationSequences(createAnimationSequences);
        }
      }

      componentWillReceiveProps(nextProps: Props) {
        const { createAnimationSequences } = nextProps;
        if (createAnimationSequences != null) {
          animatronics.setCreateAnimationSequences(createAnimationSequences);
        }
      }

      componentWillUnmount() {
        animatronics.stop();
      }

      render() {
        return (
          <BaseComponent
            playAnimation={ playAnimation }
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
