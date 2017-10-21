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
};

class Animatronics extends React.Component<Props> {
  render() {
    const { createAnimationSequences, children } = this.props;
    const enhance = withAnimatronics(createAnimationSequences);
    class BaseComponent extends React.Component<{}> {
      render() {
        const { ...props } = this.props;
        return React.cloneElement(children, props);
      }
    }
    const AnimatronicsComponent = enhance(BaseComponent);
    return <AnimatronicsComponent/>;
  }
}

export default Animatronics;
