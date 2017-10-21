import React from 'react'
import test from 'tape'
import { mount } from 'enzyme'

import Animatronics from './Animatronics'

test('Animatronics', assert => {
  const Base = () => <div/>;
  const createAnimationSequences = () => [];

  const wrapper = mount(
    <Animatronics createAnimationSequences={ createAnimationSequences }>
      <Base/>
    </Animatronics>
  );

  assert.equals(
    wrapper.find('AnimatronicsComponent').length, 1,
    'contains the underlying withAnimatronics component'
  );
  assert.end();
});
