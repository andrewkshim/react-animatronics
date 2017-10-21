import React from 'react'
import sinon from 'sinon'
import test from 'tape'
import { mount } from 'enzyme'

import Control from './Control'

test('Control registers the component when mounted', assert => {
  const Base = class extends React.Component {
    render() {
      return <div/>;
    }
  };
  const registerComponent = sinon.spy()
  const wrapper = mount(
    <Control name='base' useStringRefs={ true }>
      <Base/>
    </Control>,
    {
      context: {
        animatronics: {
          registerComponent,
          unregisterComponent: () => {},
        },
      },
    }
  );
  assert.true(registerComponent.calledOnce);
  assert.end();
});

test('Control unregisters the component when unmounted', assert => {
  class Base extends React.Component {
    render() {
      return <div/>;
    }
  }
  const unregisterComponent = sinon.spy()
  const wrapper = mount(
    <Control name='base' useStringRefs={ true }>
      <Base/>
    </Control>,
    {
      context: {
        animatronics: {
          registerComponent: () => {},
            unregisterComponent,
        },
      },
    }
  );
  wrapper.unmount();
  assert.true(unregisterComponent.calledOnce);
  assert.end();
});

test('Control sets the ref to the DOM node', assert => {
  class Base extends React.Component {
    render() {
      return <div/>;
    }
  }

  let actualDOMNode;

  const wrapper = mount(
    <Control name='base' useStringRefs={ true }>
      <Base/>
    </Control>,
    {
      context: {
        animatronics: {
          registerComponent: (componentName, domNode, styleUpdater) => {
            actualDOMNode = domNode;
          },
          unregisterComponent: () => {},
        },
      },
    }
  );

  const expectedDOMNode = wrapper.find('div').getDOMNode();
  assert.equal(actualDOMNode, expectedDOMNode);
  assert.end();
});
