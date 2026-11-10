import { ASSETS } from '../../js/constants/assets.js';
import { loadTemplate, renderTemplate } from '../../js/html-template.js';
import { ServiceNavDropdown } from './ServiceNavDropdown.js';

// Markup lives in PublicNavbar.html; this file only prepares the data and handlers.
const template = await loadTemplate('../../PublicNavbar.html', import.meta.url);

const NAV_ITEMS = [
  { id: 'landing', label: 'Trang chủ' },
  { id: 'about', label: 'Về Pet Phết' },
  { id: 'services', label: 'Dịch vụ' },
  { id: 'pricing', label: 'Bảng giá' },
  { id: 'booking', label: 'Đặt lịch' },
  { id: 'contact', label: 'Liên hệ' }
];

export const PublicNavbar = ({ currentTab, onTabChange, onNavigateToService, onOpenLogin, onOpenRegister }) =>
  renderTemplate(
    template,
    {
      logoUrl: ASSETS.brandLogo,
      goHome: () => onTabChange('landing'),
      navItems: NAV_ITEMS.map((item) => {
        const active = currentTab === item.id;
        return {
          id: item.id,
          label: item.label,
          isServices: item.id === 'services',
          activeClass: active ? 'is-active' : '',
          ariaCurrent: active ? 'page' : undefined,
          onClick: () => onTabChange(item.id)
        };
      }),
      serviceNavProps: {
        currentTab,
        variant: 'public',
        onNavigateToAllServices: () => onTabChange('services'),
        onNavigateToService
      },
      onOpenLogin,
      onOpenRegister
    },
    { components: { ServiceNavDropdown } }
  );
