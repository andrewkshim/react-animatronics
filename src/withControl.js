/**
 * TODO: improve docs
 * withControl: (componentName, options) => higher-order component
 * @module internal/context-types
 */

import React from 'react'
import ReactDOM from 'react-dom'

import ContextTypes from './internal/context-types'

const withControl = (
  componentName,
  {
    useStringRefs = false,
  } = {}
) => BaseComponent => {

  class ControlledComponent extends React.Component {
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
      animatronics.registerComponent(
        componentName,
        domNode,
        this._setComponentStyle,
      );
    }

    componentWillUnmount() {
      const { animatronics } = this.context;
      animatronics.unregisterComponent(componentName);
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

  ControlledComponent.contextTypes = ContextTypes;

  return ControlledComponent;
};

export default withControl;