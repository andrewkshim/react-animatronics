# react-animatronics

React Animatronics lets you write declarative, coordinated animations
for your React components.

[![build status](https://img.shields.io/travis/andrewkshim/react-animatronics/master.svg?style=flat-square)](https://travis-ci.org/andrewkshim/react-animatronics)
[![npm version](https://img.shields.io/npm/v/react-animatronics.svg?style=flat-square)](https://www.npmjs.com/package/react-animatronics)
[![license](https://img.shields.io/github/license/andrewkshim/react-animatronics.svg?style=flat-square)](https://github.com/andrewkshim/react-animatronics/blob/master/LICENSE)


## Table of Contents

- [Installation](#installation)
- [Examples](#examples)
- [Full API Documentation](#docs)
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
Examples
============================================================
-->
## Examples

Lots of folks learn best by looking at and playing with actual code, so this
section is a bunch of example code plus some comments. Each example has an
accompanying [CodeSandbox][sandbox] demo link.

You can probably learn to use react-animatronics just by looking through the
examples, but when you're ready to dig into the details, take a look at the
[Full API Documentation](#docs).

### List of Examples

- [Example 1: Basics](#example-1)
- [Example 2: Components](#example-2)
- [Example 3: Multi-Phase Animations](#example-3)
- [Example 4: Multi-Component Animations](#example-4)
- [Example 5: Refs and DOM Nodes](#example-5)
- [Example 6: Delays](#example-6)
- [Example 7: Custom Easing](#example-7)
- [Example 8: Animatable Styles](#example-8)
- [Example 9: Springs](#example-9)
- [Example 10: Named Animations](#example-10)
- [Example 11: Finished Callback](#example-11)
- [Example 12: Canceling Animations](#example-12)
- [Example 13: Dynamic Components](#example-13)


### <a name='example-1'></a> Example 1: Basics

CodeSandbox link: https://codesandbox.io/s/0o4349zlon

I'm a fan of functional programming and composition via [higher-order
components][hocs], so react-animatronics provides higher-order components as
part of its API. You use the functions `withAnimatronics` and `withControl` to
declare your animations.

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { withAnimatronics, withControl } from 'react-animatronics'


// The 'Rect' should not be used directly. Rather, we're going to use the
// 'ControlledRect' below since it's wrapped by 'withControl'. Since the
// Rect is a child of withControl, it receives an 'animatronicStyles' prop that
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


// 'withControl' is a function that takes a string argument for its 'name'
// which you will reference later. It returns a function that takes a base
// component as its only argument. The final component is a "controlled" component
// and it will register itself with react-animatronics so it can be animated by
// the parent 'withAnimatronics' component. Any component that you want to include
// in your animations must be wrapped by withControl.

const ControlledRect = withControl('myRect')(Rect);


// Just like the 'Rect', the 'App' component should not be used directly since
// it's wrapped by 'withAnimatronics' in the 'AnimatedApp' component below.
// Since the App is the child of withAnimatronics, it receives a 'playAnimation'
// function as props. You can call playAnimation at any time to execute the
// animation you declared in the withAnimatronics.

const App = ({ playAnimation }) => (
  <div>
    <button onClick={() => playAnimation()}>
      Play animation
    </button>
    <ControlledRect/>
  </div>
);


// 'withAnimatronics' is a function that takes a function as its only argument,
// and it returns a function that takes a base component. The function argument to
// 'withAnimatronics' should return an array (or an object, but we'll cover that
// later in Example 10) that describes your animations. We'll refer to this function
// as 'createAnimationSequences' throughout these docs.

const AnimatedApp = withAnimatronics(() => [
  {
    myRect: {
      duration: 350, // milliseconds
      start: { height: '100px' }, // your starting styles
      end: { height: '200px' } // your ending styles
    }
  }
])(App);


// This example will render a button and a blue square. Clicking the button will
// cause the square to animate for 350ms from a height of 100px to 200px.

ReactDOM.render(
  <AnimatedApp/>,
  document.getElementById('root')
);
```

These higher-order components work great with great with
[recompose][recompose], but if you're not a fan of stateless components,
react-animatronics also provides a component API, which we cover in the next
section.


### <a name='example-2'></a> Example 2: Components

CodeSandbox link: https://codesandbox.io/s/47pyw86jw

You can use react-animatronic's component-based API if higher-order components
aren't your thing. The `<Animatronics/>` and `<Control/>` are used in much the
same way as their higher-order counterparts.

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { Animatronics, Control } from 'react-animatronics'


// The 'Control' component takes a single 'name' prop that is the same as the
// string argument you'd pass into withControl. You'll use this name to refer to
// your components when you declare your animations. The Control component must
// have a single child, and that child will receive an 'animatronicStyles' prop
// that is the object containing the interpolated styles.

const ControlledRect = () => (
  <Control name='myRect'>
    <Rect/>
  </Control>
);


// The 'Rect' component below is the same as that in Example 1.

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


// The 'Animatronics' component takes a single 'createAnimationSequences' prop
// that is a function which returns your animation declaractions. The Animatronics
// component must have a single child, and that child will receive a 'playAnimation'
// props that is a function you can call to execute your animations.

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


// The 'App' component below is the same as that in Example 1.

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

The rest of the documentation uses the higher-order components, but you can use
the `<Animatronics/>` and `<Control/>` components as drop-in replacements since
the components use the higher-order components internally.


### <a name='example-3'></a> Example 3: Multi-Phase Animations

CodeSandbox link: https://codesandbox.io/s/r78352vxom

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


### <a name='example-4'></a> Example 4: Multi-Component Animations

CodeSandbox link: https://codesandbox.io/s/xl4v12nyj4

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


### <a name='example-5'></a> Example 5: Refs and DOM Nodes

CodeSandbox link: https://codesandbox.io/s/7wpkolroz0

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


### <a name='example-6'></a> Example 6: Delays

CodeSandbox link: https://codesandbox.io/s/mj5mnyxr9x

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


### <a name='example-7'></a> Example 7: Custom Easing

CodeSandbox link: https://codesandbox.io/s/qkypk60l89

react-animatronics uses the [bezier-easing][bezier] library internally,
but it also exports the `BezierEasing` function and allows you to provide
custom easing functions. The default is `BezierEasing(0.4, 0.0, 0.2, 1)`,
which is the ["Standard Curve" from Material Design][material].

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { withAnimatronics, withControl, BezierEasing } from 'react-animatronics'


const Rect = ({ animatronicStyles }) => (
  <div
    style={{
      position: 'absolute',
      height: '100px',
      width: '100px',
      backgroundColor: 'blue',
      top: '30px',
      left: animatronicStyles.left,
    }}
  />
);


const ControlledRect = withControl('myRect')(Rect);


const App = ({ playAnimation }) => (
  <div>
    <button onClick={() => playAnimation()}>
      Play animation
    </button>
    <ControlledRect />
  </div>
);


const AnimatedApp = withAnimatronics(() => [
  {
    // You can declare an 'easingFn' attribute in your animations to customize
    // the easing.
    myRect: {
      duration: 350,
      easingFn: BezierEasing(0.5, 0.5, 0.5, 0.5),
      start: { left: '0px' },
      end: { left: '400px' }
    }
  }
])(App);


// In this example, you'll see a blue rectangle animate left.

ReactDOM.render(
  <AnimatedApp />,
  document.getElementById('root')
);
```


### <a name='example-8'></a> Example 8: Animatable Styles

CodeSandbox link: https://codesandbox.io/s/7wkkvnx4xj

react-animatronics parses the styles you give it and knows how to animate
things like going from '100px' to '200px'. As with most parsing, the
implementation is rather messy, but it handles enough use cases to be helpful.
The following example demonstrates the range of styles you can animate.

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { withAnimatronics, withControl } from 'react-animatronics'


const Rect = ({ animatronicStyles }) => (
  <div
    style={{
      position: 'absolute',
      height: '100px',
      width: '100px',
      backgroundColor: 'blue',
      top: '30px',
      opacity: 0.2,
      transform: 'scale(0.2)',
      ...animatronicStyles,
    }}
  />
);


const ControlledRect = withControl('myRect')(Rect);


const App = ({ playAnimation }) => (
  <div>
    <button onClick={() => {
      playAnimation();
    }}>
      Play animation
    </button>
    <ControlledRect />
  </div>
);


const AnimatedApp = withAnimatronics(() => [
  {
    myRect: {
      duration: 350,
      start: {
        left: '0px', // you can animate strings,
        opacity: 0.2, // numbers,
        transform: 'scale(0.2)' // and even transformations!
      },
      end: {
        left: '300px',
        opacity: 1,
        transform: 'scale(1.2)'
      }
    }
  }
])(App);


ReactDOM.render(
  <AnimatedApp />,
  document.getElementById('root')
);
```

If you find styles that react-animatronics doesn't know how to deal with,
please [create an issue][issue] to let me know.


### <a name='example-9'></a> Example 9: Springs

CodeSandbox link: https://codesandbox.io/s/3r61zv3lx6

Up until now, we've used time `durations` in our animations, but we can use
springs instead by providing a `stiffness` and `damping`.

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


### <a name='example-10'></a> Example 10: Named Animations

CodeSandbox link: https://codesandbox.io/s/3ynwox9w6p

You'll sometimes want to declare multiple, different animations and then
decide at runtime which one to play. You can do this by returning an
object from `createAnimationSequences`. The object should map names
to animation sequences (i.e. strings to arrays).

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { withAnimatronics, withControl } from 'react-animatronics'


const Rect = ({ animatronicStyles }) => (
  <div
    style={{
      position: 'absolute',
      height: '100px',
      width: '100px',
      backgroundColor: 'blue',
      top: '30px',
      ...animatronicStyles,
    }}
  />
);


const ControlledRect = withControl('myRect')(Rect);


// If you've declared multiple, named animations in withAnimatronics (below),
// then you must pass in a string to playAnimation. That string should match
// whatever name you've given to your animation.

const App = ({ playAnimation }) => (
  <div>
    <button onClick={() => playAnimation('moveLeft')}>
      Move left
    </button>
    <button onClick={() => playAnimation('moveRight')}>
      Move right
    </button>
    <ControlledRect />
  </div>
);


// To delcare multiple, named animations, return an object in the
// createAnimationSequences function you pass into withAnimatronics. That object
// should map strings to arrays.  The string keys are the names that you'll pass
// into playAnimation when you want to execute that specific animation. The array
// values are the animation sequence declarations you've been returning from
// createAnimationSequences up until now.

const AnimatedApp = withAnimatronics(() => (
  {
    moveLeft: [
      {
        myRect: {
          duration: 350,
          start: { left: '0px' },
          end: { left: '300px' }
        }
      }
    ],
    moveRight: [
      {
        myRect: {
          duration: 350,
          start: { left: '300px' },
          end: { left: '0px' }
        }
      }
    ]
  }
))(App);


ReactDOM.render(
  <AnimatedApp />,
  document.getElementById('root')
);
```


### <a name='example-11'></a> Example 11: Finished Callback

CodeSandbox link: https://codesandbox.io/s/2m16xmy8j

If you need to do something once your animations finish, you can pass in a callback
function as the last argument to `playAnimation`.

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { withAnimatronics, withControl } from 'react-animatronics'


const Rect = ({ animatronicStyles }) => (
  <div
    style={{
      position: 'absolute',
      height: '100px',
      width: '100px',
      backgroundColor: 'blue',
      top: '30px',
      ...animatronicStyles,
    }}
  />
);


const ControlledRect = withControl('myRect')(Rect);


const App = ({ playAnimation }) => (
  <div>
    <button onClick={() => {
      playAnimation(() => {
        alert('Done');
      });
    }}>
      Play animation
    </button>
    <ControlledRect />
  </div>
);


const AnimatedApp = withAnimatronics(() => [
  {
    myRect: {
      duration: 350,
      start: { left: '0px' },
      end: { left: '300px' }
    }
  }
])(App);


ReactDOM.render(
  <AnimatedApp />,
  document.getElementById('root')
);
```


### <a name='example-12'></a> Example 12: Canceling Animations

CodeSandbox link: https://codesandbox.io/s/5zkkrz0xlk

In addition to `playAnimation`, any components wrapped by `withAnimatronics`
will get `cancelAnimation` as a prop. Call the `cancelAnimation` function
during an animation to cancel it. Note, this will not reset your styles, it
will pause everything and leave your components where they are.

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { withAnimatronics, withControl } from 'react-animatronics'


const Rect = ({ animatronicStyles }) => (
  <div
    style={{
      position: 'absolute',
      height: '100px',
      width: '100px',
      backgroundColor: 'blue',
      top: '30px',
      left: animatronicStyles.left,
    }}
  />
);


const ControlledRect = withControl('myRect')(Rect);


const App = ({ playAnimation, cancelAnimation }) => (
  <div>
    <button onClick={() => {
      playAnimation();
      setTimeout(() => {
        // Cancel the animation before it finishes.
        cancelAnimation();
      }, 500);
    }}>
      Play animation
    </button>
    <div
      // Use this div as a reference. It's width is the same as the "end"
      // position for myRect. If the animation didn't cancel, the rect would
      // reach the end of this div.
      style={{
        border: '2px solid black',
        width: '400px',
      }}
    />
    <ControlledRect />
  </div>
);


const AnimatedApp = withAnimatronics(() => [
  {
    myRect: {
      duration: 2000,
      start: { left: '0px' },
      end: { left: '400px' }
    }
  }
])(App);


// In this example, you'll see a blue rectangle start to animate its left
// position and then stop before it reaches the end.

ReactDOM.render(
  <AnimatedApp />,
  document.getElementById('root')
);
```


### <a name='example-13'></a> Example 13: Dynamic Components

CodeSandbox link: https://codesandbox.io/s/v0ko8zjm05

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


// This example renders a text input and animated letters that correspond to the
// input text.

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
```

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
Contributing
------------------------------------------------------------
-->


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
