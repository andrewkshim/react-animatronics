/**
 * React Animatronics: coordinated, declarative animations for React components.
 */

import BezierEasing from 'bezier-easing'
import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'

import {
  DEFAULT_REQUEST_ANIMATION_FRAME,
  DEFAULT_CANCEL_ANIMATION_FRAME,
  createPackageString,
  noop,
  isStatelessComponent,
  removeKeyFromObject,
} from './utils'

import Animator from './animator'

const REGISTER_COMPONENT = createPackageString('REGISTER_COMPONENT');
const UNREGISTER_COMPONENT = createPackageString('UNREGISTER_COMPONENT');

const ANIMATRONICS_ACTION_HANDLERS = {

  [ REGISTER_COMPONENT ]: (state, payload) => {
    const { styleSettersForComponents, domNodesForComponents } = state;
    const { componentName, domNode, setComponentStyle } = payload;
    return {
      styleSettersForComponents: {
        ...styleSettersForComponents,
        [ componentName ]: setComponentStyle,
      },
      domNodesForComponents: {
        ...domNodesForComponents,
        [ componentName ]: domNode,
      },
    };
  },

  [ UNREGISTER_COMPONENT ]: (state, payload) => {
    const { styleSettersForComponents, domNodesForComponents } = state;
    const { componentName } = payload;
    return {
      styleSettersForComponents: removeKeyFromObject(styleSettersForComponents, componentName),
      domNodesForComponents: removeKeyFromObject(domNodesForComponents, componentName),
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
      styleSettersForComponents: {},
      domNodesForComponents: {},
    };

    const registerComponent = ({ componentName, domNode, setComponentStyle }) => {
      state = handleAnimatronicsAction(
        state,
        {
          type: REGISTER_COMPONENT,
          payload: { componentName, domNode, setComponentStyle },
        },
      );
    };

    const unregisterComponent = ({ componentName }) => {
      state = handleAnimatronicsAction(
        state,
        {
          type: UNREGISTER_COMPONENT,
          payload: { componentName },
        },
      );
    };

    class AnimatorComponent extends React.Component {
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

      _runAnimation(
        onAnimationComplete = noop,
        onStageComplete = noop,
      ) {
        const { styleSettersForComponents, domNodesForComponents } = state;
        Animator.runAnimation({
          animationStages: createAnimationStages(domNodesForComponents),
          cancelAnimationFrame,
          onAnimationComplete,
          onStageComplete,
          requestAnimationFrame,
          styleSettersForComponents,
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

    AnimatorComponent.childContextTypes = AnimatronicsContextTypes;

    return AnimatorComponent;

  };

};

export const withRig = (
  componentName,
  {
    useStringRefs = false,
  } = {}
) => BaseComponent => {

  class Rig extends React.Component {
    constructor(props) {
      super(props);
      this.state = { style: {} };
      this._onRef = this._onRef.bind(this);
      this._setComponentStyle = this._setComponentStyle.bind(this);
    }

    componentDidMount() {
      const { animatronics } = this.context;
      const ref = useStringRefs ? this.refs[componentName] : this._ref;
      const domNode = ReactDOM.findDOMNode(ref);
      animatronics.registerComponent({
        domNode,
        componentName,
        setComponentStyle: this._setComponentStyle,
      });
    }

    componentWillUnmount() {
      const { animatronics } = this.context;
      animatronics.unregisterComponent({ componentName });
    }

    _setComponentStyle(updatedStyles) {
      this.setState(state => ({
        style: {
          ...state.style,
          ...updatedStyles,
        },
      }));
    }

    _onRef(ref) {
      this._ref = ref;
    }

    render() {
      const { ...props } = this.props;
      const { style } = this.state;
      const ref = useStringRefs ? componentName : this._onRef;
      return (
        <BaseComponent
          ref={ ref }
          animatronicStyles={ style }
          { ...props }
        />
      );
    }
  }

  Rig.contextTypes = AnimatronicsContextTypes;

  return Rig;
};

export const createBezierEasingFn = BezierEasing;
