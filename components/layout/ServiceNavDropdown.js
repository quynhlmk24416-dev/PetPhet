import React, { useEffect, useRef, useState } from '../../js/react.js';
import { ChevronDown } from '../../js/icons.js';
import { store } from '../../services/store.js';
const sitemapServices = [
    { label: 'Tắm và vệ sinh', id: 'srv-spa-01', matches: (name) => name.includes('Tắm Spa') },
    { label: 'Cắt tỉa lông', id: 'srv-spa-02', matches: (name) => name.includes('Grooming') },
    { label: 'Khám thú y', id: 'srv-vet-01', matches: (name) => name.includes('Khám Thú Y') },
    { label: 'Tiêm phòng', id: 'srv-vet-02', matches: (name) => name.includes('Tiêm Phòng') }
];
export const ServiceNavDropdown = ({ currentTab, variant, onNavigateToAllServices, onNavigateToService }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const activeServices = store.getServices(true);
    const menuServices = sitemapServices.flatMap((item) => {
        const service = activeServices.find((candidate) => candidate.id === item.id)
            ?? activeServices.find((candidate) => item.matches(candidate.service_name));
        return service ? [{ label: item.label, id: service.id }] : [];
    });
    useEffect(() => {
        if (!isOpen)
            return;
        const closeIfOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target))
                setIsOpen(false);
        };
        const closeOnEscape = (event) => {
            if (event.key === 'Escape')
                setIsOpen(false);
        };
        document.addEventListener('pointerdown', closeIfOutside);
        window.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeIfOutside);
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [isOpen]);
    const triggerClass = variant === 'public'
        ? `pet-public-service-trigger ${currentTab === 'services' ? 'is-active' : ''}`
        : variant === 'customer'
            ? `pet-nav-item pet-service-nav-trigger ${currentTab === 'services' ? 'is-active' : ''}`
            : `pet-mobile-service-trigger ${currentTab === 'services' ? 'is-active' : ''}`;
    return (React.createElement("div", { ref: menuRef, className: `pet-service-nav-menu pet-service-nav-menu-${variant}`, onMouseEnter: () => setIsOpen(true), onFocus: () => setIsOpen(true), onMouseLeave: () => setIsOpen(false), onBlur: (event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
                setIsOpen(false);
        } },
        React.createElement("div", { className: "pet-service-nav-controls" },
            React.createElement("button", { type: "button", className: `${triggerClass} pet-service-nav-trigger-button`, onClick: variant === 'mobile' ? () => setIsOpen((open) => !open) : onNavigateToAllServices, "aria-current": currentTab === 'services' ? 'page' : undefined, "aria-expanded": isOpen, "aria-label": variant === 'mobile' ? 'Mở danh sách dịch vụ' : 'Dịch vụ' },
                variant === 'customer' && React.createElement("span", { className: "pet-nav-label" }, "Dịch vụ"),
                variant !== 'customer' && React.createElement("span", null, "Dịch vụ"),
                React.createElement(ChevronDown, { className: "pet-service-nav-chevron", size: 14, "aria-hidden": "true" }))),
        isOpen && (React.createElement("div", { className: "pet-service-nav-dropdown" }, menuServices.map((service) => (React.createElement("button", { key: service.id, type: "button", onClick: () => { onNavigateToService(service.id); setIsOpen(false); } }, service.label)))))));
};
