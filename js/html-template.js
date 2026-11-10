/**
 * Tiny HTML template renderer.
 *
 * Purpose: keep the MARKUP of a screen in a real `.html` file and keep only the LOGIC in `.js`.
 * The template files sit in the project root (Footer.html, PublicNavbar.html, ...) so they are easy to find; they are
 * fragments, not standalone pages - open index.html in the browser.
 * A controller (for example components/layout/Footer.js) loads its template once, prepares a plain
 * data object and calls renderTemplate(template, data). The result is a normal React element tree, so
 * the page behaves exactly like a hand-written component (no extra wrapper element is added).
 *
 * Template syntax
 *   {{ path.to.value }}        text or attribute value taken from the data object (null/false -> empty text)
 *   class="a {{ b }}"          values can be mixed with plain text inside attributes
 *   aria-current="{{ x }}"     when the WHOLE value is one {{ }} and it is undefined/null/false the attribute is dropped
 *   data-if="path"             render the element only when the value is truthy   ("!path" = when falsy)
 *   data-for="item in list"    repeat the element for every entry of `list` (also exposes $index)
 *   data-key="item.id"         React key of the repeated element (defaults to the index)
 *   data-on-click="handler"    attach data.handler (any data-on-xxx works: change, submit, keydown ...)
 *   data-icon="Star"           render the icon `Star` from js/icons.js; other attributes become icon props
 *   data-component="Name"      render a registered React component, props come from data-props="path"
 *   <t-fragment>               grouping element that renders only its children (handy with data-for)
 *
 * Whitespace between tags follows the same rules as JSX, so the rendered DOM matches the old React markup.
 */
import React from './react.js';
import * as Icons from './icons.js';

const templateCache = new Map();

const ATTRIBUTE_ALIASES = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  srcset: 'srcSet',
  crossorigin: 'crossOrigin',
  autocomplete: 'autoComplete',
  fetchpriority: 'fetchPriority',
  datetime: 'dateTime'
};
const BOOLEAN_ATTRIBUTES = new Set(['disabled', 'hidden', 'checked', 'required', 'autofocus', 'open', 'selected', 'multiple', 'readonly', 'controls', 'loop', 'muted', 'autoplay']);
const DIRECTIVES = new Set(['data-if', 'data-for', 'data-key', 'data-icon', 'data-component', 'data-props']);
const INTERPOLATION = /\{\{\s*([^}]+?)\s*\}\}/g;

/** Downloads (once) and parses an .html template. `baseUrl` is normally `import.meta.url` of the caller. */
export function loadTemplate(relativeUrl, baseUrl) {
  const url = new URL(relativeUrl, baseUrl).href;
  if (!templateCache.has(url)) {
    templateCache.set(
      url,
      fetch(url).then(async (response) => {
        if (!response.ok) throw new Error(`Cannot load template ${url} (HTTP ${response.status})`);
        return parseTemplate(await response.text());
      })
    );
  }
  return templateCache.get(url);
}

export function parseTemplate(html) {
  const holder = document.createElement('template');
  holder.innerHTML = html;
  return Array.from(holder.content.childNodes).map(convertNode).filter(Boolean);
}

function convertNode(domNode) {
  if (domNode.nodeType === 3) {
    const text = collapseJsxWhitespace(domNode.nodeValue);
    return text === '' ? null : { type: 'text', value: text };
  }
  if (domNode.nodeType !== 1) return null; // comments are documentation only

  const attributes = [];
  const directives = { events: [] };
  for (const { name, value } of Array.from(domNode.attributes)) {
    if (name.startsWith('data-on-')) {
      directives.events.push([`on${name.slice(8, 9).toUpperCase()}${name.slice(9)}`, value.trim()]);
    } else if (DIRECTIVES.has(name)) {
      directives[name] = value.trim();
    } else {
      attributes.push([name, value]);
    }
  }
  return {
    type: 'element',
    tag: domNode.tagName.toLowerCase(),
    attributes,
    directives,
    children: Array.from(domNode.childNodes).map(convertNode).filter(Boolean)
  };
}

/** Same whitespace handling as JSX: indentation and line breaks around tags disappear. */
function collapseJsxWhitespace(text) {
  const lines = text.split(/\r\n|\n|\r/);
  let lastNonEmptyLine = 0;
  lines.forEach((line, index) => { if (/[^ \t]/.test(line)) lastNonEmptyLine = index; });
  let result = '';
  lines.forEach((line, index) => {
    let value = line.replace(/\t/g, ' ');
    if (index !== 0) value = value.replace(/^ +/, '');
    if (index !== lines.length - 1) value = value.replace(/ +$/, '');
    if (value) {
      if (index !== lastNonEmptyLine) value += ' ';
      result += value;
    }
  });
  return result;
}

