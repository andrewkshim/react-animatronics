import './internal/test.setup'

import React from 'react'
import sinon from 'sinon'
import test from 'tape'
import { mount } from 'enzyme'

import { withAnimatronics, withRig } from './index'

test('runs each animation stage', assert => {
  class Base extends React.Component {
    render() {
      return <div/>;
    }
  }

  const Rigged = withRig('base', { useStringRefs: true })(Base);
  const App = () => <Rigged/>;

  const onStage1Complete = sinon.spy();
  const onStage2Complete = sinon.spy();
  const createAnimationStages = () => {
    return [
      {
        base: {
          duration: 250,
          start: {
            top: '0px',
          },
          end: {
            top: '10px',
          },
        },
      },
      {
        base: {
          stiffness: 120,
          damping: 50,
          start: {
            top: '10px',
          },
          end: {
            top: '100px',
          },
        },
      },
    ];
  };

  let wrapper;
  const Animated = withAnimatronics(createAnimationStages)(App);
  wrapper = mount(<Animated/>);
  const runAnimation = wrapper.find(App).prop('runAnimation');
  runAnimation(
    () => {
      assert.true(onStage1Complete.calledOnce);
      assert.true(onStage2Complete.calledOnce);
      assert.end();
    },
    (stageIndex) => {
      if (stageIndex === 0) {
        onStage1Complete();
      } else if (stageIndex === 1) {
        onStage2Complete();
      }
    }
  );
})
