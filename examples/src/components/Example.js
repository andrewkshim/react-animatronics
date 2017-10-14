import React from 'react'

import Button from './Button'

class Example extends React.Component {

  constructor(props) {
    super(props);
    this._playAnimation = this._playAnimation.bind(this);
    this._rewindAnimation = this._rewindAnimation.bind(this);
    this.state = {
      didAnimate: false,
    };
  }

  _playAnimation() {
    const { playAnimation } = this.props;
    playAnimation(() => {
      this.setState({ didAnimate: true });
    });
  }

  _rewindAnimation() {
    const { rewindAnimation } = this.props;
    rewindAnimation(() => {
      this.setState({ didAnimate: false });
    });
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
            rewindAnimation: this._rewindAnimation,
          })) }
        </div>
        <div style={{
          height: '100%',
          width: '20%',
        }}>
          <Button
            onClick={ () => {
              if (didAnimate) {
                this._rewindAnimation();
              } else {
                this._playAnimation();
              }
            }}
            text={ didAnimate ? 'Rewind animation' : 'Play animation' }
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
