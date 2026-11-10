import React, { useEffect, useState } from '../../js/react.js';
import { Search, Clock, Star, Calendar, AlertCircle } from '../../js/icons.js';
import { store } from '../../services/store.js';
import { formatVND } from '../../services/bookingEngine.js';
export const ServicesPage = ({ onSelectServiceToBook, initialServiceId, onInitialServiceHandled }) => {
    const allServices = store.getServices(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [maxPrice, setMaxPrice] = useState(1000000);
    const [detailModalService, setDetailModalService] = useState(null);
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    useEffect(() => {
        if (!initialServiceId)
            return;
        const targetService = allServices.find((service) => service.id === initialServiceId);
        if (targetService)
            setDetailModalService(targetService);
        onInitialServiceHandled?.();
    }, [initialServiceId]);
    useEffect(() => {
        if (!detailModalService)
            return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape')
                setDetailModalService(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [detailModalService]);
    // The search bar stays pinned under the sticky navigation bar, so publish that bar's real height
    // (it changes with the screen width) as a CSS variable for styles/15-feature-updates.css.
    useEffect(() => {
        const header = document.querySelector('.pet-navbar-wrap, .pet-public-navbar-wrap');
        if (!header)
            return;
        const publishHeaderHeight = () => document.documentElement.style.setProperty('--pet-header-height', `${Math.round(header.getBoundingClientRect().height)}px`);
        publishHeaderHeight();
        const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(publishHeaderHeight) : null;
        observer?.observe(header);
        return () => {
            observer?.disconnect();
            document.documentElement.style.removeProperty('--pet-header-height');
        };
    }, []);
    // Filter logic
    const filteredServices = allServices.filter((s) => {
        const matchesQuery = !normalizedQuery ||
            s.service_name.toLocaleLowerCase().includes(normalizedQuery) ||
            s.description.toLocaleLowerCase().includes(normalizedQuery);
        const matchesPrice = s.base_price <= maxPrice;
        return matchesQuery && matchesPrice;
    });
    // The modal's count and average must always come from this service's own review records.
    const detailServiceReviews = detailModalService
        ? store.getReviewsByService(detailModalService.id)
        : [];
    const detailServiceRatingCount = detailServiceReviews.length;
    const detailServiceRatingAverage = detailServiceRatingCount
        ? (detailServiceReviews.reduce((sum, review) => sum + review.rating, 0) / detailServiceRatingCount).toFixed(1)
        : '0.0';
    const latestDetailServiceReviews = detailModalService
        ? store.getLatestReviewsByService(detailModalService.id)
        : [];
    const isVaccinationService = detailModalService
        ? /tiêm|vaccine/i.test(detailModalService.service_name)
        : false;
    return (React.createElement("div", { id: "pet-services-page", className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" },
        React.createElement("div", { className: "mb-8", "data-scroll-reveal": true },
            React.createElement("span", { className: "text-xs font-black uppercase tracking-widest text-[#EC802B]" }, "Minh bạch & Chuẩn y khoa"),
            React.createElement("h1", { className: "text-3xl sm:text-4xl font-black text-[#81451F] font-heading mt-1" }, "Dịch vụ thú cưng")),
        React.createElement("div", { className: "pet-service-toolbar bg-white p-5 rounded-3xl border-2 border-[#E8CCAD] shadow-xs mb-8", "data-scroll-reveal": true },
            React.createElement("div", { className: "pet-service-search pet-service-search-line relative" },
                React.createElement(Search, { className: "w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" }),
                React.createElement("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Tìm kiếm dịch vụ (tắm spa, cắt tỉa, vaccine...)", className: "w-full bg-transparent border-0 border-b border-[#E8CCAD] rounded-none pl-10 pr-4 py-2 text-sm text-[#81451F] focus:outline-none focus:ring-0 focus:border-[#EC802B]" })),
            React.createElement("div", { className: "pet-service-price-filter text-xs text-neutral-600" },
                React.createElement("span", { className: "font-bold text-[#81451F]" }, "Mức giá tối đa:"),
                React.createElement("input", { "aria-label": "Mức giá tối đa", type: "range", min: "100000", max: "1000000", step: "50000", value: maxPrice, onChange: (e) => setMaxPrice(Number(e.target.value)), className: "accent-[#EC802B] cursor-pointer" }),
                React.createElement("span", { className: "font-black text-[#EC802B]" }, formatVND(maxPrice))),
            React.createElement("span", { className: "pet-service-count text-[11px] text-neutral-400" },
                "Tìm thấy ",
                filteredServices.length,
                " dịch vụ phù hợp")),
        filteredServices.length === 0 ? (React.createElement("div", { className: "text-center py-16 bg-white rounded-3xl border-2 border-dashed border-[#E8CCAD] p-8" },
            React.createElement(AlertCircle, { className: "w-12 h-12 text-[#EDC55B] mx-auto mb-3" }),
            React.createElement("h3", { className: "text-lg font-bold text-[#81451F] font-heading" }, "Không tìm thấy dịch vụ phù hợp"),
            React.createElement("p", { className: "text-xs text-neutral-500 mt-1" }, "Vui lòng thử tìm với từ khóa khác hoặc điều chỉnh bộ lọc giá."),
            React.createElement("button", { onClick: () => {
                    setSearchQuery('');
                    setMaxPrice(1000000);
                }, className: "mt-4 px-4 py-2 bg-[#EC802B] text-white rounded-xl text-xs font-bold cursor-pointer" }, "Đặt lại bộ lọc"))) : (React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, filteredServices.map((srv) => (React.createElement("article", { key: srv.id, role: "button", tabIndex: 0, "aria-label": `Xem chi tiết dịch vụ ${srv.service_name}`, onClick: () => setDetailModalService(srv), onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setDetailModalService(srv);
            } }, className: "pet-service-result-card bg-white rounded-3xl border-2 border-[#E8CCAD] overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col group" },
            React.createElement("div", { className: "relative h-48 overflow-hidden bg-neutral-100" },
                React.createElement("img", { src: srv.image_url, alt: srv.service_name, className: "w-full h-full object-cover" })),
            React.createElement("div", { className: "p-5 flex-1 flex flex-col justify-between space-y-4" },
                React.createElement("div", null,
                    React.createElement("div", { className: "flex items-center gap-2 text-xs text-neutral-500 mb-2" },
                        React.createElement("span", { className: "flex items-center gap-1" },
                            React.createElement(Clock, { className: "w-3.5 h-3.5 text-[#66BCB4]" }),
                            " ",
                            srv.duration_minutes,
                            " phút"),
                        React.createElement("span", null, "•"),
                        React.createElement("span", null,
                            "Dành cho: ",
                            srv.species_supported.join(', '))),
                    React.createElement("h3", { className: "pet-service-title font-bold text-lg text-[#81451F] font-heading group-hover:text-[#EC802B] transition-colors" }, srv.service_name),
                    React.createElement("p", { className: "text-xs text-neutral-600 line-clamp-2 mt-2 leading-relaxed font-vietnamese" }, srv.description)),
                React.createElement("div", { className: "pet-service-rating pt-3 border-t border-[#FAF6F0]", "aria-label": `${srv.rating_count > 0 ? srv.rating_avg.toFixed(1) : '0.0'} trên 5 sao, ${srv.rating_count} đánh giá` },
                    React.createElement("span", { className: "pet-service-rating-stars", "aria-hidden": "true" }, Array.from({ length: 5 }, (_, index) => (React.createElement(Star, { key: index, className: index < Math.round(srv.rating_avg) ? 'is-filled' : '' })))),
                    React.createElement("strong", null, srv.rating_count > 0 ? srv.rating_avg.toFixed(1) : '0.0'),
                    React.createElement("span", { className: "pet-service-rating-count" },
                        "(",
                        srv.rating_count,
                        ")")))))))),
        detailModalService && (React.createElement("div", { className: "pet-service-detail-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200", role: "presentation", onMouseDown: (event) => { if (event.target === event.currentTarget)
                setDetailModalService(null); } },
            React.createElement("div", { className: "pet-service-detail-dialog relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col", role: "dialog", "aria-modal": "true", "aria-label": `Chi tiết ${detailModalService.service_name}`, onMouseDown: (event) => event.stopPropagation() },
                React.createElement("div", { className: "p-6 overflow-y-auto space-y-4" },
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("div", null,
                            React.createElement("h3", { className: "text-2xl font-black text-[#81451F] font-heading" }, detailModalService.service_name),
                            React.createElement("div", { className: "flex items-center gap-3 text-xs text-neutral-500 mt-1" },
                                React.createElement("span", { className: "flex items-center gap-1 font-bold text-[#66BCB4]" },
                                    React.createElement(Clock, { className: "w-3.5 h-3.5" }),
                                    " Thời lượng: ",
                                    detailModalService.duration_minutes,
                                    " phút"),
                                React.createElement("span", null, "•"),
                                React.createElement("span", null,
                                    "Tiếp nhận: ",
                                    detailModalService.species_supported.join(', ')))),
                        React.createElement("div", { className: "text-right" },
                            React.createElement("span", { className: "text-xs text-neutral-400 block" }, detailModalService.is_weight_based ? 'Giá từ' : 'Giá dịch vụ'),
                            React.createElement("span", { className: "text-2xl font-black text-[#EC802B]" }, formatVND(detailModalService.base_price)))),
                    React.createElement("div", { className: `pet-service-detail-description ${detailModalService.image_url ? 'has-image' : ''}` },
                        React.createElement("div", { className: "pet-service-detail-description-text" },
                            React.createElement("h4", { className: "font-bold text-sm text-[#81451F] mb-1" }, "Mô tả quy trình dịch vụ"),
                            React.createElement("p", { className: "text-xs text-neutral-700 leading-relaxed font-vietnamese" }, detailModalService.description)),
                        // Each service shows its own photo (the image set for that service / price table) next to the description.
                        detailModalService.image_url && (React.createElement("img", { className: "pet-service-detail-description-image", src: detailModalService.image_url, alt: detailModalService.service_name, loading: "lazy", onError: (event) => { event.currentTarget.hidden = true; event.currentTarget.parentElement?.classList.remove('has-image'); } }))),
                    isVaccinationService && (React.createElement("section", { className: "pet-vaccine-guidance", "aria-labelledby": "pet-vaccine-guidance-title" },
                        React.createElement("h4", { id: "pet-vaccine-guidance-title" }, "Vaccine thường gặp & độ tuổi tham khảo"),
                        React.createElement("p", { className: "pet-vaccine-age" }, "Chó con và mèo con thường bắt đầu loạt vaccine cơ bản vào khoảng 6–8 tuần tuổi; nhắc lại mỗi 2–4 tuần cho đến khi mũi cuối được tiêm lúc ít nhất 16 tuần tuổi. Bé có nguy cơ phơi nhiễm cao có thể cần lịch khác do bác sĩ chỉ định."),
                        React.createElement("div", { className: "pet-vaccine-species" },
                            React.createElement("div", null,
                                React.createElement("strong", null, "Chó"),
                                React.createElement("p", null, "Combo 5/7 bệnh thường có nhóm Care (distemper), adenovirus và parvovirus; tùy sản phẩm có thể thêm parainfluenza hoặc Leptospira. Vaccine dại được tiêm theo hướng dẫn bác sĩ và quy định địa phương.")),
                            React.createElement("div", null,
                                React.createElement("strong", null, "Mèo"),
                                React.createElement("p", null, "Combo 3/4 bệnh FVRCP thường phòng giảm bạch cầu, herpesvirus và calicivirus; một số sản phẩm có thêm Chlamydia. Vaccine dại và FeLV được cân nhắc theo quy định, độ tuổi và nguy cơ tiếp xúc."))),
                        React.createElement("p", { className: "pet-vaccine-caution" }, "Tên gọi “3/4/5/7 bệnh” và thành phần có thể khác theo nhà sản xuất. Lịch mũi nhắc phụ thuộc lịch sử vaccine, sức khỏe, sản phẩm và quy định địa phương; bác sĩ cần khám và xác nhận trước khi tiêm. Đây là thông tin tham khảo, không thay thế tư vấn thú y."),
                        React.createElement("div", { className: "pet-vaccine-sources" },
                            React.createElement("span", null, "Nguồn tham khảo:"),
                            React.createElement("a", { href: "https://wsava.org/global-guidelines/vaccination-guidelines/", target: "_blank", rel: "noopener noreferrer" }, "WSAVA 2024"),
                            React.createElement("a", { href: "https://www.aaha.org/resources/2022-aaha-canine-vaccination-guidelines/", target: "_blank", rel: "noopener noreferrer" }, "AAHA – vaccine cho chó")))),
                    detailModalService.is_weight_based && detailModalService.pricing_tiers && (React.createElement("div", null,
                        React.createElement("h4", { className: "font-bold text-sm text-[#81451F] mb-2" }, "Bảng giá chi tiết theo cân nặng"),
                        React.createElement("div", { className: "divide-y divide-[#E8CCAD] border border-[#E8CCAD] rounded-2xl overflow-hidden text-xs" }, detailModalService.pricing_tiers.map((tier) => (React.createElement("div", { key: tier.id, className: "flex justify-between p-3 bg-white hover:bg-[#FAF6F0]" },
                            React.createElement("span", { className: "font-semibold text-neutral-700" },
                                "Bé từ ",
                                tier.min_weight,
                                "kg đến dưới ",
                                tier.max_weight,
                                "kg"),
                            React.createElement("strong", { className: "text-[#EC802B] font-bold" }, formatVND(tier.price)))))))),
                    React.createElement("div", { className: "pt-2 border-t border-[#FAF6F0]" },
                        React.createElement("h4", { className: "font-bold text-sm text-[#81451F] mb-2 flex items-center justify-between" },
                            React.createElement("span", null,
                                "Đánh giá từ khách hàng (",
                                detailServiceRatingCount,
                                ")"),
                            React.createElement("span", { className: "text-xs font-black text-[#EC802B] flex items-center gap-1" },
                                React.createElement(Star, { className: "w-3.5 h-3.5 fill-current text-[#EDC55B]" }),
                                " ",
                                detailServiceRatingAverage,
                                " / 5.0")),
                        React.createElement("div", { className: "space-y-2 max-h-40 overflow-y-auto" }, detailServiceReviews.length === 0 ? (React.createElement("p", { className: "text-xs text-neutral-400 italic" }, "Chưa có đánh giá nào cho dịch vụ này.")) : (latestDetailServiceReviews.map((r) => (React.createElement("div", { key: r.id, className: "p-3 rounded-xl bg-[#FAF6F0] text-xs space-y-1" },
                            React.createElement("div", { className: "flex justify-between font-bold text-[#81451F]" },
                                React.createElement("span", null,
                                    r.user_name,
                                    " (",
                                    r.pet_name,
                                    ")"),
                                React.createElement("span", { className: "text-[#EDC55B]" }, '★'.repeat(r.rating))),
                            React.createElement("p", { className: "text-neutral-600" }, r.comment)))))),
                        detailServiceReviews.length > 5 && (React.createElement("p", { className: "mt-2 text-xs text-neutral-500" },
                            "Đang hiển thị 5 đánh giá mới nhất trên tổng số ",
                            detailServiceRatingCount,
                            " đánh giá.")))),
                React.createElement("div", { className: "p-4 bg-[#FAF6F0] border-t border-[#E8CCAD] flex items-center justify-end gap-3 shrink-0" },
                    React.createElement("button", { onClick: () => {
                            const id = detailModalService.id;
                            setDetailModalService(null);
                            onSelectServiceToBook(id);
                        }, className: "px-6 py-2.5 rounded-xl bg-[#EC802B] hover:bg-[#D46917] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2" },
                        React.createElement(Calendar, { className: "w-4 h-4" }),
                        " Đặt lịch dịch vụ này")))))));
};
