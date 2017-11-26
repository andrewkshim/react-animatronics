import React from 'react'
import ReactDOM from 'react-dom'

import Recorder from './internal/recorder'

const PANEL_ELEMENT_ID = 'react-animatronics-debug-panel';
const HEADER_TEXT = 'react-animatronics debug panel';

const PANEL_POSITION_BOTTOM = 'PANEL_POSITION_BOTTOM';
const PANEL_POSITION_WINDOW = 'PANEL_POSITION_WINDOW';
const DEFAULT_PANEL_POSITION = PANEL_POSITION_BOTTOM;

const SEPARATE_WINDOW_RECT = `
  width=800,
  height=600,
  left=200,
  top=200
`;

const PRIMARY_COLOR = '#709DCC';
const PANEL_HEIGHT = '240px';

const NAME_COLUMN_WIDTH = '200px';
const TOTAL_COLUMN_WIDTH = '140px';
const CURRENT_COLUMN_WIDTH = '140px';
const CONTROLS_COLUMN_WIDTH = '240px';

const TABLE_WIDTH = '720px';
const ROW_LINE_HEIGHT = '26px';

const PANEL_ELEMENT_STYLES_BOTTOM = {
  position: 'fixed',
  bottom: '0px',
  left: '0px',
}

const PANEL_ELEMENT_STYLES_WINDOW = {
  width: '100vw',
  height: '100vh',
}

const PANEL_ELEMENT_STYLES = {
  [PANEL_POSITION_BOTTOM]: PANEL_ELEMENT_STYLES_BOTTOM,
  [PANEL_POSITION_WINDOW]: PANEL_ELEMENT_STYLES_WINDOW,
}

export const getNumFrames = recording => Math.max(
  ...Object.values(recording).map(frames => frames.length)
);

export const getFrameElapsedTime = (recording, frameIndex) => Math.max(
  ...Object.values(recording)
    .map(frames => frames[frameIndex])
    .filter(frame => !!frame)
    .map(frame => frame.elapsedTime)
);

const PanelPositionButton = ({ children, isSelected, onClick }) => (
  <div
    style={{
      boxSizing: 'border-box',
      marginRight: '6px',
      padding: '2px 8px',
      border: isSelected ? `1px solid ${ PRIMARY_COLOR }` : '1px solid black',
      color: isSelected ? 'white' : 'black',
      backgroundColor: isSelected ? PRIMARY_COLOR : 'white',
      cursor: isSelected ? 'auto' : 'pointer',
    }}
    onClick={ onClick }
  >
    { children }
  </div>
);

const PanelHeader = ({ onPositionButtonClick, panelPosition }) => (
  <div style={{
    boxSizing: 'border-box',
    marginBottom: '18px',
    display: 'flex',
  }}>
    <div style={{
      boxSizing: 'border-box',
      flex: '1',
      fontSize: '18px',
      fontWeight: 'bold',
    }}>
      { HEADER_TEXT }
    </div>
    <div style={{
      boxSizing: 'border-box',
      display: 'flex',
    }}>
      <div style={{
        boxSizing: 'border-box',
        marginRight: '6px',
        padding: '2px 0',
      }}>
        Panel position:
      </div>
      <div style={{
        boxSizing: 'border-box',
        display: 'flex',
      }}>
        <PanelPositionButton
          isSelected={ panelPosition === PANEL_POSITION_BOTTOM }
          onClick={ev => {
            onPositionButtonClick(PANEL_POSITION_BOTTOM);
          }}
        >
          BOTTOM
        </PanelPositionButton>
        <PanelPositionButton
          isSelected={ panelPosition === PANEL_POSITION_WINDOW }
          onClick={ev => {
            onPositionButtonClick(PANEL_POSITION_WINDOW);
          }}
        >
          WINDOW
        </PanelPositionButton>
      </div>
    </div>
  </div>
);

