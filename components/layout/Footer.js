import { ASSETS } from '../../js/constants/assets.js';
import { store } from '../../services/store.js';
import { loadTemplate, renderTemplate } from '../../js/html-template.js';

// Markup lives in Footer.html; this file only prepares the data and handlers.
const template = await loadTemplate('../../Footer.html', import.meta.url);

export const Footer = ({ onNavigateToServices, onNavigateToService, onNavigateToAbout, isContactHighlighted = false }) => {
  const activeServices = store.getServices(true);
  return renderTemplate(template, {
    logoUrl: ASSETS.brandLogo,
    services: activeServices.map((service) => ({
      id: service.id,
      name: service.service_name,
      title: `Xem dịch vụ ${service.service_name}`,
      onClick: () => (onNavigateToService ? onNavigateToService(service.id) : onNavigateToServices?.())
    })),
    noServices: activeServices.length === 0,
    highlightClass: isContactHighlighted ? 'is-highlighted' : '',
    openAbout: (event) => {
      event.preventDefault();
      onNavigateToAbout?.();
    }
  });
};
