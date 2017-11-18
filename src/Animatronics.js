// @flow
/**
 * @module Animatronics
 */

import React from 'react'
import PropTypes from 'prop-types'

import type { Element } from 'react'

import withAnimatronics from './withAnimatronics'

type Props = {
  createAnimationSequences: Function,
  children: Element<any>,
  mergeProps?: Function,
};

class Animatronics extends React.Component<Props> {
  render() {
    const { createAnimationSequences, children, mergeProps } = this.props;
    const enhance = withAnimatronics(createAnimationSequences, { mergeProps });
    class BaseComponent extends React.Component<{}> {
      render() {
        return React.cloneElement(children, this.props);
      }
    }
    const AnimatronicsComponent = enhance(BaseComponent);
    return <AnimatronicsComponent/>;
  }
}

export default Animatronics;
