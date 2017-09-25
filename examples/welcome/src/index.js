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

class TopLockHalf extends React.Component {
  render() {
    return (
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
  }
}

class BottomLockHalf extends React.Component {
  render() {
    return (
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
  }
}

class Entrance extends React.Component {
  render() {
    const { runAnimation } = this.props;
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: 1,
        zIndex: 0,
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
  }
}

class Welcome extends React.Component {
  render() {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
      }}>
        <div>WELCOME</div>
      </div>
    );
  }
}

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
                  if (stageIndex === 2) {
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
        duration: 500,
        start: {
          topLockHalfRef: {
            top: '-50px',
            height: '50px',
          },
          bottomLockHalfRef: {
            bottom: '-50px',
            height: '50px',
          }
        },
        end: {
          topLockHalfRef: {
            height: '150px',
            top: '-1px',
          },
          bottomLockHalfRef: {
            height: '150px',
            bottom: '-1px',
          }
        },
      },
      {
        duration: 250,
      },
      {
        duration: 600,
        easingFn: createBezierEasingFn(0,.98,.01,.97),
        start: {
          topLockHalfRef: {
            transform: 'rotateZ(0deg)',
          },
          bottomLockHalfRef: {
            transform: 'rotateZ(0deg)',
          }
        },
        end: {
          topLockHalfRef: {
            transform: 'rotateZ(1350deg)',
          },
          bottomLockHalfRef: {
            transform: 'rotateZ(1350deg)',
          }
        },
      },
      {
        duration: 250,
        start: {
          entranceRef: {
            opacity: 1,
          },
        },
        end: {
          entranceRef: {
            opacity: 0,
          },
        },
      },
      {
        duration: 350,
        start: {
          topLockHalfRef: {
            transform: 'rotateZ(1350deg) translateY(0px)',
          },
          bottomLockHalfRef: {
            transform: 'rotateZ(1350deg) translateY(0px)',
          }
        },
        end: {
          topLockHalfRef: {
            transform: 'rotateZ(1350deg) translateY(-250px)',
          },
          bottomLockHalfRef: {
            transform: 'rotateZ(1350deg) translateY(250px)',
          }
        },
      },
    ];
  }
)( App );

ReactDOM.render(
  <AnimatedApp />,
  document.getElementById('app'),
);
