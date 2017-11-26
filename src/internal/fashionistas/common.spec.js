// @flow
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

test('createColorFashion creates a valid ColorFashion', () => {
  const colorFashion = createColorFashion('blue');
  expect(colorFashion.isColorType).toBeTruthy();
});

test('createNumberFashion creates a valid NumberFashion', () => {
  const numberFashion = createNumberFashion(10);
  expect(numberFashion.isNumberType).toBeTruthy();
});

test('createTransformFashion creates a valid TransformFashion', () => {
  const transformFashion = createTransformFashion('scale(0) rotateZ(90deg)');

  expect(transformFashion.isTransformType).toBeTruthy();

  const actualTransformNames = transformFashion.names;
  const expectedTransformNames = ['scale', 'rotateZ'];
  expect(actualTransformNames).toEqual(expectedTransformNames);

  const actualTransformStyles = transformFashion.styles;
  const expectedTransformStyles = [createNumberFashion(0), createUnitFashion('90deg')];
  expect(actualTransformStyles).toEqual(expectedTransformStyles);
});

test('createUnitFashion creates a valid UnitFashion', () => {
  const unitFashion = createUnitFashion('10px');
  expect(unitFashion.isUnitType).toBeTruthy();
});

test('parseStyle', () => {
  expect(parseStyle('white')).toEqual(createColorFashion('white'));

  expect(parseStyle(42)).toEqual(createNumberFashion(42));

  expect(parseStyle('rotateX(90deg) translateY(100px)', 'transform')).toEqual(
    createTransformFashion('rotateX(90deg) translateY(100px)')
  );

  expect(
    // $FlowFixMe: flow doesn't know that this will only create a transform fashion
    parseStyle('scale(1.5)', 'transform').styles[0]
  ).toEqual(createNumberFashion(1.5));

  expect(parseStyle('240rem')).toEqual(createUnitFashion('240rem'));

  expect(parseStyle('rgba(0, 0, 0, 0)')).toEqual(
    createColorFashion('rgba(0, 0, 0, 0)')
  );
});

test('stringifyColor creates the correct style string', () => {
  const actualColorStyleStr = stringifyColor(createColorFashion('black'));
  const expectedColorStyleStr = '#000000';
  expect(actualColorStyleStr).toBe(expectedColorStyleStr);
});

test('stringifyNumber creates the correct style string', () => {
  const actualNumberStyleStr = stringifyNumber(createNumberFashion(1));
  const expectedNumberStyleStr = '1';
  expect(actualNumberStyleStr).toBe(expectedNumberStyleStr);
});

test('stringifyTransform creates the correct style string', () => {
  const actualTransformStyleStr = stringifyTransform(createTransformFashion('scale(0.5)'));
  const expectedTransformStyleStr = 'scale(0.5)';
  expect(actualTransformStyleStr).toBe(expectedTransformStyleStr);
});

test('stringifyUnit creates the correct style string', () => {
  const actualUnitStyleStr = stringifyUnit(createUnitFashion('1234em'));
  const expectedUnitStyleStr = '1234em';
  expect(actualUnitStyleStr).toBe(expectedUnitStyleStr);
});

test('stringifyStyle creates the correct style strings', () => {
  const colorFashion = createColorFashion('black');
  const actualColorStyleStr = stringifyFashion(colorFashion);
  const expectedColorStyleStr = stringifyColor(colorFashion);
  expect(actualColorStyleStr).toBe(expectedColorStyleStr);

  const numberFashion = createNumberFashion(42);
  const actualNumberStyleStr = stringifyFashion(numberFashion);
  const expectedNumberStyleStr = stringifyNumber(numberFashion);
  expect(actualNumberStyleStr).toBe(expectedNumberStyleStr);

  const transformFashion = createTransformFashion('translateZ(42deg)');
  const actualTransformStyleStr = stringifyFashion(transformFashion);
  const expectedTransformStyleStr = stringifyTransform(transformFashion);
  expect(actualTransformStyleStr).toBe(expectedTransformStyleStr);

  const unitFashion = createUnitFashion('42px');
  const actualUnitStyleStr = stringifyFashion(unitFashion);
  const expectedUnitStyleStr = stringifyUnit(unitFashion);
  expect(actualUnitStyleStr).toBe(expectedUnitStyleStr);
});
