import test from 'tape'

import { constructStyles } from './timed-stylist'

test('constructStyles', assert => {
  const startStyles = { left: '0px' };
  const endStyles = { left: '100px' };
  const progress = 0.5;

  const actualStyles = constructStyles(startStyles, endStyles, progress);
  const expectedStyles = { left: '50px' };

  assert.deepEquals(actualStyles, expectedStyles, 'correctly calculates the current styles');

  assert.end();
});
