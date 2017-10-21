// @flow
import test from 'tape'

import { makeError } from './utils'

test('utils.makeError', assert => {
  const err = makeError('hello', 'world');
  assert.equals(
    err.message, 'hello world',
    'correctly formats the error message'
  );
  assert.end();
});
