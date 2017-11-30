import React from 'react'
import { mount } from 'enzyme'

import withControl from './withControl'

test('withControl()', () => {

  class Base extends React.Component {
    render() {
      return <div id='test' />;
    }
  }

  const Controlled = withControl('base')(Base);

  const wrapper = mount(
    <Controlled />,
    {
      context: {
        animatronics: {
          registerComponent: () => {},
          unregisterComponent: () => {},
        }
      }
    }
  );

  expect(wrapper.find('#test').length).toBe(1);
});