function lookup(scope, path) {
  let source = path.trim();
  let negate = false;
  if (source.startsWith('!')) { negate = true; source = source.slice(1).trim(); }
  const value = source.split('.').reduce((current, key) => (current == null ? undefined : current[key]), scope);
  return negate ? !value : value;
}

const toText = (value) => (value == null || typeof value === 'boolean' ? '' : String(value));
const interpolateText = (template, scope) => template.replace(INTERPOLATION, (_, path) => toText(lookup(scope, path)));

function resolveAttributeValue(rawValue, scope) {
  const whole = /^\{\{\s*([^}]+?)\s*\}\}$/.exec(rawValue);
  if (whole) return lookup(scope, whole[1]);
  return rawValue.includes('{{') ? interpolateText(rawValue, scope) : rawValue;
}

function parseInlineStyle(css) {
  const style = {};
  css.split(';').forEach((rule) => {
    const index = rule.indexOf(':');
    if (index < 0) return;
    const property = rule.slice(0, index).trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    style[property] = rule.slice(index + 1).trim();
  });
  return style;
}

function buildProps(node, scope, isIcon) {
  const props = {};
  for (const [name, rawValue] of node.attributes) {
    let value = resolveAttributeValue(rawValue, scope);
    if (value === undefined || value === null || value === false) continue;
    if (name === 'style' && typeof value === 'string') value = parseInlineStyle(value);
    else if (BOOLEAN_ATTRIBUTES.has(name) && value === '') value = true;
    else if (isIcon && typeof value === 'string' && value !== '' && !Number.isNaN(Number(value))) value = Number(value);
    const propName = isIcon && name === 'stroke-width' ? 'strokeWidth' : (ATTRIBUTE_ALIASES[name] || name);
    props[propName] = value;
  }
  for (const [eventName, handlerPath] of node.directives.events) {
    const handler = lookup(scope, handlerPath);
    if (typeof handler === 'function') props[eventName] = handler;
  }
  return props;
}

/** Renders one node. A data-for element returns an array (one keyed element per entry). */
function renderNode(node, scope, context) {
  if (node.type === 'text') return interpolateText(node.value, scope);

  const loop = node.directives['data-for'];
  if (!loop) return renderElement(node, scope, context, undefined);

  const match = /^\s*(\w+)\s+in\s+([\w.]+)\s*$/.exec(loop);
  if (!match) throw new Error(`Invalid data-for="${loop}"`);
  const [, itemName, listPath] = match;
  const list = lookup(scope, listPath) || [];
  return list.map((item, index) => {
    const itemScope = { ...scope, [itemName]: item, $index: index };
    const key = node.directives['data-key'] ? lookup(itemScope, node.directives['data-key']) : index;
    return renderElement(node, itemScope, context, key);
  });
}

function renderElement(node, scope, context, key) {
  const { directives } = node;
  if (directives['data-if'] !== undefined && !lookup(scope, directives['data-if'])) return null;

  const withKey = (props) => (key === undefined ? props : { ...props, key });
  const renderChildren = () => node.children.map((child) => renderNode(child, scope, context));

  if (node.tag === 't-fragment') {
    return React.createElement(React.Fragment, withKey(null), ...renderChildren());
  }
  if (directives['data-icon']) {
    const iconName = interpolateText(directives['data-icon'], scope);
    const Icon = Icons[iconName];
    if (!Icon) throw new Error(`Unknown icon "${iconName}" in template`);
    return React.createElement(Icon, withKey(buildProps(node, scope, true)));
  }
  if (directives['data-component']) {
    const Component = context.components?.[directives['data-component']];
    if (!Component) throw new Error(`Component "${directives['data-component']}" is not registered for this template`);
    const props = directives['data-props'] ? lookup(scope, directives['data-props']) : {};
    return React.createElement(Component, withKey(props));
  }
  return React.createElement(node.tag, withKey(buildProps(node, scope, false)), ...renderChildren());
}

/** Renders a parsed template with `data`. Returns one React element (or a fragment for several roots). */
export function renderTemplate(template, data, context = {}) {
  const roots = template.map((node) => renderNode(node, data, context)).filter((node) => node !== null);
  return roots.length === 1 ? roots[0] : React.createElement(React.Fragment, null, ...roots);
}
