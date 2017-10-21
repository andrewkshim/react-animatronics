/**
 * @module Control
 */

import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

import ContextTypes from './internal/context-types'

class Control extends React.Component {
  constructor(props) {
    super(props);
    this.state = { style: {} };
    this._onRef = this._onRef.bind(this);
    this._setComponentStyle = this._setComponentStyle.bind(this);
  }

  componentDidMount() {
    const { animatronics } = this.context;
    const { name, useStringRefs } = this.props;
    const ref = useStringRefs ? this.refs[name] : this._ref;
    const domNode = ReactDOM.findDOMNode(ref);
    animatronics.registerComponent(
      name,
      domNode,
      this._setComponentStyle,
    );
  }

  componentWillUnmount() {
    const { animatronics } = this.context;
    const { name } = this.props;
    animatronics.unregisterComponent(name);
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
    const { children, name, useStringRefs, ...props } = this.props;
    const { style } = this.state;
    const ref = useStringRefs ? name : this._onRef;
    return React.cloneElement(children, {
      animatronicStyles: style,
      ref,
      ...props,
    });
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
