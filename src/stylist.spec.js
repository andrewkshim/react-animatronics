import test from 'tape'

import {
  COLOR_STYLE_TYPE,
  NUMBER_STYLE_TYPE,
  TRANSFORM_STYLE_TYPE,
  UNIT_STYLE_TYPE,

  createColorStyle,
  createNumberStyle,
  createTransformStyle,
  createUnitStyle,
  parseStyle,

  stringifyColorStyle,
  stringifyNumberStyle,
  stringifyTransformStyle,
  stringifyUnitStyle,
  stringifyStyle,

  isColorString,
} from './stylist'

test('createColorStyle creates a valid ColorStyle', assert => {
  const colorStyle = createColorStyle('blue');
  const actualType = colorStyle.type;
  const expectedType = COLOR_STYLE_TYPE;
  assert.equals(actualType, expectedType);
  assert.end();
});

test('createNumberStyle creates a valid NumberStyle', assert => {
  const numberStyle = createNumberStyle(10);
  const actualType = numberStyle.type;
  const expectedType = NUMBER_STYLE_TYPE;
  assert.equals(actualType, expectedType);
  assert.end();
});

test('createTransformStyle creates a valid TransformStyle', assert => {
  const transformStyle = createTransformStyle('scale(0) rotateZ(90deg)');

  const actualType = transformStyle.type;
  const expectedType = TRANSFORM_STYLE_TYPE;
  assert.equals(actualType, expectedType);

  const actualTransformNames = transformStyle.names;
  const expectedTransformNames = ['scale', 'rotateZ'];
  assert.deepEquals(actualTransformNames, expectedTransformNames);

  const actualTransformStyles = transformStyle.styles;
  const expectedTransformStyles = [createNumberStyle(0), createUnitStyle('90deg')];
  assert.deepEquals(actualTransformStyles, expectedTransformStyles);

  assert.end();
});

test('createUnitStyle creates a valid UnitStyle', assert => {
  const unitStyle = createUnitStyle('10px');
  const actualType = unitStyle.type;
  const expectedType = UNIT_STYLE_TYPE;
  assert.equals(actualType, expectedType);
  assert.end();
});

test('parseStyle creates the correct Styles', assert => {
  const actualColorStyle = parseStyle('white');
  const expectedColorStyle = createColorStyle('white');
  assert.deepEquals(actualColorStyle, expectedColorStyle);

  const actualNumberStyle = parseStyle(42);
  const expectedNumberStyle = createNumberStyle(42);
  assert.deepEquals(actualNumberStyle, expectedNumberStyle);

  const actualTransformStyle = parseStyle('rotateX(90deg) translateY(100px)');
  const expectedTransformStyle = createTransformStyle('rotateX(90deg) translateY(100px)');
  assert.deepEquals(actualTransformStyle, expectedTransformStyle);

  const actualUnitStyle = parseStyle('240rem');
  const expectedUnitStyle = createUnitStyle('240rem');
  assert.deepEquals(actualUnitStyle, expectedUnitStyle);

  assert.end();
});

test('stringifyColorStyle creates the correct style string', assert => {
  const actualColorStyleStr = stringifyColorStyle(createColorStyle('black'));
  const expectedColorStyleStr = '#000000';
  assert.equals(actualColorStyleStr, expectedColorStyleStr);
  assert.end();
});

test('stringifyNumberStyle creates the correct style string', assert => {
  const actualNumberStyleStr = stringifyNumberStyle(createNumberStyle(1));
  const expectedNumberStyleStr = '1';
  assert.equals(actualNumberStyleStr, expectedNumberStyleStr);
  assert.end();
});

test('stringifyTransformStyle creates the correct style string', assert => {
  const actualTransformStyleStr = stringifyTransformStyle(createTransformStyle('scale(0.5)'));
  const expectedTransformStyleStr = 'scale(0.5)';
  assert.equals(actualTransformStyleStr, expectedTransformStyleStr);
  assert.end();
});

test('stringifyUnitStyle creates the correct style string', assert => {
  const actualUnitStyleStr = stringifyUnitStyle(createUnitStyle('1234em'));
  const expectedUnitStyleStr = '1234em';
  assert.equals(actualUnitStyleStr, expectedUnitStyleStr);
  assert.end();
});

test('stringifyStyle creates the correct style strings', assert => {
  const colorStyle = createColorStyle('black');
  const actualColorStyleStr = stringifyStyle(colorStyle);
  const expectedColorStyleStr = stringifyColorStyle(colorStyle);
  assert.equals(actualColorStyleStr, expectedColorStyleStr);

  const numberStyle = createNumberStyle(42);
  const actualNumberStyleStr = stringifyStyle(numberStyle);
  const expectedNumberStyleStr = stringifyNumberStyle(numberStyle);
  assert.equals(actualNumberStyleStr, expectedNumberStyleStr);

  const transformStyle = createTransformStyle('translateZ(42deg)');
  const actualTransformStyleStr = stringifyStyle(transformStyle);
  const expectedTransformStyleStr = stringifyTransformStyle(transformStyle);
  assert.equals(actualTransformStyleStr, expectedTransformStyleStr);

  const unitStyle = createUnitStyle('42px');
  const actualUnitStyleStr = stringifyStyle(unitStyle);
  const expectedUnitStyleStr = stringifyUnitStyle(unitStyle);
  assert.equals(actualUnitStyleStr, expectedUnitStyleStr);

  assert.end();
});
