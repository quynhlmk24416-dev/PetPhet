/**
 * Local icon set - a small drop-in replacement for the `lucide-react` package.
 * Icon geometry comes from Lucide (https://lucide.dev, ISC License, Copyright (c) Lucide Contributors).
 * Only the icons used by Pet Phết are included, so no icon library has to be installed.
 *
 * Usage is identical to lucide-react: <Star size={16} className="..." fill="currentColor" />
 */
import React from './react.js';

const defaultAttributes = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

const toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const toCamelCase = (string) => string.replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2) => (p2 ? p2.toUpperCase() : p1.toLowerCase()));
const toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
const mergeClasses = (...classes) =>
  classes.filter((className, index, array) => Boolean(className) && className.trim() !== '' && array.indexOf(className) === index).join(' ').trim();
const hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith('aria-') || prop === 'role' || prop === 'title') return true;
  }
  return false;
};

const Icon = React.forwardRef(
  ({ color = 'currentColor', size = 24, strokeWidth = 2, absoluteStrokeWidth, className = '', children, iconNode, ...rest }, ref) =>
    React.createElement(
      'svg',
      {
        ref,
        ...defaultAttributes,
        width: size,
        height: size,
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth,
        className: mergeClasses('lucide', className),
        ...(!children && !hasA11yProp(rest) && { 'aria-hidden': 'true' }),
        ...rest
      },
      [...iconNode.map(([tag, attrs]) => React.createElement(tag, attrs)), ...(Array.isArray(children) ? children : [children])]
    )
);

function createLucideIcon(iconName, iconNode) {
  const Component = React.forwardRef(({ className, ...props }, ref) =>
    React.createElement(Icon, {
      ref,
      iconNode,
      className: mergeClasses(`lucide-${toKebabCase(toPascalCase(iconName))}`, `lucide-${iconName}`, className),
      ...props
    })
  );
  Component.displayName = toPascalCase(iconName);
  return Component;
}

