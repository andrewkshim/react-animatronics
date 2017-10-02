/**
 * TODO: improve docs
 * withAnimatronics: (createAnimationStages, options) => higher-order component
 * @module withAnimatronics
 */

import React from 'react'

import Animator from './internal/animator'
import ContextTypes from './internal/context-types'

import {
  createPackageString,
  noop,
  removeKeyFromObject,
} from './internal/utils'

import Polyfills from './internal/polyfills'

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



const withAnimatronics = (
  createAnimationStages,
  {
    requestAnimationFrame = Polyfills.DEFAULT_REQUEST_ANIMATION_FRAME,
    cancelAnimationFrame = Polyfills.DEFAULT_CANCEL_ANIMATION_FRAME,
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

    AnimatorComponent.childContextTypes = ContextTypes;

    return AnimatorComponent;

  };

};

export default withAnimatronics;
