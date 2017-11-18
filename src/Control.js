// @flow
/**
 * @module Control
 */

import React from 'react'
import PropTypes from 'prop-types'

import type { Element } from 'react'

import ContextTypes from './internal/context-types'
import withControl from './withControl'

type Props = {
  children: Element<any>,
  mergeProps?: Function,
  name: string,
  useStringRefs?: boolean,
};

class Control extends React.Component<Props> {

  static contextTypes: Object = ContextTypes

  static defaultProps: Object = {
    useStringRefs: false,
  }

  render() {
    const { name, mergeProps, children, useStringRefs } = this.props;
    const enhance = withControl(name, { mergeProps, useStringRefs });
    class BaseComponent extends React.Component<{}> {
      render() {
        return React.cloneElement(children, this.props);
      }
    }
    const ControlledComponent = enhance(BaseComponent);
    return <ControlledComponent/>;
  }
}

export default Control;
