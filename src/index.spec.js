import './internal/test.setup'

import React from 'react'
import ReactDOM from 'react-dom'
import sinon from 'sinon'
import test from 'tape'
import { shallow, mount } from 'enzyme'

import {
  withAnimatronics,
  withRig,
} from './index'


//test('withAnimatronics successfully runs each animation stage', assert => {
test.skip('withAnimatronics successfully runs each animation stage', assert => {
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
        duration: 250,
        start: {
          base: {
            top: '0px',
          }
        },
        end: {
          base: {
            top: '10px',
          }
        },
      },
      {
        stiffness: 120,
        damping: 50,
        start: {
          base: {
            top: '10px',
          }
        },
        end: {
          base: {
            top: '100px',
          }
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
      assert.equals(wrapper.find('div').node.style.top, '100px');
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
