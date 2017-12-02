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
              top: `${ topA }px`,
              left: `${ leftA }px`,
            },
            to: {
              top: `${ topB }px`,
              left: `${ leftB }px`,
            },
          },
          {
            stiffness: 200,
            damping: 10,
            from: {
              transform: 'translateX(0px)',
            },
            to: {
              transform: 'translateX(100px)',
            },
          },
          {
            duration,
            from: {
              transform: 'translateY(0px)',
            },
            to: {
              transform: 'translateY(100px)',
            },
          },
          {
            duration: duration / 3,
            from: {
              transform: 'scale(1)',
            },
            to: {
              transform: 'scale(1.56)',
            },
          },
        ],
        circleB: {
          stiffness: 200,
          damping: 10,
          from: {
            top: `${ topB }pt`,
            left: `${ leftB }px`,
          },
          to: {
            top: `${ topC }px`,
            left: `${ leftC }px`,
          },
        },
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
