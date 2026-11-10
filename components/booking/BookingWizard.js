import React, { useState, useEffect, useRef } from '../../js/react.js';
import { Clock, PawPrint, CheckCircle2, AlertCircle, Tag, Banknote, ArrowRight, ArrowLeft, Scale, Sparkles, QrCode } from '../../js/icons.js';
import { store } from '../../services/store.js';
import { BookingCalendar } from './BookingCalendar.js';
import { notifyToast } from '../../js/utils/toast.js';
import { applyCouponDiscount, calculateEndTime, calculateServicePrice, checkContinuousCapacity, formatVND } from '../../services/bookingEngine.js';
export const BookingWizard = ({ currentUser, preselectedServiceId, preselectedPetId, initialStep = 1, onBookingCompleted, onNavigateToPetManagement }) => {
    const services = store.getServices(true);
    const userPets = store.getPetsByUser(currentUser.id);
    const schedules = store.getSchedules();
    const bookingPageRef = useRef(null);
    const servicePricingRef = useRef(null);
    // Wizard Step State
    // Coming from the Services page with a service already chosen skips straight to step 2 (choose pet).
    const [currentStep, setCurrentStep] = useState(() => initialStep === 2 && preselectedServiceId && services.some((service) => service.id === preselectedServiceId) ? 2 : 1);
    // Selections
    const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || services[0]?.id || '');
    const [selectedPetId, setSelectedPetId] = useState(preselectedPetId || userPets[0]?.id || '');
    const [confirmedWeight, setConfirmedWeight] = useState(4.0);
    // Text shown in the weight box, so the field can be cleared completely while typing a new value.
    const [confirmedWeightText, setConfirmedWeightText] = useState('4');
    const [bookingDate, setBookingDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });
    const [bookingTime, setBookingTime] = useState('09:00');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponMessage, setCouponMessage] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [customerNote, setCustomerNote] = useState('');
    const [isServicePricingOpen, setIsServicePricingOpen] = useState(false);
    useEffect(() => {
        if (!isServicePricingOpen)
            return;
        const frameId = window.requestAnimationFrame(() => {
            const pricing = servicePricingRef.current;
            if (!pricing)
                return;
            const header = document.querySelector('.pet-navbar-wrap, .pet-public-navbar-wrap');
            const visibleBottom = window.innerHeight - 16;
            const pricingBottom = pricing.getBoundingClientRect().bottom;
            const scrollDistance = Math.max(0, pricingBottom - visibleBottom);
            if (scrollDistance > 0) {
                window.scrollBy({ top: scrollDistance, behavior: 'smooth' });
            }
            else if (header && pricing.getBoundingClientRect().top < header.getBoundingClientRect().bottom + 8) {
                window.scrollBy({
                    top: pricing.getBoundingClientRect().top - header.getBoundingClientRect().bottom - 8,
                    behavior: 'smooth'
                });
            }
        });
        return () => window.cancelAnimationFrame(frameId);
    }, [isServicePricingOpen, selectedServiceId]);
    const [errorMessage, setErrorMessage] = useState('');
    const reportError = (message) => { setErrorMessage(message); notifyToast('error', message); };
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Current selected objects
    const selectedService = services.find((s) => s.id === selectedServiceId);
    const selectedPet = userPets.find((p) => p.id === selectedPetId);
    // Ensure stale unpaid QR reservations are released before showing availability.
    useEffect(() => {
        store.processExpiredQrBookings();
    }, []);
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    // Sync pet weight when pet selection changes
    useEffect(() => {
        if (selectedPet) {
            setConfirmedWeight(selectedPet.weight || 4.0);
            setConfirmedWeightText(String(selectedPet.weight || 4.0));
        }
    }, [selectedPetId]);
    // If preselectedServiceId changes from outside
    useEffect(() => {
        if (preselectedServiceId) {
            setSelectedServiceId(preselectedServiceId);
        }
    }, [preselectedServiceId]);
    useEffect(() => {
        const revealTargets = bookingPageRef.current?.querySelectorAll('[data-scroll-reveal]');
        if (!revealTargets?.length)
            return;
        if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            revealTargets.forEach((target) => target.classList.add('is-scroll-visible'));
            return;
        }
        revealTargets.forEach((target) => target.classList.remove('is-scroll-visible'));
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting)
                    return;
                entry.target.classList.add('is-scroll-visible');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        revealTargets.forEach((target) => observer.observe(target));
        return () => observer.disconnect();
    }, [currentStep, errorMessage]);
    // Compute prices
    const basePrice = selectedService
        ? calculateServicePrice(selectedService, confirmedWeight)
        : 0;
    const couponCalculation = applyCouponDiscount(basePrice, appliedCoupon);
    // Available Time Slots for selected date
    const selectedSchedule = store.getScheduleForDate(bookingDate);
    const allBookings = store.getBookings();
    // Generate only start times that fit the whole service duration inside working hours.
    const slotOptions = [];
    if (selectedService && selectedSchedule.is_available) {
        const [openH, openM] = selectedSchedule.start_time.split(':').map(Number);
        const [closeH, closeM] = selectedSchedule.end_time.split(':').map(Number);
        const openMinutes = openH * 60 + openM;
        const closeMinutes = closeH * 60 + closeM;
        const stepMinutes = Math.max(15, selectedSchedule.slot_duration_minutes || 30);
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        for (let startMinutes = openMinutes; startMinutes + selectedService.duration_minutes <= closeMinutes; startMinutes += stepMinutes) {
            const timeStr = `${Math.floor(startMinutes / 60).toString().padStart(2, '0')}:${(startMinutes % 60).toString().padStart(2, '0')}`;
            const isPastToday = bookingDate === todayKey && startMinutes <= currentMinutes;
            const check = checkContinuousCapacity(bookingDate, timeStr, selectedService.duration_minutes, allBookings, selectedSchedule.max_concurrent_capacity);
            slotOptions.push({
                time: timeStr,
                isAvailable: !isPastToday && check.isAvailable,
                reason: isPastToday ? 'Khung giờ này đã qua.' : check.reason
            });
        }
    }
    // Handle coupon application
    const handleApplyCoupon = (e) => {
        e.preventDefault();
        if (!couponCode.trim())
            return;
        const coupon = store.getCoupons().find((c) => c.code.toUpperCase() === couponCode.trim().toUpperCase());
        if (!coupon) {
            setCouponMessage('Mã giảm giá không tồn tại.');
            setAppliedCoupon(null);
            notifyToast('error', 'Mã giảm giá không tồn tại.');
            return;
        }
        const check = applyCouponDiscount(basePrice, coupon);
        if (!check.isValid) {
            setCouponMessage(check.message);
            setAppliedCoupon(null);
            notifyToast('error', check.message);
        }
        else {
            setAppliedCoupon(coupon);
            setCouponMessage(check.message);
            notifyToast('success', check.message || `Đã áp dụng mã ${coupon.code}.`);
        }
    };
    const validateStep = (step) => {
        if (step === 1) {
            if (!selectedService) {
                reportError('Vui lòng chọn dịch vụ chăm sóc.');
                return false;
            }
        }
        else if (step === 2) {
            if (userPets.length === 0) {
                reportError('Bạn chưa có hồ sơ thú cưng nào. Vui lòng thêm hồ sơ trước khi đặt lịch.');
                return false;
            }
            if (!selectedPet) {
                reportError('Vui lòng chọn thú cưng.');
                return false;
            }
            if (selectedService && !selectedService.species_supported.includes(selectedPet.species)) {
                reportError(`Dịch vụ ${selectedService.service_name} chỉ áp dụng cho ${selectedService.species_supported.join(', ')}. Bé ${selectedPet.pet_name} là ${selectedPet.species} không phù hợp.`);
                return false;
            }
            if (confirmedWeight <= 0) {
                reportError('Vui lòng xác nhận cân nặng thực tế lớn hơn 0 kg.');
                return false;
            }
        }
        else if (step === 3) {
            if (!selectedSchedule.is_available) {
                reportError(`Cơ sở đóng cửa ngày ${bookingDate}. Vui lòng chọn ngày khác.`);
                return false;
            }
            if (selectedService) {
                const selectedSlot = slotOptions.find((slot) => slot.time === bookingTime);
                if (!selectedSlot || !selectedSlot.isAvailable) {
                    reportError(selectedSlot?.reason || 'Khung giờ này không còn khả dụng. Vui lòng chọn khung giờ khác.');
                    return false;
                }
            }
        }
        return true;
    };
    const handleStepClick = (targetStep) => {
        setErrorMessage('');
        if (targetStep > currentStep) {
            for (let step = currentStep; step < targetStep; step += 1) {
                if (!validateStep(step))
                    return;
            }
        }
        setCurrentStep(targetStep);
    };
    // STEP VALIDATION
    const handleNextStep = () => {
        setErrorMessage('');
        if (!validateStep(currentStep))
            return;
        if (currentStep === 1) {
            notifyToast('success', `Đã chọn dịch vụ ${selectedService?.service_name}.`);
        }
        else if (currentStep === 2 && selectedPet) {
            notifyToast('success', `Đã chọn hồ sơ bé ${selectedPet.pet_name} và xác nhận cân nặng.`);
        }
        else if (currentStep === 3) {
            notifyToast('success', `Khung giờ ${bookingTime} ngày ${bookingDate} còn chỗ cho dịch vụ đã chọn.`);
        }
        setCurrentStep((step) => Math.min(step + 1, 4));
    };
    // FINAL SUBMISSION (Step 4 -> Step 5)
    const handleConfirmBooking = () => {
        setIsSubmitting(true);
        setErrorMessage('');
        setTimeout(() => {
            const res = store.createBooking({
                userId: currentUser.id,
                petId: selectedPetId,
                serviceId: selectedServiceId,
                bookingDate,
                bookingTime,
                confirmedWeight,
                couponCode: appliedCoupon ? appliedCoupon.code : undefined,
                paymentMethod,
                customerNote
            });
            setIsSubmitting(false);
            if (!res.success || !res.booking) {
                reportError(res.message);
                return;
            }
            notifyToast('success', `Đặt lịch thành công. Mã lịch hẹn ${res.booking.id} đã được tạo.`);
            onBookingCompleted(res.booking, res.payment);
        }, 400);
    };
    return (React.createElement("div", { ref: bookingPageRef, className: "pet-booking-page max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10" },
        React.createElement("div", { className: "mb-8", "data-scroll-reveal": true },
            React.createElement("span", { className: "text-xs font-black uppercase tracking-widest text-[#EC802B]" }, "Đặt lịch dễ dàng"),
            React.createElement("h1", { className: "text-3xl font-black text-[#81451F] font-heading mt-1" }, "Quy Trình Đặt Lịch Chăm Sóc Bé Cưng"),
            React.createElement("div", { className: "grid grid-cols-4 gap-2 mt-6" }, [
                { num: 1, label: 'Chọn dịch vụ' },
                { num: 2, label: 'Bé cưng & Cân nặng' },
                { num: 3, label: 'Ngày & Khung giờ' },
                { num: 4, label: 'Xác nhận & Thanh toán' }
            ].map((s) => (React.createElement("button", { key: s.num, type: "button", onClick: () => handleStepClick(s.num), "aria-current": currentStep === s.num ? 'step' : undefined, className: `pet-booking-step-indicator p-3 rounded-2xl border text-center transition-all cursor-pointer ${currentStep === s.num
                    ? 'bg-[#EC802B] text-white border-[#EC802B] shadow-sm'
                    : currentStep > s.num
                        ? 'bg-[#FAF6F0] text-[#66BCB4] border-[#66BCB4] font-bold'
                        : 'bg-white text-neutral-400 border-[#E8CCAD]'}` },
                React.createElement("div", { className: "text-xs font-black" },
                    "BƯỚC ",
                    s.num),
                React.createElement("div", { className: "pet-booking-step-label text-[11px] truncate hidden sm:block" }, s.label)))))),
        errorMessage && (React.createElement("div", { "data-scroll-reveal": true, className: "mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2" },
            React.createElement(AlertCircle, { className: "w-4 h-4 text-red-600 shrink-0" }),
            React.createElement("span", null, errorMessage))),
        currentStep === 1 && (React.createElement("div", { "data-scroll-reveal": true, className: `pet-booking-step-panel bg-white p-6 rounded-3xl border-2 border-[#E8CCAD] shadow-xs space-y-6${isServicePricingOpen ? ' has-service-pricing' : ''}` },
            React.createElement("div", { className: "border-b border-[#FAF6F0] pb-3" },
                React.createElement("h3", { className: "text-xl font-black text-[#81451F] font-heading" }, "Bước 1: Lựa chọn dịch vụ")),
            React.createElement("div", { className: "pet-booking-service-grid grid grid-cols-2 gap-2" }, services.map((srv) => (React.createElement("div", { key: srv.id, role: "button", tabIndex: 0, "aria-expanded": isServicePricingOpen && selectedServiceId === srv.id, "aria-controls": isServicePricingOpen && selectedServiceId === srv.id ? `booking-price-${srv.id}` : undefined, onClick: () => { setSelectedServiceId(srv.id); setIsServicePricingOpen(true); }, onKeyDown: (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedServiceId(srv.id);
                        setIsServicePricingOpen(true);
                    }
                }, className: `pet-booking-service-choice p-3 rounded-2xl border-2 transition-all cursor-pointer flex gap-3 ${selectedServiceId === srv.id
                    ? 'border-[#EC802B] bg-[#FDE8D7]/30 ring-2 ring-[#EC802B]'
                    : 'border-[#E8CCAD] hover:border-[#EDC55B] bg-[#FAF6F0]/40'}` },
                React.createElement("img", { src: srv.image_url, alt: srv.service_name, className: "w-14 h-14 rounded-xl object-cover shrink-0" }),
                React.createElement("div", { className: "flex-1 min-w-0" },
                    React.createElement("div", { className: "flex items-center justify-between gap-1" },
                        React.createElement("h4", { className: "font-bold text-sm text-[#81451F] truncate" }, srv.service_name),
                        selectedServiceId === srv.id && (React.createElement(CheckCircle2, { className: "w-4 h-4 text-[#EC802B] shrink-0" }))),
                    React.createElement("div", { className: "mt-2 flex items-center text-xs" },
                        React.createElement("span", { className: "text-neutral-500 flex items-center gap-1 text-[11px]" },
                            React.createElement(Clock, { className: "w-3 h-3 text-[#66BCB4]" }),
                            " ",
                            srv.duration_minutes,
                            " phút"))))))),
            isServicePricingOpen && selectedService && (React.createElement("div", { ref: servicePricingRef, id: `booking-price-${selectedService.id}`, className: "pet-booking-service-pricing", "aria-live": "polite" },
                React.createElement("h4", null,
                    selectedService.service_name,
                    " · Bảng giá"),
                selectedService.is_weight_based && selectedService.pricing_tiers?.length ? (React.createElement("div", { className: "pet-booking-price-tiers" }, selectedService.pricing_tiers.map((tier) => (React.createElement("div", { key: tier.id },
                    React.createElement("span", null,
                        tier.min_weight,
                        "–",
                        tier.max_weight,
                        " kg"),
                    React.createElement("strong", null, formatVND(tier.price))))))) : (React.createElement("div", { className: "pet-booking-price-tiers" },
                    React.createElement("div", null,
                        React.createElement("span", null, "Giá dịch vụ"),
                        React.createElement("strong", null, formatVND(selectedService.base_price))))))),
            React.createElement("div", { className: "flex justify-end pt-4 border-t border-[#FAF6F0]" },
                React.createElement("button", { onClick: handleNextStep, className: "px-6 py-3 rounded-2xl bg-[#EC802B] hover:bg-[#D46917] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2" },
                    "Tiếp tục: Chọn bé cưng ",
                    React.createElement(ArrowRight, { className: "w-4 h-4" }))))),
        currentStep === 2 && (React.createElement("div", { "data-scroll-reveal": true, className: "pet-booking-step-panel bg-white p-6 rounded-3xl border-2 border-[#E8CCAD] shadow-xs space-y-6" },
            React.createElement("div", { className: "border-b border-[#FAF6F0] pb-3 flex items-center justify-between" },
                React.createElement("div", null,
                    React.createElement("h3", { className: "text-xl font-black text-[#81451F] font-heading" }, "Bước 2: Chọn thú cưng & Xác nhận cân nặng"),
                    React.createElement("p", { className: "text-xs text-neutral-500 mt-0.5" }, "Kiểm tra loài và cập nhật cân nặng để áp dụng giá chính xác.")),
                React.createElement("button", { onClick: onNavigateToPetManagement, className: "text-xs font-bold text-[#EC802B] hover:underline cursor-pointer" }, "+ Thêm hồ sơ")),
            userPets.length === 0 ? (React.createElement("div", { "data-scroll-reveal": true, className: "p-8 text-center bg-[#FAF6F0] rounded-2xl border border-dashed border-[#E8CCAD]" },
                React.createElement(PawPrint, { className: "w-12 h-12 text-[#EDC55B] mx-auto mb-2" }),
                React.createElement("p", { className: "text-sm font-bold text-[#81451F]" }, "Bạn chưa có hồ sơ thú cưng nào"),
                React.createElement("button", { onClick: onNavigateToPetManagement, className: "mt-3 px-4 py-2 bg-[#EC802B] text-white text-xs font-bold rounded-xl cursor-pointer" }, "Tạo hồ sơ thú cưng ngay"))) : (React.createElement("div", { className: "space-y-4" },
                React.createElement("label", { className: "block text-xs font-bold text-[#81451F]" }, "Chọn bé cưng của bạn:"),
                React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" }, userPets.map((pet) => {
                    const isCompatible = selectedService?.species_supported.includes(pet.species);
                    return (React.createElement("button", { key: pet.id, type: "button", onClick: () => setSelectedPetId(pet.id), "aria-pressed": selectedPetId === pet.id, className: `pet-booking-pet-choice p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-start gap-3 text-left ${selectedPetId === pet.id
                            ? 'border-[#EC802B] bg-[#FDE8D7]/30 ring-2 ring-[#EC802B]'
                            : !isCompatible
                                ? 'border-neutral-200 bg-neutral-50 opacity-60'
                                : 'border-[#E8CCAD] bg-[#FAF6F0]/40'}` },
                        React.createElement("img", { src: pet.avatar_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80', alt: pet.pet_name, className: "w-14 h-14 rounded-xl object-cover shrink-0 border border-[#EDC55B]" }),
                        React.createElement("div", { className: "min-w-0 flex-1" },
                            React.createElement("div", { className: "flex items-center justify-between" },
                                React.createElement("h4", { className: "font-bold text-sm text-[#81451F] truncate" }, pet.pet_name),
                                selectedPetId === pet.id && (React.createElement(CheckCircle2, { className: "w-4 h-4 text-[#EC802B] shrink-0" }))),
                            React.createElement("p", { className: "text-xs text-neutral-500" },
                                pet.species,
                                " • ",
                                pet.breed || 'Chưa rõ giống'),
                            React.createElement("span", { className: "text-[11px] text-[#EC802B] font-bold" },
                                "Cân nặng: ",
                                pet.weight,
                                " kg"),
                            !isCompatible && (React.createElement("span", { className: "block text-[10px] text-red-500 font-semibold mt-0.5" },
                                "⚠️ Dịch vụ không nhận ",
                                pet.species)))));
                })),
                selectedPet && (React.createElement("div", { className: "p-4 rounded-2xl bg-[#FCF5DC] border border-[#EDC55B] space-y-3" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(Scale, { className: "w-4 h-4 text-[#EC802B]" }),
                        React.createElement("h4", { className: "text-xs font-bold text-[#81451F] uppercase tracking-wide" },
                            "Xác nhận cân nặng hiện tại của bé ",
                            selectedPet.pet_name)),
                    React.createElement("p", { className: "text-xs text-neutral-600 font-vietnamese" }, "Đối với dịch vụ Spa, mức giá sẽ được tính theo cân nặng thực tế tại thời điểm phục vụ."),
                    React.createElement("div", { className: "flex items-center gap-3" },
                        React.createElement("input", { type: "number", step: "0.1", min: "0.1", max: "100", value: confirmedWeightText, onChange: (e) => { setConfirmedWeightText(e.target.value); setConfirmedWeight(Number(e.target.value)); }, className: "w-32 bg-white border border-[#E8CCAD] rounded-xl px-3 py-2 text-sm font-bold text-[#81451F] focus:ring-2 focus:ring-[#EC802B] focus:outline-none" }),
                        React.createElement("span", { className: "text-sm font-bold text-[#81451F]" }, "kg"),
                        selectedService?.is_weight_based && (React.createElement("div", { className: "ml-auto text-right" },
                            React.createElement("span", { className: "text-[11px] text-neutral-500 block" }, "Giá ước tính cho bé:"),
                            React.createElement("span", { className: "text-base font-black text-[#EC802B]" }, formatVND(calculateServicePrice(selectedService, confirmedWeight)))))))))),
            React.createElement("div", { className: "flex justify-between pt-4 border-t border-[#FAF6F0]" },
                React.createElement("button", { onClick: () => setCurrentStep(1), className: "px-5 py-2.5 rounded-xl border border-[#81451F] text-[#81451F] font-bold text-xs hover:bg-[#FAF6F0] cursor-pointer flex items-center gap-1.5" },
                    React.createElement(ArrowLeft, { className: "w-4 h-4" }),
                    " Quay lại"),
                React.createElement("button", { onClick: handleNextStep, className: "px-6 py-2.5 rounded-xl bg-[#EC802B] hover:bg-[#D46917] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2" },
                    "Tiếp tục: Chọn ngày giờ ",
                    React.createElement(ArrowRight, { className: "w-4 h-4" }))))),
        currentStep === 3 && (React.createElement("div", { "data-scroll-reveal": true, className: "pet-booking-step-panel bg-white p-6 rounded-3xl border-2 border-[#E8CCAD] shadow-xs space-y-6" },
            React.createElement("div", { className: "border-b border-[#FAF6F0] pb-3" },
                React.createElement("h3", { className: "text-xl font-black text-[#81451F] font-heading" }, "Bước 3: Chọn ngày và khung giờ phục vụ"),
                React.createElement("p", { className: "text-xs text-neutral-500 mt-0.5" },
                    "Hệ thống tự động kiểm tra năng lực phục vụ liên tục trong suốt ",
                    selectedService?.duration_minutes,
                    " phút của dịch vụ.")),
            React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4" },
                React.createElement("div", { className: "sm:col-span-1", "data-scroll-reveal": true },
                    React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Chọn ngày hẹn:"),
                    React.createElement("input", { type: "date", min: todayKey, value: bookingDate, onChange: (e) => setBookingDate(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-2xl px-3 py-2.5 text-sm font-bold text-[#81451F] focus:ring-2 focus:ring-[#EC802B] focus:outline-none" }),
                    React.createElement(BookingCalendar, { selectedDate: bookingDate, minDate: todayKey, bookings: allBookings, userId: currentUser.id, onSelectDate: setBookingDate }),
                    React.createElement("div", { className: "mt-4 p-3 rounded-2xl bg-[#FCF5DC] border border-[#EDC55B] text-xs space-y-1" },
                        React.createElement("span", { className: "font-bold text-[#81451F] block" }, "Thông tin cơ sở:"),
                        React.createElement("p", { className: "text-neutral-700" },
                            "Giờ mở cửa: ",
                            selectedSchedule.start_time,
                            " - ",
                            selectedSchedule.end_time),
                        React.createElement("p", { className: "text-neutral-700" },
                            "Sức chứa tối đa: ",
                            selectedSchedule.max_concurrent_capacity,
                            " bé cùng lúc"),
                        !selectedSchedule.is_available && (React.createElement("p", { className: "text-red-600 font-bold" }, "⚠️ Ngày này cơ sở tạm nghỉ!")))),
                React.createElement("div", { className: "sm:col-span-2", "data-scroll-reveal": true },
                    React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" },
                        "Khung giờ khả dụng (Toàn bộ ca kéo dài đến ",
                        calculateEndTime(bookingTime, selectedService?.duration_minutes || 60),
                        "):"),
                    React.createElement("div", { className: "grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1" },
                        slotOptions.length === 0 && React.createElement("p", { className: "col-span-full rounded-xl bg-[#FFF4E5] p-3 text-xs text-[#946d48]" }, "Không có khung giờ phù hợp với thời lượng dịch vụ trong ngày này."),
                        slotOptions.map((slot) => (React.createElement("button", { key: slot.time, disabled: !slot.isAvailable, onClick: () => setBookingTime(slot.time), className: `py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${bookingTime === slot.time
                                ? 'bg-[#EC802B] text-white shadow-xs ring-2 ring-[#EC802B]'
                                : slot.isAvailable
                                    ? 'bg-[#FAF6F0] text-[#81451F] hover:bg-[#FDE8D7] border border-[#E8CCAD]'
                                    : 'bg-neutral-100 text-neutral-300 cursor-not-allowed border border-neutral-200 line-through'}`, title: slot.reason || 'Khung giờ khả dụng' }, slot.time)))))),
            React.createElement("div", { className: "flex justify-between pt-4 border-t border-[#FAF6F0]" },
                React.createElement("button", { onClick: () => setCurrentStep(2), className: "px-5 py-2.5 rounded-xl border border-[#81451F] text-[#81451F] font-bold text-xs hover:bg-[#FAF6F0] cursor-pointer flex items-center gap-1.5" },
                    React.createElement(ArrowLeft, { className: "w-4 h-4" }),
                    " Quay lại"),
                React.createElement("button", { onClick: handleNextStep, className: "px-6 py-2.5 rounded-xl bg-[#EC802B] hover:bg-[#D46917] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2" },
                    "Tiếp tục: Thanh toán & Mã ưu đãi ",
                    React.createElement(ArrowRight, { className: "w-4 h-4" }))))),
        currentStep === 4 && selectedService && selectedPet && (React.createElement("div", { "data-scroll-reveal": true, className: "pet-booking-step-panel bg-white p-6 rounded-3xl border-2 border-[#E8CCAD] shadow-xs space-y-6" },
            React.createElement("div", { className: "border-b border-[#FAF6F0] pb-3" },
                React.createElement("h3", { className: "text-xl font-black text-[#81451F] font-heading" }, "Bước 4: Xác nhận thông tin & Thanh toán"),
                React.createElement("p", { className: "text-xs text-neutral-500 mt-0.5" }, "Kiểm tra lại toàn bộ thông tin lịch hẹn trước khi xác nhận.")),
            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                React.createElement("div", { "data-scroll-reveal": true, className: "p-4 rounded-2xl bg-[#FAF6F0] border border-[#E8CCAD] space-y-3 text-xs" },
                    React.createElement("h4", { className: "font-bold text-sm text-[#81451F] flex items-center gap-2" },
                        React.createElement(Sparkles, { className: "w-4 h-4 text-[#EC802B]" }),
                        " Tóm tắt lịch hẹn"),
                    React.createElement("div", { className: "space-y-1.5 divide-y divide-[#E8CCAD]/40" },
                        React.createElement("div", { className: "flex justify-between py-1" },
                            React.createElement("span", { className: "text-neutral-500" }, "Khách hàng:"),
                            React.createElement("strong", { className: "text-[#81451F]" },
                                currentUser.full_name,
                                " (",
                                currentUser.phone,
                                ")")),
                        React.createElement("div", { className: "flex justify-between py-1" },
                            React.createElement("span", { className: "text-neutral-500" }, "Bé cưng:"),
                            React.createElement("strong", { className: "text-[#81451F]" },
                                selectedPet.pet_name,
                                " (",
                                selectedPet.species,
                                " - ",
                                confirmedWeight,
                                "kg)")),
                        React.createElement("div", { className: "flex justify-between py-1" },
                            React.createElement("span", { className: "text-neutral-500" }, "Dịch vụ:"),
                            React.createElement("strong", { className: "text-[#81451F]" }, selectedService.service_name)),
                        React.createElement("div", { className: "flex justify-between py-1" },
                            React.createElement("span", { className: "text-neutral-500" }, "Thời gian:"),
                            React.createElement("strong", { className: "text-[#81451F]" },
                                bookingTime,
                                " - ",
                                calculateEndTime(bookingTime, selectedService.duration_minutes),
                                " (",
                                bookingDate,
                                ")")),
                        React.createElement("div", { className: "flex justify-between py-1" },
                            React.createElement("span", { className: "text-neutral-500" }, "Thời lượng:"),
                            React.createElement("strong", { className: "text-[#81451F]" },
                                selectedService.duration_minutes,
                                " phút"))),
                    React.createElement("div", { className: "pt-2" },
                        React.createElement("label", { className: "block text-[11px] font-bold text-[#81451F] mb-1" }, "Ghi chú cho kỹ thuật viên Pet Phết:"),
                        React.createElement("textarea", { rows: 2, value: customerNote, onChange: (e) => setCustomerNote(e.target.value), placeholder: "Ví dụ: Bé hơi sợ nước, xin nhẹ tay; dặn dò tỉa phần đuôi tròn...", className: "w-full bg-white border border-[#E8CCAD] rounded-xl px-3 py-1.5 text-xs text-[#81451F] focus:ring-2 focus:ring-[#EC802B] focus:outline-none" }))),
                React.createElement("div", { className: "space-y-4", "data-scroll-reveal": true },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1 flex items-center gap-1.5" },
                            React.createElement(Tag, { className: "w-3.5 h-3.5 text-[#EC802B]" }),
                            " Mã ưu đãi / Coupon:"),
                        React.createElement("div", { className: "flex gap-2" },
                            React.createElement("input", { type: "text", value: couponCode, onChange: (e) => setCouponCode(e.target.value.toUpperCase()), placeholder: "PETFIRST50K, BANMOI15...", className: "flex-1 bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold uppercase text-[#81451F] focus:ring-2 focus:ring-[#EC802B] focus:outline-none" }),
                            React.createElement("button", { type: "button", onClick: handleApplyCoupon, className: "px-4 py-2 bg-[#81451F] hover:bg-[#5C2E11] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer" }, "Áp dụng")),
                        couponMessage && (React.createElement("p", { className: `text-[11px] mt-1 font-semibold ${appliedCoupon ? 'text-emerald-600' : 'text-red-500'}` }, couponMessage))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-2" }, "Chọn phương thức thanh toán:"),
                        React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                            React.createElement("div", { onClick: () => setPaymentMethod('COD'), className: `p-3 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'COD'
                                    ? 'border-[#EC802B] bg-[#FDE8D7]/40 ring-1 ring-[#EC802B]'
                                    : 'border-[#E8CCAD] bg-[#FAF6F0]/40'}` },
                                React.createElement("div", { className: "flex items-center gap-2" },
                                    React.createElement(Banknote, { className: "w-4 h-4 text-[#EC802B]" }),
                                    React.createElement("strong", { className: "text-xs text-[#81451F]" }, "COD Tại Salon")),
                                React.createElement("p", { className: "text-[10px] text-neutral-500 mt-1" }, "Thanh toán tiền mặt hoặc thẻ tại quầy sau khi phục vụ xong.")),
                            React.createElement("div", { onClick: () => setPaymentMethod('QR'), className: `p-3 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'QR'
                                    ? 'border-[#EC802B] bg-[#FDE8D7]/40 ring-1 ring-[#EC802B]'
                                    : 'border-[#E8CCAD] bg-[#FAF6F0]/40'}` },
                                React.createElement("div", { className: "flex items-center gap-2" },
                                    React.createElement(QrCode, { className: "w-4 h-4 text-[#66BCB4]" }),
                                    React.createElement("strong", { className: "text-xs text-[#81451F]" }, "Quét QR Ngân Hàng")),
                                React.createElement("p", { className: "text-[10px] text-neutral-500 mt-1" }, "Giữ chỗ trong 15 phút. Quét mã VietQR tiện lợi, đối chiếu nhanh.")))),
                    React.createElement("div", { className: "p-3.5 rounded-2xl bg-[#FCF5DC] border border-[#EDC55B] text-xs space-y-1.5" },
                        React.createElement("div", { className: "flex justify-between" },
                            React.createElement("span", { className: "text-neutral-600" }, "Giá gốc dịch vụ:"),
                            React.createElement("span", { className: "font-bold text-[#81451F]" }, formatVND(basePrice))),
                        couponCalculation.discountAmount > 0 && (React.createElement("div", { className: "flex justify-between text-emerald-700" },
                            React.createElement("span", null,
                                "Mã giảm giá (",
                                appliedCoupon.code,
                                "):"),
                            React.createElement("span", { className: "font-bold" },
                                "-",
                                formatVND(couponCalculation.discountAmount)))),
                        React.createElement("div", { className: "flex justify-between pt-2 border-t border-[#EDC55B]/60 text-sm" },
                            React.createElement("span", { className: "font-black text-[#81451F]" }, "Tổng thanh toán:"),
                            React.createElement("span", { className: "font-black text-xl text-[#EC802B]" }, formatVND(couponCalculation.finalTotal)))))),
            React.createElement("div", { className: "flex justify-between pt-4 border-t border-[#FAF6F0]" },
                React.createElement("button", { onClick: () => setCurrentStep(3), className: "px-5 py-2.5 rounded-xl border border-[#81451F] text-[#81451F] font-bold text-xs hover:bg-[#FAF6F0] cursor-pointer flex items-center gap-1.5" },
                    React.createElement(ArrowLeft, { className: "w-4 h-4" }),
                    " Quay lại"),
                React.createElement("button", { disabled: isSubmitting, onClick: handleConfirmBooking, className: "px-8 py-3 rounded-2xl bg-[#EC802B] hover:bg-[#D46917] text-white font-black text-sm shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50" }, isSubmitting ? 'Đang tạo lịch...' : 'Hoàn tất & Xác nhận đặt lịch'))))));
};
