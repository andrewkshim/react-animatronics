/**
 * React Animatronics: coordinated, declarative animations for React components.
 */

import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import BezierEasing from 'bezier-easing'
import chroma from 'chroma-js'

import {
  MS_PER_ANIMATION_FRAME,
  SECONDS_PER_ANIMATION_FRAME,
} from './constants'

import { updateTimedRigStyles } from './stylist/timed-stylist'
import { createFnUpdateSpringRigStyles } from './stylist/spring-stylist'

//==========================================================
// Constants
//==========================================================

const ACTION_PREFIX = '@@animatronics';
const REGISTER_COMPONENT = `${ ACTION_PREFIX }/REGISTER_COMPONENT`;
const UNREGISTER_COMPONENT = `${ ACTION_PREFIX }/UNREGISTER_COMPONENT`;

const IS_RAF_AVAILABLE = (
  typeof window !== 'undefined'
  && window.requestAnimationFrame
);
const DEFAULT_EASING_FN = BezierEasing(0.4, 0.0, 0.2, 1);

const DEFAULT_REQUEST_ANIMATION_FRAME = IS_RAF_AVAILABLE
  ? requestAnimationFrame
  : callback => setTimeout(callback, MS_PER_ANIMATION_FRAME)

const DEFAULT_CANCEL_ANIMATION_FRAME = IS_RAF_AVAILABLE
  ? cancelAnimationFrame
  : clearTimeout

const BETWEEN_PAREN_REGEX = /\(([^)]+)\)/;
const NUMBER_REGEX = /(-)?\d+(\.\d+)?/;


//==========================================================
// Internal
//==========================================================

const ensureIsFunction = possibleFn => typeof possibleFn === 'function'
  ? possibleFn
  : () => {};

const isStatelessComponent = Component => !Component.prototype.render;

const ANIMATRONICS_ACTION_HANDLERS = {

  [ REGISTER_COMPONENT ]: ({ rigs }, { name, domRef }) => {
    return {
      rigs: {
        ...rigs,
        [ name ]: domRef,
      },
    };
  },

  [ UNREGISTER_COMPONENT ]: ({ rigs }, { name }) => {
    return {
      rigs: Object
        .keys(rigs)
        .reduce((result, otherRigName) => {
          if (name !== otherRigName) {
            result[otherRigName] = rigs[otherRigName];
          }
          return result;
        }, {})
      ,
    };
  },

}

const handleAnimatronicsAction = (state, { type, payload }) => {
  return !ANIMATRONICS_ACTION_HANDLERS[type]
    ? state
    : ANIMATRONICS_ACTION_HANDLERS[type](state, payload)
  ;
}

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

const AnimatronicsContextTypes = {
  animatronics: PropTypes.shape({
    registerComponent: PropTypes.func.isRequired,
    unregisterComponent: PropTypes.func.isRequired,
  }).isRequired,
};


//==========================================================
// Exports
//==========================================================

export const withAnimatronics = (
  createAnimationStages,
  {
    requestAnimationFrame = DEFAULT_REQUEST_ANIMATION_FRAME,
    cancelAnimationFrame = DEFAULT_CANCEL_ANIMATION_FRAME,
  } = {}
) => {

  return BaseComponent => {

    let state = {
      rigs: {},
    };

    const registerComponent = ({ name, domRef }) => {
      state = handleAnimatronicsAction(
        state,
        {
          type: REGISTER_COMPONENT,
          payload: { name, domRef },
        },
      );
    };

    const unregisterComponent = ({ name }) => {
      state = handleAnimatronicsAction(
        state,
        {
          type: UNREGISTER_COMPONENT,
          payload: { name },
        },
      );
    };

    class Animator extends React.Component {
      constructor(props) {
        super(props);
        this._runAnimation = this._runAnimation.bind(this);
      }

      getChildContext() {
        return {
          animatronics: {
            registerComponent,
            unregisterComponent,
          }
        };
      }

      _runAnimation(onAnimationComplete, onStageComplete) {
        const { rigs } = state;
        runAnimation({
          animationStages: createAnimationStages(rigs),
          cancelAnimationFrame,
          onAnimationComplete: ensureIsFunction(onAnimationComplete),
          onStageComplete: ensureIsFunction(onStageComplete),
          requestAnimationFrame,
          rigs,
        })
      }

      render() {
        const { ...props } = this.props;
        return (
          <BaseComponent
            runAnimation={ this._runAnimation }
            { ...props }
          />
        );
      }
    };

    Animator.childContextTypes = AnimatronicsContextTypes;

    return Animator;

  };

};

export const withRig = (
  name,
  {
    useStringRefs = false,
  } = {}
) => BaseComponent => {

  if (isStatelessComponent(BaseComponent)) {
    console.error(`Using stateless component but requires rig ${name}!`);
  }

  class Rig extends React.Component {
    constructor(props) {
      super(props);
      this._onRef = this._onRef.bind(this);
    }

    componentDidMount() {
      const { animatronics } = this.context;
      const ref = useStringRefs ? this.refs[name] : this._ref;
      const domRef = ReactDOM.findDOMNode(ref);
      animatronics.registerComponent({
        domRef,
        name,
      });
    }

    componentWillUnmount() {
      const { animatronics } = this.context;
      animatronics.unregisterComponent({
        name,
      })
    }

    _onRef(ref) {
      this._ref = ref;
    }

    render() {
      const { ...props } = this.props;
      const ref = useStringRefs ? name : this._onRef;
      return (
        <BaseComponent
          ref={ ref }
          { ...props }
        />
      );
    }
  }

  Rig.contextTypes = AnimatronicsContextTypes;

  return Rig;
};

export const createBezierEasingFn = BezierEasing;
