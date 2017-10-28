// @flow
/**
 * @module withAnimatronics
 */

import React from 'react'

import type { VoidFn } from './internal/flow-types'

import ContextTypes from './internal/context-types'
import { makeMachinist } from './internal/machines/machinist'

import {
  DEFAULT_ANIMATION_NAME,
  DEFAULT_CANCEL_ANIMATION_FRAME,
  DEFAULT_CLEAR_TIMEOUT,
  DEFAULT_NOW,
  DEFAULT_REQUEST_ANIMATION_FRAME,
  DEFAULT_SET_TIMEOUT,
} from './internal/constants'

import {
  IS_DEVELOPMENT,
  isReactComponent,
  makeError,
  noop,
} from './internal/utils'

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
    requestAnimationFrame = DEFAULT_REQUEST_ANIMATION_FRAME,
    cancelAnimationFrame = DEFAULT_CANCEL_ANIMATION_FRAME,
    setTimeout = DEFAULT_SET_TIMEOUT,
    clearTimeout = DEFAULT_CLEAR_TIMEOUT,
    now = DEFAULT_NOW,
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

  const machinist = makeMachinist(
    requestAnimationFrame,
    cancelAnimationFrame,
    setTimeout,
    clearTimeout,
    now,
  );
  const animatronics = machinist.makeAnimatronicsMachine(createAnimationSequences);

  const playAnimation = (
    animationName: string = DEFAULT_ANIMATION_NAME,
    onComplete: VoidFn = noop
  ) => {
    if (typeof animationName === 'function') {
      onComplete = animationName;
      animationName = DEFAULT_ANIMATION_NAME;
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
    if (IS_DEVELOPMENT) {
      if (!isReactComponent(BaseComponent)) {
        throw makeError(
          `withAnimatronics() must be used to wrap a React component`
          + ` but you gave it: ${ BaseComponent }. Make sure that you're`
          + ` passing in either a component class or a function that returns`
          + ` an element. A common mistake is to pass in the React element`
          + ` itself. For example, passing in "<Component/>" instead of "Component",`
          + ` but you should be passing in the second form.`
        );
      }
    }

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
