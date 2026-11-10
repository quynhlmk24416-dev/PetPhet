import React, { useEffect, useRef, useState } from '../../js/react.js';
import { ArrowRight, CalendarDays, Clock3, Heart, PawPrint, Scissors, ShieldCheck, Sparkles, Star, Clock, BookOpen, CheckCircle2 } from '../../js/icons.js';
import { store } from '../../services/store.js';
import { formatVND } from '../../services/bookingEngine.js';
const heroPhotos = [
    {
        src: 'https://images.unsplash.com/photo-1719464454959-9cf304ef4774?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
        alt: 'Chú chó nhỏ được nhân viên cắt tỉa lông tại tiệm chăm sóc thú cưng',
        label: 'Cún cưng'
    },
    {
        src: 'https://images.unsplash.com/photo-1643703519020-7039196f599c?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
        alt: 'Chú mèo nằm trên bãi cỏ giữa khung cảnh ngoài trời',
        label: 'Mèo cưng'
    },
    {
        src: 'https://images.unsplash.com/photo-1611173622933-91942d394b04?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
        alt: 'Chú chó nhỏ quấn khăn sau khi được tắm và chăm sóc',
        label: 'Khoảnh khắc vui'
    }
];
const pawTrail = Array.from({ length: 10 }, (_, index) => {
    const t = index / 12;
    const side = index % 2 === 0 ? 1 : -1;
    const x = 109 - t * 200;
    const y = 120 - t * 300 + Math.sin(t * Math.PI * 2) * 7 + side * 8;
    const angle = 70 + side * 10 + Math.atan2(-66, -80) * (180 / Math.PI);
    return { x, y, angle };
});
const careNotes = [
    {
        title: 'Trước buổi spa',
        description: 'Báo cho Pet Phết biết thói quen, vùng nhạy cảm hoặc lưu ý sức khỏe của bé.',
        icon: Heart
    },
    {
        title: 'Giữ hồ sơ chăm sóc',
        description: 'Cân nặng và lịch sử dịch vụ giúp bạn theo dõi nhu cầu của bé qua từng lần hẹn.',
        icon: BookOpen
    },
    {
        title: 'Chủ động đặt lịch',
        description: 'Chọn ngày và khung giờ phù hợp, rồi kiểm tra lại thông tin trước khi xác nhận.',
        icon: CheckCircle2
    }
];
export const LandingPage = ({ onNavigateToBooking, onNavigateToServices }) => {
    const services = store.getServices(true).slice(0, 3);
    const reviews = store.getFeaturedReviews();
    const [selectedService, setSelectedService] = useState(null);
    const [activeHeroPhoto, setActiveHeroPhoto] = useState(0);
    const [visiblePaws, setVisiblePaws] = useState(0);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterMessage, setNewsletterMessage] = useState('');
    const heroDragStart = useRef(null);
    const selectedServiceReviews = selectedService
        ? store.getReviewsByService(selectedService.id)
        : [];
    const latestSelectedServiceReviews = selectedService
        ? store.getLatestReviewsByService(selectedService.id)
        : [];
    const selectedServiceRatingCount = selectedServiceReviews.length;
    const selectedServiceRatingAverage = selectedServiceRatingCount
        ? (selectedServiceReviews.reduce((sum, review) => sum + review.rating, 0) / selectedServiceRatingCount).toFixed(1)
        : '0.0';
    const navigateHeroPhoto = (direction) => {
        setActiveHeroPhoto((index) => (index + direction + heroPhotos.length) % heroPhotos.length);
    };
    useEffect(() => {
        if (!selectedService)
            return;
        const onKeyDown = (event) => { if (event.key === 'Escape')
            setSelectedService(null); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selectedService]);
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            return;
        const intervalId = window.setInterval(() => {
            setActiveHeroPhoto((index) => (index + 1) % heroPhotos.length);
        }, 5000);
        return () => window.clearInterval(intervalId);
    }, []);
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setVisiblePaws(pawTrail.length);
            return;
        }
        const timeoutId = window.setTimeout(() => {
            setVisiblePaws((count) => count === pawTrail.length ? 0 : count + 1);
        }, visiblePaws === pawTrail.length ? 1500 : 240);
        return () => window.clearTimeout(timeoutId);
    }, [visiblePaws]);
    useEffect(() => {
        const landingPage = document.querySelector('.pet-landing-page');
        const sections = landingPage?.querySelectorAll(':scope > section:not(.pet-hero-section)');
        if (!landingPage || !sections?.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            return;
        if (!('IntersectionObserver' in window))
            return;
        landingPage.classList.add('pet-scroll-reveal-ready');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting)
                    return;
                entry.target.classList.add('is-scroll-visible');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, []);
    const handleNewsletterSubmit = (event) => {
        event.preventDefault();
        const subject = encodeURIComponent('Đăng ký nhận tin mới từ Pet Phết');
        const body = encodeURIComponent(`Vui lòng đăng ký email ${newsletterEmail} nhận tin mới từ Pet Phết.`);
        setNewsletterMessage('Đang mở ứng dụng email để gửi yêu cầu đăng ký.');
        window.location.href = `mailto:contact@petphet.vn?subject=${subject}&body=${body}`;
    };
    return (React.createElement("div", { className: "pet-landing-page" },
        React.createElement("section", { className: "pet-hero-section" },
            React.createElement("div", { className: "pet-hero-backdrop", "aria-hidden": "true" }),
            React.createElement("div", { className: "pet-hero-image-stage" },
                React.createElement("div", { className: "pet-hero-mascots", "aria-live": "polite", onPointerDown: (event) => {
                        if (event.button !== 0)
                            return;
                        event.preventDefault();
                        heroDragStart.current = { pointerId: event.pointerId, x: event.clientX };
                        event.currentTarget.setPointerCapture(event.pointerId);
                    }, onPointerUp: (event) => {
                        const drag = heroDragStart.current;
                        heroDragStart.current = null;
                        if (!drag || drag.pointerId !== event.pointerId)
                            return;
                        const delta = event.clientX - drag.x;
                        if (Math.abs(delta) < 36)
                            return;
                        navigateHeroPhoto(delta < 0 ? 1 : -1);
                    }, onPointerCancel: () => { heroDragStart.current = null; } }, heroPhotos.map((photo, index) => (React.createElement("img", { key: photo.src, className: index === activeHeroPhoto ? 'is-active' : '', src: photo.src, alt: index === activeHeroPhoto ? photo.alt : '', "aria-hidden": index !== activeHeroPhoto, fetchPriority: index === 0 ? 'high' : 'auto', draggable: false }))))),
            React.createElement("div", { className: "pet-hero-paw-trail", "aria-hidden": "true" }, pawTrail.map((paw, index) => (React.createElement("img", { className: `pet-solid-paw ${index < visiblePaws ? 'is-visible' : ''}`, key: index, src: "./images/brand/paw-trail-brown.svg", alt: "", style: {
                    '--paw-x': `${paw.x}%`,
                    '--paw-y': `${paw.y}px`,
                    '--paw-angle': `${paw.angle}deg`
                } })))),
            React.createElement("div", { className: "pet-hero-copy" },
                React.createElement("span", { className: "pet-eyebrow" },
                    React.createElement(Sparkles, { size: 15 }),
                    " CHĂM SÓC THÚ CƯNG BẰNG CẢ TRÁI TIM"),
                React.createElement("h1", { className: "pet-hero-title" },
                    "Yêu thương bé cưng ",
                    React.createElement("em", null, "bằng cả trái tim!")),
                React.createElement("p", null, "Chăm sóc tận tâm – Trải nghiệm dễ thương – Đồng hành cùng mọi khoảnh khắc của bé."),
                React.createElement("div", { className: "pet-hero-actions" },
                    React.createElement("button", { className: "pet-button pet-button-primary", onClick: () => onNavigateToBooking() },
                        React.createElement(CalendarDays, { size: 19 }),
                        " Đặt lịch ngay"),
                    React.createElement("button", { className: "pet-button pet-button-light", onClick: onNavigateToServices },
                        React.createElement(Scissors, { size: 19 }),
                        " Khám phá dịch vụ")),
                React.createElement("div", { className: "pet-hero-trust" },
                    React.createElement("span", null,
                        React.createElement(ShieldCheck, { size: 17 }),
                        " Chăm sóc tận tâm"),
                    React.createElement("span", null,
                        React.createElement(Clock3, { size: 17 }),
                        " Đặt lịch linh hoạt"),
                    React.createElement("span", null,
                        React.createElement(Heart, { size: 17 }),
                        " Yêu thương từng bé")),
                React.createElement("div", { className: "quote-box" },
                    React.createElement("span", { className: "quote-mark" }, "“"),
                    React.createElement("p", null, "Người bạn đồng hành chăm sóc thú cưng toàn diện, mang đến trải nghiệm spa, thú y chuẩn y khoa và tình yêu thương vô điều kiện cho mọi bé cưng."))),
            React.createElement("button", { className: "pet-hero-scroll", type: "button", onClick: () => {
                    const heading = document.getElementById('pet-home-services-title');
                    if (!heading)
                        return;
                    const header = document.querySelector('.pet-navbar-wrap, .pet-public-navbar-wrap');
                    const headerHeight = header?.getBoundingClientRect().height ?? 0;
                    window.scrollTo({
                        top: window.scrollY + heading.getBoundingClientRect().top - headerHeight,
                        behavior: 'smooth'
                    });
                } },
                "Khám phá Pet Phết ",
                React.createElement("span", null, "↓")),
            React.createElement("div", { className: "pet-marquee", "aria-label": "Các dịch vụ của Pet Phết", onPointerMove: (event) => {
                    const bounds = event.currentTarget.getBoundingClientRect();
                    event.currentTarget.style.setProperty('--pet-marquee-x', `${event.clientX - bounds.left}px`);
                    event.currentTarget.style.setProperty('--pet-marquee-y', `${event.clientY - bounds.top}px`);
                }, onPointerLeave: (event) => {
                    event.currentTarget.style.removeProperty('--pet-marquee-x');
                    event.currentTarget.style.removeProperty('--pet-marquee-y');
                } },
                React.createElement("div", { className: "pet-marquee-track", "aria-hidden": "true" }, [0, 1].map((copy) => React.createElement("div", { className: "pet-marquee-group", key: copy }, ['Chăm sóc ban ngày', 'Spa & Làm đẹp', 'Khám Thú Y', 'Chăm sóc răng miệng', 'Sức khỏe thú cưng', 'Pet Phết – Pet First'].map((item) => React.createElement("span", { key: `${copy}-${item}` },
                    React.createElement(PawPrint, { size: 16 }),
                    " ",
                    item))))))),
        React.createElement("section", { className: "pet-section-block", id: "pet-services-section" },
            React.createElement("div", { className: "pet-section-heading" },
                React.createElement("div", null,
                    React.createElement("h2", { id: "pet-home-services-title" }, "Chăm sóc bé từ A đến Z")),
                React.createElement("button", { className: "pet-outline-link pet-home-view-all-services", onClick: onNavigateToServices },
                    "Xem tất cả dịch vụ ",
                    React.createElement(ArrowRight, { size: 18 }))),
            React.createElement("div", { className: "pet-service-grid" }, services.map((service) => (React.createElement("article", { className: "pet-service-card pet-home-service-card", key: service.id, role: "button", tabIndex: 0, "aria-label": `Xem chi tiết ${service.service_name}`, onClick: () => setSelectedService(service), onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedService(service);
                } } },
                React.createElement("div", { className: "pet-service-image-wrap" },
                    React.createElement("img", { src: service.image_url, alt: service.service_name, loading: "lazy" })),
                React.createElement("div", { className: "pet-service-card-body" },
                    React.createElement("div", { className: "pet-service-meta" },
                        React.createElement("span", null, service.is_weight_based ? 'Giá theo cân nặng' : 'Giá niêm yết'),
                        React.createElement("span", null,
                            React.createElement(Star, { size: 13, fill: "currentColor" }),
                            " ",
                            service.rating_avg.toFixed(1),
                            " (",
                            service.rating_count,
                            ")")),
                    React.createElement("h3", null, service.service_name),
                    React.createElement("p", null, service.description),
                    React.createElement("div", { className: "pet-service-card-footer" },
                        React.createElement("strong", null,
                            service.is_weight_based ? 'Từ ' : '',
                            formatVND(service.base_price)),
                        React.createElement("button", { onClick: (event) => { event.stopPropagation(); onNavigateToBooking(service.id); }, "aria-label": `Đặt lịch ${service.service_name}` },
                            React.createElement(ArrowRight, { size: 18 }))))))))),
        React.createElement("section", { className: "pet-home-values", "aria-labelledby": "pet-home-values-title" },
            React.createElement("div", { className: "pet-home-values-heading" },
                React.createElement("span", { className: "pet-section-kicker" }, "PET PHẾT – PET FIRST"),
                React.createElement("h2", { id: "pet-home-values-title" }, "Một nơi để chăm sóc bé chu đáo hơn")),
            React.createElement("div", { className: "pet-home-values-list" }, [
                ['01', 'Dịch vụ rõ ràng', 'Tìm hiểu nội dung và mức giá trước khi chọn dịch vụ.'],
                ['02', 'Lịch hẹn chủ động', 'Chọn khung giờ còn trống phù hợp với bạn và bé.'],
                ['03', 'Thông tin liền mạch', 'Lưu hồ sơ thú cưng và xem lại các lần chăm sóc.']
            ].map(([number, title, description]) => (React.createElement("article", { key: number },
                React.createElement("span", null, number),
                React.createElement("div", null,
                    React.createElement("h3", null, title),
                    React.createElement("p", null, description))))))),
        React.createElement("section", { id: "pet-how-it-works", className: "pet-how-it-works" },
            React.createElement("div", { className: "pet-section-heading centered" },
                React.createElement("div", null,
                    React.createElement("span", { className: "pet-section-kicker" }, "ĐẶT LỊCH THẬT DỄ DÀNG"),
                    React.createElement("h2", null, "Chỉ 4 bước để bé được chăm sóc"))),
            React.createElement("div", { className: "pet-steps-grid" }, [
                ['01', 'Chọn dịch vụ', 'Tìm hiểu dịch vụ phù hợp với bé cưng.'],
                ['02', 'Chọn thú cưng', 'Sử dụng hồ sơ bé đã lưu hoặc tạo mới.'],
                ['03', 'Chọn thời gian', 'Chọn ngày và khung giờ còn sức chứa.'],
                ['04', 'Xác nhận đặt lịch', 'Kiểm tra thông tin và chọn COD hoặc QR.']
            ].map(([number, title, description]) => React.createElement("article", { key: number },
                React.createElement("span", null, number),
                React.createElement("h3", null, title),
                React.createElement("p", null, description)))),
            React.createElement("div", { className: "pet-center-action" },
                React.createElement("button", { className: "pet-button pet-button-primary", onClick: () => onNavigateToBooking() },
                    "Bắt đầu đặt lịch ",
                    React.createElement(ArrowRight, { size: 18 })))),
        React.createElement("section", { className: "pet-care-notes", "aria-labelledby": "pet-care-notes-title" },
            React.createElement("div", { className: "pet-section-heading" },
                React.createElement("div", null,
                    React.createElement("span", { className: "pet-section-kicker" }, "ĐỒNG HÀNH CÙNG BÉ"),
                    React.createElement("h2", { id: "pet-care-notes-title" }, "Chăm sóc tốt hơn từ những điều nhỏ"))),
            React.createElement("div", { className: "pet-care-notes-grid" }, careNotes.map(({ title, description, icon: Icon }) => (React.createElement("article", { key: title },
                React.createElement(Icon, { size: 21, "aria-hidden": "true" }),
                React.createElement("h3", null, title),
                React.createElement("p", null, description)))))),
        React.createElement("section", { className: "pet-review-section" },
            React.createElement("div", { className: "pet-section-heading" },
                React.createElement("div", null,
                    React.createElement("span", { className: "pet-section-kicker" }, "CHIA SẺ TỪ KHÁCH HÀNG"),
                    React.createElement("h2", null, "Những chiếc đuôi vui vẻ"))),
            reviews.length > 0 ? React.createElement("div", { className: "pet-review-grid" }, reviews.map((review) => React.createElement("article", { key: review.id, className: "pet-review-card" },
                React.createElement("div", { className: "pet-review-stars" },
                    '★'.repeat(review.rating),
                    '☆'.repeat(5 - review.rating)),
                React.createElement("p", null,
                    "“",
                    review.comment,
                    "”"),
                React.createElement("strong", null, review.user_name),
                React.createElement("small", null,
                    "Chủ bé ",
                    review.pet_name)))) : React.createElement("div", { className: "pet-empty-reviews" },
                React.createElement(Sparkles, null),
                " Pet Phết đang chờ những chia sẻ đầu tiên từ bạn.")),
        React.createElement("section", { className: "pet-bottom-cta" },
            React.createElement("div", null,
                React.createElement("span", { className: "pet-section-kicker" }, "SẴN SÀNG CHO MỘT NGÀY THẬT VUI?"),
                React.createElement("h2", null, "Bắt đầu hành trình chăm sóc bé hôm nay")),
            React.createElement("button", { className: "pet-button pet-button-white", onClick: () => onNavigateToBooking() },
                "Đặt lịch cho bé ",
                React.createElement(ArrowRight, { size: 18 }))),
        React.createElement("section", { className: "pet-newsletter", "aria-labelledby": "pet-newsletter-title" },
            React.createElement("div", null,
                React.createElement("span", { className: "pet-section-kicker" }, "TIN MỚI TỪ PET PHẾT"),
                React.createElement("h2", { id: "pet-newsletter-title" }, "Một chút tin vui cho bạn và bé"),
                React.createElement("p", null, "Nhận thông tin dịch vụ, ưu đãi và mẹo chăm sóc thú cưng.")),
            React.createElement("form", { onSubmit: handleNewsletterSubmit },
                React.createElement("label", { className: "sr-only", htmlFor: "pet-newsletter-email" }, "Email của bạn"),
                React.createElement("input", { id: "pet-newsletter-email", type: "email", autoComplete: "email", required: true, placeholder: "Nhập email của bạn", value: newsletterEmail, onChange: (event) => { setNewsletterEmail(event.target.value); setNewsletterMessage(''); } }),
                React.createElement("button", { type: "submit" },
                    "Đăng ký nhận tin ",
                    React.createElement(ArrowRight, { size: 17 })),
                newsletterMessage && React.createElement("p", { className: "pet-newsletter-status", role: "status" },
                    newsletterMessage,
                    " Nếu không mở được, gửi email đến contact@petphet.vn."))),
        selectedService && (React.createElement("div", { className: "pet-service-detail-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs", role: "presentation", onMouseDown: (event) => { if (event.target === event.currentTarget)
                setSelectedService(null); } },
            React.createElement("div", { className: "pet-service-detail-dialog relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl", role: "dialog", "aria-modal": "true", "aria-label": `Chi tiết ${selectedService.service_name}`, onMouseDown: (event) => event.stopPropagation() },
                React.createElement("div", { className: "p-6 space-y-4" },
                    React.createElement("div", { className: "flex flex-wrap items-start justify-between gap-3" },
                        React.createElement("div", { className: "min-w-0" },
                            React.createElement("h3", { className: "text-2xl font-black text-[#81451F] font-heading" }, selectedService.service_name),
                            React.createElement("p", { className: "mt-1 text-xs text-[#7d634a] flex items-center gap-2" },
                                React.createElement(Clock, { size: 14 }),
                                " ",
                                selectedService.duration_minutes,
                                " phút · ",
                                selectedService.species_supported.join(', '))),
                        React.createElement("strong", { className: "text-xl text-[#EC802B]" },
                            selectedService.is_weight_based ? 'Từ ' : '',
                            formatVND(selectedService.base_price))),
                    React.createElement("p", { className: "text-sm leading-7 text-[#76583d]" }, selectedService.description),
                    selectedService.is_weight_based && selectedService.pricing_tiers?.length ? (React.createElement("div", { className: "rounded-2xl bg-[#FFF7ED] border border-[#E8CCAD] p-4" },
                        React.createElement("h4", { className: "font-bold text-sm text-[#81451F] mb-2" }, "Bảng giá theo cân nặng"),
                        React.createElement("div", { className: "space-y-2 text-xs" }, selectedService.pricing_tiers.map((tier) => React.createElement("div", { key: tier.id, className: "flex justify-between gap-3" },
                            React.createElement("span", null,
                                tier.min_weight,
                                "–",
                                tier.max_weight,
                                " kg"),
                            React.createElement("strong", null, formatVND(tier.price))))))) : null,
                    React.createElement("div", { className: "border-t border-[#F0E2D2] pt-3" },
                        React.createElement("div", { className: "flex items-center justify-between gap-3" },
                            React.createElement("h4", { className: "font-bold text-sm text-[#81451F]" },
                                "Đánh giá khách hàng (",
                                selectedServiceRatingCount,
                                ")"),
                            React.createElement("span", { className: "text-xs text-[#D79A2D]" },
                                "★ ",
                                selectedServiceRatingAverage,
                                " / 5.0")),
                        React.createElement("div", { className: "mt-2 space-y-2 max-h-40 overflow-y-auto" }, latestSelectedServiceReviews.length ? latestSelectedServiceReviews.map((review) => React.createElement("div", { key: review.id, className: "rounded-xl bg-[#FFFAF4] p-3 text-xs" },
                            React.createElement("strong", null,
                                review.user_name,
                                " · ",
                                review.pet_name),
                            React.createElement("p", { className: "mt-1 text-[#76583d]" }, review.comment))) : React.createElement("p", { className: "text-xs text-[#9b846e]" }, "Dịch vụ chưa có đánh giá.")),
                        selectedServiceReviews.length > 5 && React.createElement("p", { className: "mt-2 text-[11px] text-[#9b846e]" },
                            "Đang hiển thị 5 đánh giá mới nhất trên tổng số ",
                            selectedServiceRatingCount,
                            " đánh giá.")),
                    React.createElement("div", { className: "flex justify-end" },
                        React.createElement("button", { className: "pet-button pet-button-primary", onClick: () => { const id = selectedService.id; setSelectedService(null); onNavigateToBooking(id); } },
                            React.createElement(CalendarDays, { size: 17 }),
                            " Đặt lịch dịch vụ này"))))))));
};
