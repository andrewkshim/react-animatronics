import React from 'react'
import { mount } from 'enzyme'

import { getNumFrames, getFrameElapsedTime } from './DebugPanel'

test('getNumFrames', () => {
  expect(getNumFrames({ a: [1], b: [1, 2] })).toBe(2);
  expect(getNumFrames({ a: [1, 2], b: [1, 2] })).toBe(2);
});

test('getFrameElapsedTime', () => {
  expect(getFrameElapsedTime({
    a: [{ elapsedTime: 10 }, { elapsedTime: 20 }],
    b: [{ elapsedTime: 2 }, { elapsedTime: 4 }],
  }, 1)).toBe(20);
});
