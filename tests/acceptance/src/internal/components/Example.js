import React from 'react'

import Button from './Button'

class Example extends React.Component {

  constructor(props) {
    super(props);
    this._playAnimation = this._playAnimation.bind(this);
    this.state = {
      didAnimate: false,
    };
  }

  _playAnimation() {
    const { playAnimation } = this.props;
    const { didAnimate } = this.state;
    if (!didAnimate) {
      playAnimation(() => {
        this.setState({ didAnimate: true });
      });
    }
  }

  render() {
    const { children } = this.props;
    const { didAnimate } = this.state;
    return (
      <div style={{
        position: 'relative',
        height: '100%',
        width: '100%',
      }}>
        <div style={{
          position: 'relative',
          height: '100%',
          width: '80%',
        }}>
          { React.Children.map(children, c => React.cloneElement(c, {
            didAnimate,
            playAnimation: this._playAnimation,
          })) }
        </div>
        <div style={{
          height: '100%',
          width: '20%',
        }}>
          <Button
            onClick={ () => {
              this._playAnimation();
            }}
            text={'Play animation' }
            style={{
              position: 'absolute',
              right: '0px',
              top: '0px',
            }}
          />
        </div>
      </div>
    );
  }

}

export default Example;
