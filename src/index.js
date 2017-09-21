import React from 'react'
import PropTypes from 'prop-types'
import BezierEasing from 'bezier-easing'

import {
  parseStyle,
  calculateDifference,
  updateStyleValue,
  reconstructStyle,
} from './styleParser'

//==========================================================
// Constants
//==========================================================

const ACTION_PREFIX = '@@animatronics';
const REGISTER_COMPONENT = `${ ACTION_PREFIX }/REGISTER_COMPONENT`;
const UNREGISTER_COMPONENT = `${ ACTION_PREFIX }/UNREGISTER_COMPONENT`;
const DEFAULT_EASING_FN = BezierEasing(0.4, 0.0, 0.2, 1);


//==========================================================
// Internal
//==========================================================

const ANIMATRONICS_ACTION_HANDLERS = {

  [ REGISTER_COMPONENT ]: ({ rigs }, { name, ref }) => {
    return {
      rigs: {
        ...rigs,
        [ name ]: ref,
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

const calculateUpdatedStyle = ({
  startValue,
  endValue,
  easingFn,
  duration,
  elapsedTime,
}) => {
  const normalizedDuration = duration === 0 ? elapsedTime : duration;
  const parsedStartStyle = parseStyle(startValue);
  const parsedEndStyle = parseStyle(endValue);
  const difference = calculateDifference(parsedStartStyle, parsedEndStyle);
  const parsedUpdatedStyle = updateStyleValue(
    parsedStartStyle,
    difference * easingFn( elapsedTime / normalizedDuration ),
  );
  return reconstructStyle(parsedUpdatedStyle);
}

const updateRigStyles = ({
  rigRef,
  startStyles,
  endStyles,
  easingFn,
  duration,
  elapsedTime,
}) => {
  Object.keys(startStyles).forEach(styleName => {
    const updatedStyle = calculateUpdatedStyle({
      startValue: startStyles[styleName],
      endValue: endStyles[styleName],
      easingFn,
      duration,
      elapsedTime,
    });
    rigRef.style[styleName] = updatedStyle;
  });
}

const extractUnderlyingDOMNodeRef = ref => {
  // HACK
  return ref._reactInternalFiber.child.stateNode;
}

const runAnimationStage = ({
  animationStage,
  rigs,
  environment,
  onStageComplete,
}) => {
  const {
    start: allStartStyles,
    end: allEndStyles,
    easingFn = DEFAULT_EASING_FN,
    duration,
  } = animationStage;

  //let { requestAnimationFrame } = environment;
  //if (!requestAnimationFrame) {
    //requestAnimationFrame = window.requestAnimationFrame;
  //}

  const startTime = Date.now();

  const runAnimationLoop = () => {
    const elapsedTime = Date.now() - startTime;
    Object.keys(rigs).forEach(rigName => {
      if (!allStartStyles || !allEndStyles) {
        // TODO: warn
        return;
      }

      const startStyles = allStartStyles[rigName];
      const endStyles = allEndStyles[rigName];

      if (!startStyles || !endStyles) {
        // TODO: warn
        return;
      }

      updateRigStyles({
        rigRef: rigs[rigName],
        startStyles,
        endStyles,
        easingFn,
        duration,
        elapsedTime,
      });
    });

    if (elapsedTime < duration) {
      requestAnimationFrame(runAnimationLoop);
    } else {
      onStageComplete();
    }
    //if ((currentStageNum + 1) < animationStages.length) {
      //onNextStage();
      ////this.setState(
        ////{ currentStageNum: currentStageNum + 1 },
        ////() => {
          ////this._startAnimation();
        ////}
      ////);
    //}
  };
  requestAnimationFrame(runAnimationLoop);
}

const runAnimation = ({
  animationStages,
  rigs,
  environment,
  onAnimationComplete,
}) => {

  const run = ({ animationStages, currentStageNum, rigs }) => {
    runAnimationStage({
      animationStage: animationStages[currentStageNum],
      rigs,
      onStageComplete: () => {
        const nextStageNum = currentStageNum + 1;
        if (nextStageNum === animationStages.length) {
          onAnimationComplete && onAnimationComplete();
        } else {
          run({
            animationStages,
            currentStageNum: nextStageNum,
            rigs,
          });
        }
      },
    });
  };

  run({
    animationStages,
    currentStageNum: 0,
    rigs,
  });

}

export const AnimatronicsContextTypes = {
  animatronics: PropTypes.shape({
    registerComponent: PropTypes.func.isRequired,
    unregisterComponent: PropTypes.func.isRequired,
  }).isRequired,
};

export const withAnimatronics = (BaseComponent, createAnimationStages) => {

  let state = {
    rigs: {},
  };

  const registerComponent = ({ name, ref }) => {
    state = handleAnimatronicsAction(
      state,
      {
        type: REGISTER_COMPONENT,
        payload: { name, ref },
      },
    );
  };
//==========================================================
// Exports
//==========================================================

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
        rigs,
        environment: null,
        onAnimationComplete: null,
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

export const withRig = (BaseComponent, name) => {

  class Rig extends React.Component {
    constructor(props) {
      super(props);
      this._onRef = this._onRef.bind(this);
    }

    componentDidMount() {
      const { animatronics } = this.context;
      animatronics.registerComponent({
        ref: this._ref,
        name,
      });
    }

    componentWillUnmount() {
      const { animationcs } = this.context;
      animatronics.unregisterComponent({
        name,
      })
    }

    _onRef(ref) {
      this._ref = extractUnderlyingDOMNodeRef(ref);
    }

    render() {
      const { ...props } = this.props;
      return (
        <BaseComponent
          ref={ this._onRef }
          { ...props }
        />
      );
    }
  }

  Rig.contextTypes = AnimatronicsContextTypes;

  return Rig;
};
