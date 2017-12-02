import { parseStyle } from './common'
import {
  interpolateValue,
  interpolateFashion,
  reconstructStyles,
} from './spring'

test('interpolateValue', () => {
  expect(interpolateValue(0, 100, 0.5)).toBe(50);
});

test('interpolateFashion', () => {
  const startColor = parseStyle('black');
  const endColor = parseStyle('white');
  const interpolatedColor = interpolateFashion(startColor, endColor, 0.5);
  expect(
    interpolatedColor.isColorType && interpolatedColor.value.name()
  ).toBe('gray');

  const startNumber = parseStyle(0);
  const endNumber = parseStyle(100);
  const interpolatedNumber = interpolateFashion(startNumber, endNumber, 0.6)
  // $FlowFixMe: fighting with flow on how to manage the Fashion type, clean up later
  expect(interpolatedNumber.value).toBe(60);

  const startUnit = parseStyle('0px');
  const endUnit = parseStyle('100px');
  const interpolatedUnit = interpolateFashion(startUnit, endUnit, 0.42);
  // $FlowFixMe: fighting with flow on how to manage the Fashion type, clean up later
  expect(interpolatedUnit.value).toBe(42);
});

describe('reconstructStyles', () => {

  test('should reconstruct basic styles', () => {
    expect(
      reconstructStyles(
        { left: '0px', top: '0px' },
        { left: '100px', top: '100px' },
        ['left', 'top'],
        [0.4, 0.7],
      )
    ).toEqual({ left: '40px', top: '70px' });
  });

  test('should reconstruct transform styles', () => {
    expect(
      reconstructStyles(
        { transform: 'scale(1)' },
        { transform: 'scale(1.5)' },
        ['transform'],
        [0.5],
      )
     ).toEqual({ transform: 'scale(1.25)' });
  });

  test('should reconstruct complex styles', () => {
    expect(
      reconstructStyles(
        { transform: 'scale(1, 1)' },
        { transform: 'scale(1.5, 2)' },
        ['transform'],
        [0.5, 0.5],
      )
     ).toEqual({ transform: 'scale(1.25, 1.5)' });
  });

});
