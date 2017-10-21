/**
 * withControl: (name, options) => higher-order component
 * @module internal/context-types
 */

import React from 'react'

import ContextTypes from './internal/context-types'
import Control from './Control'

const withControl = (
  name,
  { useStringRefs = false } = {}
) => BaseComponent => {

  const ControlledComponent = class extends React.Component {
    render() {
      return (
        <Control name={ name } useStringRefs={ useStringRefs }>
          <BaseComponent { ...this.props }/>
        </Control>
      );
    }
  };

  ControlledComponent.contextTypes = ContextTypes;

  return ControlledComponent;
};

export default withControl;
