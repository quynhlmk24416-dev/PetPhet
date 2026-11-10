import { ASSETS } from '../../js/constants/assets.js';
import { loadTemplate, renderTemplate } from '../../js/html-template.js';

// Markup lives in MascotBadge.html; this file only prepares the data.
const template = await loadTemplate('../../MascotBadge.html', import.meta.url);

const SIZE_CLASSES = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32'
};

export const MascotBadge = ({ type = 'duo', size = 'md', message, className = '' }) =>
  renderTemplate(template, {
    className,
    sizeClass: SIZE_CLASSES[size],
    bannerUrl: ASSETS.bgBanner,
    message,
    isDog: type === 'dog',
    isCat: type === 'cat',
    isDuo: ['duo', 'greeting', 'success', 'loading', 'error'].includes(type)
  });
