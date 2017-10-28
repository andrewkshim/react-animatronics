import React from 'react'
import chroma from 'chroma-js'

import { withAnimatronics, withControl, BezierEasing } from '../../../../src'

// TODO: reorganize styles

const SERIF_FONT = "'Bitter', serif";

const PRIMARY_COLOR = '#709DCC';
const SECONDARY_COLOR = '#FF8B82';
const ACCENT_COLOR = '#FFED82';

const CLICK_WAVE_ALPHA = 0.6;
const CLICK_WAVE_COLOR = PRIMARY_COLOR;
const CLICK_WAVE_DIMENSION = 600; // px
const CLICK_WAVE_DURATION = 750; // ms

const ClickWave = withControl('wave')(
  ({ animatronicStyles, clickX, clickY }) => (
    <div
      style={{
        position: 'absolute',
        width: `${ CLICK_WAVE_DIMENSION }px`,
        height: `${ CLICK_WAVE_DIMENSION }px`,
        borderRadius: `${ CLICK_WAVE_DIMENSION / 2 }px`,
        top: `${ clickY - CLICK_WAVE_DIMENSION / 2 }px`,
        left: `${ clickX - CLICK_WAVE_DIMENSION / 2 }px`,
        transformOrigin: 'center',
        backgroundColor: `rgba(${ chroma(CLICK_WAVE_COLOR).alpha(CLICK_WAVE_ALPHA).rgba().join(',') })`,
        ...animatronicStyles,
      }}
    />
  )
);

class ClickWaveContainer extends React.Component {

  componentDidMount() {
    const { playAnimation, clearClick } = this.props;
    playAnimation('click', () => clearClick());
  }

  render() {
    const { clickX, clickY } = this.props;
    return (
      <ClickWave
        clickX={ clickX }
        clickY={ clickY }
      />
    );
  }

}

const AnimatedClickWave = withAnimatronics(() => ({
  click: [
    {
      wave: {
        duration: CLICK_WAVE_DURATION,
        from: {
          transform: 'scale(0)',
          opacity: 1,
        },
        to: {
          opacity: 0,
          transform: 'scale(1)',
        },
      },
    },
  ],
}))( ClickWaveContainer );

class Button extends React.Component {

  constructor(props) {
    super(props);

    this._clearClick = this._clearClick.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onRef = this._onRef.bind(this);

    this.state = {
      clickX: null,
      clickY: null,
    };
  }

  _clearClick() {
    this.setState({
      clickX: null,
      clickY: null,
    });
  }

  _onClick(ev) {
    const { left, top } = this._ref.getBoundingClientRect();
    this.setState({
      clickX: ev.clientX - left,
      clickY: ev.clientY - top,
    });
  }

  _onRef(ref) {
    this._ref = ref;
  }

  render() {
    const { text, style, onClick, ...props } = this.props;
    const { clickX, clickY } = this.state;
    return (
      <div
        ref={ this._onRef }
        onClick={ev => {
          this._onClick(ev);
          onClick(ev);
        }}
        style={{
          backgroundColor: PRIMARY_COLOR,
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontFamily: SERIF_FONT,
          fontSize: '16px',
          outline: 'none',
          overflow: 'hidden',
          padding: '12px 36px',
          position: 'relative',
          textTransform: 'uppercase',
          boxShadow: `
            2px 3px 6px 0px rgba(0, 0, 0, 0.11),
            2px 3px 8px 0px rgba(0, 0, 0, 0.16)
          `,
          ...style,
        }}
        { ...props }
      >
        { clickX != null && clickY != null &&
          <AnimatedClickWave
            clickX={ clickX }
            clickY={ clickY }
            clearClick={ this._clearClick }
          />
        }
        { text }
      </div>
    );
  }

}

export default Button;
