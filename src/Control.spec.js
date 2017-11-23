import React from 'react'
import { mount } from 'enzyme'

import Control from './Control'

test('<Control />', () => {

  class Base extends React.Component {

    componentDidMount() {
      const { animatronicStyles } = this.props;

      expect(animatronicStyles).toEqual({});
    }

    render() {
      return <div/>;
    }

  }

  const wrapper = mount(
    <Control name='base'>
      <Base/>
    </Control>,
    {
      context: {
        animatronics: {
          registerComponent: () => {},
          unregisterComponent: () => {},
        }
      }
    }
  );

  expect(wrapper.find('ControlledComponent').length).toBe(1);
});
