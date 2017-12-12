// @flow
/**
 * @module withControl
 */

import React from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'

import type { ComponentType } from 'react'

import ContextTypes from './internal/context-types'
import Control from './Control'
import { IS_PRODUCTION } from './internal/constants'

import {
  isStatelessComponent,
  isReactComponent,
  makeError,
} from './internal/utils'

type Props = {
  innerRef: Function,
};

const withControl = (name: string) => (BaseComponent: ComponentType<{}>) => {

  if (!IS_PRODUCTION) {
    if (!isReactComponent(BaseComponent)) {
      throw makeError(
        `The withControl() higher-order component must be used to wrap a`,
        `valid React component.`
      );
    }
  }

  class ControlledComponent extends React.Component<Props> {
    static contextTypes: Object = ContextTypes

    render() {
      const { innerRef, ...props } = this.props;
      return (
        <Control name={ name }>{ ({ animatronicStyles, ref }) =>
          <BaseComponent
            { ...this.props }
            animatronicStyles={ animatronicStyles }
            ref={ isStatelessComponent(BaseComponent) ? null : element => {
              innerRef && innerRef(element);
              ref(element);
            } }
          />
        }</Control>
      );
    }
  }

  return hoistNonReactStatics(ControlledComponent, BaseComponent);
}

export default withControl;
