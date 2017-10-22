// @flow
import lolex from 'lolex'
import sinon from 'sinon'
import test from 'tape'

import SpringMachine from './spring-machine'

test('SpringMachine', assert => {
  const { setInterval, clearInterval, tick } = lolex.createClock();
  const maxExpectedIterations = 200;
  const interval = 10;
  const startStyles = { left: '0px' };
  const expectedEndStyles = { left: '100px' };
  const stiffness = 200;
  const damping = 20;

  const onNext = sinon.spy();
  const springMachine = SpringMachine(startStyles, expectedEndStyles, stiffness, damping);

  let id = 0;
  id = setInterval(() => {
    springMachine.next(
      onNext,
      actualEndStyles => {
        clearInterval(id);
        assert.true(onNext.called, 'the machine correctly calls back to onNext');
        assert.deepEquals(actualEndStyles, expectedEndStyles, 'the machine ends on the correct styles');
        assert.end();
      }
    );
  }, interval);

  tick(maxExpectedIterations * interval);
});
