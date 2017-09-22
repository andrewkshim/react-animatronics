import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

import { withAnimatronics, withRig } from '../../../src'

class Circle extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { dimension, style } = this.props;
    return (
      <div
        style={{
          position: 'absolute',
          width: `${ dimension }px`,
          height: `${ dimension }px`,
          borderRadius: `${ dimension / 2 }px`,
          ...style,
        }}
      />
    );
  }
}

const BlueCircle = withRig(Circle, 'blueCircle');
const RedCircle = withRig(Circle, 'redCircle');
const PurpleCircle = withRig(Circle, 'purpleCircle');

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
  App,
  ({ blueCircle, redCircle }) => {
    const { offsetLeft, offsetTop } = redCircle;
    return ([
      {
        duration: 500,
        start: {
          blueCircle: {
            top: 40,
            left: 0,
          },
        },
        end: {
          blueCircle: {
            top: offsetTop + 40,
            left: offsetLeft + 40,
          },
        },
      },
      {
        duration: 500,
        start: {
          purpleCircle: {
            transform: 'scale(0)',
          },
        },
        end: {
          purpleCircle: {
            transform: 'scale(1)',
          },
        },
      },
      {
        duration: 0,
        start: {
          blueCircle: {
            transform: 'scale(1)',
          },
          redCircle: {
            transform: 'scale(1)',
          },
        },
        end: {
          blueCircle: {
            transform: 'scale(0)',
          },
          redCircle: {
            transform: 'scale(0)',
          },
        },
      },
      {
        duration: 250,
      },
      {
        duration: 500,
        start: {
          purpleCircle: {
            top: offsetTop,
            left: offsetLeft,
          },
        },
        end: {
          purpleCircle: {
            top: 100,
            left: 800,
          },
        },
      },
    ]);
  }
);

ReactDOM.render(
  <AnimatedApp />,
  document.getElementById('app'),
);
