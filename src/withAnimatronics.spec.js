import React from 'react'
import { mount } from 'enzyme'

import withAnimatronics from './withAnimatronics'

describe('withAnimatronics', () => {

  test('should render its base component', () => {

    class Base extends React.Component {
      render() {
        return <div id='test' />;
      }
    }

    const Animated = withAnimatronics(() => {})(Base);
    const wrapper = mount(<Animated />);

    expect(wrapper.find('#test').length).toBe(1);
  });

  test('should throw when not given a valid React component', () => {
    expect(() => {
      withAnimatronics(() => {})(undefined)
    }).toThrow(/must be used to wrap a valid React component/);
  });

});

