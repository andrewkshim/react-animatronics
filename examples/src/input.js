import React from 'react'

import Example from './internal/components/Example'
import Circle from './internal/components/Circle'
import { SERIF_FONT, COLOR_A, COLOR_B, COLOR_C } from './internal/styles'
import { withAnimatronics, withControl } from '../../src'

const COLORS = [
  COLOR_A,
  COLOR_B,
  COLOR_C,
];

const Letters = withAnimatronics(() => [])(class extends React.Component {

  constructor(props) {
    super(props);
    this.state = { didLettersAnimate: false };
  }

  componentDidUpdate(prevProps) {
    const { didAnimate: prevDidAnimate } = prevProps;
    const { didAnimate: nextDidAnimate, playAnimation } = this.props;
    if (!prevDidAnimate && nextDidAnimate) {
      playAnimation('reveal', () => {
        this.setState({ didLettersAnimate: true });
      });
    } else if (prevDidAnimate && !nextDidAnimate) {
      playAnimation('hide', () => {
        this.setState({ didLettersAnimate: false });
      });
    }
  }

  render() {
    const { text, didAnimate } = this.props;
    const { didLettersAnimate } = this.state;
    const letters = text.split('');
    const components = letters.map((letter, index) =>
       withControl(`${ letter }-${ index }`)(Circle)
    );
    return (
      <div style={{
        position: 'relative',
        display: 'flex',
        flexWrap: 'wrap',
      }}>{
        letters.map((letter, index) => {
          const LetterCircle = components[index];
          return (
            <LetterCircle
              key={ index }
              dimension={ 80 }
              style={{
                position: 'relative',
                backgroundColor: COLORS[index % COLORS.length],
                transform: didLettersAnimate ? 'scale(1)' : 'scale(0)',
                marginLeft: '10px',
                marginTop: '10px',
              }}
            >
              <div style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontFamily: SERIF_FONT,
                fontSize: '36px',
              }}>
                { letter }
              </div>
            </LetterCircle>
          );
        })
      }</div>
    );
  }

});

class Input extends React.Component {

  constructor(props) {
    super(props);
    this._onChange = this._onChange.bind(this);
    this.state = { text: '' };
  }

  _onChange(ev) {
    const { didAnimate, playAnimation } = this.props;
    const text = ev.target.value;
    if (text === '' && didAnimate) {
      playAnimation('hide');
    }
    this.setState({ text });
  }

  render() {
    const { didAnimate, animatronicStyles } = this.props;
    const { text } = this.state;
    return (
      <div>
        <input
          type='text'
          placeholder='Type something then animate'
          value={ text }
          onChange={ this._onChange }
          style={{
            outline: 'none',
            width: '60%',
            height: '48px',
            fontSize: '24px',
            lineHeight: 1.5,
            fontFamily: SERIF_FONT,
            position: 'relative',
            paddingLeft: '0.25em',
            marginTop: '5%',
            marginLeft: '5%',
            ...animatronicStyles,
          }}
        />
        <div style={{
          marginTop: '2.5%',
          marginLeft: '2.5%',
        }}>
          <Letters
            didAnimate={ didAnimate }
            text={ text }
            createAnimationSequences={() => ({
              reveal: [
                text.split('').reduce(
                  (result, letter, index) => {{
                    result[`${ letter }-${ index }`] = {
                      duration: 250,
                      delay: index * 100,
                      from: { transform: 'scale(0)' },
                      to: { transform: 'scale(1)' }
                    }
                    return result;
                  }},
                  {}
                )
              ],
              hide: [
                text.split('').reduce(
                  (result, letter, index) => {{
                    result[`${ letter }-${ index }`] = {
                      duration: 250,
                      delay: index * 100,
                      from: { transform: 'scale(1)' },
                      to: { transform: 'scale(0)' }
                    }
                    return result;
                  }},
                  {}
                )
              ]
            })}
          />
        </div>
      </div>
    );
  }

}

const ControlledInput = withControl('input')( Input );

class InputExample extends React.Component {

  render() {
    const { playAnimation } = this.props;
    return (
      <Example playAnimation={ playAnimation }>
        <ControlledInput/>
      </Example>
    );
  }

}

// TODO: Better organize these example components and/or figure out a better
// way to support dynamic animatronics. Need to wrap the root element and
// have a fake animation to trigger the child Letters animation.
export default withAnimatronics(
  () => [
    {
      input: {
        duration: 0,
        from: { transform: 'scale(1)' },
        to: { transform: 'scale(1)' },
      }
    }
  ]
)( InputExample );
