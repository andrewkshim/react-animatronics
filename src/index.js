/**
 * React Animatronics: coordinated, declarative animations for React components.
 */

import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import BezierEasing from 'bezier-easing'

import {
  MS_PER_ANIMATION_FRAME,
  SECONDS_PER_ANIMATION_FRAME,
} from './constants'

import {
  DEFAULT_REQUEST_ANIMATION_FRAME,
  DEFAULT_CANCEL_ANIMATION_FRAME,
  createModuleString,
  ensureIsFunction,
  isStatelessComponent,
} from './utils'

import runAnimation from './animator'

const REGISTER_COMPONENT = createModuleString('REGISTER_COMPONENT');
const UNREGISTER_COMPONENT = createModuleString('UNREGISTER_COMPONENT');

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

const AnimatronicsContextTypes = {
  animatronics: PropTypes.shape({
    registerComponent: PropTypes.func.isRequired,
    unregisterComponent: PropTypes.func.isRequired,
  }).isRequired,
};

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
