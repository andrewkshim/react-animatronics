import { calculateCurrentValue, constructStyles } from './timed'

test('calculateCurrentValue', () => {
  expect(calculateCurrentValue(0, 100, 0.5)).toBe(50);
});

test('constructStyles', () => {
  const fromStyles = { left: '0px' };
  const toStyles = { left: '100px' };
  const progress = 0.5;

  const actualStyles = constructStyles(fromStyles, toStyles, progress);
  const expectedStyles = { left: '50px' };

  expect(actualStyles).toEqual(expectedStyles);
});
