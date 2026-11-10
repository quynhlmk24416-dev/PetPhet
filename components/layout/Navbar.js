import React, { useEffect, useRef, useState } from '../../js/react.js';
import { PawPrint, Award, CalendarDays, ChevronDown, Menu, X, UserRound, LogOut } from '../../js/icons.js';
import { NotificationDropdown } from '../common/NotificationDropdown.js';
import { ASSETS } from '../../js/constants/assets.js';
import { ServiceNavDropdown } from './ServiceNavDropdown.js';
const navItems = [
    { id: 'landing', label: 'Trang chủ' },
    { id: 'about', label: 'Về Pet Phết' },
    { id: 'services', label: 'Dịch vụ' },
    { id: 'pricing', label: 'Bảng giá' },
    { id: 'booking', label: 'Đặt lịch' },
    { id: 'contact', label: 'Liên hệ' }
];
export const Navbar = ({ currentUser, currentTab, onTabChange, onNavigateToService, onLogout, userPoints }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);
    useEffect(() => {
        if (!profileOpen)
            return;
        const closeIfOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target))
                setProfileOpen(false);
        };
        const closeOnEscape = (event) => { if (event.key === 'Escape')
            setProfileOpen(false); };
        document.addEventListener('mousedown', closeIfOutside);
        window.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('mousedown', closeIfOutside);
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [profileOpen]);
    const navigate = (tab) => {
        onTabChange(tab);
        setMobileOpen(false);
        setProfileOpen(false);
    };
    return (React.createElement("header", { className: "pet-navbar-wrap" },
        React.createElement("div", { className: "pet-navbar" },
            React.createElement("button", { className: "pet-brand", onClick: () => navigate('landing'), "aria-label": "Pet Phết - Trang chủ" },
                React.createElement("img", { className: "pet-brand-logo", src: ASSETS.brandLogo, alt: "Pet Phết – Pet First" })),
            React.createElement("nav", { className: "pet-nav-links", "aria-label": "Điều hướng chính" }, navItems.map((item) => {
                if (item.id === 'services') {
                    return (React.createElement(ServiceNavDropdown, { key: item.id, currentTab: currentTab, variant: "customer", onNavigateToAllServices: () => navigate('services'), onNavigateToService: onNavigateToService }));
                }
                const active = currentTab === item.id;
                return (React.createElement("button", { key: item.id, className: `pet-nav-item ${active ? 'is-active' : ''}`, onClick: () => navigate(item.id), "aria-current": active ? 'page' : undefined, type: "button" },
                    React.createElement("span", { className: "pet-nav-label" }, item.label)));
            })),
            React.createElement("div", { className: "pet-nav-actions" },
                React.createElement(NotificationDropdown, { role: currentUser.role, userId: currentUser.id }),
                React.createElement("div", { className: `pet-profile-wrap ${profileOpen ? 'is-open' : ''}`, ref: profileRef, onMouseEnter: () => setProfileOpen(true), onMouseLeave: () => setProfileOpen(false), onFocusCapture: () => setProfileOpen(true), onBlur: (event) => {
                        if (!event.currentTarget.contains(event.relatedTarget))
                            setProfileOpen(false);
                    } },
                    React.createElement("button", { className: "pet-profile-button", onClick: () => setProfileOpen((open) => (window.matchMedia('(hover: hover) and (pointer: fine)').matches ? true : !open)), "aria-expanded": profileOpen, "aria-label": "Tài khoản" },
                        currentUser.role === 'customer' ? (React.createElement("span", { className: "pet-profile-avatar pet-profile-initial", "aria-hidden": "true" }, currentUser.full_name.trim().split(/\s+/).at(-1)?.charAt(0).toLocaleUpperCase('vi-VN') || '?')) : currentUser.avatar_url ? (React.createElement("img", { src: currentUser.avatar_url, alt: "Ảnh đại diện" })) : (React.createElement("span", { className: "pet-profile-avatar" },
                            React.createElement(UserRound, { size: 22 }))),
                        React.createElement("span", { className: "pet-profile-name" }, "Tài khoản"),
                        React.createElement(ChevronDown, { className: "pet-profile-chevron", size: 16 })),
                    profileOpen && (React.createElement("div", { className: "pet-profile-menu" },
                        React.createElement("div", { className: "pet-profile-summary" },
                            React.createElement("strong", null, currentUser.full_name),
                            React.createElement("span", null, currentUser.email),
                            React.createElement("small", null,
                                userPoints.toLocaleString('vi-VN'),
                                " Pet Point")),
                        React.createElement("button", { onClick: () => navigate('account') },
                            React.createElement(UserRound, { size: 16 }),
                            " Tài khoản của tôi"),
                        React.createElement("button", { onClick: () => navigate('pets') },
                            React.createElement(PawPrint, { size: 16 }),
                            " Hồ sơ thú cưng"),
                        React.createElement("button", { onClick: () => navigate('my-bookings') },
                            React.createElement(CalendarDays, { size: 16 }),
                            " Lịch sử đặt lịch"),
                        React.createElement("button", { onClick: () => navigate('points') },
                            React.createElement(Award, { size: 16 }),
                            " Pet Point"),
                        React.createElement("button", { className: "pet-logout-button", onClick: onLogout },
                            React.createElement(LogOut, { size: 16 }),
                            " Đăng xuất")))),
                React.createElement("button", { className: "pet-mobile-toggle", onClick: () => setMobileOpen((v) => !v), "aria-label": "Mở điều hướng" }, mobileOpen ? React.createElement(X, { size: 23 }) : React.createElement(Menu, { size: 23 })))),
        mobileOpen && (React.createElement("nav", { className: "pet-mobile-menu", "aria-label": "Điều hướng di động" },
            navItems.map((item) => {
                if (item.id === 'services') {
                    return (React.createElement(ServiceNavDropdown, { key: item.id, currentTab: currentTab, variant: "mobile", onNavigateToAllServices: () => navigate('services'), onNavigateToService: (serviceId) => {
                            onNavigateToService(serviceId);
                            setMobileOpen(false);
                        } }));
                }
                return React.createElement("button", { key: item.id, className: currentTab === item.id ? 'is-active' : '', onClick: () => navigate(item.id), type: "button" }, item.label);
            }),
            React.createElement("button", { onClick: () => navigate('account') },
                React.createElement(UserRound, { size: 18 }),
                " Tài khoản của tôi"),
            React.createElement("button", { onClick: () => { onLogout(); setMobileOpen(false); } },
                React.createElement(LogOut, { size: 18 }),
                " Đăng xuất")))));
};
