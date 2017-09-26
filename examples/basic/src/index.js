import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

import { withAnimatronics, withRig } from '../../../src'

class Circle extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { dimension, style, animatronicStyles } = this.props;
    return (
      <div
        style={{
          position: 'absolute',
          width: `${ dimension }px`,
          height: `${ dimension }px`,
          borderRadius: `${ dimension / 2 }px`,
          ...style,
          ...animatronicStyles,
        }}
      />
    );
  }
}

const BlueCircle = withRig('blueCircle')(Circle);
const RedCircle = withRig('redCircle')(Circle);
const PurpleCircle = withRig('purpleCircle')(Circle);

const App = ({
  runAnimation,
}) => (
  <div style={{
    width: '100vw',
    height: '100vh',
    display: 'flex',
  }}>
    <div style={{
      margin: '0 auto',
      width: '70vw',
      position: 'relative',
    }}>
      <button onClick={ runAnimation }>Animate!</button>
      <BlueCircle
        dimension={ 40 }
        style={{
          backgroundColor: 'blue',
          left: '0px',
          top: '40px',
        }}
      />
      <RedCircle
        dimension={ 120 }
        style={{
          backgroundColor: 'red',
          left: '200px',
          top: '0px',
        }}
      />
      <PurpleCircle
        dimension={ 120 }
        style={{
          backgroundColor: 'purple',
          left: '200px',
          top: '0px',
          transform: 'scale(0)',
        }}
      />
    </div>
  </div>
);

const AnimatedApp = withAnimatronics(
  ({ blueCircle, redCircle, purpleCircle }) => {
    const { offsetLeft, offsetTop } = redCircle;
    return [
      {
        blueCircle: {
          duration: 500,
          start: {
              top: '40px',
              left: '0px',
          },
          end: {
            top: `${offsetTop + 40}px`,
            left: `${offsetLeft + 40}px`,
          },
        },
      },
      {
        purpleCircle: {
          duration: 500,
          start: {
            transform: 'scale(0)',
          },
          end: {
            transform: 'scale(1)',
          },
        },
      },
      {
        blueCircle: {
          duration: 0,
          start: {
            transform: 'scale(1)',
          },
          end: {
            transform: 'scale(0)',
          },
        },
        redCircle: {
          duration: 0,
          start: {
            transform: 'scale(1)',
          },
          end: {
            transform: 'scale(0)',
          },
        },
      },
      {
        purpleCircle: {
          duration: 350,
          start: {
            top: `${offsetTop}px`,
            left: `${offsetLeft}px`,
          },
          end: {
            top: '100px',
            left: '800px',
          },
        },
      },
    ];
  }
)( App );

ReactDOM.render(
  <AnimatedApp />,
  document.getElementById('app'),
);
