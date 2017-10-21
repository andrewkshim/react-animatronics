import React from 'react'
import test from 'tape'
import { mount } from 'enzyme'

import Control from './Control'

test('Control', assert => {
  const Base = () => <div/>;

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
