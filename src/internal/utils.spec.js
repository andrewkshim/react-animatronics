import {
  makeError,
  multiplyMatrices,
} from './utils'

test('makeError', () => {
  const spaceErr = makeError('hello', 'world');
  expect(spaceErr.message).toBe('hello world');

  const newlineErr = makeError('hello', '\n', 'world');
  expect(newlineErr.message).toBe('hello\nworld');

  const spaceAndNewlineErr = makeError(
    'there should be a space between',
    'these lines but there should not',
    '\n',
    'be a space at the start of this line'
  );
  expect(spaceAndNewlineErr.message).toBe(
  'there should be a space between these lines but there should not\nbe a space at the start of this line'
  );
});

describe('multiplyMatrices', () => {

  const identity = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];
  const matrixA = [
    1, 2, 3, 4,
    1, 2, 3, 4,
    1, 2, 3, 4,
    1, 2, 3, 4,
  ];
  const matrixB = [
    1, 1, 1, 1,
    2, 2, 2, 2,
    3, 3, 3, 3,
    4, 4, 4, 4,
  ];

  test('should correctly multiply with the identity matrix', () => {
    expect(multiplyMatrices(matrixA, identity)).toEqual(matrixA);
  });

  test('should correctly multiply two different matrices', () => {
    expect(multiplyMatrices(matrixA, matrixB)).toEqual([
      30, 30, 30, 30,
      30, 30, 30, 30,
      30, 30, 30, 30,
      30, 30, 30, 30,
    ]);
  });

});
