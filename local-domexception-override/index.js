if (typeof globalThis.DOMException === 'undefined') {
  module.exports = class DOMException extends Error {
    constructor(message, name) {
      super(message);
      this.name = name || 'DOMException';
    }
  };
} else {
  module.exports = globalThis.DOMException;
}
