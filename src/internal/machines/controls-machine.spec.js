// @flow
import test from 'tape'
import sinon from 'sinon'

import { ControlsMachine } from './controls-machine'

test('ControlsMachine', assert => {
  const machine = ControlsMachine();
  const styleUpdater = sinon.spy();

  machine.registerComponent('componentA', {}, styleUpdater);
  machine.updateStyles('componentA', { left: '42px' });

  assert.true(
    styleUpdater.called,
    'allows callers to provide and call a style updater function'
  );
  assert.deepEquals(
    styleUpdater.firstCall.args[0], { left: '42px' },
    'calls the style updater with the expected arguments'
  );
  assert.end();
});
