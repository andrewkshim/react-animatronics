// @flow
import test from 'tape'

import { parseBasicStyle } from './common-fashionista'
import { interpolateValue, interpolateFashion, reconstructStyles } from './spring-fashionista'

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
  const startStyles = { left: '0px', top: '0px' };
  const endStyles = { left: '100px', top: '100px' };
  const styleNames = ['left', 'top'];
  const springValues = [0.4, 0.7];
  const reconstructed = reconstructStyles(
    startStyles,
    endStyles,
    styleNames,
    springValues,
  );

  assert.deepEquals(reconstructed, { left: '40px', top: '70px' });
  assert.end();
});
