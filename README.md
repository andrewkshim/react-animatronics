# react-animatronics

React Animatronics lets you write declarative, coordinated animations
for your React components.


## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Full Documentation](#full-documentation)


## Installation

```
# npm
npm install --save react-animatronics

# yarn
yarn add react-animatronics
```


## Usage

React Animatronics provides higher-order components that let you describe
animations involving multiple components scattered throughout your component
hierarchy.

A quick example:

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
      <button onClick={() => playAnimation()}>Play animation!</button>
      <Square/>
    </div>
  )
);
```

This example will render a button and a blue square. Clicking the
button will cause the square to animate for 500ms to a height of
200px.


## Full Documentation

- [withControl](#withControl)
- [withAnimatronics](#withAnimatronics)


### <a name='withControl'></a> `withControl(string): (ReactComponent) => (ReactComponent)`

`withControl` is a function that returns another function. It takes a string as
its only argument. The returned function takes a React component as its only
argument and returns a final React component (i.e. it's a higher-order
component). That final component is a "controlled component".

The string is what you use to reference the component in
[`withAnimatronics`](#withAnimatronics):

```js
const ControlledComponent = withControl('helloWorld')(
  ({ animatronicStyles }) => <div style={ animatronicStyles }/>
);

const App = withAnimatronics(() => [
  {
    // The helloWorld in this object refers to the 'helloWorld' string
    // passed into withControl.
    helloWorld: {
      duration: 500,
      start: { left: '100px' },
      end: { left: '200px' },
    }
  }
])(() => <ControlledComponent/>);
```

The component you pass in will receive an additional prop called
`animatronicStyles`. This is an object that contains the style
values for the current animation frame, and you'll probably want to
use those styles in your component. You see this in the above example,
but here's another example for good measure:

```js
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

# Using object spread.
const Square = withControl('square')(
  ({ animatronicStyles }) => (
    <div
      style={{
        height: '100px',
        width: '100px',
        backgroundColor: 'blue',
        ...animatronicStyles
      }}
    />
  )
);
```

### <a name='withAnimatronics'></a> `withAnimatronics(() => Array|Object): (ReactComponent) => (ReactComponent)`

`withAnimatronics` is a function that takes a single, function argument. It
returns a function that is a higher-order component.

```js
const higherOrderComponent = withAnimatronics(() => {});
const FinalComponent = higherOrderComponent(YourComponent);

# Or, on one line.
const FinalComponent = withAnimatronics(() => {})(YourComponent);
```

The `FinalComponent` is an "animatronics component" that knows how to run
animations involving any of its descendant [controlled components](#withControl).

The function you pass into `withAnimatronics` must return "animation sequences",
which are described in the next section.

#### Animation Sequences

The function you pass into `withAnimatronics` is called `createAnimationSequence()`
because it returns one or more "animation sequences":

```js
const createAnimationSequence = () => {
  return animationSequence;
};

const higherOrderComponent = withAnimatronics(createAnimationSequence);
```

An animation sequence is an array of objects, where each object represents
a single "phase" of the animation. Each phase describes the styles for your
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
const createAnimationSequence = () => {
  return animationSequence;
};

const higherOrderComponent = withAnimatronics(createAnimationSequence);
```

#### <a name='multiple-named-animation-sequences'></a> Multiple, Named Animation Sequences

When `createAnimationSequence` returns an array, you can only use that
one animation sequence. For more complex use cases, you may want to describe
multiple, named animation sequences. To do this, you can have `createAnimationSequence`
return an object where the keys are arbitrary names and the values are
animation sequence arrays.

```
const createAnimationSequence = () => {
  return {
    animationSequence1: [ /* ... */ ],
    animationSequence2: [ /* ... */ ],
  }
}
```

You can then choose to execute either `"animationSequence1"` or `"animationSequence2"`
when it comes time to run your animations. As far as running your animations goes,
that's in the next section.


#### Executing your Animations

Once you've setup [`withControl`](#withControl) and [`withAnimatronics`](#withAnimatronics),
you can execute your animations.

The component you pass into the `withAnimatronics` higher-order component can execute
animations via two props:

```js
const createAnimationSequence = () => [];
const higherOrderComponent = withAnimatronics(createAnimationSequence);

// YourComponent receives playAnimation and rewindAnimation as props from
// the higherOrderComponent.
const YourComponent = ({ playAnimation, rewindAnimation }) => <div/>;

const FinalComponent = higherOrderComponent(YourComponent);
```

##### <a name='playAnimation'></a> `playAnimation(string?, Function?): void`

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

##### <a name='rewindAnimation'></a> `rewindAnimation(Function?): void`

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
playAnimation();

rewindAnimation(() => {
  console.log('Animation done rewinding');
});
```

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

##### Custom Easing Function

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
[bezier-easing][5] library and it included for convenience. The default easing
is `BezierEasing(0.4, 0.0, 0.2, 1)` which is the [standard ease-in-out][6] from
Material Design.

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

This will animate your components just like [react-motion][7] does.

If you specify a `stiffness` you must also include a `damping`, and
you cannot include a `duration` or `easingFn`.

In other words, your animations can use either time _or_ springs, not both.

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

### More Examples

You can find more examples in the [`examples/`](./examples) folder.


[5]:https://github.com/gre/bezier-easing
[6]:https://material.io/guidelines/motion/duration-easing.html
[7]:https://github.com/chenglou/react-motion
