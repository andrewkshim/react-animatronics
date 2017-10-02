/**
 * polyfills: provides anything related to the browser environment
 * @module internal/polyfills
 */

const IS_RAF_AVAILABLE = (
  typeof window !== 'undefined'
  && window.requestAnimationFrame
);

const DEFAULT_REQUEST_ANIMATION_FRAME = (
  IS_RAF_AVAILABLE
    ? requestAnimationFrame
    : callback => setTimeout(callback, MS_PER_ANIMATION_FRAME)
);

const DEFAULT_CANCEL_ANIMATION_FRAME = (
  IS_RAF_AVAILABLE
    ? cancelAnimationFrame
    : clearTimeout
);

const Polyfills = {
  DEFAULT_REQUEST_ANIMATION_FRAME,
  DEFAULT_CANCEL_ANIMATION_FRAME,
};

export default Polyfills;
