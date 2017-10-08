import test from 'tape'

import { calculateCurrentValue, constructStyles } from './timed-fashionista'

test('calculateCurrentValue', assert => {
  assert.equals(calculateCurrentValue(0, 100, 0.5), 50, 'returns the expected value');
  assert.end();
});

test('constructStyles', assert => {
  const startStyles = { left: '0px' };
  const endStyles = { left: '100px' };
  const progress = 0.5;

  const actualStyles = constructStyles(startStyles, endStyles, progress);
  const expectedStyles = { left: '50px' };

  assert.deepEquals(actualStyles, expectedStyles, 'correctly calculates the current styles');

  assert.end();
});
