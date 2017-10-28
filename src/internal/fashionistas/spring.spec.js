// @flow
import test from 'tape'

import { parseBasicStyle } from './common'
import { interpolateValue, interpolateFashion, reconstructStyles } from './spring'

test('interpolateValue', assert => {
  const actual = interpolateValue(0, 100, 0.5);
  const expected = 50;
  assert.equals(actual, expected, 'calculates the correct value');
  assert.end();
});

test('interpolateFashion', assert => {
  const startColor = parseBasicStyle('black');
  const endColor = parseBasicStyle('white');
  const interpolatedColor = interpolateFashion(startColor, endColor, 0.5);
  assert.equals(
    interpolatedColor.isColorType && interpolatedColor.value.name(), 'gray',
    'correctly interpolates colors'
  );

  const startNumber = parseBasicStyle(0);
  const endNumber = parseBasicStyle(100);
  const interpolatedNumber = interpolateFashion(startNumber, endNumber, 0.6)
  assert.equals(interpolatedNumber.value, 60, 'correctly interpolates numbers');

  const startUnit = parseBasicStyle('0px');
  const endUnit = parseBasicStyle('100px');
  const interpolatedUnit = interpolateFashion(startUnit, endUnit, 0.42);
  assert.equals(interpolatedUnit.value, 42, 'correctly interpolates units');

  assert.end();
});

test('reconstructStyles', assert => {
  assert.deepEquals(
    reconstructStyles(
      { left: '0px', top: '0px' },
      { left: '100px', top: '100px' },
      ['left', 'top'],
      [0.4, 0.7],
    ),
    { left: '40px', top: '70px' },
    'correctly reconstructs positional styles'
  );

  assert.deepEquals(
    reconstructStyles(
      { transform: 'scale(1)' },
      { transform: 'scale(1.5)' },
      ['transform'],
      [0.5],
    ),
    { transform: 'scale(1.25)' },
    'correctly reconstructs transform styles'
  );

  assert.end();
});
