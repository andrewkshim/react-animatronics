# react-animatronics

Declarative, coordinated animations for React components.

[![build status](https://img.shields.io/travis/andrewkshim/react-animatronics/master.svg?style=flat-square)](https://travis-ci.org/andrewkshim/react-animatronics)
[![npm version](https://img.shields.io/npm/v/react-animatronics.svg?style=flat-square)](https://www.npmjs.com/package/react-animatronics)
[![license](https://img.shields.io/github/license/andrewkshim/react-animatronics.svg?style=flat-square)](https://github.com/andrewkshim/react-animatronics/blob/master/LICENSE)


## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](#documentation)


## Installation

```bash
# npm
npm install --save react-animatronics

# yarn
yarn add react-animatronics
```


## Quick Start

```js
import React from 'react'
import { Animatronics, Control } from 'react-animatronics'

const animations = () => [
  {
    hello: {
      duration: 500,
      from: {
        left: '0px'
      },
      to: {
        left: '200px'
      }
    }
  }
];

const App = () => (
  <Animatronics animations={ animations }>{
    ({ playAnimation }) => (
      <Control name='hello'>{
        ({ animatronicStyles }) => (
          <div
            style={{
              backgroundColor: 'blue',
              height: '100px',
              width: '100px',
              cursor: 'pointer',
              position: 'absolute',
              ...animatronicStyles
            }}
            onClick={() => playAnimation()}
          />
        )
      }</Control>
    )
  }</Animatronics>
);
```

Live CodeSandbox example: https://codesandbox.io/s/wq39rlvnk7


## Documentation

- [Walkthrough][walkthrough] - for those new to react-animatronics
- [API Reference][api_reference] - for those that just need to remember how to do "that one thing"


[walkthrough]:./docs/walkthrough.md
[api_reference]:./docs/api_reference.md
[new_issue]:https://github.com/andrewkshim/react-animatronics/issues/new
