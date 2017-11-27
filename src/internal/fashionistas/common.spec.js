import {
  createColorFashion,
  createNumberFashion,
  createTransformFashion,
  createUnitFashion,
  createSpacingFashion,
  createStaticFashion,
  createBoxShadowFashion,
  createCommaFashion,
  parseStyle,

  stringifyColor,
  stringifyNumber,
  stringifyComposite,
  stringifyUnit,
  stringifyFashion,

  isColorString,
  isNumberString,
  isUnitString,
  haveConvertibleUnits,
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

  expect(transformFashion.isCompositeType).toBeTruthy();

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

test('createSpacingFashion', () => {
  expect(createSpacingFashion('10px').styles).toEqual([
    createUnitFashion('10px'),
    createUnitFashion('10px'),
    createUnitFashion('10px'),
    createUnitFashion('10px')
  ]);
  expect(createSpacingFashion('10px 20px').styles).toEqual([
    createUnitFashion('10px'),
    createUnitFashion('20px'),
    createUnitFashion('10px'),
    createUnitFashion('20px')
  ]);
  expect(createSpacingFashion('10px 20px 14px').styles).toEqual([
    createUnitFashion('10px'),
    createUnitFashion('20px'),
    createUnitFashion('14px'),
    createUnitFashion('20px')
  ]);
  expect(createSpacingFashion('10px 20px 14px 44px').styles).toEqual([
    createUnitFashion('10px'),
    createUnitFashion('20px'),
    createUnitFashion('14px'),
    createUnitFashion('44px')
  ]);
  expect(() => createSpacingFashion(''))
    .toThrow(/should have between 1 to 4/);
  expect(() => createSpacingFashion('1px 2px 3px 4px 5px'))
    .toThrow(/should have between 1 to 4/);
});

test('createStaticFashion', () => {
  const staticFashion = createStaticFashion('hello');
  expect(staticFashion.isStaticType).toBe(true);
  expect(staticFashion.value).toBe('hello');
});

test('createBoxShadowFashion', () => {
  expect(createBoxShadowFashion('10px 10px blue').styles).toEqual([
    createUnitFashion('10px'),
    createUnitFashion('10px'),
    createUnitFashion('0px'),
    createUnitFashion('0px'),
    createColorFashion('blue'),
  ]);

  expect(createBoxShadowFashion('5px 4px 20px red').styles).toEqual([
    createUnitFashion('5px'),
    createUnitFashion('4px'),
    createUnitFashion('20px'),
    createUnitFashion('0px'),
    createColorFashion('red'),
  ]);

  expect(createBoxShadowFashion('1px 2px 3px -4rem #000').styles).toEqual([
    createUnitFashion('1px'),
    createUnitFashion('2px'),
    createUnitFashion('3px'),
    createUnitFashion('-4rem'),
    createColorFashion('#000'),
  ]);

  expect(createBoxShadowFashion('inset 4px 2px purple').styles).toEqual([
    createStaticFashion('inset'),
    createUnitFashion('4px'),
    createUnitFashion('2px'),
    createColorFashion('purple'),
  ]);
});

test('createCommaFashion', () => {
  expect(createCommaFashion('0, 1').styles).toEqual([
    createNumberFashion(0),
    createNumberFashion(1),
  ]);
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

  expect(parseStyle('10px 20px', 'padding')).toEqual(
    createSpacingFashion('10px 20px')
  );

  expect(parseStyle('1px 2px blue', 'boxShadow')).toEqual(
    createBoxShadowFashion('1px 2px blue')
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

test('stringifyComposite creates the correct style string', () => {
  const actualTransformStyleStr = stringifyComposite(createTransformFashion('scale(0.5)'));
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
  expect(stringifyFashion(transformFashion))
    .toBe(stringifyComposite(transformFashion));

  const spacingFashion = createSpacingFashion('10px 20px');
  expect(stringifyFashion(spacingFashion))
    .toBe(stringifyComposite(spacingFashion));

  const unitFashion = createUnitFashion('42px');
  const actualUnitStyleStr = stringifyFashion(unitFashion);
  const expectedUnitStyleStr = stringifyUnit(unitFashion);
  expect(actualUnitStyleStr).toBe(expectedUnitStyleStr);
});

test('haveConvertibleUnits', () => {
  expect(haveConvertibleUnits('10px', '30px')).toBe(false);
  expect(haveConvertibleUnits('10px', '30rem')).toBe(true);
  expect(haveConvertibleUnits(20, 40)).toBe(false);
  expect(haveConvertibleUnits('scale(0)', 'scale(1)', 'transform')).toBe(true);
});

test('isNumberString', () => {
  expect(isNumberString('123')).toBe(true);
  expect(isNumberString('123px')).toBe(false);
  expect(isNumberString('hello')).toBe(false);
});

test('isUnitString', () => {
  expect(isUnitString('12px')).toBe(true);
  expect(isUnitString('foobar')).toBe(false);

  // FIXME: this test should fail in a more thorough implementation,
  // we could check the actual unit string to see if its valid.
  expect(isUnitString('24unknownunit')).toBe(true);
});
