import React from 'react'
import PropTypes from 'prop-types'

import Circle from './internal/components/Circle'
import Example from './internal/components/Example'
import { COLOR_A, COLOR_B, COLOR_C } from './internal/styles'
import { withAnimatronics, withRig } from '../../src'

const START_SCALE = 'scale(0.8)';
const END_SCALE = 'scale(1.3)';

const CircleA = withRig('circleA')(Circle);
const CircleB = withRig('circleB')(Circle);
const CircleC = withRig('circleC')(Circle);

const SpringsExample = ({ playAnimation, rewindAnimation }) => (
  <Example playAnimation={ playAnimation } rewindAnimation={ rewindAnimation }>
    <CircleA
      dimension={ 100 }
      style={{
        backgroundColor: COLOR_A,
        top: 'calc(40% - 50px)',
        left: 'calc(20% - 50px)',
        transform: START_SCALE,
      }}
    />
    <CircleB
      dimension={ 100 }
      style={{
        backgroundColor: COLOR_B,
        top: 'calc(40% - 50px)',
        left: 'calc(50% - 50px)',
        transform: START_SCALE,
      }}
    />
    <CircleC
      dimension={ 100 }
      style={{
        backgroundColor: COLOR_C,
        top: 'calc(40% - 50px)',
        left: 'calc(80% - 50px)',
        transform: START_SCALE,
      }}
    />
  </Example>
);

export default withAnimatronics(
  ({ circleA, circleB, circleC }) => {
    return [
      {
        circleA: {
          stiffness: 100,
          damping: 5,
          start: {
            transform: START_SCALE,
          },
          end: {
            transform: END_SCALE,
          },
        },
        circleB: {
          stiffness: 200,
          damping: 5,
          start: {
            transform: START_SCALE,
          },
          end: {
            transform: END_SCALE,
          },
        },
        circleC: {
          stiffness: 300,
          damping: 5,
          start: {
            transform: START_SCALE,
          },
          end: {
            transform: END_SCALE,
          },
        },
      },
    ];
  }
)( SpringsExample );
