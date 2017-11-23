import React from 'react'
import { mount } from 'enzyme'

import Animatronics from './Animatronics'

test('<Animatronics />', () => {
  const Base = () => <div/>;
  const createAnimationSequences = () => [];

  const wrapper = mount(
    <Animatronics createAnimationSequences={ createAnimationSequences }>
      <Base/>
    </Animatronics>
  );

  expect(wrapper.find('AnimatronicsComponent').length).toBe(1);
});
