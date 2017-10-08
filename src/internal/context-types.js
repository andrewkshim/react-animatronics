/**
 * ContextTypes: provides the context types for all internal components
 *
 * @module internal/context-types
 */

import PropTypes from 'prop-types'

export default  {
  animatronics: PropTypes.shape({
    registerComponent: PropTypes.func.isRequired,
    unregisterComponent: PropTypes.func.isRequired,
  }).isRequired,
};
