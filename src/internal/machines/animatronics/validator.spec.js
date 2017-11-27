import {
  throwIfAnimationNotValid,
  throwIfPhaseNotValid,
} from './validator'

test('machines/animatronics/validator/throwIfAnimationNotValid', () => {
  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      stiffness: 200,
      damping: 20,
    }),
  ).toThrow(/must specify either/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      stiffness: 20,
    }),
  ).toThrow(/with both a 'duration' and a 'stiffness'/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      damping: 20,
    })
  ).toThrow(/with both a 'duration' and a 'damping'/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 'foobar',
    })
  ).toThrow(/'duration' must always be a number/);

  expect(
    () => throwIfAnimationNotValid({
      stiffness: 'foobar',
      damping: 20,
    })
  ).toThrow(/'stiffness' must always be a number/);

  expect(
    () => throwIfAnimationNotValid({
      stiffness: 200,
      damping: 'foobar',
    })
  ).toThrow(/'damping' must always be a number/);

  expect(
    () => throwIfAnimationNotValid({
      stiffness: 200,
    }),
  ).toThrow(/with a 'stiffness' but not a 'damping'/);

  expect(
    () => throwIfAnimationNotValid({
      damping: 20,
    })
  ).toThrow(/with a 'damping' but not a 'stiffness'/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: {},
    })
  ).toThrow(/with a 'from' but not an 'to'/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      to: {},
    })
  ).toThrow(/with an 'to' but not a 'from'/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: 'foobar',
      to: {},
    })
  ).toThrow(/'from' must always be a plain object/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: {},
      to: 'foobar',
    })
  ).toThrow(/'to' must always be a plain object/);

  expect(
    () => throwIfAnimationNotValid({
      from: {
        scaleA: 0,
      },
      to: {
        scaleA: 1,
      }
    })
  ).toThrow(/specify one or the other/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      delay: 'foobar',
      from: {},
      to: {},
    })
  ).toThrow(/'delay' must always be a number/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: {},
      to: {},
    })
  ).not.toThrow();

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: { 'box-shadow': '10px 20px blue, 30px 40px red' },
      to: { 'box-shadow': '0px 0px black' },
    })
  ).toThrow(/different number of box-shadows/);

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: { 'box-shadow': '10px 20px blue, 30px 40px red' },
      to: { 'box-shadow': '0px 0px black, 0px 0px black' },
    })
  ).not.toThrow();

  expect(
    () => throwIfAnimationNotValid({
      duration: 100,
      from: { 'box-shadow': 'inset 10px 20px blue' },
      to: { 'box-shadow': '0px 0px black' },
    })
  ).toThrow(/must have "insets" for the same shadow/);
});

test('machines/animatronics/validator/throwIfPhaseNotValid', () => {
  expect(
    () => {
      throwIfPhaseNotValid(
        { bar: {
          duration: 100,
          from: { left: '100px' },
          to: { left: '200px' }
        } },
        { foo: null }
      );
    }
  ).toThrow(/isn't aware of any component with that name/);
});
