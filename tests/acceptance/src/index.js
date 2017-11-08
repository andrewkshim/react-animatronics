import Debug from 'debug'
import React from 'react'
import ReactDOM from 'react-dom'
import Transition from 'react-transition-group/Transition'
import chroma from 'chroma-js'

import BasicExample from './basic'
import SpringsExample from './springs'
import InputExample from './input'
import CurveExample from './curve'

import {
  PRIMARY_COLOR,
  ACCENT_COLOR,
  GREY,
  SERIF_FONT,
  LRG_FONT_SIZE,
  MED_FONT_SIZE,
  SML_FONT_SIZE,
} from './internal/styles'

import { withControl, withAnimatronics, BezierEasing } from '../../../src'

const BASIC = 'basic';
const SPRINGS = 'springs';
const INPUT = 'input';
const CURVE = 'curve';

const debug = Debug('animatronics:examples');

const EXAMPLES = {
  [ BASIC ]: BasicExample,
  [ SPRINGS ]: SpringsExample,
  [ INPUT ]: InputExample,
  [ CURVE ]: CurveExample,
};

// component styles
const CLICK_WAVE_ALPHA = 1.0;
const CLICK_WAVE_COLOR = ACCENT_COLOR;
const CLICK_WAVE_DIMENSION = 500; // px
const CLICK_WAVE_DURATION = 750; // ms

const HEADER_FONT_SIZE = '36px';

const HIGHLIGHT_COLOR = ACCENT_COLOR;
const HIGHLIGHT_DURATION = 250; // ms
const HIGHLIGHT_SELECTED_OPACITY = 0.6;
const HIGHLIGHT_LIGHT_OPACITY = 0.2;

const ITEM_HEIGHT = 54; // px
const ITEM_PADDING = ITEM_HEIGHT / 3; // px

const capitalize = str => `${ str.charAt(0).toUpperCase() }${ str.slice(1) }`

const Logo = () => (
  <a
    style={{
      width: '100%',
      fontFamily: SERIF_FONT,
      color: PRIMARY_COLOR,
      fontSize: LRG_FONT_SIZE,
      padding: '18px 0px 36px 0px',
      pointer: 'cursor',
      textDecoration: 'none',
    }}
    href="https://github.com/andrewkshim/react-animatronics"
    target="_blank"
  >
    react-animatronics
  </a>
)

const ClickWave = withControl('clickWave')(({ animatronicStyles, clickX, clickY }) => (
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
));

const ExampleItemHighlight = ({ isSelected, animatronicStyles }) => (
  <div style={{
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: '0px',
    bottom: '0px',
  }}>
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        left: '0px',
        bottom: '0px',
        backgroundColor: HIGHLIGHT_COLOR,
        pointerEvents: 'none',
        opacity: (animatronicStyles.opacity || 0),
      }}
    />
  </div>
);

