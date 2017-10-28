import React from 'react'
import PropTypes from 'prop-types'

import Circle from './internal/components/Circle'
import Example from './internal/components/Example'
import { COLOR_A, COLOR_B, COLOR_C } from './internal/styles'
import { withAnimatronics, withControl } from '../../../src'

const START_SCALE = 'scale(0.8)';
const END_SCALE = 'scale(1.3)';

const CircleA = withControl('circleA')(Circle);
const CircleB = withControl('circleB')(Circle);
const CircleC = withControl('circleC')(Circle);

const SpringsExample = ({ playAnimation }) => (
  <Example playAnimation={ playAnimation }>
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
          from: {
            transform: START_SCALE,
          },
          to: {
            transform: END_SCALE,
          },
        },
        circleB: {
          stiffness: 200,
          damping: 5,
          from: {
            transform: START_SCALE,
          },
          to: {
            transform: END_SCALE,
          },
        },
        circleC: {
          stiffness: 300,
          damping: 5,
          from: {
            transform: START_SCALE,
          },
          to: {
            transform: END_SCALE,
          },
        },
      },
    ];
  }
)( SpringsExample );
