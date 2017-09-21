import './test.setup'

import React from 'react'
import sinon from 'sinon'
import test from 'tape'
import { shallow, mount } from 'enzyme'

import {
  createWithAnimatronics,
  withAnimatronics,
  withRig,
} from './index'

test('withAnimatronics creates a valid React element', assert => {
  const Animated = withAnimatronics(() => <div/>);
  const element = React.createElement(Animated);
  assert.true(React.isValidElement(element));
  assert.end();
});

test('withAnimatronics supplies runAnimation() to the wrapped component', assert => {
  const Base = () => <div/>;
  const Animated = withAnimatronics(Base);
  const wrapper = shallow(<Animated/>);
  const runAnimation = wrapper.find(Base).prop('runAnimation');
  assert.true(typeof runAnimation === 'function');
  assert.end();
});

test('withRig creates a valid React element', assert => {
  const Rigged = withRig(() => <div/>);
  const element = React.createElement(Rigged);
  assert.true(React.isValidElement(element));
  assert.end();
});

test('withRig registers the component when mounted', assert => {
  const Base = () => <div/>;
  const Rigged = withRig(Base);
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
  const Base = () => <div/>;
  const Rigged = withRig(Base);
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

//test('withAnimatronics runs each animation stage', assert => {
  //const Base = () => <div></div>;
  //const Animated = withAnimatronics(Base, ({ baseRef }) => {
  //});
//})