const AnimationHeader = () => (
  <div style={{
    borderBottom: '1px solid black',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
  }}>
    <div style={{
      boxSizing: 'border-box',
      paddingBottom: '6px',
      width: NAME_COLUMN_WIDTH,
    }}>
      Animation Name
    </div>
    <div style={{
      boxSizing: 'border-box',
      width: TOTAL_COLUMN_WIDTH,
      textAlign: 'right',
      paddingRight: '12px',
      paddingBottom: '6px',
    }}>
      Total Frames
    </div>
    <div style={{
      boxSizing: 'border-box',
      marginRight: '6px',
      paddingBottom: '6px',
      paddingRight: '6px',
      textAlign: 'right',
      width: CURRENT_COLUMN_WIDTH,
    }}>
      Current Frame
    </div>
    <div style={{
      boxSizing: 'border-box',
      borderRight: '1px solid black'
    }} />
    <div style={{
      boxSizing: 'border-box',
      flex: '1',
      minWidth: CONTROLS_COLUMN_WIDTH,
      paddingLeft: '12px',
      paddingBottom: '6px',
    }}>
      Controls
    </div>
  </div>
);

const AnimationRowCurrentFrameInput = ({ numFrames, frameNum, setFrameNum }) => (
  <input
    style={{
      boxSizing: 'border-box',
      fontFamily: 'monospace',
      fontSize: '14px',
      marginBottom: '6px',
      marginRight: '6px',
      marginTop: '6px',
      paddingRight: '6px',
      textAlign: 'right',
      width: CURRENT_COLUMN_WIDTH,
    }}
    type='text'
    disabled={ numFrames <= 1 }
    value={ frameNum }
    onKeyDown={ev => {
      const key = ev.key.toUpperCase();
      if (key === 'ARROWUP') {
        setFrameNum(Math.min(frameNum + 1, numFrames));
      } else if (key === 'ARROWDOWN') {
        setFrameNum(Math.max(frameNum - 1, 1));
      }
    }}
    onChange={ev => {
      const nextNum = parseInt(ev.target.value);
      if (typeof nextNum === 'number' && 1 <= nextNum && nextNum <= numFrames) {
        setFrameNum(nextNum);
      }
    }}
  />
);

const AnimationRowControls = ({ frameNum, numFrames, recording, setFrameNum }) => (
  <div style={{
    boxSizing: 'border-box',
    flex: '1',
    minWidth: CONTROLS_COLUMN_WIDTH,
    paddingLeft: '12px',
    paddingTop: '6px',
    paddingBottom: '6px',
    display: 'flex',
  }}>
    <input
      type='range'
      min='1'
      max={`${ numFrames }`}
      value={ frameNum }
      onChange={ev => {
        setFrameNum(parseInt(ev.target.value));
      }}
    />
    <div
      style={{
        boxSizing: 'border-box',
        border: '1px solid black',
        cursor: 'pointer',
        marginLeft: '18px',
        padding: '4px 8px',
      }}
      onClick={ev => {
        const startTime = getFrameElapsedTime(recording, 0);
        for (let index = 0; index < numFrames; index++) {
          const elapsedTime = getFrameElapsedTime(recording, index);
          setTimeout(() => {
            setFrameNum(index + 1);
          }, elapsedTime - startTime);
        }
      }}
    >
      Replay
    </div>
  </div>
);

class AnimationRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      frameNum: getNumFrames(props.recording),
    };

    this.setFrameNum = this.setFrameNum.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { recording } = nextProps;
    this.setState({
      frameNum: getNumFrames(recording),
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const { frameNum: prevNum } = prevState;
    const { frameNum: nextNum } = this.state;
    const { recording } = this.props;
    if (nextNum !== prevNum) {
      Object.values(recording).forEach(frames => {
        if (nextNum < frames.length) {
          const { updatedStyles, updateStyles } = frames[nextNum];
          updateStyles(updatedStyles);
        }
      })
    }
  }

  setFrameNum(frameNum) {
    this.setState({ frameNum });
  }

  render() {
    const { animationName, recording } = this.props;
    const { frameNum } = this.state;
    const numFrames = getNumFrames(recording);
    return (
      <div style={{
        boxSizing: 'border-box',
        display: 'flex',
      }}>
        <div style={{
          boxSizing: 'border-box',
          width: NAME_COLUMN_WIDTH,
          overflowX: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          lineHeight: ROW_LINE_HEIGHT,
          paddingTop: '6px',
          paddingBottom: '6px',
        }}>
          { animationName }
        </div>
        <div style={{
          boxSizing: 'border-box',
          width: TOTAL_COLUMN_WIDTH,
          textAlign: 'right',
          paddingRight: '12px',
          lineHeight: ROW_LINE_HEIGHT,
          paddingTop: '6px',
          paddingBottom: '6px',
        }}>
          { numFrames }
        </div>
        <AnimationRowCurrentFrameInput
          frameNum={ frameNum }
          numFrames={ numFrames }
          setFrameNum={ this.setFrameNum }
        />
        <div style={{
          boxSizing: 'border-box',
          borderRight: '1px solid black',
        }} />
        { numFrames <= 1 ? null : (
          <AnimationRowControls
            frameNum={ frameNum }
            numFrames={ numFrames }
            recording={ recording }
            setFrameNum={ this.setFrameNum }
          />
        ) }
      </div>
    );
  }

}

const PanelBody = ({ recordings }) => (
  <div style={{
    boxSizing: 'border-box',
    fontSize: '14px',
    paddingLeft: '12px',
    paddingBottom: '12px',
  }}>
    <AnimationHeader />
    {
      !recordings ? null : (
        Object.keys(recordings).map((animationName, index) => (
          <AnimationRow
            key={ index }
            animationName={ animationName }
            recording={ recordings[animationName] }
          />
        ))
      )
    }
  </div>
);

const DisplayToggle = ({ onClick, isHidden }) => (
  <div
    style={{
      backgroundColor: PRIMARY_COLOR,
      borderBottom: '1px solid black',
      borderTopLeftRadius: '6px',
      borderTopRightRadius: '6px',
      boxSizing: 'border-box',
      color: 'white',
      cursor: 'pointer',
      height: '28px',
      padding: '6px 18px',
      position: 'absolute',
      left: '6px',
      textAlign: 'center',
      top: '-28px',
    }}
    onClick={ onClick }
    >
    { isHidden ? 'Show' : 'Hide' } Debug Panel
  </div>
);

class InlinePanel extends React.Component {

  constructor(props) {
    super(props);
    this.state = { isHidden: false };
  }

  render() {
    const { recordings, setPanelPosition } = this.props;
    const { isHidden } = this.state;
    return (
      <div style={{
        backgroundColor: 'white',
        border: '1px solid black',
        boxSizing: 'border-box',
        fontFamily: 'monospace',
        height: PANEL_HEIGHT,
        minWidth: TABLE_WIDTH,
        opacity: '0.8',
        overflowY: 'scroll',
        padding: '6px 12px',
        position: 'relative',
        resize: 'both',
        top: isHidden ? PANEL_HEIGHT : '0px',
        width: '100vw',
      }}>
        <PanelHeader
      panelPosition={ PANEL_POSITION_BOTTOM }
          onPositionButtonClick={nextPanelPosition => {
            if (nextPanelPosition === PANEL_POSITION_BOTTOM) return;
            setPanelPosition(nextPanelPosition);
          }}
        />
        <PanelBody recordings={ recordings } />
        <DisplayToggle
          onClick={() => this.setState({ isHidden: !isHidden })}
          isHidden={ isHidden }
        />
      </div>
    );
  }

}

const WindowPanel = ({ recordings, setPanelPosition }) => (
  <div style={{
    backgroundColor: 'white',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
    height: '100%',
    minWidth: TABLE_WIDTH,
    opacity: '0.8',
    overflowY: 'scroll',
    padding: '6px 12px',
    position: 'relative',
    resize: 'both',
    width: 'calc(100% - 24px)',
  }}>
    <PanelHeader
      panelPosition={ PANEL_POSITION_WINDOW }
      onPositionButtonClick={nextPanelPosition => {
        if (nextPanelPosition === PANEL_POSITION_WINDOW) return;
        setPanelPosition(nextPanelPosition);
      }}
    />
    <PanelBody recordings={ recordings } />
  </div>
);

