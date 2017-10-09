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

export const reverseStages = (stages: AnimationStage[]): AnimationStage[] =>
  stages.map(stage =>
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

export const playAnimation = (
  stages: AnimationStage[],
  controls: Controls,
  requestAnimationFrame: Function,
  cancelAnimationFrame: Function,
  onComplete: Function,
) => {
  debug('starting animation %O', stages);

  const run = (stages, currentStageNum) => {
    debug('running animation stage %d', currentStageNum);

    // Flow doesn't play nicely with computed properties / array access.
    // $FlowFixMe
    const stage: AnimationStage = stages[currentStageNum];

    const onComponentFrame = controls.updateStyles;

    const onStageComplete = () => {
      const nextStageNum = currentStageNum + 1;
      if (nextStageNum === stages.length) {
        controls.clearAnimation();
        onComplete();
      } else {
        run(stages, nextStageNum);
      }
    }

    const animationMachine = AnimationMachine(
      stage,
      requestAnimationFrame,
      cancelAnimationFrame,
    );
    controls.setAnimation(animationMachine);

    animationMachine.run(onComponentFrame, onStageComplete);
  };

  run(stages, 0);
}

export const rewindAnimation = (
  stages: AnimationStage[],
  controls: Controls,
  requestAnimationFrame: Function,
  cancelAnimationFrame: Function,
  onComplete: Function,
) => playAnimation(
  reverseStages(stages),
  controls,
  requestAnimationFrame,
  cancelAnimationFrame,
  onComplete,
);

const Animator = { playAnimation, rewindAnimation };

export default Animator;
