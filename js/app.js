import React, { useEffect, useRef, useState } from './react.js';
import { store } from '../services/store.js';
import { clearSession, getInitialTab, restoreSession, saveSession } from '../services/sessionService.js';
import { Navbar } from '../components/layout/Navbar.js';
import { PublicNavbar } from '../components/layout/PublicNavbar.js';
import { Footer } from '../components/layout/Footer.js';
import { LandingPage } from '../components/customer/LandingPage.js';
import { AboutPage } from '../components/customer/AboutPage.js';
import { ServicesPage } from '../components/customer/ServicesPage.js';
import { PricingPage } from '../components/customer/PricingPage.js';
import { PetManagementPage } from '../components/customer/PetManagementPage.js';
import { AccountPage } from '../components/customer/AccountPage.js';
import { BookingWizard } from '../components/booking/BookingWizard.js';
import { PaymentView } from '../components/booking/PaymentView.js';
import { BookingHistoryPage } from '../components/customer/BookingHistoryPage.js';
import { PetPointPage } from '../components/customer/PetPointPage.js';
import { AdminPortal } from '../components/admin/AdminPortal.js';
import { AuthModal } from '../components/auth/AuthModal.js';
import { ChatbotDrawer } from '../components/common/ChatbotDrawer.js';
import { ToastViewport } from '../components/common/ToastViewport.js';
export function App() {
    const [, setStoreRevision] = useState(0);
    // A saved login session (see services/sessionService.js) survives a page reload.
    const [restoredUser] = useState(() => restoreSession(store));
    const [isAuthenticated, setIsAuthenticated] = useState(Boolean(restoredUser));
    const [currentTab, setCurrentTab] = useState(() => getInitialTab(restoredUser));
    const [selectedServiceForBooking, setSelectedServiceForBooking] = useState();
    const [bookingStartStep, setBookingStartStep] = useState(1);
    const [selectedPetForBooking, setSelectedPetForBooking] = useState();
    const [selectedServiceDetailId, setSelectedServiceDetailId] = useState();
    const [activePaymentBooking, setActivePaymentBooking] = useState(null);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authDefaultMode, setAuthDefaultMode] = useState('login');
    const [postLoginTab, setPostLoginTab] = useState(null);
    const [isContactHighlighted, setIsContactHighlighted] = useState(false);
    const contactScrollFrame = useRef(null);
    const contactHighlightEnd = useRef(null);
    useEffect(() => store.subscribe(() => setStoreRevision((revision) => revision + 1)), []);
    useEffect(() => {
        if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            return;
        const main = document.querySelector('.pet-main-content');
        if (!main)
            return;
        const targets = Array.from(main.querySelectorAll('[data-scroll-reveal]'))
            .filter((target) => !target.closest('.pet-landing-page'));
        if (!targets.length)
            return;
        main.classList.add('pet-scroll-reveal-ready');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting)
                    return;
                entry.target.classList.add('is-scroll-visible');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        targets.forEach((target) => observer.observe(target));
        // Elements added later (for example a pet card that was just saved) would stay hidden forever,
        // because the observer above only knows the elements that existed when the page opened.
        const watchNewTargets = new MutationObserver((records) => {
            records.forEach((record) => record.addedNodes.forEach((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE)
                    return;
                const added = node.matches('[data-scroll-reveal]') ? [node] : [];
                added.push(...node.querySelectorAll('[data-scroll-reveal]'));
                added
                    .filter((target) => !target.closest('.pet-landing-page') && !target.classList.contains('is-scroll-visible'))
                    .forEach((target) => observer.observe(target));
            }));
        });
        watchNewTargets.observe(main, { childList: true, subtree: true });
        return () => {
            observer.disconnect();
            watchNewTargets.disconnect();
            main.classList.remove('pet-scroll-reveal-ready');
        };
    }, [currentTab, isAuthenticated]);
    useEffect(() => () => {
        if (contactScrollFrame.current !== null)
            window.cancelAnimationFrame(contactScrollFrame.current);
        if (contactHighlightEnd.current !== null)
            window.clearTimeout(contactHighlightEnd.current);
    }, []);
    // Keep customer navigation in browser history so Back/Forward works on GitHub Pages too.
    useEffect(() => {
        if (!window.history.state?.petPhetInitialized) {
            window.history.replaceState({ petPhetInitialized: true, petPhetTab: currentTab }, '', `${window.location.pathname}${window.location.search}#${currentTab}`);
        }
        const onPopState = (event) => {
            const nextTab = typeof event.state?.petPhetTab === 'string' ? event.state.petPhetTab : 'landing';
            const protectedTabs = ['pets', 'booking', 'payment', 'my-bookings', 'points', 'account'];
            if (!isAuthenticated && protectedTabs.includes(nextTab)) {
                setPostLoginTab(nextTab);
                setAuthDefaultMode('login');
                setIsAuthOpen(true);
                return;
            }
            setCurrentTab(nextTab);
            setIsAuthOpen(false);
            const sectionId = typeof event.state?.petPhetSection === 'string' ? event.state.petPhetSection : undefined;
            if (sectionId) {
                window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
            }
            else {
                window.scrollTo({ top: 0, behavior: 'auto' });
            }
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, [isAuthenticated]);
    // The public landing page is always the first screen on a new browser visit.
    // A role becomes active only after the credentials are checked by AuthModal.
    const currentUser = store.getCurrentUser();
    const userPoints = store.getUserPetPoints(currentUser?.id || '');
    const handleNavigate = (tab) => {
        let destinationTab = tab;
        let sectionId;
        if (tab === 'services') {
            destinationTab = 'services';
        }
        else if (tab === 'pricing') {
            destinationTab = 'pricing';
        }
        else if (tab === 'contact') {
            destinationTab = currentTab;
            sectionId = 'pet-contact-section';
            setIsContactHighlighted(false);
            if (contactScrollFrame.current !== null)
                window.cancelAnimationFrame(contactScrollFrame.current);
            if (contactHighlightEnd.current !== null)
                window.clearTimeout(contactHighlightEnd.current);
        }
        if (destinationTab === 'booking')
            setBookingStartStep(1);
        const protectedTabs = ['pets', 'booking', 'payment', 'my-bookings', 'points', 'account'];
        if (!isAuthenticated && protectedTabs.includes(destinationTab)) {
            setPostLoginTab(destinationTab);
            setAuthDefaultMode('login');
            setIsAuthOpen(true);
            return;
        }
        window.history.pushState({ petPhetInitialized: true, petPhetTab: destinationTab, petPhetSection: sectionId }, '', `${window.location.pathname}${window.location.search}#${destinationTab}`);
        setCurrentTab(destinationTab);
        if (sectionId) {
            window.setTimeout(() => {
                document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (tab === 'contact') {
                    let stableFrames = 0;
                    let lastScrollY = window.scrollY;
                    const startedAt = performance.now();
                    const highlightAfterScroll = () => {
                        const currentScrollY = window.scrollY;
                        stableFrames = Math.abs(currentScrollY - lastScrollY) < 1 ? stableFrames + 1 : 0;
                        lastScrollY = currentScrollY;
                        if (stableFrames >= 6 || performance.now() - startedAt >= 2500) {
                            contactScrollFrame.current = null;
                            setIsContactHighlighted(true);
                            contactHighlightEnd.current = window.setTimeout(() => setIsContactHighlighted(false), 850);
                            return;
                        }
                        contactScrollFrame.current = window.requestAnimationFrame(highlightAfterScroll);
                    };
                    contactScrollFrame.current = window.requestAnimationFrame(highlightAfterScroll);
                }
            }, 50);
        }
        else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const handleNavigateToService = (serviceId) => {
        setSelectedServiceDetailId(serviceId);
        handleNavigate('services');
    };
    // `startStep` 2 opens the booking wizard directly on "choose pet" when the service was already picked.
    const handleNavigateToBooking = (serviceId, petId, startStep = 1) => {
        setSelectedServiceForBooking(serviceId);
        setSelectedPetForBooking(petId);
        setBookingStartStep(startStep);
        if (!isAuthenticated) {
            setPostLoginTab('booking');
            setAuthDefaultMode('login');
            setIsAuthOpen(true);
            return;
        }
        window.history.pushState({ petPhetInitialized: true, petPhetTab: 'booking' }, '', `${window.location.pathname}${window.location.search}#booking`);
        setCurrentTab('booking');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleBookingCompleted = (booking, payment) => {
        setActivePaymentBooking({ booking, payment });
        window.history.pushState({ petPhetInitialized: true, petPhetTab: 'payment' }, '', `${window.location.pathname}${window.location.search}#payment`);
        setCurrentTab('payment');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleOpenPaymentForBooking = (booking) => {
        const payment = store.getPayments().find((item) => item.booking_id === booking.id);
        setActivePaymentBooking({ booking, payment });
        window.history.pushState({ petPhetInitialized: true, petPhetTab: 'payment' }, '', `${window.location.pathname}${window.location.search}#payment`);
        setCurrentTab('payment');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleAuthSuccess = (user) => {
        saveSession(user);
        setIsAuthenticated(true);
        setIsAuthOpen(false);
        if (user.role === 'admin') {
            setCurrentTab('admin-dashboard');
        }
        else {
            setCurrentTab(postLoginTab || 'landing');
        }
        setPostLoginTab(null);
        const destination = user.role === 'admin' ? 'admin-dashboard' : (postLoginTab || 'landing');
        window.history.pushState({ petPhetInitialized: true, petPhetTab: destination }, '', `${window.location.pathname}${window.location.search}#${destination}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleLogout = () => {
        clearSession();
        setIsAuthenticated(false);
        setCurrentTab('landing');
        setSelectedServiceForBooking(undefined);
        setSelectedPetForBooking(undefined);
        setActivePaymentBooking(null);
        setPostLoginTab(null);
        setAuthDefaultMode('login');
        setIsAuthOpen(false);
        window.history.replaceState({ petPhetInitialized: true, petPhetTab: 'landing' }, '', `${window.location.pathname}${window.location.search}#landing`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const openAuth = (mode = 'login') => {
        setAuthDefaultMode(mode);
        setPostLoginTab(null);
        setIsAuthOpen(true);
    };
    const renderLandingOrServices = () => (React.createElement(React.Fragment, null,
        currentTab === 'landing' && (React.createElement(LandingPage, { onNavigateToBooking: handleNavigateToBooking, onNavigateToServices: () => handleNavigate('services') })),
        currentTab === 'about' && (React.createElement(AboutPage, { onNavigateToBooking: () => handleNavigateToBooking(), onNavigateToServices: () => handleNavigate('services') })),
        currentTab === 'services' && React.createElement(ServicesPage, { initialServiceId: selectedServiceDetailId, onInitialServiceHandled: () => setSelectedServiceDetailId(undefined), onSelectServiceToBook: (serviceId) => handleNavigateToBooking(serviceId, undefined, 2) }),
        currentTab === 'pricing' && React.createElement(PricingPage, { onNavigateToBooking: (serviceId) => handleNavigateToBooking(serviceId, undefined, 2) })));
    return (React.createElement("div", { className: "pet-app-shell" },
        !isAuthenticated ? (React.createElement("div", { className: "pet-public-shell" },
            React.createElement(PublicNavbar, { currentTab: currentTab, onTabChange: handleNavigate, onNavigateToService: handleNavigateToService, onOpenLogin: () => openAuth('login'), onOpenRegister: () => openAuth('register') }),
            React.createElement("main", { className: "pet-main-content" }, renderLandingOrServices()),
            React.createElement(Footer, { onNavigateToServices: () => handleNavigate('services'), onNavigateToService: handleNavigateToService, onNavigateToAbout: () => handleNavigate('about'), isContactHighlighted: isContactHighlighted }),
            React.createElement(ChatbotDrawer, null))) : currentUser.role === 'admin' ? (React.createElement("div", { className: "pet-admin-app-shell" },
            React.createElement(AdminPortal, { currentUser: currentUser, onLogout: handleLogout }),
            React.createElement(Footer, { onNavigateToServices: () => handleNavigate('services'), onNavigateToService: handleNavigateToService, onNavigateToAbout: () => handleNavigate('about'), isContactHighlighted: isContactHighlighted }),
            React.createElement(ChatbotDrawer, null))) : (React.createElement("div", { className: "pet-customer-shell" },
            React.createElement(Navbar, { currentUser: currentUser, currentTab: currentTab, onTabChange: handleNavigate, onNavigateToService: handleNavigateToService, onLogout: handleLogout, userPoints: userPoints }),
            React.createElement("main", { className: "pet-main-content" },
                currentTab === 'landing' && (React.createElement(LandingPage, { onNavigateToBooking: handleNavigateToBooking, onNavigateToServices: () => handleNavigate('services') })),
                currentTab === 'about' && (React.createElement(AboutPage, { onNavigateToBooking: () => handleNavigateToBooking(), onNavigateToServices: () => handleNavigate('services') })),
                currentTab === 'services' && React.createElement(ServicesPage, { initialServiceId: selectedServiceDetailId, onInitialServiceHandled: () => setSelectedServiceDetailId(undefined), onSelectServiceToBook: (serviceId) => handleNavigateToBooking(serviceId, undefined, 2) }),
                currentTab === 'pricing' && React.createElement(PricingPage, { onNavigateToBooking: (serviceId) => handleNavigateToBooking(serviceId, undefined, 2) }),
                currentTab === 'pets' && (React.createElement(PetManagementPage, { currentUser: currentUser, onNavigateToBookingWithPet: (petId) => handleNavigateToBooking(undefined, petId) })),
                currentTab === 'booking' && (React.createElement(BookingWizard, { currentUser: currentUser, preselectedServiceId: selectedServiceForBooking, preselectedPetId: selectedPetForBooking, initialStep: bookingStartStep, onBookingCompleted: handleBookingCompleted, onNavigateToPetManagement: () => handleNavigate('pets') })),
                currentTab === 'payment' && activePaymentBooking && (React.createElement(PaymentView, { booking: activePaymentBooking.booking, payment: activePaymentBooking.payment, onViewBookingHistory: () => handleNavigate('my-bookings') })),
                currentTab === 'my-bookings' && (React.createElement(BookingHistoryPage, { currentUser: currentUser, onNavigateToBooking: () => handleNavigateToBooking(), onOpenPaymentForBooking: handleOpenPaymentForBooking })),
                currentTab === 'points' && (React.createElement(PetPointPage, { currentUser: currentUser, onNavigateToBooking: () => handleNavigateToBooking(), onNavigateToHistory: () => handleNavigate('my-bookings') })),
                currentTab === 'account' && React.createElement(AccountPage, { currentUser: currentUser })),
            React.createElement(Footer, { onNavigateToServices: () => handleNavigate('services'), onNavigateToService: handleNavigateToService, onNavigateToAbout: () => handleNavigate('about'), isContactHighlighted: isContactHighlighted }),
            React.createElement(ChatbotDrawer, null))),
        React.createElement(AuthModal, { isOpen: isAuthOpen, defaultMode: authDefaultMode, onClose: () => setIsAuthOpen(false), onSuccess: handleAuthSuccess }),
        React.createElement(ToastViewport, null)));
}
export default App;
