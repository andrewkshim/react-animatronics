# react-animatronics

React Animatronics lets you write declarative, coordinated animations
for your React components.

[![build status](https://img.shields.io/travis/andrewkshim/react-animatronics/master.svg?style=flat-square)](https://travis-ci.org/andrewkshim/react-animatronics)
[![npm version](https://img.shields.io/npm/v/react-animatronics.svg?style=flat-square)](https://www.npmjs.com/package/react-animatronics)
[![license](https://img.shields.io/github/license/andrewkshim/react-animatronics.svg?style=flat-square)](https://github.com/andrewkshim/react-animatronics/blob/master/LICENSE)


## Table of Contents

- [Installation](#installation)
- [Quick Guide](#quick-guide)
- [Full API Documentation](#docs)
- [Examples](#examples)
- [Alternative Libraries](#alternative-libraries)


## Installation

```bash
# npm
npm install --save react-animatronics

# yarn
yarn add react-animatronics
```


<!--
============================================================
Quick Guide
============================================================
-->
## Quick Guide

React Animatronics provides components that let you describe animations
involving multiple components scattered throughout your component hierarchy.

This section is just a bunch of example code plus some comments. You can get
started just by following the examples, but when you're ready to dig into the
details, take a look at the [Detailed Walkthrough](#detailed-walkthrough).

Each example has an accompanying [CodeSandbox][sandbox] demo link at the end.


### Example 1: Basics

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { Animatronics, Control } from 'react-animatronics'

// The 'Control' component will register itself when it mounts, meaning that it
// can then be "controlled" and animated by the parent 'Animatronics'
// component. Any component that you want to include in your animations must be
// wrapped by a Control. The 'name' prop you pass into Control will be used later
// inside the Animatronics component to reference your controlled component.
// The Control component must have a single child, and that child will receive
// an 'animatronicStyles' prop that is an object containing the interpolated
// styles. See the Rect component directly below.
const ControlledRect = () => (
  <Control name='myRect'>
    <Rect/>
  </Control>
);

// This 'Rect' should not be used directly. Rather, we're going to use the
// 'ControlledRect' above since it's wrapped by the 'Control'. Since the
// Rect is a child of Control, it receives an 'animatronicStyles' prop that
// is an object containing the interpolated styles e.g. '{ left: "42.42px" }'.
// It's up to you how to use the animatronicStyles, you can inject them into
// the "style" prop or do something else. Just don't forget to use them!
const Rect = ({ animatronicStyles }) => (
  <div
    style={{
      // set a default height of '100px' when the component is not animating
      height: animatronicStyles.height || '100px',
      width: '100px',
      backgroundColor: 'blue'
    }}
  />
);

// Similar to the 'Control' component, the 'Animatronics' component is a
// wrapper that must have a single child. That child will receive as props a
// function 'playAnimation' that you can call anytime to run your animations.
// To declare an animation, you must pass in a 'createAnimationSequences'
// function to the Animatronics component. In this example, we're returning
// an array that describes the animation we want to run. There's a bit more to
// this part of the API though, if you're curious, read through the Detailed
// Walkthough's section on createAnimationSequences.
const AnimatedApp = () => (
  <Animatronics createAnimationSequences={() => [
    {
      myRect: {
        duration: 350, // milliseconds
        start: { height: '100px' }, // your starting styles
        end: { height: '200px' } // your ending styles
      }
    }
  ]}>
    <App/>
  </Animatronics>
);

// Just like the 'Rect', the 'App' component should not be used directly since
// it's wrapped by 'Animatronics' in the 'AnimatedApp' component. Since the App
// is the child of Animatronics, it receives a 'playAnimation' function as props.
// You can call playAnimation at any time to execute the animation you declared
// in the Animatronics 'createAnimationSequences' function.
const App = ({ playAnimation }) => (
  <div>
    <button onClick={() => playAnimation()}>
      Play animation
    </button>
    <ControlledRect/>
  </div>
);

// This example will render a button and a blue square. Clicking the button will
// cause the square to animate for 350ms from a height of 100px to 200px.
ReactDOM.render(
  <AnimatedApp/>,
  document.getElementById('root')
);
```

CodeSandbox link: https://codesandbox.io/s/47pyw86jw


### Example 2: HoCs (Higher-Order Components)

I'm a fan of being functional, so react-animatronics provides [higher-order component][hocs]
versions of the `<Animatronics/>` and `<Control/>` components. You can use the functions
`withAnimatronics` and `withControl` much the same way you'd use their component counterparts.
They also work great with [recompose][recompose].

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { withAnimatronics, withControl } from 'react-animatronics'

// Same 'Rect' from Example 1.
const Rect = ({ animatronicStyles }) => (
  <div
    style={{
      // set a default height of '100px' when the component is not animating
      height: animatronicStyles.height || '100px',
      width: '100px',
      backgroundColor: 'blue'
    }}
  />
);

// 'withControl' is a function that takes a string argument that is the same as
// the 'name' prop you'd pass into the <Control/> component. It then returns a
// function that takes the base component as its only argument.
const ControlledRect = withControl('myRect')(Rect);

// Same 'App' from Example 1.
const App = ({ playAnimation }) => (
  <div>
    <button onClick={() => playAnimation()}>
      Play animation
    </button>
    <ControlledRect/>
  </div>
);

// 'withAnimatronics' is a function that takes a function argument that is the
// same as the 'createAnimationSequences' prop you'd pass into the <Animatronics/>
// component. If then returns a function that takes the base component as its
// only argument.
const AnimatedApp = withAnimatronics(() => [
  {
    myRect: {
      duration: 350, // milliseconds
      start: { height: '100px' }, // your starting styles
      end: { height: '200px' } // your ending styles
    }
  }
])(App);

// Just like Example 1, but now your components are powered by HoCs. This
// example will render a button and a blue square. Clicking the button will
// cause the square to animate for 350ms from a height of 100px to 200px.
ReactDOM.render(
  <AnimatedApp/>,
  document.getElementById('root')
);
```

CodeSandbox link: https://codesandbox.io/s/0o4349zlon


### Example 3: Multi-Phase Animations

"Multi-phase animations" sound fancy, but they're simple. Rather than having
your animations do a single thing (having just one phase) like in the previous
examples, you can declare your animations in `createAnimationSequences` to execute
multiple phases that run in sequence, one after the other.

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { withAnimatronics, withControl } from 'react-animatronics'

const Rect = ({ animatronicStyles }) => (
  <div
    style={{
      top: animatronicStyles.top || '20px',
      left: animatronicStyles.left || '20px',
      height: '100px',
      width: '100px',
      backgroundColor: 'blue',
      position: 'absolute',
    }}
  />
);

const ControlledRect = withControl('myRect')(Rect);

const App = ({ playAnimation }) => (
  <div>
    <button onClick={() => playAnimation()}>
      Play animation
    </button>
    <ControlledRect/>
  </div>
);

// This is where things get interesting. Rather than returning just a single-element
// array, we can return an array with as many elements as we want. The animations will
// fire in sequence, one after the other.
const AnimatedApp = withAnimatronics(() => [
  // phase 1: move down
  {
    myRect: {
      duration: 350,
      start: { top: '20px' },
      end: { top: '200px' }
    }
  },
  // phase 2: move to the right
  {
    myRect: {
      duration: 350,
      start: { left: '20px' },
      end: { left: '200px' }
    }
  },
  // phase 3: move diagonally down to the right
  {
    myRect: {
      duration: 350,
      start: { top: '200px', left: '200px' },
      end: { top: '300px', left: '300px' }
    }
  }
])(App);

// In this example, you'll see a blue square that animates its position
// in a sequence of moves.
ReactDOM.render(
  <AnimatedApp/>,
  document.getElementById('root')
);
```

CodeSandbox link: https://codesandbox.io/s/r78352vxom


### Example 4: Multi-Component Animations

Another fancy-sounding title but simple concept. Rather than animating a single
component like in the previous examples, you can animate multiple components
(remember to wrap your components with `<Control/>` or `withControl()`).

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { withAnimatronics, withControl } from 'react-animatronics'

const Rect = ({ animatronicStyles }) => (
  <div
    style={{
      top: animatronicStyles.top || '20px',
      left: animatronicStyles.left || '20px',
      height: '100px',
      width: '100px',
      backgroundColor: 'blue',
      position: 'absolute',
    }}
  />
);

const ControlledRect = withControl('myRect')(Rect);

const Circle = ({ animatronicStyles }) => (
  <div
    style={{
      top: animatronicStyles.top || '20px',
      left: animatronicStyles.left || '20px',
      height: '100px',
      width: '100px',
      borderRadius: '50px',
      backgroundColor: 'red',
      position: 'absolute',
    }}
  />
)

const ControlledCircle = withControl('myCircle')(Circle);

const App = ({ playAnimation }) => (
  <div>
    <button onClick={() => playAnimation()}>
      Play animation
    </button>
    <ControlledRect/>
    <ControlledCircle/>
  </div>
);

// Within each phase, you can declare animations for more than one component.
const AnimatedApp = withAnimatronics(() => [
  // phase 1
  {
    myRect: {
      duration: 350,
      start: { top: '20px' },
      end: { top: '200px' }
    },
    myCircle: {
      duration: 350,
      start: { left: '20px' },
      end: { left: '200px' }
    }
  },
  // phase 2
  {
    myRect: {
      duration: 350,
      start: { left: '20px' },
      end: { left: '200px' }
    },
    myCircle: {
      duration: 350,
      start: { top: '20px' },
      end: { top: '200px' }
    }
  },
  // phase 3
  {
    myRect: {
      duration: 350,
      start: { top: '200px', left: '200px' },
      end: { top: '300px', left: '300px' }
    },
    myCircle: {
      duration: 350,
      start: { top: '200px', left: '200px' },
      end: { top: '300px', left: '300px' }
    }
  }
])(App);

// In this example, you'll see a blue square and red circle that animate their
// positions in a sequence of moves.
ReactDOM.render(
  <AnimatedApp/>,
  document.getElementById('root')
);
```

CodeSandbox link: https://codesandbox.io/s/xl4v12nyj4


### Example 5: Refs and DOM Nodes

Wrapping a component with `<Control/>` or `withControl` has a secret effect, it'll
grab the `ref` of your component so you can use it in `createAnimationSequences`.
At the moment, I can think of only one use case for this, but it's a pretty cool one.
When you're declaring your animations, you can reference your components' DOM nodes
and make animations based on their current positions. Enough words, code!

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { withAnimatronics, withControl } from 'react-animatronics'

class Circle extends React.Component {
  render() {
    const { animatronicStyles } = this.props
    return (
      <div
        style={{
          top: animatronicStyles.top || '20px',
          left: animatronicStyles.left || '20px',
          height: '100px',
          width: '100px',
          borderRadius: '50px',
          backgroundColor: 'tomato',
          position: 'absolute',
        }}
      />
    );
  }
}

const ControlledCircleA = withControl('circleA')(Circle);
const ControlledCircleB = withControl('circleB')(Circle);
const ControlledCircleC = withControl('circleC')(Circle);

const App = ({ playAnimation }) => (
  <div>
    <button onClick={() => playAnimation()}>
      Play animation
    </button>
    <ControlledCircleA/>
    <ControlledCircleB/>
    <ControlledCircleC/>
  </div>
);

const AnimatedApp = withAnimatronics(({ circleA, circleB, circleC }) => {
  const { left: leftA, top: topA } = circleA.getBoundingClientRect();
  const { left: leftB, top: topB } = circleB.getBoundingClientRect();
  const { left: leftC, top: topC } = circleC.getBoundingClientRect();
  return [
    // phase 1
    {
      circleA: {
        duration: 350,
        start: { left: '20px' },
        end: { left: '200px' }
      },
      circleB: {
        duration: 350,
        start: { top: '20px', left: '20px' },
        end: { top: '200px', left: '100px' }
      },
      circleC: {
        duration: 350,
        start: { top: '20px', left: '20px' },
        end: { top: '200px', left: '300px' }
      },
    },
    // phase 2
    {
      circleA: {
        duration: 350,
        start: { top: `${topA}px`, left: '200px' },
        end: { top: `${topB}px`, left: `${leftB}px` }
      },
      circleB: {
        duration: 350,
        start: { top: '200px', left: '100px' },
        end: { top: `${topC}px`, left: `${leftC}px` }
      },
      circleC: {
        duration: 350,
        start: { top: '200px', left: '300px' },
        end: { top: `${topA}px`, left: `${leftA}px` }
      },
    }
  ];
}
)(App);

// In this example, you'll see three circles animate into a triangle formation
// and then rotate counter clockwise.
ReactDOM.render(
  <AnimatedApp />,
  document.getElementById('root')
);
```

CodeSandbox link: https://codesandbox.io/s/7wpkolroz0


### Example 6: Delays

You can provide your animations with a `delay` if you want to have the animation
run a little bit later. You can use this to create staggered animations within
your phases.

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { withAnimatronics, withControl } from 'react-animatronics'

class Circle extends React.Component {
  render() {
    const { animatronicStyles } = this.props
    return (
      <div
        style={{
          top: animatronicStyles.top || '20px',
          left: animatronicStyles.left || '20px',
          height: '100px',
          width: '100px',
          borderRadius: '50px',
          backgroundColor: 'lavender',
          position: 'absolute',
        }}
      />
    );
  }
}

const ControlledCircleA = withControl('circleA')(Circle);
const ControlledCircleB = withControl('circleB')(Circle);
const ControlledCircleC = withControl('circleC')(Circle);

const App = ({ playAnimation }) => (
  <div>
    <button onClick={() => playAnimation()}>
      Play animation
    </button>
    <ControlledCircleA/>
    <ControlledCircleB/>
    <ControlledCircleC/>
  </div>
);

const AnimatedApp = withAnimatronics(() => {
  return [
    {
      circleA: {
        duration: 800,
        start: { left: '20px' },
        end: { left: '300px' }
      },
      circleB: {
        duration: 800,
        delay: 300,
        start: { left: '20px' },
        end: { left: '300px' }
      },
      circleC: {
        duration: 800,
        delay: 600,
        start: { left: '20px' },
        end: { left: '300px' }

      }
    }
  ];
}
)(App);

// In this example, you'll see three circles animate left in a staggered sequence.
ReactDOM.render(
  <AnimatedApp />,
  document.getElementById('root')
);
```

CodeSandbox link: https://codesandbox.io/s/mj5mnyxr9x


### Example 7: Springs

Up until now, we've used time `durations` in our animations, but we can also
use springs by providing a `stiffness` and `damping`.

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { withAnimatronics, withControl } from 'react-animatronics'

class Circle extends React.Component {
  render() {
    const { animatronicStyles } = this.props
    return (
      <div
        style={{
          top: '20px',
          left: animatronicStyles.left || '20px',
          height: '100px',
          width: '100px',
          borderRadius: '50px',
          backgroundColor: 'lightskyblue',
          position: 'absolute',
        }}
      />
    );
  }
}

const ControlledCircle = withControl('myCircle')(Circle);

const App = ({ playAnimation }) => (
  <div>
    <button onClick={() => playAnimation()}>
      Play animation
    </button>
    <ControlledCircle />
  </div>
);

const AnimatedApp = withAnimatronics(() => {
  return [
    {
      myCircle: {
        stiffness: 200,
        damping: 5,
        start: { left: '20px' },
        end: { left: '300px' }
      }
    }
  ];
}
)(App);

// This example shows a blue circle that will animate its left position in a
// "springy" way. The circle will bounce left and right before settling into
// its final position.
ReactDOM.render(
  <AnimatedApp />,
  document.getElementById('root')
);
```

CodeSandbox link: https://codesandbox.io/s/3r61zv3lx6

You'll be familiar with springs if you've used [react-motion][motion]. If this
is the first time you've encountered them, I highly recommend you look into
react-motion because it's all about springs and their docs provide a much
better overview on springs.

If you don't have time for that, I'll attempt a quick explanation (fair
warning, I'm not a physicist and my explanation won't use precise language).
"Springs" model physical springs and aren't subject to the notion of time
(which is why we don't specify a `duration`). It's as if you're applying a
force to whatever thing you're animating, and then friction/damping eventually
reduce that force to zero.

The `stiffness` refers to how "springy" the spring is — if the stiffness is
higher, the spring will bounce back with more force. The `damping` refers to
how much the spring "slows down" — if the damping is higher, the force applied
to the spring will go down to zero faster. In my experience, the best way to
understand spring animations is to go in and tweak the `stiffness` and `damping`
parameters to see how they affect the animation.


### Example 8: Dynamic Components

Sometimes you'll want to declare animations for dyanmic components — components
that aren't known beforehand. All the previous examples demonstrated animations
that choreographed components which we already knew were available to us, but
there's a way to declare animations for components that are rendered later.

To do that, you can pass in a new `createAnimationSequences` prop to the component
you wrapped with `<Animatronics/>` or `withAnimatronics`.

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { withAnimatronics, withControl } from 'react-animatronics'

class Letters extends React.Component {

  componentDidMount() {
    const { playAnimation } = this.props;
    playAnimation();
  }

  componentDidUpdate() {
    const { playAnimation } = this.props;
    playAnimation();
  }

  render() {
    const { text } = this.props;
    return (
      <div>{
        text.split('').map((letter, index) => {
          const ControlledLetter = withControl(`${letter}-${index}`)(
            ({ animatronicStyles }) => (
              <div
                style={{
                  backgroundColor: 'lightgreen',
                  display: 'inline-block',
                  height: '30px',
                  lineHeight: '30px',
                  margin: '3px',
                  textAlign: 'center',
                  width: '30px',
                  transform: animatronicStyles.transform || 'scale(0)',
                }}
              >
                {letter}
              </div>
            )
          );
          return <ControlledLetter key={index} />;
        })
      }</div>
    );
  }
}

// Intentionally returning an empty array in `createAnimationSequences` because we're
// going to be providing it later as a prop (see the <App/> render method below).
const AnimatedLetters = withAnimatronics(() => [])(Letters);

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
      shouldRenderLetters: false,
    };
  }

  render() {
    const { text, shouldRenderLetters } = this.state;
    return (
      <div>
        <input
          placeholder='Type something then click play'
          value={text}
          onChange={
            ev => this.setState({ text: ev.target.value })
          }
          style={{
            width: '200px',
            display: 'inline-block'
          }}
        />
        <button onClick={
          () => this.setState(
            state => ({ shouldRenderLetters: !state.shouldRenderLetters })
          )
        }>
          Play animation
        </button>
        {(!text || !shouldRenderLetters) ? null : (
          <AnimatedLetters
            text={text}
            createAnimationSequences={() =>
              [
                text.split('').reduce(
                  (animations, letter, index) => {
                    animations[`${letter}-${index}`] = {
                      duration: 250,
                      delay: index * 100,
                      start: { transform: 'scale(0)' },
                      end: { transform: 'scale(1)' }
                    }
                    return animations;
                  },
                  {}
                )
              ]
            }
          />
        )}
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
```

CodeSandbox link: https://codesandbox.io/s/v0ko8zjm05

This is the most dense example. The main idea is that you're passing in an
updated `createAnimationSequences` prop to the `<AniamtedLetters/>` component
every time the `text` updates. Then, when the `<Letters/>` component renders,
it will create new controlled components based on the `text`, and it will
animate those controlled components appropriately.

Admittedly, the developer experience around this use case can be improved. If you
use react-animatronics for animating dynamic components and have suggestions,
please [create an issue][issue] and let me know.


<!--
------------------------------------------------------------
Full API Documentation
------------------------------------------------------------
-->
## <a name='docs'></a> Full API Documentation

Coming soon.


<!--
------------------------------------------------------------
Examples
------------------------------------------------------------
-->
## Examples

You can find running examples under [`examples/src/`](./examples/src).

To run the examples:

```bash
# clone the repo
git@github.com:andrewkshim/react-animatronics.git

# go into the repo
cd react-animatronics

# install the dependencies
yarn install

# run the examples
yarn run examples

# open localhost:8080 in your browser
```

### Alternative Libraries

- [react-transition-group][transition]
- [react-motion][motion]


<!--
------------------------------------------------------------
Links
------------------------------------------------------------
-->
[bezier]:https://github.com/gre/bezier-easing
[hocs]:https://reactjs.org/docs/higher-order-components.html
[issue]:https://github.com/andrewkshim/react-animatronics/issues/new
[material]:https://material.io/guidelines/motion/duration-easing.html
[motion]:https://github.com/chenglou/react-motion
[recompose]:https://github.com/acdlite/recompose
[sandbox]:https://codesandbox.io/
[transition]:https://github.com/reactjs/react-transition-group
