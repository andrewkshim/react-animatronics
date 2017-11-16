// @flow
import test from 'tape'

import { makeError } from './index'

test('utils.makeError', assert => {
  const spaceErr = makeError('hello', 'world');
  assert.equals(
    spaceErr.message, 'hello world',
    'correctly formats spaces'
  );

  const newlineErr = makeError('hello', '\n', 'world');
  assert.equals(
    newlineErr.message, 'hello\nworld',
    'correctly formats newlines'
  );

  const spaceAndNewlineErr = makeError(
    'there should be a space between',
    'these lines but there should not',
    '\n',
    'be a space at the start of this line'
  );
  assert.equals(
    spaceAndNewlineErr.message,
    'there should be a space between these lines but there should not\nbe a space at the start of this line',
    'correctly formats a combination of spaces and newlines'
  );

  assert.end();
});
