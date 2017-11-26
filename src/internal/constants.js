// @flow
/**
 * Constants: where any shared constants go.
 *
 * @module internal/constants
 */
import BezierEasing from 'bezier-easing'

export const MS_PER_ANIMATION_FRAME: number = 1000 / 60;

export const SECONDS_PER_ANIMATION_FRAME: number = MS_PER_ANIMATION_FRAME / 1000;

export const DEFAULT_ANIMATION_NAME: string = 'default';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const IS_WINDOW_AVAILABLE = typeof window !== 'undefined';

export const IS_RAF_AVAILABLE: boolean = (
  IS_WINDOW_AVAILABLE
  && window.requestAnimationFrame
);

export const DEFAULT_REQUEST_ANIMATION_FRAME: Function = (
  IS_RAF_AVAILABLE
    ? requestAnimationFrame
    : callback => setTimeout(callback, MS_PER_ANIMATION_FRAME)
);

export const DEFAULT_CANCEL_ANIMATION_FRAME: Function = (
  IS_RAF_AVAILABLE
    ? cancelAnimationFrame
    : clearTimeout
);

export const DEFAULT_SET_TIMEOUT: Function = (
  IS_WINDOW_AVAILABLE
    ? window.setTimeout.bind(window)
    : setTimeout
);

export const DEFAULT_CLEAR_TIMEOUT: Function = (
  IS_WINDOW_AVAILABLE
    ? window.clearTimeout.bind(window)
    : clearTimeout
);

export const DEFAULT_NOW: Function = Date.now;

export const DEFAULT_EASING_FN = BezierEasing(0.4, 0.0, 0.2, 1);
