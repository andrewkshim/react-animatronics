import { makeError } from './index'

test('utils.makeError', () => {
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
