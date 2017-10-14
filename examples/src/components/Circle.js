import React from 'react';

// Need to make this a class component because we use the refs in the animations.
class Circle extends React.Component {
  render() {
    const { dimension, style, animatronicStyles, children } = this.props;
    return (
      <div
        style={{
          position: 'absolute',
          width: `${ dimension }px`,
          height: `${ dimension }px`,
          borderRadius: `${ dimension / 2 }px`,
          boxShadow: `
            2px 3px 11px rgba(0, 0, 0, 0.11),
            2px 3px 11px rgba(0, 0, 0, 0.16)
          `,
          ...style,
          ...animatronicStyles,
        }}
      >
        { children }
      </div>
    );
  }
}

export default Circle;