class ExampleItem extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      shouldDisplayHighlight: props.isSelected,
    };

    this._onRef = this._onRef.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onMouseOut = this._onMouseOut.bind(this);
    this._onMouseOver = this._onMouseOver.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { isSelected: prevSelected } = this.props;
    const { isSelected: nextSelected, playAnimation } = nextProps;
    if (!prevSelected && nextSelected) {
      playAnimation('hover');
    } else if (prevSelected && !nextSelected) {
      playAnimation('unselect');
    }
  }

  componentDidMount() {
    const {
      isSelected,
      playAnimation,
      transitionState,
      clickX,
      clickY,
    } = this.props;

    if (isSelected) {
      if (clickX != null && clickY != null) {
        playAnimation('click');
      } else {
        playAnimation('selected');
      }
    } else if (transitionState === 'entered') {
      playAnimation('unselect');
    }
  }

  _onRef(ref) {
    this._ref = ref;
  }

  _onClick(ev) {
    const { isSelected, onClick } = this.props;
    if (isSelected) return;
    const { left, top } = this._ref.getBoundingClientRect();
    onClick(ev.clientX - left, ev.clientY - top);
  }

  _onMouseOver() {
    const { isSelected, playAnimation } = this.props;
    if (!isSelected) {
      playAnimation('hover');
    }
  }

  _onMouseOut() {
    const { isSelected, playAnimation } = this.props;
    if (!isSelected) {
      playAnimation('unhover');
    }
  }

  render() {
    const { example, children, isSelected, clickX, clickY } = this.props;
    return (
      <div
        style={{
          height: `${ ITEM_HEIGHT }px`,
          width: '100%',
          borderBottom: `1px solid ${ GREY }`,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
        ref={ this._onRef }
        onClick={ this._onClick }
        onMouseOver={ this._onMouseOver }
        onMouseOut={ this._onMouseOut }
      >
        { children }
        { isSelected && clickX && clickY &&
          <ClickWave
            clickX={ clickX }
            clickY={ clickY }
          />
        }
      </div>
    );
  }

}

const createAnimatedHighlight = example => withControl(`${ example }Highlight`)(ExampleItemHighlight);

const createAnimatedItem = example => withControl(example)(withAnimatronics(() => ({
  selected: [
    {
      [`${ example }Highlight`]: {
        duration: 0,
        from: {
          opacity: HIGHLIGHT_SELECTED_OPACITY,
        },
        to: {
          opacity: HIGHLIGHT_SELECTED_OPACITY,
        },
      }
    },
  ],
  hover: [
    {
      [`${ example }Highlight`]: {
        duration: HIGHLIGHT_DURATION,
        from: {
          opacity: 0,
        },
        to: {
          opacity: 0.2,
        },
      }
    },
  ],
  unhover: [
    {
      [`${ example }Highlight`]: {
        duration: HIGHLIGHT_DURATION,
        from: {
          opacity: 0.2,
        },
        to: {
          opacity: 0,
        },
      }
    },
  ],
  unselect: [
    {
      [`${ example }Highlight`]: {
        duration: HIGHLIGHT_DURATION,
        from: {
          opacity: HIGHLIGHT_SELECTED_OPACITY,
        },
        to: {
          opacity: 0,
        },
      }
    },
  ],
  click: [
    {
      [`${ example }Highlight`]: {
        duration: CLICK_WAVE_DURATION,
        from: {
          opacity: HIGHLIGHT_LIGHT_OPACITY,
        },
        to: {
          opacity: HIGHLIGHT_SELECTED_OPACITY,
        },
      },
      clickWave: {
        duration: CLICK_WAVE_DURATION,
        easing: BezierEasing(0.4, 0.0, 1, 1),
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
}) )( ExampleItem ));

class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      selectedExample: BASIC,
      clickX: null,
      clickY: null,
    };

    this.onItemClick = this.onItemClick.bind(this);
  }

  onItemClick(clickX, clickY, selectedExample) {
    debug('selected example "%s"', selectedExample);
    this.setState({
      selectedExample,
      clickX,
      clickY,
    });
  }

  render() {
    const { selectedExample, clickX, clickY } = this.state;
    const Example = EXAMPLES[selectedExample];
    return (
      <div style={{
        width: '100%',
        height: '100%',
        minHeight: '600px',
        minWidth: '800px',
        display: 'flex',
        flexDirection: 'row',
      }}>
        <div style={{
          minWidth: '272px',
          height: '100%',
          backgroundColor: 'white',
          boxShadow: `
            0 0 11px 0 rgba(0,0,0,.11),
            0 1px 15px 0 rgba(0,0,0,.16)
          `,
          display: 'flex',
          flexDirection: 'column',
          padding: '0 18px 0 24px',
        }}>
          <Logo/>
          <div style={{
            fontSize: SML_FONT_SIZE,
            fontFamily: SERIF_FONT,
            textTransform: 'uppercase',
            color: PRIMARY_COLOR,
            borderBottom: `1px solid ${ PRIMARY_COLOR }`,
            paddingBottom: '6px',
          }}>Examples</div>
          <div>{
            Object.keys(EXAMPLES).map(example => {
              const Highlight = createAnimatedHighlight(example);
              const Item = createAnimatedItem(example);
              const isSelected = selectedExample === example;
              return (
                <Transition
                  key={ example }
                  timeout={ HIGHLIGHT_DURATION }
                  in={ isSelected }
                >{ state => (
                  <Item
                    isSelected={ isSelected }
                    onClick={(clickX, clickY) => this.onItemClick(clickX, clickY, example) }
                    clickX={ clickX }
                    clickY={ clickY }
                    transitionState={ state }
                  >
                    <Highlight isSelected={ isSelected }/>
                    <div style={{
                      position: 'absolute',
                      height: '100%',
                      width: '100%',
                      left: 0,
                      top: 0,
                      padding: `${ ITEM_PADDING }px`,
                      fontFamily: SERIF_FONT,
                      fontSize: MED_FONT_SIZE,
                    }}>
                      { example }
                    </div>
                  </Item>
                ) }</Transition>
              );
            })
          }</div>
        </div>
        <div style={{
          flex: 1,
          margin: '18px 36px',
        }}>
          <div style={{
            width: '100%',
            height: '100%',
          }}>
            <h1
              style={{
                fontFamily: SERIF_FONT,
                fontSize: HEADER_FONT_SIZE,
                margin: 0,
                height: '54px',
                lineHeight: '1.5',
              }}
            >
              { `${ capitalize(selectedExample) } Example` }
            </h1>
            <div style={{
              margin: '18px',
              padding: '18px',
              overflow: 'hidden',
              backgroundColor: 'white',
              boxShadow: `
                2px 3px 6px 0px rgba(0, 0, 0, 0.11),
                2px 3px 8px 0px rgba(0, 0, 0, 0.16)
              `,
              height: 'calc(100% - 54px - 36px)',
            }}>
              <Example/>
            </div>
          </div>
        </div>
      </div>
    );
  }

}

const AnimatedApp = withAnimatronics(() => [])(App);

ReactDOM.render(
  <AnimatedApp/>,
  document.getElementById('app'),
);
