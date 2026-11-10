/**
 * Bridge to the locally vendored React runtime.
 * index.html loads js/vendor/react.production.min.js and react-dom.production.min.js
 * before this module, so no bundler, npm install or CDN is needed.
 */
const React = window.React;
const ReactDOM = window.ReactDOM;

if (!React || !ReactDOM) {
  throw new Error('React runtime not found. Load js/vendor/react*.production.min.js before js/main.js.');
}

export default React;
export { React };
export const { Fragment, useCallback, useEffect, useMemo, useRef, useState } = React;
export const { createRoot } = ReactDOM;
