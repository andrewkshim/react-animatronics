// @flow
/**
 * @module withControl
 */

import React from 'react'
import ReactDOM from 'react-dom'
import hoistNonReactStatics from 'hoist-non-react-statics'

import type { Ref, Element, ComponentType } from 'react'
import type { Styles } from './internal/flow-types'

import ContextTypes from './internal/context-types'

import {
  IS_DEVELOPMENT,
} from './internal/constants'

import {
  isReactComponent,
  isStatelessComponent,
  makeError,
} from './internal/utils'

type Options = {
  useStringRefs?: boolean,
  mergeProps?: Function,
};

type Props = {};

type State = {
  style: Object,
};

const withControl = (
  name: string,
  {
    mergeProps,
    useStringRefs = false,
  }: Options = {}
) => (BaseComponent: ComponentType<{}>): ComponentType<Props> => {

  type BaseRef = Element<typeof BaseComponent>;

  if (IS_DEVELOPMENT) {
    if (!isReactComponent(BaseComponent)) {
      throw makeError(
        `withControl() must be used to wrap a React component`
         + ` Make sure that you're passing in either a component class or a`
         + ` function that returns an element. A common mistake is to pass in`
         + ` the React element itself. For example, passing in "<Component/>"`
         + ` instead of "Component", but you should be passing in the second form.`
      );
    }
    if (mergeProps && typeof mergeProps !== 'function') {
      throw makeError(
        `The "mergeProps" option to withControl must be a function with two arguments:`
        + ` the first is the props of the controlled component, and the second is`
        + ` an object { animatronicStyles } that contains the interpolated styles.`
        + ` The function must return an object that will be spread into the wrapped`
        + ` component as props.`
      );
    }
  }

  class ControlledComponent extends React.Component<Props, State> {
    _ref: ?BaseRef
    _onRef: Function
    _setComponentStyle: Function
    _resetComponentStyle: Function

    constructor(props: Props) {
      super(props);
      this.state = { style: {} };
      this._ref = null;
      this._onRef = this._onRef.bind(this);
      this._setComponentStyle = this._setComponentStyle.bind(this);
      this._resetComponentStyle = this._resetComponentStyle.bind(this);
    }

    componentDidMount() {
      const { animatronics } = this.context;

      const ref: ?BaseRef = useStringRefs ? this.refs[name] : this._ref;

      // $FlowFixMe: flow thinks the ref is an object type for some reason
      const domNode = ReactDOM.findDOMNode(ref);

      if (IS_DEVELOPMENT) {
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
        domNode,
        this._setComponentStyle,
        this._resetComponentStyle,
      );
    }

    componentDidUpdate() {
      const { animatronics } = this.context;

      const ref: ?BaseRef = useStringRefs ? this.refs[name] : this._ref;

      // $FlowFixMe: flow thinks the ref is an object type for some reason
      const domNode = ReactDOM.findDOMNode(ref);

      animatronics.registerComponent(
        name,
        domNode,
        this._setComponentStyle,
        this._resetComponentStyle,
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

    _resetComponentStyle() {
      this.setState({ style: {} })
    }

    _onRef(ref: ?BaseRef) {
      this._ref = ref;
    }

    render() {
      const baseProps = this.props;
      const { style } = this.state;

      const props = mergeProps ? (
        mergeProps(baseProps, { animatronicStyles: style })
      ) : ({
        ...baseProps,
        animatronicStyles: style,
      });

      if (!isStatelessComponent(BaseComponent)) {
        props.ref = useStringRefs ? name : this._onRef;
      }

      return <BaseComponent { ...props }/>;
    }
  }

  ControlledComponent.contextTypes = ContextTypes;

  return hoistNonReactStatics(ControlledComponent, BaseComponent);
};

export default withControl;
