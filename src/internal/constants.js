// @flow
/**
 * Constants: where any shared constants go.
 *
 * @module internal/constants
 */

const MS_PER_ANIMATION_FRAME: number = 1000 / 60;

const SECONDS_PER_ANIMATION_FRAME: number = MS_PER_ANIMATION_FRAME / 1000;

const DEFAULT_ANIMATION_NAME: string = 'DEFAULT_ANIMATION_NAME';

const Constants = {
  MS_PER_ANIMATION_FRAME,
  SECONDS_PER_ANIMATION_FRAME,
  DEFAULT_ANIMATION_NAME,
};

export default Constants;
