// @flow
import type { Animation, AnimationPhase, DOMNode } from '../../flow-types'

import {
  makeError,
  isUsingTime,
  isUsingSpring,
  stringify,
} from '../../utils'

import {
  BOX_SHADOW,
} from '../../constants'

const hasUnequalBoxShadows = (animation: Animation): boolean => (
  animation.from[BOX_SHADOW]
  && animation.to[BOX_SHADOW]
  && animation.from[BOX_SHADOW].split(',').length !== animation.to[BOX_SHADOW].split(',').length
);

const hasInvalidInsetBoxShadow = (animation: Animation): boolean => (
  animation.from[BOX_SHADOW]
  && animation.to[BOX_SHADOW]
  && (
    animation.from[BOX_SHADOW].split(',').map(shadow => shadow.includes('inset')).join('')
    !== animation.to[BOX_SHADOW].split(',').map(shadow => shadow.includes('inset')).join('')
  )
);

export const throwIfAnimationNotValid = (animation: Animation) => {
  if (isUsingTime(animation) && isUsingSpring(animation)) {
    throw makeError(
      `The following animation declaration is incorrect:`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `Animations must specify either [duration] OR [stiffness, damping],`,
      `they cannot specify all three at once because animating with a`,
      `duration is very different from animating with a spring.`
    );
  } else if (animation.duration != null && animation.stiffness != null) {
    throw makeError(
      `You declared an animation with both a 'duration' and a 'stiffness':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `You should either:`,
      `\n`,
      `    1) remove the 'stiffness'`,
      `\n`,
      `    OR`,
      `\n`,
      `    2) remove the 'duration' and add a 'damping'`,
      `\n`,
      `since animations must either use time or spring, but not both.`,
    );
  } else if (animation.duration != null && animation.damping != null) {
    throw makeError(
      `You declared an animation with both a 'duration' and a 'damping':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `You should either:`,
      `\n`,
      `    1) remove the 'damping'`,
      `\n`,
      `    OR`,
      `\n`,
      `    2) remove the 'duration' and add a 'stiffness'`,
      `\n`,
      `since animations must either use time or spring, but not both.`,
    );
  } else if (animation.stiffness != null && animation.damping == null) {
    throw makeError(
      `You declared an animation with a 'stiffness' but not a 'damping':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `Spring animations must specify both a stiffness and damping,`,
      `so add a 'damping' value to your animation for springy goodness.`
    );
  } else if (animation.stiffness == null && animation.damping != null) {
    throw makeError(
      `You declared an animation with a 'damping' but not a 'stiffness':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `Spring animations must specify both a stiffness and damping,`,
      `so add a 'stiffness' value to your animation for springy goodness.`
    );
  } else if (animation.duration == null && animation.stiffness == null) {
    throw makeError(
      `You declared an animation with neither a 'duration' or 'stiffness':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `You must specify one or the other.`
    );
  } else if (animation.duration != null && typeof animation.duration !== 'number') {
    throw makeError(
      `You declared an animation with an invalid 'duration':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'duration' must always be a number (in milliseconds).`
    );
  } else if (animation.stiffness != null && typeof animation.stiffness !== 'number') {
    throw makeError(
      `You declared an animation with an invalid 'stiffness':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'stiffness' must always be a number.`
    );
  } else if (animation.damping != null && typeof animation.damping !== 'number') {
    throw makeError(
      `You declared an animation with an invalid 'damping':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'damping' must always be a number.`
    );
  } else if (animation.from != null && animation.to == null) {
    throw makeError(
      `You declared an animation with a 'from' but not an 'to':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `Animations must always have an 'to'. They, unlike people, should`,
      `always know where life is going to take them.`
    );
  } else if (animation.from == null && animation.to != null) {
    throw makeError(
      `You declared an animation with an 'to' but not a 'from':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `Animations must always have a 'from'. They, unlike chickens or eggs,`,
      `should know exactly where the beginning is.`
    );
  } else if (animation.from != null && typeof animation.from !== 'object') {
    throw makeError(
      `You declared an animation with an invalid 'from':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'from' must always be a plain object.`
    );
  } else if (animation.to != null && typeof animation.to !== 'object') {
    throw makeError(
      `You declared an animation with an invalid 'to':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'to' must always be a plain object.`
    );
  } else if (animation.delay != null && typeof animation.delay !== 'number') {
    throw makeError(
      `You declared an animation with an invalid 'delay':`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`,
      `The 'delay' must always be a number (in milliseconds).`
    );
  } else if (hasUnequalBoxShadows(animation)) {
    throw makeError(
      `You declared an animation with a different number of box-shadows`,
      `in the "from" and "to". It's unclear what react-animatronics`,
      `should do in this case, so it throws :). Make sure to declare the`,
      `same number of box-shadows in your animation. Here's what your current`,
      `animation looks like:`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`
    );
  } else if (hasInvalidInsetBoxShadow(animation)) {
    throw makeError(
      `You declared an animation with invalid "from" and "to" box-shadows.`,
      `The box-shadows must have "insets" for the same shadow. If you have`,
      `an "inset" in your first shadow in "from", there must be an "inset"`,
      `in your first shadow in "to". Here's what your current animation looks like:`,
      `\n`,
      `${ stringify(animation) }`,
      `\n`
    );
  }
}

export const throwIfPhaseNotValid = (phase: AnimationPhase, nodes: { [string]: DOMNode }) => {
  const validComponents = new Set(Object.keys(nodes));
  Object.keys(phase).forEach(componentName => {
    if (!validComponents.has(componentName)) {
      throw makeError(
        `You've declared an animation for the controlled component: '${ componentName }',`,
        `but react-animatronics isn't aware of any component with that name.`,
        `If you don't know why this is happening, check for the following:`,
        `\n`,
        `    1) Misspelled names in the <Animatronics> "animations" prop`,
        `\n`,
        `    2) Misspelled names in <Control>`,
        `\n`
      );
    }
    const animation = phase[componentName];
    if (Array.isArray(animation)) {
      animation.forEach(throwIfAnimationNotValid);
    } else {
      throwIfAnimationNotValid(animation);
    }
  });
}
