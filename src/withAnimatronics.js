// @flow
/**
 * @module withAnimatronics
 */

import React from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'

import type { ComponentType } from 'react'

import ContextTypes from './internal/context-types'
import Animatronics from './Animatronics'
import { IS_PRODUCTION } from './internal/constants'

import {
  isStatelessComponent,
  isReactComponent,
  makeError,
} from './internal/utils'

type Props = {};

const withAnimatronics = (animations: Function|Array<Object>|Object) => (BaseComponent: ComponentType<{}>) => {

  if (!IS_PRODUCTION) {
    if (!isReactComponent(BaseComponent)) {
      throw makeError(
        `The withAnimatronics() higher-order component must be used to wrap a`,
        `valid React component.`
      );
    }
  }

  class AnimatronicsComponent extends React.Component<Props> {
    render() {
      return (
        <Animatronics animations={ animations }>{ props =>
          <BaseComponent
            { ...this.props }
            { ...props }
          />
        }</Animatronics>
      );
    }
  }

  return hoistNonReactStatics(AnimatronicsComponent, BaseComponent);
}

export default withAnimatronics;

