import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'

import Control from './Control'

test('<Control> renders its child component', () => {

  class Base extends React.Component {
    render() {
      return <div id='test' />;
    }
  }

  const wrapper = mount(
    <Control name='base'>{ () =>
      <Base />
    }</Control>,
    {
      context: {
        animatronics: {
          registerComponent: () => {},
          unregisterComponent: () => {},
        }
      }
    }
  );

  expect(wrapper.find('#test').length).toBe(1);
});

test('<Control> should register the DOM node', () => {
  let baseRef;

  class Base extends React.Component {
    render() {
      return <div id='test' ref={ ref => baseRef = ref } />;
    }
  }

  const wrapper = mount(
    <Control name='base'>{ ({ ref }) =>
      <Base ref={ ref } />
    }</Control>,
    {
      context: {
        animatronics: {
          registerComponent: (name, domNode) => {
            expect(domNode).toBe(baseRef);
          },
          unregisterComponent: () => {},
        }
      }
    }
  );
});

test('<Control> should update the DOM node when the component updates', () => {
  let actualDOMNode;

  class Base extends React.Component {
    render() {
      const { name } = this.props;
      return name === 'base' ?  <span /> : <div />;
    }
  }

  const wrapper = mount(
    <Control name='base'>{({ ref }) =>
      <Base ref={ ref } name={ name } />
    }</Control>,
    {
      context: {
        animatronics: {
          registerComponent: (name, domNode) => {
            actualDOMNode = domNode;
          },
          unregisterComponent: () => {},
        },
      },
    }
  );

  wrapper.setProps({ name: 'foobar' });
  wrapper.update();
  const expectedDOMNode = wrapper.find('div').getDOMNode();
  expect(actualDOMNode).toBe(expectedDOMNode);
});

test('<Control> should unregister when it unmounts', () => {
  const Base = () => <div />;
  const unregisterComponent = sinon.spy();

  const wrapper = mount(
    <Control name='base'>{ () =>
      <Base />
    }</Control>,
    {
      context: {
        animatronics: {
          registerComponent: () => {},
          unregisterComponent,
        }
      }
    }
  );
  wrapper.unmount();
  expect(unregisterComponent.calledOnce).toBe(true);
});

test('<Control> should throw when it receives an invalid "name"', () => {
  const Base = () => <div />;

  expect(() => {
    mount(
      <Control>{ () =>
        <Base />
      }</Control>,
      {
        context: {
          animatronics: {
            registerComponent: () => {},
            unregisterComponent: () => {},
          }
        }
      }
    );
  }).toThrow(/must receive a string "name" prop/);
});

test('<Control> should throw when it receives invalid "children"', () => {
  expect(() => {
    mount(
      <Control name='base'></Control>,
      {
        context: {
          animatronics: {
            registerComponent: () => {},
            unregisterComponent: () => {},
          }
        }
      }
    );
  }).toThrow(/must receive a function "children" prop/);
});

test('<Control> should throw when "animatronics" is not in the context', () => {
  const Base = () => <div />;

  expect(() => {
    mount(
      <Control name='base'>{() =>
        <Base />
      }</Control>,
      {
        context: {}
      }
    );
  }).toThrow(/forgot to use an animatronics component/);
});
