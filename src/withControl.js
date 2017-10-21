/**
 * @module withControl
 */

import React from 'react'
import ReactDOM from 'react-dom'

import ContextTypes from './internal/context-types'
import { isStatelessComponent } from './internal/utils'

const withControl = (
  name,
  { useStringRefs = false } = {}
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
      const { ...props } = this.props;
      const { style } = this.state;

      const baseProps = {
        animatronicStyles: style,
        ...props,
      };
      if (!isStatelessComponent(BaseComponent)) {
        baseProps.ref = useStringRefs ? name : this._onRef;
      }

      return <BaseComponent { ...baseProps }/>;
    }
  }

  ControlledComponent.contextTypes = ContextTypes;

  return ControlledComponent;
};

export default withControl;
