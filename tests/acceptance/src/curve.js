import React from 'react'
import PropTypes from 'prop-types'

import Circle from './internal/components/Circle'
import Example from './internal/components/Example'
import { COLOR_A, COLOR_B, COLOR_C } from './internal/styles'
import { withAnimatronics, withControl } from '../../../src'

const ControlledCircle = withControl('myCircle')(Circle);

const BasicExample = ({ playAnimation }) => (
  <Example playAnimation={ playAnimation }>
    <ControlledCircle
      dimension={ 100 }
      style={{
        backgroundColor: COLOR_A,
        left: '0px',
        top: '0px',
      }}
    />
  </Example>
);

export default withAnimatronics(
  () => {
    return [
      {
        myCircle: [
          {
            duration: 500,
            from: {
              top: `${ 0 }px`,
            },
            to: {
              top: `${ 100 }px`,
            },
          },
          {
            duration: 750,
            from: {
              left: `${ 0 }px`,
            },
            to: {
              left: `${ 200 }px`,
            },
          }
        ],
      },
    ];
  }
)( BasicExample );
