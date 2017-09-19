const BETWEEN_PAREN_REGEX = /\(([^)]+)\)/;
const NUMBER_REGEX = /\d+/;

export const parseStyle = style => {
  if (typeof style === 'number') {
    return {
      value: style,
      unit: 'px',
    };
  } else if (style.indexOf('(') > -1) {
    const openParenIndex = style.indexOf('(');
    const matches = BETWEEN_PAREN_REGEX.exec(style);
    return {
      transformFn: style.slice(0, openParenIndex),
      ...parseStyle(matches[1]),
    };
  } else {
    const matches = NUMBER_REGEX.exec(style);
    const value = matches[0];
    return {
      value: parseFloat(value),
      unit: style.slice(value.length),
    };
  }
}

export const calculateDifference = (parsedStartStyle, parsedEndStyle) => {
  return parsedEndStyle.value - parsedStartStyle.value;
}

export const updateStyleValue = (parsedStyle, delta) => {
  return {
    ...parsedStyle,
    value: parsedStyle.value + delta,
  };
}

export const reconstructStyle = ({ transformFn, value, unit }) => {
  return transformFn ? `${transformFn}(${value}${unit})` : `${value}${unit}`;
}
