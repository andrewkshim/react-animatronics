import React from 'react'
import { mount } from 'enzyme'

import withControl from './withControl'

describe('withControl', () => {

  test('should render its base component', () => {

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

  test('should throw when not given a valid React component', () => {
    expect(() => {
      withControl(() => {})(undefined)
    }).toThrow(/must be used to wrap a valid React component/);
  });

});

