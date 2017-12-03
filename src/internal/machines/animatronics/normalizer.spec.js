import { normalizeCombinedTransforms } from './normalizer'

// TODO: There's probably a better way to mock out getComputedStyle, but for
// now, creating a fake "style" object is easy (albeit dirty) and it works.
const makeFakeStyle = () => ({
  get top() {
    return this._top;
  },
  set top(nextTop) {
    if (!nextTop) {
      return;
    } else if (nextTop.includes('rem')) {
      const num = parseFloat(nextTop.replace('rem'));
      this._top = `${ num * 10 }px`;
    } else if (nextTop.includes('px')) {
      this._top = nextTop;
    } else {
      throw new Error(`fake style top received invalid nextTop: ${ nextTop }`);
    }
  }
});

describe('normalizeCombinedTransforms', () => {
  const getComputedStyle = node => node.style;
  const node = { style: makeFakeStyle() };

  test('should handle basic styles', () => {
    const animations = {
      from: { transform: 'translateX(0px) translateY(0px)' },
      to: { transform: 'translateX(10rem) translateY(-100px)' }
    };
    expect(normalizeCombinedTransforms(
      getComputedStyle,
      node,
      animations
    )).toEqual({
      normalizedFromTransform: {
        translateX: 'translateX(0px)',
        translateY: 'translateY(0px)'
      },
      normalizedToTransform: {
        translateX: 'translateX(100px)',
        translateY: 'translateY(-100px)'
      },
    });
  });
});
