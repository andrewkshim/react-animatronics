# react-animatronics

Declarative, coordinated animations for React components.

[![build status](https://img.shields.io/travis/andrewkshim/react-animatronics/master.svg?style=flat-square)](https://travis-ci.org/andrewkshim/react-animatronics)
[![npm version](https://img.shields.io/npm/v/react-animatronics.svg?style=flat-square)](https://www.npmjs.com/package/react-animatronics)
[![license](https://img.shields.io/github/license/andrewkshim/react-animatronics.svg?style=flat-square)](https://github.com/andrewkshim/react-animatronics/blob/master/LICENSE)


## Table of Contents

- [Installation](#installation)
- [Quick Intro](#quick-intro)
- [Documentation](#documentation)


## Installation

```bash
# npm
npm install --save react-animatronics

# yarn
yarn add react-animatronics
```


## Quick Intro

React-animatronics exposes a simple API that allows you to declare complex
animations involving multiple React components.

If you learn by looking at code first, here's an example demonstrating some of
what react-animatronics can do:

```js
import React from 'react'
import { Animatronics, Control } from 'react-animatronics'

const Square = ({ style, animatronicStyles }) => (
  <div
    style={{
      height: '100px',
      width: '100px',
      cursor: 'pointer',
      position: 'absolute',
      ...style,
      ...animatronicStyles
    }}
  />
);

const SquareOne = () => (
  <Control name='squareOne'>{
    ({ animatronicStyles }) => (
      <Square
        style={{
          backgroundColor: 'blue',
          top: '0px',
          left: '0px'
        }}
        animatronicStyles={ animatronicStyles }
      />
    )
  }</Control>
);

const SquareTwo = () => (
  <Control name='squareTwo'>{
    ({ animatronicStyles }) => (
      <Square
        style={{
          backgroundColor: 'red',
          top: '200px',
          left: '0px'
        }}
        animatronicStyles={ animatronicStyles }
      />
    )
  }</Control>
);

const SquareThree = () => (
  <Control name='squareThree'>{
    ({ animatronicStyles }) => (
      <Square
        style={{
          backgroundColor: 'green',
          top: '0px',
          left: '200px'
        }}
        animatronicStyles={ animatronicStyles }
      />
    )
  }</Control>
);

const animations = () => [
  {
    squareOne: {
      duration: 500,
      from: {
        top: '0px',
        left: '0px'
      },
      to: {
        top: '200px',
        left: '200px'
      }
    },
    squareTwo: {
      duration: 500,
      from: {
        top: '200px',
        left: '0px'
      },
      to: {
        top: '0px',
        left: '0px'
      }
    },
  },
  {
    squareOne: {
      duration: 500,
      from: {
        top: '200px',
        left: '200px'
      },
      to: {
        top: '0px',
        left: '200px'
      }
    },
    squareThree: {
      duration: 500,
      from: {
        top: '0px',
        left: '200px'
      },
      to: {
        top: '200px',
        left: '0px'
      }
    }
  }
];

const App = () => (
  <Animatronics animations={ animations }>{
    ({ playAnimation, reset }) => (
      <div
        style={{ cursor: 'pointer' }}
        onClick={() => {
          playAnimation(() => {
            setTimeout(reset, 500);
          });
        }}
      >
        <SquareOne />
        <SquareTwo />
        <SquareThree />
      </div>
    )
  }</Animatronics>

);
```

Live CodeSandbox example: https://codesandbox.io/s/wq39rlvnk7

Read on for a more thorough understanding of what react-animatronics can do.


## Documentation

- [Walkthrough][walkthrough] - for those new to react-animatronics
- [API Reference][api_reference] - for those that just need to remember how to do "that one thing"


[walkthrough]:./docs/walkthrough.md
[api_reference]:./docs/api_reference.md
[new_issue]:https://github.com/andrewkshim/react-animatronics/issues/new
