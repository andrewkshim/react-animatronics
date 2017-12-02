// @flow
/**
 * @module Control
 */

import React from 'react'
import ReactDOM from 'react-dom'

import type { Ref, ElementType } from 'react'
import type { Styles } from './internal/flow-types'

import ContextTypes from './internal/context-types'
import { IS_PRODUCTION } from './internal/constants'
import { makeError } from './internal/utils'

type Props = {
  children: Function,
  name: string,
};

type State = {
  animatronicStyles: Object,
};

class Control extends React.Component<Props, State> {

  static contextTypes: Object = ContextTypes

  _ref: any
  _onRef: Function
  _registerComponent: Function
  _resetComponentStyle: Function
  _getComponentStyle: Function
  _setComponentStyle: Function

  constructor(props: Props) {
    super(props);

    if (!IS_PRODUCTION) {
      if (typeof props.name !== 'string') {
        // TODO: check for name uniqueness
        throw makeError(
          `<Control> must receive a string "name" prop.`
        );
      }
      if (typeof props.children !== 'function') {
        throw makeError(
          `<Control> must receive a function "children" prop that returns a`,
          `single React element.`
        );
      }
    }

    this.state = { animatronicStyles: {} };

    this._ref = null;
    this._onRef = this._onRef.bind(this);
    this._registerComponent = this._registerComponent.bind(this);
    this._resetComponentStyle = this._resetComponentStyle.bind(this);
    this._getComponentStyle = this._getComponentStyle.bind(this);
    this._setComponentStyle = this._setComponentStyle.bind(this);
  }

  _getComponentStyle() {
    return this.state.animatronicStyles;
  }

  _setComponentStyle(updatedStyles: Styles) {
    this.setState(state => ({
      animatronicStyles: {
        ...state.animatronicStyles,
        ...updatedStyles,
      },
    }));
  }

  _resetComponentStyle() {
    this.setState({ animatronicStyles: {} });
  }

  _onRef(ref: any) {
    this._ref = ref;
  }

  _registerComponent() {
    const { animatronics } = this.context;
    const { name } = this.props;

    if (!IS_PRODUCTION) {
      if (!animatronics) {
        throw makeError(
          `Can't find the right context in the following controlled component: ${ name }.`,
          `This likely means you forgot to use an animatronics component. Check to see that`,
          `you're using either <Animatronics/> or withAnimatronics() and that your controlled`,
          `component is a descendant of it.`
        );
      }
    }

    animatronics.registerComponent(
      name,
      ReactDOM.findDOMNode(this._ref),
      this._getComponentStyle,
      this._setComponentStyle,
      this._resetComponentStyle,
    );
  }

  componentDidMount() {
    this._registerComponent();
  }

  componentDidUpdate() {
    this._registerComponent();
  }

  componentWillUnmount() {
    const { animatronics } = this.context;
    const { name } = this.props;
    animatronics.unregisterComponent(name);
  }

  render() {
    const { children } = this.props;
    const { animatronicStyles } = this.state;
    return children({
      animatronicStyles,
      ref: this._onRef,
    });
  }

}

export default Control;
