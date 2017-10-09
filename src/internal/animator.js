// @flow
/**
 * Animator: runs the animations.
 *
 * @module internal/animator
 */

import Debug from 'debug'

import type { AnimationStage, Controls } from './flow-types'
import { AnimationMachine } from './machines/animation-machine'

const debug = Debug('animatronics:animator');

const reverseAnimationStages = stages => stages.map(stage =>
  Object.keys(stage).reduce((result, componentName) => {
    const { start, end, ...rest } = stage[componentName];
    result[componentName] = {
      start: end,
      end: start,
      ...rest,
    };
    return result;
  }, {})
);

const playAnimation = (
  stages: AnimationStage[],
  requestAnimationFrame: Function,
  cancelAnimationFrame: Function,
  controls: Controls,
) => {
  debug('starting animation %O', stages);

  const run = (stages, currentStageNum) => {
    debug('running animation stage %d', currentStageNum);

    // Flow doesn't play nicely with computed properties / array access.
    // $FlowFixMe
    const stage: AnimationStage = stages[currentStageNum];

    const runNextStage = () => {
      const nextStageNum = currentStageNum + 1;
      if (nextStageNum === stages.length) {
        // onAnimationComplete();
      } else {
        run({
          stages,
          currentStageNum: nextStageNum,
        });
      }
    }

    const onComponentFrame = controls.updateStyles;

    const onComplete = runNextStage;

    const animationMachine = AnimationMachine(
      stage,
      requestAnimationFrame,
      cancelAnimationFrame,
    );
    animationMachine.run(onComponentFrame, onComplete);

    // return machine;
  };

  return run({
    stages,
    currentStageNum: 0,
  });
}

const rewindAnimation = (
  stages: AnimationStage[],
  requestAnimationFrame: Function,
  cancelAnimationFrame: Function,
  controls: Controls,
) => playAnimation(
  reverseAnimationStages(stages),
  requestAnimationFrame,
  cancelAnimationFrame,
  controls,
);

const cancelAnimation = (): void => {
  // TODO:
}

const Animator = {
  playAnimation,
  rewindAnimation,
  cancelAnimation,
};

export default Animator;
