import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'

import withControl from './withControl'

test('withControl creates a valid React element', () => {
  const Controlled = withControl('base', { useStringRefs: true })(() => <div/>);
  const element = React.createElement(Controlled);
  expect(React.isValidElement(element)).toBe(true);
});

test('withControl throws a well-formed error when it does not have the correct context', () => {
  class Base extends React.Component {
    render() {
      return <div/>;
    }
  }
  const Controlled = withControl('base', { useStringRefs: true })(Base);
  expect(
    () => {
      mount(<Controlled/>, { context: {} });
    }
  ).toThrow(/forgot to use an animatronics component/);
});

test('withControl throws a well-formed error when it does not receive a React component', () => {
  expect(
    () => withControl('base', { useStringRefs: true })(undefined)
  ).toThrow(/must be used to wrap a React component/);
});

test('withControl registers the component when mounted', () => {
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
  expect(registerComponent.calledOnce).toBe(true);
});

test('withControl unregisters the component when unmounted', () => {
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
  expect(unregisterComponent.calledOnce).toBe(true);
});

test('withControl sets the ref to the DOM node', () => {
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
  expect(actualDOMNode,).toBe(expectedDOMNode);
});

test('withControl sees the latest DOM node', () => {
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
  expect(actualDOMNode).toBe(expectedDOMNode);
});
