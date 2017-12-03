import {
  calculateCurrentValue,
  constructStyles,
} from './timed'

test('calculateCurrentValue', () => {
  expect(calculateCurrentValue(0, 100, 0.5)).toBe(50);
});

describe('constructStyles', () => {
  test('should handle basic styles', () => {
    const fromStyles = { left: '0px' };
    const toStyles = { left: '100px' };
    const progress = 0.5;

    const actualStyles = constructStyles(fromStyles, toStyles, progress);
    const expectedStyles = { left: '50px' };

    expect(actualStyles).toEqual(expectedStyles);
  });

  test('should handle transform styles', () => {
    expect(constructStyles(
      { transform: { translateX: 'translateX(0px)' } },
      { transform: { translateX: 'translateX(100px)' } },
      0.5,
      ['translateX']
    )).toEqual({ transform: 'translateX(50px)' });

    expect(constructStyles(
      { transform: { matrix: 'matrix(1, 0, 0, 1, 0, 0)' } },
      { transform: { matrix: 'matrix(1, 0, 0, 1, 0, -100)' } },
      0.7,
      ['matrix']
    )).toEqual({ transform: 'matrix(1, 0, 0, 1, 0, -70)' });
  });

});
