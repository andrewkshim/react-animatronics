import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

import {
  withAnimatronics,
  withRig,
  createBezierEasingFn,
} from '../../../src'

const Layout = ({ children }) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
    }}>
      <div style={{
        margin: '50px auto',
        width: '500px',
        height: '300px',
        position: 'relative',
        border: '1px solid red',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        { children }
      </div>
    </div>
  );
}

const TopLockHalf = ({ animatronicStyles }) => (
  <div
    id='top-lock-half'
    style={{
      backgroundColor: 'white',
      borderBottom: '1px solid red',
      display: 'flex',
      height: '50px',
      justifyContent: 'center',
      position: 'absolute',
      top: '-50px',
      width: '200%',
      left: '-50%',
      transformOrigin: 'bottom center',
      zIndex: 10,
      ...animatronicStyles,
    }}
  >
    <div style={{
      height: '50px',
      width: '100px',
      borderTopLeftRadius: '100px',
      borderTopRightRadius: '100px',
      backgroundColor: 'red',
      position: 'absolute',
      bottom: '0px',
    }}/>
    <div style={{
      height: '25px',
      width: '50px',
      backgroundColor: 'yellow',
      bottom: '0px',
      position: 'absolute',
      borderTopLeftRadius: '50px',
      borderTopRightRadius: '50px',
    }}/>
  </div>
);

const BottomLockHalf = ({ animatronicStyles }) => (
  <div
    id='bottom-lock-half'
    style={{
      backgroundColor: 'white',
      borderTop: '1px solid red',
      display: 'flex',
      height: '50px',
      justifyContent: 'center',
      position: 'absolute',
      bottom: '-50px',
      width: '200%',
      left: '-50%',
      transformOrigin: 'top center',
      zIndex: 10,
      ...animatronicStyles,
    }}
  >
    <div style={{
      height: '50px',
      width: '100px',
      borderBottomLeftRadius: '100px',
      borderBottomRightRadius: '100px',
      backgroundColor: 'red',
      position: 'absolute',
      top: '0px',
    }}/>
    <div style={{
      height: '25px',
      width: '50px',
      backgroundColor: 'orange',
      top: '0px',
      position: 'absolute',
      borderBottomLeftRadius: '50px',
      borderBottomRightRadius: '50px',
    }}/>
  </div>
);

const Entrance = ({ runAnimation, animatronicStyles }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    opacity: 1,
    zIndex: 0,
    ...animatronicStyles,
  }}>
    <button
      onClick={ runAnimation }
      style={{
        width: '50%',
        height: '30px',
        margin: '0 auto',
      }}
    >
      Enter
    </button>
  </div>
);

const Welcome = ({ animatronicStyles }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
    ...animatronicStyles,
  }}>
    <div>WELCOME</div>
  </div>
);

const RiggedTopLockHalf = withRig('topLockHalfRef')(TopLockHalf);
const RiggedBottomLockHalf = withRig('bottomLockHalfRef')(BottomLockHalf);
const RiggedEntrance = withRig('entranceRef')(Entrance);
const RiggedWelcome = withRig('welcomeRef')(Welcome);

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      didEnter: false,
    };
  }

  render() {
    const { runAnimation } = this.props;
    const { didEnter } = this.state;
    return (
      <Layout>
        <RiggedTopLockHalf/>
        { !didEnter
          ? <RiggedEntrance runAnimation={ () => {
              runAnimation(
                () => {},
                stageIndex => {
                  if (stageIndex === 1) {
                    this.setState({ didEnter: true });
                  }
                }
              );
            } }/>
          : <RiggedWelcome/>
        }
        <RiggedBottomLockHalf/>
      </Layout>
    );
  }

}

const AnimatedApp = withAnimatronics(
  ({ topLockHalfRef, bottomLockHalfRef }) => {
    return [
      {
        topLockHalfRef: {
          duration: 500,
          start: {
            top: '-50px',
            height: '50px',
          },
          end: {
            height: '150px',
            top: '-1px',
          },
        },
        bottomLockHalfRef: {
          duration: 500,
          start: {
            bottom: '-50px',
            height: '50px',
          },
          end: {
            height: '150px',
            bottom: '-1px',
          },
        },
      },
      {
        topLockHalfRef: {
          duration: 600,
          easingFn: createBezierEasingFn(0,.98,.01,.97),
          start: {
            transform: 'rotateZ(0deg)',
          },
          end: {
            transform: 'rotateZ(1350deg)',
          },
        },
        bottomLockHalfRef: {
          duration: 600,
          easingFn: createBezierEasingFn(0,.98,.01,.97),
          start: {
            transform: 'rotateZ(0deg)',
          },
          end: {
            transform: 'rotateZ(1350deg)',
          },
        },
      },
      {
        topLockHalfRef: {
          duration: 350,
          start: {
            transform: 'rotateZ(1350deg) translateY(0px)',
          },
          end: {
            transform: 'rotateZ(1350deg) translateY(-250px)',
          },
        },
        bottomLockHalfRef: {
          duration: 350,
          start: {
            transform: 'rotateZ(1350deg) translateY(0px)',
          },
          end: {
            transform: 'rotateZ(1350deg) translateY(250px)',
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
