// @flow
/**
 * @module withControl
 */

import React from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'

import type { ComponentType } from 'react'

import ContextTypes from './internal/context-types'
import Control from './Control'
import { isStatelessComponent } from './internal/utils'

type Props = {};

type State = {};

const withControl = (name: string) => (BaseComponent: ComponentType<{}>) => {

  class ControlledComponent extends React.Component<Props, State> {
    static contextTypes: Object = ContextTypes

    render() {
      return (
        <Control name={ name }>{ ({ animatronicStyles, ref }) =>
          <BaseComponent
            { ...this.props }
            animatronicStyles={ animatronicStyles }
            ref={ isStatelessComponent(BaseComponent) ? null : ref }
          />
        }</Control>
      );
    }
  }

  return hoistNonReactStatics(ControlledComponent, BaseComponent);
}

export default withControl;
