import React from 'react'
import PropTypes from 'prop-types'

import Circle from './internal/components/Circle'
import Example from './internal/components/Example'
import { COLOR_A, COLOR_B, COLOR_C } from './internal/styles'
import { withAnimatronics, withControl } from '../../../src'

const CircleA = withControl('circleA')(Circle);
const CircleB = withControl('circleB')(Circle);
const CircleC = withControl('circleC')(Circle);

const ExperimentalExample = props => (
  <Example { ...props }>
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
    const duration = 2000; // ms
    return [
      {
        circleA: [
          {
            duration,
            from: {
              transform: 'scale(1.0)',
            },
            to: {
              transform: 'scale(2.0)',
            },
          },
          {
            stiffness: 50,
            damping: 5,
            from: {
              transform: 'translateX(0px)',
            },
            to: {
              transform: 'translateX(calc((100% - 200px) * -1))',
            },
          },
          {
            duration,
            from: {
              transform: 'translateY(0px)',
            },
            to: {
              transform: 'translateY(10rem)',
            },
          },
        ],
        circleB: [
          {
            duration,
            from: {
              transform: 'translateY(0px)',
            },
            to: {
              transform: 'translateY(-10rem)',
            },
          },
          {
            duration,
            from: {
              left: 'calc(90% - 50px)',
            },
            to: {
              left: 'calc(90% - 450px)',
            },
          }
        ],
        circleC: {
          duration,
          from: {
              top: `${ topC }px`,
              left: `${ leftC }px`,
          },
          to: {
            top: `${ topA }px`,
            left: `${ leftA }px`,
          },
        },
      },
    ];
  }
)( ExperimentalExample );
