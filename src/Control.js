/**
 * @module Control
 */

import React from 'react'
import PropTypes from 'prop-types'

import ContextTypes from './internal/context-types'
import withControl from './withControl'

class Control extends React.Component {
  render() {
    const { name, children, useStringRefs } = this.props;
    const enhance = withControl(name, { useStringRefs });
    class BaseComponent extends React.Component {
      render() { return this.props.children; }
    }
    const ControlledComponent = enhance(BaseComponent);
    return <ControlledComponent children={ children }/>;
  }
}

Control.contextTypes = ContextTypes;

Control.propTypes = {
  name: PropTypes.string.isRequired,
};

Control.defaultProps = {
  useStringRefs: false,
};

export default Control;
