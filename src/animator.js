/**
 * Animator: runs the animations.
 * @module animator
 */

import BezierEasing from 'bezier-easing'

import { updateTimedRigStyles } from './stylist/timed-stylist'
import { createFnUpdateSpringRigStyles } from './stylist/spring-stylist'

const DEFAULT_EASING_FN = BezierEasing(0.4, 0.0, 0.2, 1);

const runAnimationStageWithoutStyleUpdates = ({
  cancelAnimationFrame,
  duration,
  runNextStage,
  requestAnimationFrame,
}) => {
  const startTime = Date.now();
  let currentFrame;

  const runLastAnimationFrame = () => {
    currentFrame = null;
    runNextStage();
  };

  const runNextAnimationFrame = () => {
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < duration) {
      currentFrame = requestAnimationFrame(runNextAnimationFrame);
    } else {
      currentFrame = requestAnimationFrame(runLastAnimationFrame);
    }
  };
  currentFrame = requestAnimationFrame(runNextAnimationFrame);
}

const runTimedAnimationStage = ({
  animationStage,
  cancelAnimationFrame,
  runNextStage,
  requestAnimationFrame,
  rigs,
}) => {
  const {
    start: allStartStyles,
    end: allEndStyles,
    easingFn = DEFAULT_EASING_FN,
    duration,
  } = animationStage;

  const startTime = Date.now();
  let currentFrame;

  const updateTimedStyles = elapsedTime => {
    Object.keys(rigs).forEach(rigName => {
      const startStyles = allStartStyles[rigName];
      const endStyles = allEndStyles[rigName];
      const rigRef = rigs[rigName];

      if (!rigRef) {
        // TODO: warn
        return;
      }

      if (!startStyles || !endStyles) {
        // TODO: warn
        return;
      }

      updateTimedRigStyles({
        rigRef: rigs[rigName],
        startStyles,
        endStyles,
        easingFn,
        duration,
        elapsedTime,
      });
    });
  };

  const runLastAnimationFrame = () => {
    currentFrame = null;
    if (duration > 0) {
      updateTimedStyles(duration);
    }
    runNextStage();
  };

  const runNextAnimationFrame = () => {
    const elapsedTime = Date.now() - startTime;
    updateTimedStyles(elapsedTime);

    if (elapsedTime < duration) {
      currentFrame = requestAnimationFrame(runNextAnimationFrame);
    } else {
      currentFrame = requestAnimationFrame(runLastAnimationFrame);
    }
  };
  currentFrame = requestAnimationFrame(runNextAnimationFrame);
}

const runSpringAnimationStage = ({
  animationStage,
  cancelAnimationFrame,
  runNextStage,
  requestAnimationFrame,
  rigs,
}) => {
  const {
    start: allStartStyles,
    end: allEndStyles,
    stiffness,
    damping,
  } = animationStage;

  const updateSpringRigStyles = createFnUpdateSpringRigStyles({
    allStartStyles,
    allEndStyles,
    stiffness,
    damping,
  });

  let currentFrame;
  let isAnimationDone = false;

  const updateSpringStyles = () => {
    Object.keys(allStartStyles).forEach(rigName => {
      isAnimationDone = updateSpringRigStyles({
        rigRef: rigs[rigName],
        rigName,
        styleNames: Object.keys(allStartStyles[rigName]),
      });
    });
  };

  const runLastAnimationFrame = () => {
    currentFrame = null;
    updateSpringStyles();
    runNextStage();
  };

  const runNextAnimationFrame = () => {
    updateSpringStyles();
    if (!isAnimationDone) {
      currentFrame = requestAnimationFrame(runNextAnimationFrame);
    } else {
      currentFrame = requestAnimationFrame(runLastAnimationFrame);
    }
  };
  currentFrame = requestAnimationFrame(runNextAnimationFrame);
}


const runAnimation = ({
  animationStages,
  cancelAnimationFrame,
  onAnimationComplete,
  onStageComplete,
  requestAnimationFrame,
  rigs,
}) => {

  const run = ({ animationStages, currentStageNum, rigs }) => {
    const animationStage = animationStages[currentStageNum];
    const {
      start,
      end,
      duration,
      stiffness,
      damping,
    } = animationStage;

    const hasStyleUpdates = !!start && !!end;
    const isUsingTime = duration != null;
    const isUsingSpring = stiffness != null && damping != null;

    if (isUsingTime && isUsingSpring) {
      // TODO: console.warn
    }

    const runNextStage = () => {
      const nextStageNum = currentStageNum + 1;
      if (onStageComplete) {
        onStageComplete(currentStageNum);
      }
      if (nextStageNum === animationStages.length) {
        onAnimationComplete && onAnimationComplete();
      } else {
        run({
          animationStages,
          currentStageNum: nextStageNum,
          rigs,
        });
      }
    }

    if (hasStyleUpdates) {
      if (isUsingTime) {
        runTimedAnimationStage({
          animationStage,
          cancelAnimationFrame,
          requestAnimationFrame,
          rigs,
          runNextStage,
        });
      } else if (isUsingSpring) {
        runSpringAnimationStage({
          animationStage,
          cancelAnimationFrame,
          requestAnimationFrame,
          rigs,
          runNextStage,
        });
      }
    } else {
      runAnimationStageWithoutStyleUpdates({
        cancelAnimationFrame,
        duration,
        runNextStage,
        requestAnimationFrame,
      });
    }
  };

  run({
    animationStages,
    currentStageNum: 0,
    rigs,
  });
}

export default runAnimation;
