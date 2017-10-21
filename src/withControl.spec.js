import React from 'react'
import test from 'tape'
import { shallow } from 'enzyme'

import withControl from './withControl'
import Control from './Control'

test.only('withControl', assert => {
  const Controlled = withControl('base', { useStringRefs: true })(() => <div/>);
  const wrapper = shallow(
    <Controlled/>,
    {
      context: {
        animatronics: {
          registerComponent: () => {},
          unregisterComponent: () => {},
        },
      }
    }
  );
  assert.true(wrapper.find(Control), 'contains the Control component');
  assert.end();
});
