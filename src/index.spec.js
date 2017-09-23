import './test.setup'

import React from 'react'
import ReactDOM from 'react-dom'
import sinon from 'sinon'
import test from 'tape'
import { shallow, mount } from 'enzyme'

import {
  createWithAnimatronics,
  withAnimatronics,
  withRig,
} from './index'

test('withAnimatronics creates a valid React element', assert => {
  const Animated = withAnimatronics()(() => <div/>);
  const element = React.createElement(Animated);
  assert.true(React.isValidElement(element));
  assert.end();
});

test('withAnimatronics supplies runAnimation() to the wrapped component', assert => {
  const Base = () => <div/>;
  const Animated = withAnimatronics()(Base);
  const wrapper = shallow(<Animated/>);
  const runAnimation = wrapper.find(Base).prop('runAnimation');
  assert.true(typeof runAnimation === 'function');
  assert.end();
});

test('withRig creates a valid React element', assert => {
  const Rigged = withRig('base', { useStringRefs: true })(() => <div/>);
  const element = React.createElement(Rigged);
  assert.true(React.isValidElement(element));
  assert.end();
});

test('withRig registers the component when mounted', assert => {
  class Base extends React.Component {
    render() {
      return <div/>;
    }
  }
  const Rigged = withRig('base', { useStringRefs: true })(Base);
  const registerComponent = sinon.spy()
  const wrapper = mount(<Rigged/>, {
    context: {
      animatronics: {
        registerComponent,
        unregisterComponent: () => {},
      },
    },
  });
  assert.true(registerComponent.calledOnce);
  assert.end();
});

test('withRig unregisters the component when unmounted', assert => {
  class Base extends React.Component {
    render() {
      return <div/>;
    }
  }
  const Rigged = withRig('base', { useStringRefs: true })(Base);
  const unregisterComponent = sinon.spy()
  const wrapper = mount(<Rigged/>, {
    context: {
      animatronics: {
        registerComponent: () => {},
        unregisterComponent,
      },
    },
  });
  wrapper.unmount();
  assert.true(unregisterComponent.calledOnce);
  assert.end();
});

test('withRig sets the ref to the DOM node', assert => {
  class Base extends React.Component {
    render() {
      return <div/>;
    }
  }

  const Rigged = withRig('base', { useStringRefs: true })(Base);
  let actualDomRef;

  const wrapper = mount(<Rigged/>, {
    context: {
      animatronics: {
        registerComponent: ({ domRef }) => {
          actualDomRef = domRef;
        },
        unregisterComponent: () => {},
      },
    },
  });

  const expectedDomRef = wrapper.find('div').node;
  assert.equal(actualDomRef, expectedDomRef);
  assert.end();
});

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
            top: 0,
          }
        },
        end: {
          base: {
            top: 10,
          }
        },
        onStageComplete: onStage1Complete,
      },
      {
        stiffness: 120,
        damping: 50,
        start: {
          base: {
            top: 10,
          }
        },
        end: {
          base: {
            top: 100,
          }
        },
        onStageComplete: onStage2Complete,
      },
    ];
  };

  let wrapper;
  const Animated = withAnimatronics(
    createAnimationStages,
    {
      onAnimationComplete: () => {
        assert.true(onStage1Complete.calledOnce);
        assert.true(onStage2Complete.calledOnce);
        assert.equals(wrapper.find('div').node.style.top, '100px');
        assert.end();
      }
    }
  )(App);
  wrapper = mount(<Animated/>);
  const runAnimation = wrapper.find(App).prop('runAnimation');
  runAnimation();
})
