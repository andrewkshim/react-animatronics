
import React from 'react'
import { shallow } from 'enzyme'

import Animatronics from './Animatronics'

describe('<Animatronics>', () => {

  class Base extends React.Component {
    render() {
      return <div></div>;
    }
  }

  test('should throw when "children" prop is not a function', () => {
    expect(() => {
      shallow(<Animatronics></Animatronics>);
    }).toThrow(/must receive a function "children" prop/);
  });

  test('should throw when "animations" prop is not an array, function, or object', () => {
    expect(() => {
      shallow(
        <Animatronics>{() =>
          <Base />
        }</Animatronics>
      );
    }).toThrow(/must receive an "animations" prop that is either an array, function, or object/);
  });

  test('should pass the correct props to its child', () => {
    const animations = () => [
      {
        base: {
          duration: 100,
          from: { left: '100px' },
          to: { left: '200px' },
        }
      }
    ];

    shallow(
      <Animatronics animations={ animations }>{({
        playAnimation,
        cancelAnimation,
        reset,
      }) => {
        expect(typeof playAnimation === 'function').toBe(true);
        expect(typeof cancelAnimation === 'function').toBe(true);
        expect(typeof reset === 'function').toBe(true);
        return <Base />;
      }}</Animatronics>
    );
  });

});