// ---- Icon geometry ----
const ArrowLeftIcon = createLucideIcon("arrow-left", [
    ["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
    ["path", { d: "M19 12H5", key: "x3x0zl" }]
]);

const ArrowRightIcon = createLucideIcon("arrow-right", [
    ["path", { d: "M5 12h14", key: "1ays0h" }],
    ["path", { d: "m12 5 7 7-7 7", key: "xquz4c" }]
]);

const AwardIcon = createLucideIcon("award", [
    ["path", { d: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526", key: "1yiouv" }],
    ["circle", { cx: "12", cy: "8", r: "6", key: "1vp47v" }]
]);

const BanknoteIcon = createLucideIcon("banknote", [
    ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "2", key: "9lu3g6" }],
    ["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }],
    ["path", { d: "M6 12h.01M18 12h.01", key: "113zkx" }]
]);

const BellIcon = createLucideIcon("bell", [
    ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0", key: "vwvbt9" }],
    ["path", { d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326", key: "11g9vi" }]
]);

const BookOpenIcon = createLucideIcon("book-open", [
    ["path", { d: "M12 7v14", key: "1akyts" }],
    ["path", { d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z", key: "ruj8y" }]
]);

const CalendarIcon = createLucideIcon("calendar", [
    ["path", { d: "M8 2v4", key: "1cmpym" }],
    ["path", { d: "M16 2v4", key: "4m81vk" }],
    ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
    ["path", { d: "M3 10h18", key: "8toen8" }]
]);

const CalendarDaysIcon = createLucideIcon("calendar-days", [
    ["path", { d: "M8 2v4", key: "1cmpym" }],
    ["path", { d: "M16 2v4", key: "4m81vk" }],
    ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
    ["path", { d: "M3 10h18", key: "8toen8" }],
    ["path", { d: "M8 14h.01", key: "6423bh" }],
    ["path", { d: "M12 14h.01", key: "1etili" }],
    ["path", { d: "M16 14h.01", key: "1gbofw" }],
    ["path", { d: "M8 18h.01", key: "lrp35t" }],
    ["path", { d: "M12 18h.01", key: "mhygvu" }],
    ["path", { d: "M16 18h.01", key: "kzsmim" }]
]);

const CheckCheckIcon = createLucideIcon("check-check", [
    ["path", { d: "M18 6 7 17l-5-5", key: "116fxf" }],
    ["path", { d: "m22 10-7.5 7.5L13 16", key: "ke71qq" }]
]);

const ChevronDownIcon = createLucideIcon("chevron-down", [
    ["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]
]);

const CircleAlertIcon = createLucideIcon("circle-alert", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["line", { "x1": "12", "x2": "12", "y1": "8", "y2": "12", key: "1pkeuh" }],
    ["line", { "x1": "12", "x2": "12.01", "y1": "16", "y2": "16", key: "4dfq90" }]
]);

const CircleCheckIcon = createLucideIcon("circle-check", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
]);

const CircleXIcon = createLucideIcon("circle-x", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "m15 9-6 6", key: "1uzhvr" }],
    ["path", { d: "m9 9 6 6", key: "z0biqf" }]
]);

const ClockIcon = createLucideIcon("clock", [
    ["path", { d: "M12 6v6l4 2", key: "mmk7yg" }],
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
]);

const Clock3Icon = createLucideIcon("clock-3", [
    ["path", { d: "M12 6v6h4", key: "135r8i" }],
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
]);

const CopyIcon = createLucideIcon("copy", [
    ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
]);

const CreditCardIcon = createLucideIcon("credit-card", [
    ["rect", { width: "20", height: "14", x: "2", y: "5", rx: "2", key: "ynyp8z" }],
    ["line", { "x1": "2", "x2": "22", "y1": "10", "y2": "10", key: "1b3vmo" }]
]);

const EyeIcon = createLucideIcon("eye", [
    ["path", { d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0", key: "1nclc0" }],
    ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
]);

const EyeOffIcon = createLucideIcon("eye-off", [
    ["path", { d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49", key: "ct8e1f" }],
    ["path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242", key: "151rxh" }],
    ["path", { d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143", key: "13bj9a" }],
    ["path", { d: "m2 2 20 20", key: "1ooewy" }]
]);

const FacebookIcon = createLucideIcon("facebook", [
    ["path", { d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z", key: "1jg4f8" }]
]);

const HeartIcon = createLucideIcon("heart", [
    ["path", { d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5", key: "mvr1a0" }]
]);

const InstagramIcon = createLucideIcon("instagram", [
    ["rect", { width: "20", height: "20", x: "2", y: "2", rx: "5", ry: "5", key: "2e1cvw" }],
    ["path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z", key: "9exkf1" }],
    ["line", { "x1": "17.5", "x2": "17.51", "y1": "6.5", "y2": "6.5", key: "r4j83e" }]
]);

const KeyRoundIcon = createLucideIcon("key-round", [
    ["path", { d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z", key: "1s6t7t" }],
    ["circle", { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor", key: "w0ekpg" }]
]);

const LayoutDashboardIcon = createLucideIcon("layout-dashboard", [
    ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1", key: "10lvy0" }],
    ["rect", { width: "7", height: "5", x: "14", y: "3", rx: "1", key: "16une8" }],
    ["rect", { width: "7", height: "9", x: "14", y: "12", rx: "1", key: "1hutg5" }],
    ["rect", { width: "7", height: "5", x: "3", y: "16", rx: "1", key: "ldoo1y" }]
]);

const LockIcon = createLucideIcon("lock", [
    ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
    ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }]
]);

const LogInIcon = createLucideIcon("log-in", [
    ["path", { d: "m10 17 5-5-5-5", key: "1bsop3" }],
    ["path", { d: "M15 12H3", key: "6jk70r" }],
    ["path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", key: "u53s6r" }]
]);

const LogOutIcon = createLucideIcon("log-out", [
    ["path", { d: "m16 17 5-5-5-5", key: "1bji2h" }],
    ["path", { d: "M21 12H9", key: "dn1m92" }],
    ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }]
]);

const MailIcon = createLucideIcon("mail", [
    ["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7", key: "132q7q" }],
    ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2", key: "izxlao" }]
]);

const MapPinIcon = createLucideIcon("map-pin", [
    ["path", { d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0", key: "1r0f0z" }],
    ["circle", { cx: "12", cy: "10", r: "3", key: "ilqhr7" }]
]);

const MenuIcon = createLucideIcon("menu", [
    ["path", { d: "M4 5h16", key: "1tepv9" }],
    ["path", { d: "M4 12h16", key: "1lakjw" }],
    ["path", { d: "M4 19h16", key: "1djgab" }]
]);

const MessageSquareIcon = createLucideIcon("message-square", [
    ["path", { d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z", key: "18887p" }]
]);

const MessageSquareQuoteIcon = createLucideIcon("message-square-quote", [
    ["path", { d: "M14 14a2 2 0 0 0 2-2V8h-2", key: "1r06pg" }],
    ["path", { d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z", key: "18887p" }],
    ["path", { d: "M8 14a2 2 0 0 0 2-2V8H8", key: "1jzu5j" }]
]);

const PawPrintIcon = createLucideIcon("paw-print", [
    ["circle", { cx: "11", cy: "4", r: "2", key: "vol9p0" }],
    ["circle", { cx: "18", cy: "8", r: "2", key: "17gozi" }],
    ["circle", { cx: "20", cy: "16", r: "2", key: "1v9bxh" }],
    ["path", { d: "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z", key: "1ydw1z" }]
]);

const PenIcon = createLucideIcon("pen", [
    ["path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z", key: "1a8usu" }]
]);

const PenLineIcon = createLucideIcon("pen-line", [
    ["path", { d: "M13 21h8", key: "1jsn5i" }],
    ["path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z", key: "1a8usu" }]
]);

const PhoneIcon = createLucideIcon("phone", [
    ["path", { d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384", key: "9njp5v" }]
]);

const PlusIcon = createLucideIcon("plus", [
    ["path", { d: "M5 12h14", key: "1ays0h" }],
    ["path", { d: "M12 5v14", key: "s699le" }]
]);

const QrCodeIcon = createLucideIcon("qr-code", [
    ["rect", { width: "5", height: "5", x: "3", y: "3", rx: "1", key: "1tu5fj" }],
    ["rect", { width: "5", height: "5", x: "16", y: "3", rx: "1", key: "1v8r4q" }],
    ["rect", { width: "5", height: "5", x: "3", y: "16", rx: "1", key: "1x03jg" }],
    ["path", { d: "M21 16h-3a2 2 0 0 0-2 2v3", key: "177gqh" }],
    ["path", { d: "M21 21v.01", key: "ents32" }],
    ["path", { d: "M12 7v3a2 2 0 0 1-2 2H7", key: "8crl2c" }],
    ["path", { d: "M3 12h.01", key: "nlz23k" }],
    ["path", { d: "M12 3h.01", key: "n36tog" }],
    ["path", { d: "M12 16v.01", key: "133mhm" }],
    ["path", { d: "M16 12h1", key: "1slzba" }],
    ["path", { d: "M21 12v.01", key: "1lwtk9" }],
    ["path", { d: "M12 21v-1", key: "1880an" }]
]);

const RefreshCwIcon = createLucideIcon("refresh-cw", [
    ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
    ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
    ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
    ["path", { d: "M8 16H3v5", key: "1cv678" }]
]);

const SaveIcon = createLucideIcon("save", [
    ["path", { d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z", key: "1c8476" }],
    ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
    ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }]
]);

const ScaleIcon = createLucideIcon("scale", [
    ["path", { d: "m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z", key: "7g6ntu" }],
    ["path", { d: "m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z", key: "ijws7r" }],
    ["path", { d: "M7 21h10", key: "1b0cd5" }],
    ["path", { d: "M12 3v18", key: "108xh3" }],
    ["path", { d: "M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2", key: "3gwbw2" }]
]);

const ScissorsIcon = createLucideIcon("scissors", [
    ["circle", { cx: "6", cy: "6", r: "3", key: "1lh9wr" }],
    ["path", { d: "M8.12 8.12 12 12", key: "1alkpv" }],
    ["path", { d: "M20 4 8.12 15.88", key: "xgtan2" }],
    ["circle", { cx: "6", cy: "18", r: "3", key: "fqmcym" }],
    ["path", { d: "M14.8 14.8 20 20", key: "ptml3r" }]
]);

const SearchIcon = createLucideIcon("search", [
    ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
    ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
]);

const SendIcon = createLucideIcon("send", [
    ["path", { d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z", key: "1ffxy3" }],
    ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }]
]);

const ShieldIcon = createLucideIcon("shield", [
    ["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", key: "oel41y" }]
]);

const ShieldCheckIcon = createLucideIcon("shield-check", [
    ["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", key: "oel41y" }],
    ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
]);

const SparklesIcon = createLucideIcon("sparkles", [
    ["path", { d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z", key: "1s2grr" }],
    ["path", { d: "M20 2v4", key: "1rf3ol" }],
    ["path", { d: "M22 4h-4", key: "gwowj6" }],
    ["circle", { cx: "4", cy: "20", r: "2", key: "6kqj1y" }]
]);

const StarIcon = createLucideIcon("star", [
    ["path", { d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z", key: "r04s7s" }]
]);

const TagIcon = createLucideIcon("tag", [
    ["path", { d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z", key: "vktsd0" }],
    ["circle", { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor", key: "kqv944" }]
]);

const TargetIcon = createLucideIcon("target", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["circle", { cx: "12", cy: "12", r: "6", key: "1vlfrh" }],
    ["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }]
]);

const Trash2Icon = createLucideIcon("trash-2", [
    ["path", { d: "M10 11v6", key: "nco0om" }],
    ["path", { d: "M14 11v6", key: "outv1u" }],
    ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
    ["path", { d: "M3 6h18", key: "d0wm0j" }],
    ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }]
]);

const TriangleAlertIcon = createLucideIcon("triangle-alert", [
    ["path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3", key: "wmoenq" }],
    ["path", { d: "M12 9v4", key: "juzpu7" }],
    ["path", { d: "M12 17h.01", key: "p32p05" }]
]);

const UserRoundIcon = createLucideIcon("user-round", [
    ["circle", { cx: "12", cy: "8", r: "5", key: "1hypcn" }],
    ["path", { d: "M20 21a8 8 0 0 0-16 0", key: "rfgkzh" }]
]);

const UserRoundPlusIcon = createLucideIcon("user-round-plus", [
    ["path", { d: "M2 21a8 8 0 0 1 13.292-6", key: "bjp14o" }],
    ["circle", { cx: "10", cy: "8", r: "5", key: "o932ke" }],
    ["path", { d: "M19 16v6", key: "tddt3s" }],
    ["path", { d: "M22 19h-6", key: "vcuq98" }]
]);

const UsersIcon = createLucideIcon("users", [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
    ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744", key: "16gr8j" }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
    ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }]
]);

const XIcon = createLucideIcon("x", [
    ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
    ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
]);

const YoutubeIcon = createLucideIcon("youtube", [
    ["path", { d: "M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17", key: "1q2vi4" }],
    ["path", { d: "m10 15 5-3-5-3z", key: "1jp15x" }]
]);

// ---- Names used by the app ----
export const AlertCircle = CircleAlertIcon;
export const AlertTriangle = TriangleAlertIcon;
export const ArrowLeft = ArrowLeftIcon;
export const ArrowRight = ArrowRightIcon;
export const Award = AwardIcon;
export const Banknote = BanknoteIcon;
export const Bell = BellIcon;
export const BookOpen = BookOpenIcon;
export const Calendar = CalendarIcon;
export const CalendarDays = CalendarDaysIcon;
export const CheckCheck = CheckCheckIcon;
export const CheckCircle2 = CircleCheckIcon;
export const ChevronDown = ChevronDownIcon;
export const Clock = ClockIcon;
export const Clock3 = Clock3Icon;
export const Copy = CopyIcon;
export const CreditCard = CreditCardIcon;
export const Edit2 = PenIcon;
export const Edit3 = PenLineIcon;
export const Eye = EyeIcon;
export const EyeOff = EyeOffIcon;
export const Facebook = FacebookIcon;
export const Heart = HeartIcon;
export const Instagram = InstagramIcon;
export const KeyRound = KeyRoundIcon;
export const LayoutDashboard = LayoutDashboardIcon;
export const Lock = LockIcon;
export const LogIn = LogInIcon;
export const LogOut = LogOutIcon;
export const Mail = MailIcon;
export const MapPin = MapPinIcon;
export const Menu = MenuIcon;
export const MessageSquare = MessageSquareIcon;
export const MessageSquareQuote = MessageSquareQuoteIcon;
export const PawPrint = PawPrintIcon;
export const Phone = PhoneIcon;
export const Plus = PlusIcon;
export const QrCode = QrCodeIcon;
export const RefreshCw = RefreshCwIcon;
export const Save = SaveIcon;
export const Scale = ScaleIcon;
export const Scissors = ScissorsIcon;
export const Search = SearchIcon;
export const Send = SendIcon;
export const Shield = ShieldIcon;
export const ShieldCheck = ShieldCheckIcon;
export const Sparkles = SparklesIcon;
export const Star = StarIcon;
export const Tag = TagIcon;
export const Target = TargetIcon;
export const Trash2 = Trash2Icon;
export const UserRound = UserRoundIcon;
export const UserRoundPlus = UserRoundPlusIcon;
export const Users = UsersIcon;
export const X = XIcon;
export const XCircle = CircleXIcon;
export const Youtube = YoutubeIcon;
