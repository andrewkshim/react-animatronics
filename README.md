# react-animatronics

React Animatronics lets you write declarative, coordinated animations
for your React components.

[![build status](https://img.shields.io/travis/andrewkshim/react-animatronics/master.svg?style=flat-square)](https://travis-ci.org/andrewkshim/react-animatronics)
[![npm version](https://img.shields.io/npm/v/react-animatronics.svg?style=flat-square)](https://www.npmjs.com/package/react-animatronics)
[![license](https://img.shields.io/github/license/andrewkshim/react-animatronics.svg?style=flat-square)](https://github.com/andrewkshim/react-animatronics/blob/master/LICENSE)


## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#docs)
  - [withControl](#withControl)
  - [withAnimatronics](#withAnimatronics)
    - [Animation Sequences](#animation-sequences)
    - [Multiple, Named Animation Sequences](#multiple-named-animation-sequences)
    - [Executing your Animations](#executing-your-animations)
      - [playAnimation](#playAnimation)
      - [rewindAnimation](#rewindAnimation)
    - [What can be Animated?](#what-can-be-animated)
    - [More Animation Options](#more-animation-options)
      - [Custom Easing Functions](#custom-easing-functions)
      - [Spring Animations](#spring-animations)
      - [Animation Options Summary](#animation-options-summary)
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
Usage
============================================================
-->
## Usage

React Animatronics provides [higher-order components][hocs] that let you describe
animations involving multiple components scattered throughout your component
hierarchy.

A quick, basic example:

```js
import React from 'react'
import { withAnimatronics, withControl } from 'react-animatronics'

const Square = withControl('square')(
  ({ animatronicStyles }) => (
    <div
      style={{
        height: animatronicStyles.height || '100px',
        width: '100px',
        backgroundColor: 'blue'
      }}
    />
  )
);

const App = withAnimatronics(
  () => [
    {
      square: {
        duration: 500,
        start: { height: '100px' },
        end: { height: '200px' }
      }
    }
  ]
)(
  ({ playAnimation }) => (
    <div>
      <button onClick={() => playAnimation()}>Play animation</button>
      <Square/>
    </div>
  )
);
```

This example will render a button and a blue square. Clicking the
button will cause the square to animate for 500ms to a height of
200px.


<!--
============================================================
API Documentation
============================================================
-->
## <a name='docs'></a> API Documentation

```js
import { withControl, withAnimatronics } from 'react-animatronics'
```

<!--
------------------------------------------------------------
withControl
------------------------------------------------------------
-->
### <a name='withControl'></a> withControl

```
withControl(string): (ReactComponent) => (ReactComponent)
```

`withControl` is a function that returns another function. It takes a string as
its only argument. The returned function takes a React component as its only
argument and returns a final React component (i.e. it's a higher-order
component). That final component is a **controlled component**.

The string is the name you use to reference the component in
[`withAnimatronics`](#withAnimatronics):

```js
const higherOrderComponent = withControl('helloWorld');
const ControlledComponent = higherOrderComponent(
  ({ animatronicStyles }) => <div style={ animatronicStyles }/>
);

// The helloWorld property in the object below corresponds to the 'helloWorld'
// string passed into withControl and the associated animation will be applied
// to the ControlledComponent.
const App = withAnimatronics(() => [
  {
    helloWorld: {
      duration: 500,
      start: { left: '100px' },
      end: { left: '200px' }
    }
  }
])(() => <ControlledComponent/>);
```

We'll go into more detail on `withAnimatronics` later. For now, it's only
important to know that the string you put into `withControl` will be used in
`withAnimatronics`.

The component you pass into the higher-order component will receive an
additional prop called `animatronicStyles`. This is an object that contains the
interpolated style values for the current animation frame. The styles that get
included are determined by what you declare in the `start` and `end` of your
animation — this is another `withAnimatronics` detail we'll go into later.

Here are some ways you can use the `animatronicStyles` in your components:

```js
// If you just want to use the animatronicStyles.
const YourComponent = withControl('square')(
  ({ animatronicStyles }) => (
    <div
      style={ animatronicStyles }
    />
  )
);

// If you have styles you want to keep static, you can use specific
// values from animatronicStyles while keeping other styles unchanged.
const YourComponent = withControl('square')(
  ({ animatronicStyles }) => (
    <div
      style={{
        top: animatronicStyles.top,
        backgroundColor: 'blue'
      }}
    />
  )
);

// If you always want the animatronicStyles to take precedence, you
// can use object spread.
const YourComponent = withControl('square')(
  ({ animatronicStyles }) => (
    <div
      style={{
        top: '100px',
        backgroundColor: 'blue',
        ...animatronicStyles
      }}
    />
  )
);
```


<!--
------------------------------------------------------------
withAnimatronics
------------------------------------------------------------
-->
### <a name='withAnimatronics'></a> withAnimatronics

```js
withAnimatronics(() => Array|Object): (ReactComponent) => (ReactComponent)
```

`withAnimatronics` is a function that takes a single, function argument. It
returns a function that is a higher-order component. The higher-order component
returns a final component that is an **animatronics component**.

```js
const higherOrderComponent = withAnimatronics(() => {});
const AnimatronicsComponent = higherOrderComponent(YourComponent);

// Or, on one line.
const AnimatronicsComponent  = withAnimatronics(() => {})(YourComponent);
```

The animatronics component knows how to run animations involving any of its
descendant [controlled components](#withControl).

The function you pass into `withAnimatronics` must return **animation sequences**,
which are described in the next section.


<!--
------------------------------------------------------------
Animation Sequences
------------------------------------------------------------
-->
#### Animation Sequences

The function you pass into `withAnimatronics` is internally named `createAnimationSequences()`
because it returns one or more **animation sequences**:

```js
const createAnimationSequences = () => {
  return animationSequence;
};

const higherOrderComponent = withAnimatronics(createAnimationSequences);
```

An animation sequence is an array of objects, where each object represents
a single **phase** of the animation. Each phase describes the styles for your
controlled components and how to animate those styles:

```js
// Phase 1 describes two components (square and circle) simultaneously animating
// their top positions from 0px to 100px for a 500ms duration.
const phase1 = {
  square: {
    duration: 500,
    start: { top: '0px' },
    end: { top: '100px' },
  },
  circle: {
    duration: 500,
    start: { top: '0px' },
    end: { top: '100px' },
  }
};

// Phase 2 describes the same two components both animating their top positions
// further from 100px to 200px for a 500ms duration.
const phase2 = {
  square: {
    duration: 500,
    start: { top: '100px' },
    end: { top: '200px' },
  },
  circle: {
    duration: 500,
    start: { top: '100px' },
    end: { top: '200px' },
}

// The order of the phases gets determined by their position in the sequence.
const animationSequence = [ phase1, phase2 ];

// Bringing in the code from the previous example to put it all together.
const createAnimationSequences = () => {
  return animationSequence;
};

const higherOrderComponent = withAnimatronics(createAnimationSequences);
```

In the above example, we're only returning one animation sequence which means
you'll only be able to execute that one sequence. Sometimes you'll want to define
multiple animation sequences so can you execute one of those sequences depending
on what state your components are in.

We cover defining multiple animation sequences in the next section.


<!--
------------------------------------------------------------
Multiple, Named Animation Sequences
------------------------------------------------------------
-->
#### <a name='multiple-named-animation-sequences'></a> Multiple, Named Animation Sequences

When `createAnimationSequences` returns an array, you can only use that
one animation sequence. For more complex use cases, you may want to describe
multiple, named animation sequences. To do this, you can have `createAnimationSequences`
return an object where the keys are arbitrary names and the values are
animation sequence arrays.

```
const createAnimationSequences = () => {
  return {
    animationSequence1: [ /* ... */ ],
    animationSequence2: [ /* ... */ ],
  }
}
```

You can then choose to execute either `"animationSequence1"` or
`"animationSequence2"` (or whatever you decide to name them) when it comes time
to run your animations, which brings us to the next section.


<!--
------------------------------------------------------------
Executing your Animations
------------------------------------------------------------
-->
#### Executing your Animations

Once you've setup [`withControl`](#withControl) and [`withAnimatronics`](#withAnimatronics),
you can execute your animations.

The component you pass into the `withAnimatronics` higher-order component can execute
animations via two props:

```js
const createAnimationSequences = () => [];
const higherOrderComponent = withAnimatronics(createAnimationSequences);

// YourComponent receives playAnimation and rewindAnimation as props from
// the higherOrderComponent.
const YourComponent = ({ playAnimation, rewindAnimation }) => <div/>;

const AnimatronicsComponent = higherOrderComponent(YourComponent);
```

To execute your animations normally, you can call `playAnimation`. In less
common cases, you may want to rewind the last animation with `rewindAnimation`.


<!--
------------------------------------------------------------
playAnimation
------------------------------------------------------------
-->
##### <a name='playAnimation'></a> playAnimation

```js
playAnimation(string?, Function?): void
```

`playAnimation` starts your animations. It's an overloaded function that takes
two optional arguments and returns nothing (how un-functional). It has four
forms:

1. `playAnimation()` — takes no arguments.
2. `playAnimation('name')` — takes a single string argument.
3. `playAnimation(() => {})` — takes a single, callback function argument.
4. `playAnimation('name', () => {})` — takes two arguments, a string and then a callback function.

If you aren't using [multiple, named animation sequences](#multiple-named-animation-sequences),
you don't need to pass a string argument — you can call `playAnimation` with no
arguments or a single, callback function. The callback function will execute
when the animation completes. It takes no arguments and returns nothing:

```js
playAnimation(() => {
  console.log('Animation done');
});
```

If you _are_ using multiple, named animation sequences, you must pass in at
least the string argument — you can call `playAnimation` with the single string
argument or two arguments, the string and the callback function:

```
playAnimation('name', () => {
  console.log('Animation done');
});
```

The string `'name'` refers to the name of the animation sequence you want to run.


<!--
------------------------------------------------------------
rewindAnimation
------------------------------------------------------------
-->
##### <a name='rewindAnimation'></a> rewindAnimation

```js
rewindAnimation(Function?): void
```

`rewindAnimation` reverses the last played animation. It will run the animation
sequence backwards starting from the last phase, and in each phase, it will
switch the `start` and `end` styles. A call to `rewindAnimation` must always be
preceeded with a call to `playAnimation`, otherwise it will throw.  It, too, is
an overloaded function, but it only has two forms:

1. `rewindAnimation()` — takes no arguments.
3. `rewindAnimation(() => {})` — takes a single, callback function argument.

The callback function executes when the animation completes. It takes no arguments
and returns nothing:

```js
// You must always call playAnimation at least once before calling rewindAnimation.
playAnimation();

rewindAnimation(() => {
  console.log('Animation done rewinding');
});
```


<!--
------------------------------------------------------------
What can be Animated?
------------------------------------------------------------
-->
#### <a name='what-can-be-animated'></a> What can be Animated?

React Animatronics can handle a bunch of different style values. Here are some
examples:

```js
{
  duration: 500,
  start: {
    height: '100px',
    left: '200em', // any unit will work
    opacity: 0, // numbers will work too
    transform: 'scale(0.5)' // transforms will animate too!
  },
  end: {
    height: '200px',
    left: '100em',
    opacity: 1,
    transform: 'scale(1.2)'
  }
}
```

There may be some styles that this library won't handle correctly. If you run
into any, please [file an issue][issue] and let me know.


<!--
------------------------------------------------------------
More Animation Options
------------------------------------------------------------
-->
#### More Animation Options

All previous examples have shown timed animations with specified
`durations`:

```js
{
  duration: 500,
  start: { height: '100px' },
  end: { height: '200px' }
}
```

But you have more options available to you.


<!--
------------------------------------------------------------
Custom Easing Functions
------------------------------------------------------------
-->
##### Custom Easing Functions

In each animation frame, the styles will progress from their `start` to `end` values
using a default easing function, but you can provide a custom easing function:

```js
import { BezierEasing } from 'react-animatronics'

{
  duration: 500,
  easingFn: BezierEasing(0.25, 0.75, 0.75, 0.25),
  start: { height: '100px' },
  end: { height: '200px' }
}
```

The `BezierEasing` function in this library is exported directly from the
[bezier-easing][bezier] library and it included for convenience. The default easing
is `BezierEasing(0.4, 0.0, 0.2, 1)` which is the [standard ease-in-out][material] from
Material Design.


<!--
------------------------------------------------------------
Spring Animations
------------------------------------------------------------
-->
##### Spring Animations

If you're a fan of springs, you can do:

```js
{
  stiffness: 170,
  damping: 26,
  start: { height: '100px' },
  end: { height: '200px' }
}
```

This will animate your components just like [react-motion][motion] does.

If you specify a `stiffness` you must also include a `damping`, and
you cannot include a `duration` or `easingFn`.

In other words, your animations can use either time _or_ springs, not both.


<!--
------------------------------------------------------------
Animation Options Summary
------------------------------------------------------------
-->
##### Animation Options Summary

Timed animations attributes:

```js
{
  duration: number,
  easingFn: Function?,
  start: Object,
  end: Object
}
```

Spring animations attributes:

```js
{
  stiffness: number,
  damping: number,
  start: Object,
  end: Object
}
```


<!--
------------------------------------------------------------
Examples
------------------------------------------------------------
-->
### Examples

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
[transition]:https://github.com/reactjs/react-transition-group
