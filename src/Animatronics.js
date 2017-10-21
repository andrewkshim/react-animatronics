/**
 * @module Animatronics
 */

import React from 'react'
import PropTypes from 'prop-types'

import withAnimatronics from './withAnimatronics'

class Animatronics extends React.Component {
  render() {
    const { createAnimationSequences, children } = this.props;
    const enhance = withAnimatronics(createAnimationSequences);
    class BaseComponent extends React.Component {
      render() {
        const { children, ...props } = this.props;
        return React.cloneElement(children, props);
      }
    }
    const AnimatronicsComponent = enhance(BaseComponent);
    return <AnimatronicsComponent children={ children }/>;
  }
}

Animatronics.propTypes = {
  createAnimationSequences: PropTypes.func.isRequired,
};

export default Animatronics;
