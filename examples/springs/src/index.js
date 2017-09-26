import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

import { withAnimatronics, withRig } from '../../../src'

const Circle = ({ dimension, style, animatronicStyles }) => (
  <div
    style={{
      width: `${ dimension }px`,
      height: `${ dimension }px`,
      borderRadius: `${ dimension / 2 }px`,
      ...style,
      ...animatronicStyles,
    }}
  />
);

const BlueCircle = withRig('blueCircle')(Circle);
const RedCircle = withRig('redCircle')(Circle);
const PurpleCircle = withRig('purpleCircle')(Circle);

const App = ({
  runAnimation,
}) => (
  <div style={{
    width: '100%',
    height: '100%',
    display: 'flex',
  }}>
    <div style={{
      margin: '0 auto',
      width: '70%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <button
        onClick={ () => runAnimation() }
        style={{
          margin: '20px 0px',
          width: '200px',
        }}
      >
        Animate!
      </button>
      <BlueCircle
        dimension={ 80 }
        style={{
          backgroundColor: 'blue',
          margin: '20px 0px',
          position: 'relative',
        }}
      />
      <RedCircle
        dimension={ 80 }
        style={{
          backgroundColor: 'red',
          margin: '20px 0px',
          position: 'relative',
        }}
      />
      <PurpleCircle
        dimension={ 80 }
        style={{
          backgroundColor: 'purple',
          margin: '20px 0px',
          position: 'relative',
        }}
      />
    </div>
  </div>
);

const AnimatedApp = withAnimatronics(
  ({ blueCircle, redCircle, purpleCircle }) => {
    return [
      {
        stiffness: 170,
        damping: 26,
        start: {
          blueCircle: {
            left: '0px',
          },
        },
        end: {
          blueCircle: {
            left: '400px',
          },
        },
      },
      {
        stiffness: 100,
        damping: 10,
        start: {
          redCircle: {
            left: '0px',
          },
        },
        end: {
          redCircle: {
            left: '400px',
          },
        },
      },
      {
        stiffness: 200,
        damping: 5,
        start: {
          purpleCircle: {
            left: '0px',
          },
        },
        end: {
          purpleCircle: {
            left: '400px',
          },
        },
      }
    ];
  }
)( App );

ReactDOM.render(
  <AnimatedApp />,
  document.getElementById('app'),
);
