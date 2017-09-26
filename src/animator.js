/**
 * Animator: runs the animations.
 * @module animator
 */

import BezierEasing from 'bezier-easing'

import { updateTimedRigStyles } from './stylist/timed-stylist'
import { createFnUpdateSpringRigStyles } from './stylist/spring-stylist'

const DEFAULT_EASING_FN = BezierEasing(0.4, 0.0, 0.2, 1);

const isUsingTime = animation => animation.duration != null;
const isUsingSpring = animation => (
  animation.stiffness != null
  && animation.damping != null
);

const runTimedAnimationStage = ({
  startStyles,
  endStyles,
  duration,
  easingFn,
  setComponentStyle,
  requestAnimationFrame,
  cancelAnimationFrame,
  runNextStage,
}) => {
  const startTime = Date.now();
  let currentFrame;

  const runLastAnimationFrame = () => {
    currentFrame = null;
    if (duration > 0) {
      updateTimedRigStyles({
        setComponentStyle,
        startStyles,
        endStyles,
        easingFn,
        duration,
        elapsedTime: duration,
      });
    }
    runNextStage();
  };

  const runNextAnimationFrame = () => {
    const elapsedTime = Date.now() - startTime;
    updateTimedRigStyles({
      setComponentStyle,
      startStyles,
      endStyles,
      easingFn,
      duration,
      elapsedTime,
    });

    if (elapsedTime < duration) {
      currentFrame = requestAnimationFrame(runNextAnimationFrame);
    } else {
      currentFrame = requestAnimationFrame(runLastAnimationFrame);
    }
  };

  currentFrame = requestAnimationFrame(runNextAnimationFrame);
}

const runSpringAnimationStage = ({
  startStyles,
  endStyles,
  stiffness,
  damping,
  setComponentStyle,
  requestAnimationFrame,
  cancelAnimationFrame,
  runNextStage,
}) => {

  const updateSpringRigStyles = createFnUpdateSpringRigStyles({
    startStyles,
    endStyles,
    stiffness,
    damping,
    setComponentStyle,
  });

  let currentFrame;
  let isAnimationDone = false;

  const runLastAnimationFrame = () => {
    currentFrame = null;
    isAnimationDone = updateSpringRigStyles();
    runNextStage();
  };

  const runNextAnimationFrame = () => {
    isAnimationDone = updateSpringRigStyles();
    if (!isAnimationDone) {
      currentFrame = requestAnimationFrame(runNextAnimationFrame);
    } else {
      currentFrame = requestAnimationFrame(runLastAnimationFrame);
    }
  };
  currentFrame = requestAnimationFrame(runNextAnimationFrame);
}

const runAnimationStage = ({
  animationStage,
  cancelAnimationFrame,
  requestAnimationFrame,
  styleSettersForComponents,
  runNextStage,
}) => {
  Object.keys(animationStage).forEach(componentName => {
    const animation = animationStage[componentName];
    const setComponentStyle = styleSettersForComponents[componentName];

    if (isUsingTime(animation)) {
      const {
        start: startStyles,
        end: endStyles,
        duration,
        easingFn = DEFAULT_EASING_FN,
      } = animation;
      runTimedAnimationStage({
        startStyles,
        endStyles,
        duration,
        easingFn,
        setComponentStyle,
        requestAnimationFrame,
        cancelAnimationFrame,
        runNextStage,
      });
    } else if (isUsingSpring(animation)) {
      // TODO: rename to startStyles, endStyles
      const {
        start: startStyles,
        end: endStyles,
        stiffness,
        damping,
      } = animation;
      runSpringAnimationStage({
        startStyles,
        endStyles,
        stiffness,
        damping,
        setComponentStyle,
        requestAnimationFrame,
        cancelAnimationFrame,
        runNextStage,
      });
    } else {
      // TODO: warn
    }
  });
}

const runAnimation = ({
  animationStages,
  cancelAnimationFrame,
  onAnimationComplete,
  onStageComplete,
  requestAnimationFrame,
  styleSettersForComponents,
}) => {

  const run = ({ animationStages, currentStageNum }) => {
    // TODO: left off with changing the API, see basic example
    const animationStage = animationStages[currentStageNum];

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
        });
      }
    }

    runAnimationStage({
      animationStage,
      cancelAnimationFrame,
      requestAnimationFrame,
      styleSettersForComponents,
      runNextStage,
    });
  };

  run({
    animationStages,
    currentStageNum: 0,
  });
}

export default runAnimation;



    //const {
      //start,
      //end,
      //duration,
      //stiffness,
      //damping,
    //} = animationStage;

    //const isUsingTime = duration != null;
    //const isUsingSpring = stiffness != null && damping != null;

    //if (isUsingTime && isUsingSpring) {
      //// TODO: console.warn
    //}
