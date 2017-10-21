// @flow
import test from 'tape'

import { makeError } from './utils'

test('utils.makeError', assert => {
  const err = makeError('hello', 'world');
  assert.equals(
    err.message, 'hello\nworld',
    'correctly formats the error message'
  );
  assert.end();
});
