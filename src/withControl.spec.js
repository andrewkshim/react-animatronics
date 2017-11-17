import React from 'react'
import sinon from 'sinon'
import test from 'tape'
import { mount } from 'enzyme'

import withControl from './withControl'

test('withControl creates a valid React element', assert => {
  const Controlled = withControl('base', { useStringRefs: true })(() => <div/>);
  const element = React.createElement(Controlled);
  assert.true(React.isValidElement(element));
  assert.end();
});

test('withControl throws a well-formed error when it does not have the correct context', assert => {
  class Base extends React.Component {
    render() {
      return <div/>;
    }
  }
  const Controlled = withControl('base', { useStringRefs: true })(Base);
  assert.throws(
    () => {
      mount(<Controlled/>, { context: {} });
    },
    /forgot to use an animatronics component/,
  );
  assert.end();
});

test('withControl throws a well-formed error when it does not receive a React component', assert => {
  assert.throws(
    () => withControl('base', { useStringRefs: true })(undefined),
    /must be used to wrap a React component/,
  );
  assert.end();
});

test('withControl registers the component when mounted', assert => {
  class Base extends React.Component {
    render() {
      return <div/>;
    }
  }
  const Controlled = withControl('base', { useStringRefs: true })(Base);
  const registerComponent = sinon.spy()
  const wrapper = mount(<Controlled/>, {
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

test('withControl unregisters the component when unmounted', assert => {
  class Base extends React.Component {
    render() {
      return <div/>;
    }
  }
  const Controlled = withControl('base', { useStringRefs: true })(Base);
  const unregisterComponent = sinon.spy()
  const wrapper = mount(<Controlled/>, {
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

test('withControl sets the ref to the DOM node', assert => {
  class Base extends React.Component {
    render() {
      return <div/>;
    }
  }

  const Controlled = withControl('base', { useStringRefs: true })(Base);
  let actualDOMNode;

  const wrapper = mount(<Controlled/>, {
    context: {
      animatronics: {
        registerComponent: (componentName, domNode, styleUpdater) => {
          actualDOMNode = domNode;
        },
        unregisterComponent: () => {},
      },
    },
  });

  const expectedDOMNode = wrapper.find('div').getDOMNode();
  assert.equal(actualDOMNode, expectedDOMNode);
  assert.end();
});

test('withControl sees the latest DOM node', assert => {
  class Base extends React.Component {
    render() {
      const { shouldRender } = this.props;
      return !shouldRender ? null : <div/>;
    }
  }

  const Controlled = withControl('base')(Base);
  let actualDOMNode;

  const wrapper = mount(
    <Controlled shouldRender={false} />,
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

  wrapper.setProps({ shouldRender: true });
  wrapper.update();
  const expectedDOMNode = wrapper.find('div').getDOMNode();
  assert.equal(actualDOMNode, expectedDOMNode);
  assert.end();
});
