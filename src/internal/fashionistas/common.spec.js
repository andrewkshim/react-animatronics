// @flow
import test from 'tape'

import {
  createColorFashion,
  createNumberFashion,
  createTransformFashion,
  createUnitFashion,
  parseStyle,

  stringifyColor,
  stringifyNumber,
  stringifyTransform,
  stringifyUnit,
  stringifyFashion,

  isColorString,
} from './common'

test('createColorFashion creates a valid ColorFashion', assert => {
  const colorFashion = createColorFashion('blue');
  assert.ok(colorFashion.isColorType);
  assert.end();
});

test('createNumberFashion creates a valid NumberFashion', assert => {
  const numberFashion = createNumberFashion(10);
  assert.ok(numberFashion.isNumberType);
  assert.end();
});

test('createTransformFashion creates a valid TransformFashion', assert => {
  const transformFashion = createTransformFashion('scale(0) rotateZ(90deg)');

  assert.ok(transformFashion.isTransformType);

  const actualTransformNames = transformFashion.names;
  const expectedTransformNames = ['scale', 'rotateZ'];
  assert.deepEquals(actualTransformNames, expectedTransformNames);

  const actualTransformStyles = transformFashion.styles;
  const expectedTransformStyles = [createNumberFashion(0), createUnitFashion('90deg')];
  assert.deepEquals(actualTransformStyles, expectedTransformStyles);

  assert.end();
});

test('createUnitFashion creates a valid UnitFashion', assert => {
  const unitFashion = createUnitFashion('10px');
  assert.ok(unitFashion.isUnitType);
  assert.end();
});

test('parseStyle', assert => {
  assert.deepEquals(
    parseStyle('white'),
    createColorFashion('white'),
    'correctly creates a color fashion'
  );

  assert.deepEquals(
    parseStyle(42),
    createNumberFashion(42),
    'correctly creates a number fashion'
  );

  assert.deepEquals(
    parseStyle('rotateX(90deg) translateY(100px)'),
    createTransformFashion('rotateX(90deg) translateY(100px)'),
    'correctly creates a transform fashion'
  );

  assert.deepEquals(
    // $FlowFixMe: flow doesn't know that this will only create a transform fashion
    parseStyle('scale(1.5)').styles[0],
    createNumberFashion(1.5),
    'correctly creates a transform fashion with a decimal value'
  );

  assert.deepEquals(
    parseStyle('240rem'),
    createUnitFashion('240rem'),
    'correctly creates a unit fashion'
  );

  assert.deepEquals(
    parseStyle('rgba(0, 0, 0, 0)'),
    createColorFashion('rgba(0, 0, 0, 0)'),
    'correctly creates an rgba color fashion'
  );

  assert.end();
});

test('stringifyColor creates the correct style string', assert => {
  const actualColorStyleStr = stringifyColor(createColorFashion('black'));
  const expectedColorStyleStr = '#000000';
  assert.equals(actualColorStyleStr, expectedColorStyleStr);
  assert.end();
});

test('stringifyNumber creates the correct style string', assert => {
  const actualNumberStyleStr = stringifyNumber(createNumberFashion(1));
  const expectedNumberStyleStr = '1';
  assert.equals(actualNumberStyleStr, expectedNumberStyleStr);
  assert.end();
});

test('stringifyTransform creates the correct style string', assert => {
  const actualTransformStyleStr = stringifyTransform(createTransformFashion('scale(0.5)'));
  const expectedTransformStyleStr = 'scale(0.5)';
  assert.equals(actualTransformStyleStr, expectedTransformStyleStr);
  assert.end();
});

test('stringifyUnit creates the correct style string', assert => {
  const actualUnitStyleStr = stringifyUnit(createUnitFashion('1234em'));
  const expectedUnitStyleStr = '1234em';
  assert.equals(actualUnitStyleStr, expectedUnitStyleStr);
  assert.end();
});

test('stringifyStyle creates the correct style strings', assert => {
  const colorFashion = createColorFashion('black');
  const actualColorStyleStr = stringifyFashion(colorFashion);
  const expectedColorStyleStr = stringifyColor(colorFashion);
  assert.equals(actualColorStyleStr, expectedColorStyleStr);

  const numberFashion = createNumberFashion(42);
  const actualNumberStyleStr = stringifyFashion(numberFashion);
  const expectedNumberStyleStr = stringifyNumber(numberFashion);
  assert.equals(actualNumberStyleStr, expectedNumberStyleStr);

  const transformFashion = createTransformFashion('translateZ(42deg)');
  const actualTransformStyleStr = stringifyFashion(transformFashion);
  const expectedTransformStyleStr = stringifyTransform(transformFashion);
  assert.equals(actualTransformStyleStr, expectedTransformStyleStr);

  const unitFashion = createUnitFashion('42px');
  const actualUnitStyleStr = stringifyFashion(unitFashion);
  const expectedUnitStyleStr = stringifyUnit(unitFashion);
  assert.equals(actualUnitStyleStr, expectedUnitStyleStr);

  assert.end();
});
