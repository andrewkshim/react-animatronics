// @flow
/**
 * @module withControl
 */

import React from 'react'
import ReactDOM from 'react-dom'

import type { Ref, Element, ComponentType } from 'react'
import type { Styles } from './internal/flow-types'

import ContextTypes from './internal/context-types'
import { isStatelessComponent } from './internal/utils'

type Options = {
  useStringRefs?: boolean,
};

type Props = {};

type State = {
  style: Object,
};

const withControl = (
  name: string,
  { useStringRefs = false }: Options = {}
) => (BaseComponent: ComponentType<{}>): ComponentType<Props> => {

  type BaseRef = Element<typeof BaseComponent>;

  class ControlledComponent extends React.Component<Props, State> {
    _ref: ?BaseRef
    _onRef: Function
    _setComponentStyle: Function

    constructor(props: Props) {
      super(props);
      this.state = { style: {} };
      this._ref = null;
      this._onRef = this._onRef.bind(this);
      this._setComponentStyle = this._setComponentStyle.bind(this);
    }

    componentDidMount() {
      const { animatronics } = this.context;

      const ref: ?BaseRef = useStringRefs
        ? this.refs[name]
        : this._ref;

      // $FlowFixMe: flow thinks the ref is an object type for some reason
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

    _setComponentStyle(updatedStyles: Styles) {
      this.setState(state => ({
        style: {
          ...state.style,
          ...updatedStyles,
        },
      }));
    }

    _onRef(ref: ?BaseRef) {
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
