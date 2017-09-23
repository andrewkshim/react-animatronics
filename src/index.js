import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import BezierEasing from 'bezier-easing'


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
const MS_PER_ANIMATION_FRAME = 1000 / 60; // 60 fps
const SECONDS_PER_ANIMATION_FRAME = MS_PER_ANIMATION_FRAME / 1000;
const DEFAULT_EASING_FN = BezierEasing(0.4, 0.0, 0.2, 1);

const DEFAULT_REQUEST_ANIMATION_FRAME = IS_RAF_AVAILABLE
  ? requestAnimationFrame
  : callback => setTimeout(callback, MS_PER_ANIMATION_FRAME)

const DEFAULT_CANCEL_ANIMATION_FRAME = IS_RAF_AVAILABLE
  ? cancelAnimationFrame
  : clearTimeout

const BETWEEN_PAREN_REGEX = /\(([^)]+)\)/;
const NUMBER_REGEX = /\d+(\.\d+)?/;


//==========================================================
// Internal
//==========================================================

const parseStyle = style => {
  if (typeof style === 'number') {
    return {
      value: style,
      unit: 'px',
    };
  } else if (style.indexOf('(') > -1) {
    const openParenIndex = style.indexOf('(');
    const matches = BETWEEN_PAREN_REGEX.exec(style);
    return {
      transformFn: style.slice(0, openParenIndex),
      ...parseStyle(matches[1]),
    };
  } else {
    const matches = NUMBER_REGEX.exec(style);
    const value = matches[0];
    return {
      value: parseFloat(value),
      unit: style.slice(value.length),
    };
  }
}

const updateStyleValue = (parsedStyle, delta) => {
  return {
    ...parsedStyle,
    value: parsedStyle.value + delta,
  };
}

const reconstructStyle = ({ transformFn, value, unit }) => {
  return transformFn ? `${transformFn}(${value}${unit})` : `${value}${unit}`;
}

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

const calculateTimedUpdatedStyle = ({
  startValue,
  endValue,
  easingFn,
  duration,
  elapsedTime,
}) => {
  const normalizedDuration = duration === 0 ? elapsedTime : duration;
  const parsedStartStyle = parseStyle(startValue);
  const parsedEndStyle = parseStyle(endValue);
  const difference = parsedEndStyle.value - parsedStartStyle.value;
  const parsedUpdatedStyle = updateStyleValue(
    parsedStartStyle,
    difference * easingFn( elapsedTime / normalizedDuration ),
  );
  return reconstructStyle(parsedUpdatedStyle);
}

const updateTimedRigStyles = ({
  rigRef,
  startStyles,
  endStyles,
  easingFn,
  duration,
  elapsedTime,
}) => {
  Object.keys(startStyles).forEach(styleName => {
    const updatedStyle = calculateTimedUpdatedStyle({
      startValue: startStyles[styleName],
      endValue: endStyles[styleName],
      easingFn,
      duration,
      elapsedTime,
    });
    rigRef.style[styleName] = updatedStyle;
  });
}

const updateSpringRigStyles = ({
  rigRef,
  currentStyles,
  currentVelocities,
  damping,
  elapsedTime,
  endStyles,
  stiffness,
}) => {
  return Object.keys(currentStyles).reduce((result, styleName) => {
    const currentStyle = currentStyles[styleName];
    const endStyle = endStyles[styleName];
    const parsedStartStyle = parseStyle(currentStyle);
    const parsedEndStyle = parseStyle(endStyle);

    const currentVelocity = currentVelocities[styleName];

    const spring = -stiffness * (parsedStartStyle.value - parsedEndStyle.value);
    const damper = -damping * currentVelocity;
    const acceleration = spring + damper;
    const updatedVelocity = currentVelocity + (acceleration * SECONDS_PER_ANIMATION_FRAME);
    const updatedStyle = updateStyleValue(
      parsedStartStyle,
      updatedVelocity * SECONDS_PER_ANIMATION_FRAME
    );
    const reconstructedStyle = reconstructStyle(updatedStyle);

    result.updatedStyles[styleName] = reconstructedStyle;
    result.updatedVelocities[styleName] = updatedVelocity;

    rigRef.style[styleName] = reconstructedStyle;

    return result;
  }, { updatedStyles: {}, updatedVelocities: {} });
}

const allVelocitiesSettled = currentStylesAndVelocities => {
  const velocityChecks = Object.keys(currentStylesAndVelocities)
    .reduce((result, rigName) => {
      const { currentVelocities } = currentStylesAndVelocities[rigName];
      return result.concat(
        Object.values(currentVelocities)
          .map(velocity => Math.abs(velocity) < 0.01)
      );
    }, []);
  return velocityChecks.every(check => check);
}

const createStyleUpdater = ({
  allEndStyles,
  allStartStyles,
  duration,
  easingFn,
  rigs,
}) => elapsedTime => {
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

  const startTime = Date.now();
  const currentStylesAndVelocities = Object.keys(allStartStyles).reduce((result, rigName) => {
    const currentStyles = allStartStyles[rigName];
    result[rigName] = {
      currentStyles,
      currentVelocities: Object.keys(currentStyles).reduce((velocities, styleName) => {
        velocities[styleName] = 0;
        return velocities;
      }, {}),
    };
    return result;
  }, {});
  let currentFrame;

  const updateSpringStyles = elapsedTime => {
    Object.keys(allStartStyles).forEach(rigName => {
      const { currentStyles, currentVelocities } = currentStylesAndVelocities[rigName];
      const endStyles = allEndStyles[rigName];
      const rigRef = rigs[rigName];

      if (!rigRef) {
        // TODO: warn
        return;
      }

      if (!currentStyles || !endStyles) {
        // TODO: warn
        return;
      }

      const { updatedStyles, updatedVelocities } = updateSpringRigStyles({
        rigRef: rigs[rigName],
        currentStyles,
        currentVelocities,
        damping,
        elapsedTime,
        endStyles,
        stiffness,
      });
      currentStylesAndVelocities[rigName].currentStyles = updatedStyles;
      currentStylesAndVelocities[rigName].currentVelocities = updatedVelocities;
    });
  };

  const runLastAnimationFrame = () => {
    currentFrame = null;
    runNextStage();
  };

  const runNextAnimationFrame = () => {
    const elapsedTime = Date.now() - startTime;
    updateSpringStyles(elapsedTime);
    if (!allVelocitiesSettled(currentStylesAndVelocities)) {
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
      onStageComplete,
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
        onStageComplete();
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
    onAnimationComplete,
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

      _runAnimation() {
        const { rigs } = state;
        runAnimation({
          animationStages: createAnimationStages(rigs),
          cancelAnimationFrame,
          onAnimationComplete,
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
      if (!!ref) {
        this._ref = ref;
      }
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
