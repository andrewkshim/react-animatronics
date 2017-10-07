import './internal/setup.test'

import React from 'react'
import sinon from 'sinon'
import test from 'tape'
import { mount } from 'enzyme'

import withRig from './withRig'

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
  let actualDomNode;

  const wrapper = mount(<Rigged/>, {
    context: {
      animatronics: {
        registerComponent: ({ domNode }) => {
          actualDomNode = domNode;
        },
        unregisterComponent: () => {},
      },
    },
  });

  const expectedDomNode = wrapper.find('div').node;
  assert.equal(actualDomNode, expectedDomNode);
  assert.end();
});
