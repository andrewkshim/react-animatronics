import React from 'react'
import test from 'tape'
import { mount } from 'enzyme'

import Control from './Control'

test('Control', assert => {

  class Base extends React.Component {
 
    componentDidMount() {
      const { animatronicStyles } = this.props;

      assert.deepEquals(
        animatronicStyles, {},
        'passes initial styles to its child'
      );

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

  assert.equals(
    wrapper.find('ControlledComponent').length, 1,
    'controls the underlying withControl component'
  );
  assert.end();
});
