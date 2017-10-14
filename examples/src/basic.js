import React from 'react'
import PropTypes from 'prop-types'

import Circle from './components/Circle'
import Example from './components/Example'
import { COLOR_A, COLOR_B, COLOR_C } from './styles'
import { withAnimatronics, withRig } from '../../src'

const CircleA = withRig('circleA')(Circle);
const CircleB = withRig('circleB')(Circle);
const CircleC = withRig('circleC')(Circle);

const BasicExample = ({ playAnimation, rewindAnimation }) => (
  <Example playAnimation={ playAnimation } rewindAnimation={ rewindAnimation }>
    <CircleA
      dimension={ 100 }
      style={{
        backgroundColor: COLOR_A,
        left: 'calc(60% - 50px)',
        top: '20%',
      }}
    />
    <CircleB
      dimension={ 100 }
      style={{
        backgroundColor: COLOR_B,
        left: 'calc(90% - 50px)',
        top: '60%',
      }}
    />
    <CircleC
      dimension={ 100 }
      style={{
        backgroundColor: COLOR_C,
        left: 'calc(30% - 50px)',
        top: '60%',
      }}
    />
  </Example>
);

export default withAnimatronics(
  ({ circleA, circleB, circleC }) => {
    const { offsetLeft: leftA, offsetTop: topA } = circleA;
    const { offsetLeft: leftB, offsetTop: topB } = circleB;
    const { offsetLeft: leftC, offsetTop: topC } = circleC;
    const duration = 500; // ms
    return [
      {
        circleA: {
          duration,
          start: {
              top: `${ topA }px`,
              left: `${ leftA }px`,
          },
          end: {
            top: `${ topB }px`,
            left: `${ leftB }px`,
          },
        },
        circleB: {
          duration,
          start: {
              top: `${ topB }px`,
              left: `${ leftB }px`,
          },
          end: {
            top: `${ topC }px`,
            left: `${ leftC }px`,
          },
        },
        circleC: {
          duration,
          start: {
              top: `${ topC }px`,
              left: `${ leftC }px`,
          },
          end: {
            top: `${ topA }px`,
            left: `${ leftA }px`,
          },
        },
      },
    ];
  }
)( BasicExample );