class DebugPanel extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      panelPosition: DEFAULT_PANEL_POSITION,
      panelElement: null,
      recordings: null,
      window: null,
      interval: null,
    };

    this.setPanelElement = this.setPanelElement.bind(this);
    this.createPanelElement = this.createPanelElement.bind(this);
    this.createSeparateWindow = this.createSeparateWindow.bind(this);
    this.destroy = this.destroy.bind(this);
    this.setPanelPosition = this.setPanelPosition.bind(this);
    this.setRecordings = this.setRecordings.bind(this);
  }

  componentDidMount() {
    const panelElement = this.createPanelElement();
    this.setPanelElement(panelElement);
    Recorder.addRecordListener(this.setRecordings);
  }

  componentDidUpdate(prevProps, prevState) {
    const { panelPosition: prevPosition } = prevState;
    const { panelPosition: nextPosition } = this.state;
    if (nextPosition !== prevPosition) {
      this.destroy(prevPosition);
      const nextPanelElement = this.createPanelElement();
      this.setPanelElement(nextPanelElement);
    }
  }

  componentWillUnmount() {
    Recorder.removeRecordListener(this.setRecordings);
    this.destroy(this.state.panelPosition);
  }

  createPanelElement() {
    const { panelPosition } = this.state;
    const panelElement = document.createElement('div');
    const panelStyles = PANEL_ELEMENT_STYLES[panelPosition];

    panelElement.id = PANEL_ELEMENT_ID;

    Object.keys(panelStyles).forEach(styleName => {
      panelElement.style[styleName] = panelStyles[styleName];
    });

    return panelElement;
  }

  createSeparateWindow() {
    const separateWindow = window.open('', '', SEPARATE_WINDOW_RECT);
    separateWindow.document.title = HEADER_TEXT;
    separateWindow.document.body.style.margin = '0px';
    return separateWindow;
  }

  setPanelElement(panelElement) {
    const { panelPosition } = this.state;

    if (panelPosition === PANEL_POSITION_WINDOW) {
      const separateWindow = this.createSeparateWindow();

      const interval = setInterval(() => {
        if (!separateWindow.closed) return;
        clearInterval(interval);
        this.destroy(panelPosition);

        this.setState(
          { panelPosition: DEFAULT_PANEL_POSITION },
          () => {
            const nextPanelElement = this.createPanelElement();
            this.setPanelElement(nextPanelElement);
          }
        );
      }, 500);

      this.setState({
        interval,
        panelElement,
        window: separateWindow,
      });

      separateWindow.document.body.appendChild(panelElement);
    } else {
      this.setState({
        panelElement,
        window,
      });

      window.document.body.appendChild(panelElement);
    }
  }

  destroy(prevPosition) {
    const { window, panelElement, interval } = this.state;
    if (!panelElement) return;

    window.document.body.removeChild(panelElement);

    if (prevPosition === PANEL_POSITION_WINDOW) {
      clearInterval(interval);
      window.close();
    }

    this.setState({
      window: null,
      panelElement: null,
      interval: null,
    });
  }

  setPanelPosition(panelPosition) {
    this.setState({ panelPosition });
  }

  setRecordings(recordings) {
    this.setState({ recordings });
  }

  render() {
    const { panelElement, panelPosition, recordings } = this.state;

    const props = {
      recordings,
      setPanelPosition: this.setPanelPosition,
    };

    return !panelElement ? null : (
      ReactDOM.createPortal(
        panelPosition === PANEL_POSITION_WINDOW ? (
          <WindowPanel { ...props } />
        ): (
          <InlinePanel { ...props } />
        ),
        panelElement,
      )
    );
  }
}

export default DebugPanel;
