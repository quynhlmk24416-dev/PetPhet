import { store } from '../../services/store.js';
import { formatVND } from '../../services/bookingEngine.js';
import { loadTemplate, renderTemplate } from '../../js/html-template.js';

// Markup lives in PricingPage.html; this file only prepares the data and handlers.
const template = await loadTemplate('../../PricingPage.html', import.meta.url);

function toPricingRow(service, onNavigateToBooking) {
  const hasTiers = Boolean(service.is_weight_based && service.pricing_tiers?.length);
  return {
    id: service.id,
    name: service.service_name,
    imageUrl: service.image_url,
    hasTiers,
    amountText: formatVND(service.base_price),
    tiers: hasTiers
      ? service.pricing_tiers.map((tier) => ({
          id: tier.id,
          rangeText: `${tier.min_weight}–${tier.max_weight} kg`,
          priceText: formatVND(tier.price)
        }))
      : [],
    onBook: () => onNavigateToBooking(service.id)
  };
}

export const PricingPage = ({ onNavigateToBooking }) => {
  const services = store.getServices(true).map((service) => toPricingRow(service, onNavigateToBooking));
  return renderTemplate(template, {
    services,
    isEmpty: services.length === 0,
    hasServices: services.length > 0
  });
};
