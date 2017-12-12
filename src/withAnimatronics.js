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
  getDisplayName,
  isStatelessComponent,
  isReactComponent,
  makeError,
} from './internal/utils'

type Props = {
  innerRef: Function,
};

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
      const { innerRef, ...props } = this.props;
      return (
        <Animatronics animations={ animations }>{ animatronicProps =>
          <BaseComponent
            ref={ innerRef }
            { ...props }
            { ...animatronicProps }
          />
        }</Animatronics>
      );
    }
  }
  AnimatronicsComponent.displayName = `withAnimatronics(${ getDisplayName(BaseComponent) })`;

  return hoistNonReactStatics(AnimatronicsComponent, BaseComponent);
}

export default withAnimatronics;

