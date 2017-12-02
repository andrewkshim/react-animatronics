# API Reference

If you're new to react-animatronics, I suggest going through the
[Walkthrough](./walkthrough.md) first.

API overview:

```js
import {
  Animatronics,
  Control,
  withAnimatronics,
  withControl,
  DebugPanel,
  BezierEasing
} from 'react-animatronics'
```

## Table of Contents

- [\<Animatronics\>](#animatronics)
- [\<Control\>](#control)
- [withAnimatronics](#withAnimatronics)
- [withControl](#withControl)
- [\<DebugPanel\>](#debug)
- [BezierEasing](#bezier)
- [Declaring Animations](#animations)

## <a name='animatronics'></a> \<Animatronics\>

Usage:
```js
import { Animatronics } from 'react-animatronics'

<Animatronics animations={ animations }>{
  ({ playAnimation, cancelAnimation, reset }) => {}
}</Animatronics>
```

`<Animatronics>` is a component that takes two required props:

- `animations`: see the [Declaring Animations](#animations) section
- `children`: must be a function that returns a React element

It will pass the following props to its `children`:

- `playAnimation(name?: string, callback?: Function)`: function that takes an optional string name and optional callback function
  - when called with no arguments, it will run the `"default"` animation and return a promise that resolves when the animation is finished
  - when called with a single `name` argument, it will run the named animation and return a promise that resolves when the animation is finished
  - when called with a single `callback` argument, it will run the `"default"` animation and call the `callback` when the animation is finished
  - when called with a `name` and a `callback` argument, it will run the named animation and call the `callback` when the animation is finished
- `cancelAnimation(name?: string)`: function that takes an optional string name
  - when called with no arguments, it will cancel all currently running animations
  - when called with a `name` argument, it will cancel the currently running, named animation
- `reset()`: function that takes no arguments
  - cancels all currently running animations and sets the `animatronicStyles`
    for every controlled component to the empty object


## <a name='control'></a> \<Control\>

Usage:
```js
import { Control } from 'react-animatronics'

<Animatronics animations={ animations }>{
  () => (
    <Control name={ name }>{
      ({ animatronicStyles }) => {}
    }</Control>
  )
}</Animatronics>
```

`<Control>` is a component that takes two required props:

- `name`: string name to assign to the controlled component
- `children`: must be a function that returns a React element

If will pass the following props to its `children`:

- `animatronicStyles`: arbitrary object that contains interpolated animation values

Every `<Control>` must have an ancestor `<Animatronics>` component.


## <a name='withAnimatronics'></a> withAnimatronics

Usage:
```js
import { withAnimatronics } from 'react-animatronics'

const Component = ({ playAnimation, cancelAnimation, reset }) => {};

const AnimatedComponent = withAnimatronics(animations)(Component);
```

`withAnimatronics` is a function that takes a single argument:

- `animations`: see the [Declaring Animations](#animations) section

It returns a higher-order component and is an interchangeable, alternative to
the `<Animatronics>` component.

## <a name='withControl'></a> withControl

Usage:
```js
import { withControl } from 'react-animatronics'

const Component = ({ animatronicStyles }) => {};

const ControlledComponent = withControl(name)(Component);
```

`withControl` is a function that takes a single arugment:

- `name`: string name to assign to the controlled component

It returns a higher-order component and is an interchangeable, alternative to
the `<Control>` component.

## <a name='debug'></a> \<DebugPanel\>

Usage:
```js
import { DebugPanel } from 'react-animatronics'

<DebugPanel />
```

`<DebugPanel>` is a component that will help you debug any animation that goes
through react-animatronics. It takes no props, so you can simply insert it
anywhere in your app and it will render a panel that allows you to play back
your animations.


## <a name='bezier'></a> BezierEasing

Usage:
```js
import { BezierEasing } from 'react-animatronics'

BezierEasing(0.4, 0.0, 0.2, 1.0)
```

`BezierEasing` is a function that takes four numbers which represent the
control points of a bezier-curve. It comes taken straight from the
[bezier-easing][bezier] library and is meant to be used in animations with
custom `easing`.


## <a name='animations'></a> Declaring Animations

The goal of this section is to understand what the `animations` prop
that you pass into `<Animatronics>` (or `withAnimatronics`) can be:

```js
const animations = /* this is what we care about */

<Animatronics animations={ animations }></Animatronics>
```

We'll start off by saying the `animations` prop is a collection of `Phase`
objects. It can be an array, object, or function. Here's what I mean in terms
of type definitions:

```js
ArrayAnimations = Array<Phase>

ObjectAnimations = {
  [string]: ArrayAnimations
}

FunctionAnimations = DOMNodes => ArrayAnimations|ObjectAnimations

animations = ArrayAnimations|ObjectAnimations|FunctionAnimations
```

As an object, it maps arbitrary animation names to an array of phases.
You can execute the named animations individually by passing the name
into the `playAnimation` function.

As a function, it must return a collection of phases that is either an array
or an object. The function will receive a single object argument of `DOMNodes`
that maps the `<Control>` `name` to the component's DOM element:
```js
DOMNodes = {
  [string]: DOMElement
}
```

The `Phase` object maps the `<Control>` `name` to `Animation` objects:
```js
Phase = {
  [string]: Animation
}
```

The `Animation` object can describe a timed or spring animation:
```js
TimedAnimation = {
  duration: number,
  from: object,
  to: object,
  delay: number, // optional
}

SpringAnimation = {
  stiffness: number,
  damping: number,
  from: object,
  to: object,
  delay: number, // optional
}
```

An `Animation` can also be an array of the objects described above:
```js
Animation = Array<TimedAnimation|SpringAnimation>
```

When declared this way, the animations will execute in parallel.


[bezier]:https://github.com/gre/bezier-easing
