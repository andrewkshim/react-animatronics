import Recorder from '../../recorder'

import {
  separateTransformNames,
} from '../../fashionistas/common'

import { IS_PRODUCTION } from '../../constants'


import { normalizeStyles } from './normalizer'

const runSpringAnimation = (state, mutators) => (
  animationName,
  componentName,
  animation,
  index,
  hasUniqueTransforms = false
) => {
  const {
    from: fromStyles,
    to: toStyles,
    stiffness,
    damping,
  } = animation;

  let startTime;

  if (!IS_PRODUCTION) {
    startTime = mutators.now();
  }

  // TODO: throw if animations from and to don't have the same
  const transformations = animation.from.transform
    && separateTransformNames(animation.from.transform);

  const { normalizedFrom, normalizedTo } = normalizeStyles({
    getComputedStyle: mutators.getComputedStyle,
    node: state.nodes[componentName],
    fromStyles,
    toStyles,
    animation,
  });

  mutators.createSpringMachine({
    animationName,
    componentName,
    damping,
    index,
    normalizedFrom,
    normalizedTo,
    stiffness,
    transformations,
  });
  mutators.createEndlessJobMachine({
    animationName,
    componentName,
    index,
  });

  if (!IS_PRODUCTION) {
    Recorder.reset(animationName);
  }

  const onNext = updatedStyles => {
    if (hasUniqueTransforms) {
      mutators.updateUniqueTransformsComponentStyles({
        componentName,
        fromStyles,
        normalizedFrom,
        normalizedTo,
        toStyles,
        updatedStyles,
      });
    } else {
      mutators.updateComponentStyles({ componentName, updatedStyles });
    }

    if (!IS_PRODUCTION) {
      const updateStyles = state.styleUpdaters[componentName];
      const elapsedTime = mutators.now() - startTime;
      Recorder.record({
        animationName,
        componentName,
        elapsedTime,
        updateStyles,
        updatedStyles: !hasUniqueTransforms ? updatedStyles : ({
          ...updatedStyles,
          transform: state.concurrentTransformsMachines[componentName].getTransformString()
        }),
      });
    }
  }

  // LEFT OFF: Just got the merged transforms working, now need to clean up all the
  // cruft from the previous, wrong implementation. Oh, and you need to handle computed
  // transforms now.
  const onComplete = updatedStyles => {
    const isStopped = !state.animationCountdownMachines[animationName];
    if (isStopped) return;

    if (hasUniqueTransforms && normalizedFrom.transform && normalizedTo.transform) {
      mutators.updateUniqueTransformsComponentStyles({
        componentName,
        fromStyles,
        normalizedFrom,
        normalizedTo,
        toStyles,
        updatedStyles: toStyles,
      });
    } else {
      mutators.updateComponentStyles({
        componentName,
        updatedStyles,
      });
    }

    mutators.stopEndlessJobMachine({ animationName, index, componentName });
    mutators.countdownAnimations({ animationName });
  }

  const job = () => {
    mutators.runNextSpringFrame({
      animationName,
      componentName,
      index,
      onComplete,
      onNext,
    });
  }

  mutators.registerEndlessJob({ animationName, index, componentName, job });
  mutators.startEndlessJobMachine({ animationName, index, componentName });
};

export default runSpringAnimation;
