import React, { useEffect, useState } from '../../js/react.js';
import { LayoutDashboard, Calendar, Scissors, Users, Star, Clock, CheckCircle2, AlertCircle, Search, Plus, Edit2, MessageSquare, Tag, LogOut, QrCode, Edit3 } from '../../js/icons.js';
import { store } from '../../services/store.js';
import { notifyToast } from '../../js/utils/toast.js';
import { formatVND } from '../../services/bookingEngine.js';
import { NotificationDropdown } from '../common/NotificationDropdown.js';
import { formatDateDMY } from '../../js/utils/date.js';
import { ASSETS } from '../../js/constants/assets.js';
const AdminPortalContent = ({ currentUser, onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    // Filter state for dashboard
    const [dateFilter, setDateFilter] = useState('all');
    const [focusedChartSeries, setFocusedChartSeries] = useState(null);
    const toggleChartSeries = (series) => {
        setFocusedChartSeries((current) => current === series ? null : series);
    };
    // Refresh trigger
    const [refreshKey, setRefreshKey] = useState(0);
    const triggerRefresh = () => setRefreshKey((prev) => prev + 1);
    // Data pulls
    const allBookings = store.getBookings();
    const allPayments = store.getPayments();
    const allServices = store.getServices(false);
    const allCategories = store.getCategories();
    const allReviews = store.getReviews();
    const allPets = store.getAllPets();
    const allUsers = store.getAllUsers();
    const allSchedules = store.getSchedules();
    const allCoupons = store.getCoupons();
    // Metrics computation
    const customerCount = allUsers.filter((u) => u.role === 'customer').length;
    const petCount = allPets.filter((p) => p.is_active).length;
    const bookingCount = allBookings.length;
    const pendingBookings = allBookings.filter((b) => b.status === 'pending');
    const confirmedBookings = allBookings.filter((b) => b.status === 'confirmed');
    const inProgressBookings = allBookings.filter((b) => b.status === 'in_progress');
    const completedBookings = allBookings.filter((b) => b.status === 'completed');
    const cancelledBookings = allBookings.filter((b) => b.status === 'cancelled');
    const pendingReconcilePayments = allPayments.filter((p) => p.payment_status === 'pending_reconcile');
    const totalVerifiedRevenue = allPayments
        .filter((p) => p.payment_status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
    const monthlyPerformance = (() => {
        const now = new Date();
        return Array.from({ length: 12 }, (_, index) => {
            const month = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
            const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
            const monthBookings = allBookings.filter((booking) => booking.booking_date.startsWith(monthKey));
            const monthBookingIds = new Set(monthBookings.map((booking) => booking.id));
            const revenue = allPayments
                .filter((payment) => payment.payment_status === 'paid' && monthBookingIds.has(payment.booking_id))
                .reduce((sum, payment) => sum + payment.amount, 0);
            return {
                label: new Intl.DateTimeFormat('vi-VN', { month: 'short' }).format(month),
                bookings: monthBookings.length,
                revenue
            };
        });
    })();
    const maxMonthlyBookings = Math.max(1, ...monthlyPerformance.map((month) => month.bookings));
    const maxMonthlyRevenue = Math.max(1, ...monthlyPerformance.map((month) => month.revenue));
    const chartX = (index) => 70 + index * (860 / (monthlyPerformance.length - 1));
    const chartY = (value, max) => 280 - (value / max) * 230;
    const bookingLine = monthlyPerformance
        .map((month, index) => `${index === 0 ? 'M' : 'L'} ${chartX(index)} ${chartY(month.bookings, maxMonthlyBookings)}`)
        .join(' ');
    const revenueLine = monthlyPerformance
        .map((month, index) => `${index === 0 ? 'M' : 'L'} ${chartX(index)} ${chartY(month.revenue, maxMonthlyRevenue)}`)
        .join(' ');
    // Admin state actions
    const [actionAlert, setActionAlert] = useState(null);
    const reportAction = (type, text) => { setActionAlert({ type, text }); notifyToast(type, text); };
    // Booking management filters & modal
    const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
    const [bookingSearch, setBookingSearch] = useState('');
    const [selectedBookingForAction, setSelectedBookingForAction] = useState(null);
    const [adminNoteInput, setAdminNoteInput] = useState('');
    // Service modal
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [srvName, setSrvName] = useState('');
    const [srvCatId, setSrvCatId] = useState(allCategories[0]?.id || '');
    const [srvPrice, setSrvPrice] = useState(200000);
    const [srvDuration, setSrvDuration] = useState(60);
    const [srvDesc, setSrvDesc] = useState('');
    const [srvImage, setSrvImage] = useState('');
    const [srvIsWeightBased, setSrvIsWeightBased] = useState(false);
    // Schedule modal
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [targetScheduleDate, setTargetScheduleDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
    const [schStartTime, setSchStartTime] = useState('08:00');
    const [schEndTime, setSchEndTime] = useState('20:00');
    const [schCapacity, setSchCapacity] = useState(4);
    const [schIsAvailable, setSchIsAvailable] = useState(true);
    // Review reply state
    const [replyReviewTarget, setReplyReviewTarget] = useState(null);
    const [replyText, setReplyText] = useState('');
    // Coupon state
    const [couponModalOpen, setCouponModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [cpExpiresAt, setCpExpiresAt] = useState('2029-12-31');
    const [cpUsageLimit, setCpUsageLimit] = useState(100);
    const [cpCode, setCpCode] = useState('');
    const [cpType, setCpType] = useState('fixed');
    const [cpValue, setCpValue] = useState(50000);
    const [cpMinSpend, setCpMinSpend] = useState(200000);
    const [cpDesc, setCpDesc] = useState('');
    useEffect(() => {
        const anyModalOpen = serviceModalOpen || scheduleModalOpen || Boolean(replyReviewTarget) || couponModalOpen || Boolean(selectedBookingForAction);
        if (!anyModalOpen)
            return;
        const closeOnEscape = (event) => {
            if (event.key !== 'Escape')
                return;
            setServiceModalOpen(false);
            setScheduleModalOpen(false);
            setReplyReviewTarget(null);
            setCouponModalOpen(false);
            setSelectedBookingForAction(null);
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [serviceModalOpen, scheduleModalOpen, replyReviewTarget, couponModalOpen, selectedBookingForAction]);
    const closeAllModals = () => {
        setServiceModalOpen(false);
        setScheduleModalOpen(false);
        setReplyReviewTarget(null);
        setCouponModalOpen(false);
        setSelectedBookingForAction(null);
    };
    // Handlers
    const handleUpdateBookingStatus = (bookingId, status) => {
        const res = store.updateBookingStatus(bookingId, status, adminNoteInput);
        reportAction(res.success ? 'success' : 'error', res.message);
        setSelectedBookingForAction(null);
        setAdminNoteInput('');
        triggerRefresh();
    };
    const handleReconcilePayment = (paymentId, isApproved) => {
        const res = store.reconcilePayment(paymentId, isApproved, currentUser.id);
        reportAction(res.success ? 'success' : 'error', res.message);
        triggerRefresh();
    };
    const handleSaveService = (e) => {
        e.preventDefault();
        if (editingService) {
            store.updateService(editingService.id, {
                service_name: srvName,
                category_id: srvCatId,
                base_price: Number(srvPrice),
                duration_minutes: Number(srvDuration),
                description: srvDesc,
                image_url: srvImage,
                is_weight_based: srvIsWeightBased
            });
            reportAction('success', `Đã cập nhật dịch vụ "${srvName}".`);
        }
        else {
            store.addService({
                service_name: srvName,
                category_id: srvCatId,
                base_price: Number(srvPrice),
                duration_minutes: Number(srvDuration),
                description: srvDesc,
                image_url: srvImage || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80',
                is_weight_based: srvIsWeightBased,
                species_supported: ['Chó', 'Mèo'],
                is_active: true
            });
            reportAction('success', `Đã thêm mới dịch vụ "${srvName}".`);
        }
        setServiceModalOpen(false);
        triggerRefresh();
    };
    const handleSaveSchedule = (e) => {
        e.preventDefault();
        if (!targetScheduleDate || schEndTime <= schStartTime || schCapacity < 1) {
            reportAction('error', 'Vui lòng kiểm tra ngày, giờ hoạt động và sức chứa.');
            return;
        }
        store.updateSchedule(targetScheduleDate, {
            start_time: schStartTime,
            end_time: schEndTime,
            max_concurrent_capacity: Number(schCapacity),
            is_available: schIsAvailable
        });
        reportAction('success', `Cập nhật lịch làm việc ngày ${targetScheduleDate} thành công!`);
        setScheduleModalOpen(false);
        triggerRefresh();
    };
    const handleReplyReviewSubmit = (e) => {
        e.preventDefault();
        if (!replyReviewTarget || !replyText.trim())
            return;
        const res = store.replyReview(replyReviewTarget.id, replyText);
        reportAction(res.success ? 'success' : 'error', res.message);
        setReplyReviewTarget(null);
        setReplyText('');
        triggerRefresh();
    };
    const handleSaveCoupon = (e) => {
        e.preventDefault();
        if (!cpCode.trim())
            return;
        const normalizedCode = cpCode.toUpperCase().trim();
        const duplicateCoupon = allCoupons.some((coupon) => coupon.code.toUpperCase() === normalizedCode && coupon.id !== editingCoupon?.id);
        if (duplicateCoupon) {
            reportAction('error', 'Mã giảm giá này đã tồn tại. Vui lòng chọn mã khác.');
            return;
        }
        if (cpValue <= 0 || (cpType === 'percent' && cpValue > 100) || cpMinSpend < 0) {
            reportAction('error', 'Giá trị giảm phải hợp lệ; phần trăm không được vượt quá 100%.');
            return;
        }
        if (cpUsageLimit < (editingCoupon?.used_count || 0) || cpUsageLimit < 1) {
            reportAction('error', 'Giới hạn sử dụng phải lớn hơn hoặc bằng số lượt đã dùng.');
            return;
        }
        const expiry = new Date(`${cpExpiresAt}T23:59:59`);
        if (Number.isNaN(expiry.getTime()) || expiry.getTime() < Date.now()) {
            reportAction('error', 'Ngày hết hạn phải là ngày trong tương lai.');
            return;
        }
        const data = {
            code: normalizedCode,
            discount_type: cpType,
            discount_value: Number(cpValue),
            min_order_value: Number(cpMinSpend),
            is_active: true,
            expires_at: expiry.toISOString(),
            usage_limit: Number(cpUsageLimit),
            description: cpDesc || `Giảm ${cpType === 'percent' ? `${cpValue}%` : formatVND(cpValue)} cho đơn từ ${formatVND(cpMinSpend)}`
        };
        if (editingCoupon) {
            store.updateCoupon(editingCoupon.id, { ...data, is_active: editingCoupon.is_active });
            reportAction('success', `Đã cập nhật mã coupon ${data.code}.`);
        }
        else {
            store.addCoupon(data);
            reportAction('success', `Đã tạo mã coupon mới: ${data.code}`);
        }
        setCouponModalOpen(false);
        setEditingCoupon(null);
        setCpCode('');
        setCpUsageLimit(100);
        setCpExpiresAt('2029-12-31');
        setCpDesc('');
        triggerRefresh();
    };
    return (React.createElement("div", { className: "pet-admin-portal-root min-h-screen flex flex-col" },
        React.createElement("header", { className: "bg-[#81451F] text-white border-b-2 border-[#EC802B] sticky top-0 z-30 shadow-md" },
            React.createElement("div", { className: "pet-admin-header-layout" },
                React.createElement("div", { className: "pet-admin-logo-column" },
                    React.createElement("button", { type: "button", className: "pet-admin-logo-button", onClick: () => { closeAllModals(); setActiveTab('dashboard'); }, "aria-label": "Về Dashboard quản trị", title: "Về Dashboard" },
                        React.createElement("img", { src: ASSETS.brandLogo, alt: "Pet Phết", className: "pet-admin-header-logo" }))),
                React.createElement("div", { className: "pet-admin-header-content" },
                    React.createElement("div", { className: "pet-admin-brand-header flex items-center justify-between" },
                        React.createElement("div", null,
                            React.createElement("span", { className: "font-black text-lg text-[#EDC55B] font-heading" }, "Pet Phết Admin Portal"),
                            React.createElement("p", { className: "text-[11px] text-orange-200" }, "Hệ thống điều hành dịch vụ thú cưng")),
                        React.createElement("div", { className: "flex items-center gap-3" },
                            React.createElement(NotificationDropdown, { role: "admin" }),
                            React.createElement("button", { onClick: onLogout, className: "px-3.5 py-1.5 rounded-xl bg-[#FCF5DC] text-[#81451F] hover:bg-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs" },
                                React.createElement(LogOut, { className: "w-3.5 h-3.5 text-[#EC802B]" }),
                                " Đăng xuất"))),
                    React.createElement("div", { className: "pet-admin-tab-navigation flex flex-wrap items-center gap-1" }, [
                        { id: 'dashboard', label: 'Dashboard', icon: React.createElement(LayoutDashboard, { className: "w-4 h-4" }) },
                        { id: 'bookings', label: 'Đơn đặt lịch', icon: React.createElement(Calendar, { className: "w-4 h-4" }) },
                        { id: 'services', label: 'Dịch vụ', icon: React.createElement(Scissors, { className: "w-4 h-4" }) },
                        { id: 'schedules', label: 'Lịch làm việc', icon: React.createElement(Clock, { className: "w-4 h-4" }) },
                        { id: 'customers', label: 'Khách & Bé cưng', icon: React.createElement(Users, { className: "w-4 h-4" }) },
                        { id: 'reviews', label: 'Đánh giá', icon: React.createElement(Star, { className: "w-4 h-4" }) },
                        { id: 'coupons', label: 'Mã ưu đãi', icon: React.createElement(Tag, { className: "w-4 h-4" }) }
                    ].map((tab) => (React.createElement("button", { key: tab.id, onClick: () => { closeAllModals(); setActiveTab(tab.id); }, className: `pet-admin-tab px-3 py-1.5 text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${activeTab === tab.id
                            ? 'is-active'
                            : ''}` },
                        tab.icon,
                        tab.label))))))),
        React.createElement("main", { className: "flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full" },
            actionAlert && (React.createElement("div", { className: `mb-6 p-4 rounded-2xl text-xs flex items-center justify-between ${actionAlert.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-700'}` },
                React.createElement("div", { className: "flex items-center gap-2" },
                    actionAlert.type === 'success' ? (React.createElement(CheckCircle2, { className: "w-4 h-4 text-emerald-600" })) : (React.createElement(AlertCircle, { className: "w-4 h-4 text-red-600" })),
                    React.createElement("span", null, actionAlert.text)),
                React.createElement("button", { onClick: () => setActionAlert(null), className: "text-neutral-400 hover:text-neutral-700 text-xs font-bold cursor-pointer" }, "Đóng"))),
            activeTab === 'dashboard' && (React.createElement("div", { className: "space-y-6" },
                React.createElement("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" },
                    React.createElement("div", null,
                        React.createElement("h2", { className: "text-2xl font-black text-[#81451F] font-heading" }, "Báo Cáo Hoạt Động & Chỉ Số Quản Trị")),
                    React.createElement("div", { className: "flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#E8CCAD]" }, [
                        { id: 'today', label: 'Hôm nay' },
                        { id: '7days', label: '7 ngày' },
                        { id: '30days', label: '30 ngày' },
                        { id: 'all', label: 'Toàn bộ' }
                    ].map((f) => (React.createElement("button", { key: f.id, onClick: () => setDateFilter(f.id), className: `px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${dateFilter === f.id
                            ? 'bg-[#EC802B] text-white shadow-2xs'
                            : 'text-neutral-600 hover:bg-[#FAF6F0]'}` }, f.label))))),
                React.createElement("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4" },
                    React.createElement("div", { className: "p-5 rounded-3xl bg-white border-2 border-[#E8CCAD] shadow-xs space-y-1" },
                        React.createElement("span", { className: "text-[11px] text-neutral-400 uppercase font-bold tracking-wider" }, "Tổng Doanh Thu Đã Thu"),
                        React.createElement("p", { className: "text-2xl sm:text-3xl font-black text-[#EC802B]" }, formatVND(totalVerifiedRevenue))),
                    React.createElement("div", { className: "p-5 rounded-3xl bg-white border-2 border-[#E8CCAD] shadow-xs space-y-1" },
                        React.createElement("span", { className: "text-[11px] text-neutral-400 uppercase font-bold tracking-wider" }, "Tổng Số Booking"),
                        React.createElement("p", { className: "text-2xl sm:text-3xl font-black text-[#81451F]" }, bookingCount),
                        React.createElement("span", { className: "text-[10px] text-[#EC802B] font-bold block pt-1" },
                            pendingBookings.length,
                            " lịch hẹn chờ xác nhận")),
                    React.createElement("div", { className: "p-5 rounded-3xl bg-white border-2 border-[#E8CCAD] shadow-xs space-y-1" },
                        React.createElement("span", { className: "text-[11px] text-neutral-400 uppercase font-bold tracking-wider" }, "Khách Hàng & Bé Cưng"),
                        React.createElement("p", { className: "text-2xl sm:text-3xl font-black text-[#66BCB4]" },
                            customerCount,
                            " / ",
                            petCount),
                        React.createElement("span", { className: "text-[10px] text-neutral-500 block pt-1" }, "Khách hàng / Thú cưng hoạt động")),
                    React.createElement("div", { className: "p-5 rounded-3xl bg-white border-2 border-[#E8CCAD] shadow-xs space-y-1" },
                        React.createElement("span", { className: "text-[11px] text-neutral-400 uppercase font-bold tracking-wider" }, "Dịch Vụ Đang Mở"),
                        React.createElement("p", { className: "text-2xl sm:text-3xl font-black text-[#EDC55B]" }, allServices.filter((s) => s.is_active).length))),
                pendingReconcilePayments.length > 0 && (React.createElement("div", { className: "p-5 rounded-3xl bg-[#FCF5DC] border-2 border-[#EDC55B] shadow-xs space-y-3" },
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("h3", { className: "font-bold text-sm text-[#81451F] flex items-center gap-2" },
                            React.createElement(QrCode, { className: "w-4 h-4 text-[#EC802B]" }),
                            " Có ",
                            pendingReconcilePayments.length,
                            " giao dịch QR đang chờ đối chiếu sao kê"),
                        React.createElement("span", { className: "text-xs text-[#EC802B] font-bold" }, "Cần kiểm tra")),
                    React.createElement("div", { className: "divide-y divide-[#E8CCAD]/60" }, pendingReconcilePayments.map((p) => (React.createElement("div", { key: p.id, className: "py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs" },
                        React.createElement("div", null,
                            React.createElement("strong", { className: "text-[#81451F]" }, p.transfer_content),
                            React.createElement("span", { className: "text-neutral-500 ml-2" },
                                "(",
                                formatVND(p.amount),
                                ")"),
                            React.createElement("span", { className: "text-[10px] text-neutral-400 block" },
                                "Tham chiếu: ",
                                p.transaction_reference)),
                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement("button", { onClick: () => handleReconcilePayment(p.id, true), className: "px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer" }, "Khớp sao kê (Duyệt)"),
                            React.createElement("button", { onClick: () => handleReconcilePayment(p.id, false), className: "px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold cursor-pointer" }, "Không khớp")))))))),
                React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-5 gap-3 text-center" },
                    React.createElement("div", { className: "p-4 bg-white rounded-2xl border border-amber-200" },
                        React.createElement("span", { className: "text-[11px] font-bold text-amber-700 block" }, "Chờ xác nhận"),
                        React.createElement("span", { className: "text-2xl font-black text-amber-600" }, pendingBookings.length)),
                    React.createElement("div", { className: "p-4 bg-white rounded-2xl border border-blue-200" },
                        React.createElement("span", { className: "text-[11px] font-bold text-blue-700 block" }, "Đã xác nhận"),
                        React.createElement("span", { className: "text-2xl font-black text-blue-600" }, confirmedBookings.length)),
                    React.createElement("div", { className: "p-4 bg-white rounded-2xl border border-purple-200" },
                        React.createElement("span", { className: "text-[11px] font-bold text-purple-700 block" }, "Đang phục vụ"),
                        React.createElement("span", { className: "text-2xl font-black text-purple-600" }, inProgressBookings.length)),
                    React.createElement("div", { className: "p-4 bg-white rounded-2xl border border-emerald-200" },
                        React.createElement("span", { className: "text-[11px] font-bold text-emerald-700 block" }, "Hoàn thành"),
                        React.createElement("span", { className: "text-2xl font-black text-emerald-600" }, completedBookings.length)),
                    React.createElement("div", { className: "p-4 bg-white rounded-2xl border border-red-200" },
                        React.createElement("span", { className: "text-[11px] font-bold text-red-700 block" }, "Đã hủy"),
                        React.createElement("span", { className: "text-2xl font-black text-red-600" }, cancelledBookings.length))),
                React.createElement("section", { className: "pet-admin-performance-chart rounded-3xl border-2 border-[#E8CCAD] bg-white p-5 sm:p-6 shadow-xs", "aria-labelledby": "pet-admin-performance-title" },
                    React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3" },
                        React.createElement("h3", { id: "pet-admin-performance-title", className: "text-lg font-black text-[#81451F] font-heading" }, "Đặt lịch & doanh thu trong 12 tháng"),
                        React.createElement("div", { className: "flex flex-wrap gap-4 text-xs font-bold" },
                            React.createElement("button", { type: "button", onClick: () => toggleChartSeries('bookings'), "aria-pressed": focusedChartSeries === 'bookings', className: `pet-admin-chart-legend inline-flex items-center gap-2 text-[#66BCB4] ${focusedChartSeries === 'revenue' ? 'is-muted' : ''}` },
                                React.createElement("i", { className: "pet-admin-chart-legend-dot pet-admin-chart-bookings" }),
                                " Số booking"),
                            React.createElement("button", { type: "button", onClick: () => toggleChartSeries('revenue'), "aria-pressed": focusedChartSeries === 'revenue', className: `pet-admin-chart-legend inline-flex items-center gap-2 text-[#EC802B] ${focusedChartSeries === 'bookings' ? 'is-muted' : ''}` },
                                React.createElement("i", { className: "pet-admin-chart-legend-dot pet-admin-chart-revenue" }),
                                " Doanh thu đã thu"))),
                    React.createElement("div", { className: "mt-4 overflow-x-auto" },
                        React.createElement("svg", { className: "pet-admin-chart-svg w-full min-w-[680px]", viewBox: "0 0 1000 340", role: "img", "aria-label": "Biểu đồ đường thể hiện số booking và doanh thu đã thu theo từng tháng trong 12 tháng gần nhất" },
                            [0, 1, 2, 3].map((tick) => {
                                const y = 50 + tick * (230 / 3);
                                const bookingValue = Math.round(maxMonthlyBookings * (3 - tick) / 3);
                                const revenueValue = maxMonthlyRevenue * (3 - tick) / 3;
                                return (React.createElement("g", { key: tick },
                                    React.createElement("line", { x1: "70", y1: y, x2: "930", y2: y, stroke: "#F0E2D2", strokeDasharray: "4 5" }),
                                    React.createElement("text", { x: "58", y: y + 4, textAnchor: "end", className: "pet-admin-chart-axis-label" }, bookingValue),
                                    React.createElement("text", { x: "940", y: y + 4, textAnchor: "start", className: "pet-admin-chart-axis-label" }, new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 0 }).format(revenueValue))));
                            }),
                            React.createElement("text", { x: "14", y: "34", className: "pet-admin-chart-axis-title" }, "Booking"),
                            React.createElement("text", { x: "986", y: "34", textAnchor: "end", className: "pet-admin-chart-axis-title" }, "Doanh thu (₫)"),
                            React.createElement("g", { className: focusedChartSeries === 'revenue' ? 'pet-admin-chart-series is-muted' : 'pet-admin-chart-series' },
                                React.createElement("path", { d: bookingLine, fill: "none", stroke: "#66BCB4", strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round", pointerEvents: "none" }),
                                React.createElement("path", { d: bookingLine, fill: "none", stroke: "transparent", strokeWidth: "18", className: "pet-admin-chart-hit-area", pointerEvents: "stroke", role: "button", tabIndex: 0, "aria-label": "Làm nổi bật số booking", "aria-pressed": focusedChartSeries === 'bookings', onClick: () => toggleChartSeries('bookings'), onKeyDown: (event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            toggleChartSeries('bookings');
                                        }
                                    } }),
                                monthlyPerformance.map((month, index) => (React.createElement("circle", { key: month.label + index, cx: chartX(index), cy: chartY(month.bookings, maxMonthlyBookings), r: "4.5", fill: "#66BCB4", stroke: "white", strokeWidth: "2", pointerEvents: "none" })))),
                            React.createElement("g", { className: focusedChartSeries === 'bookings' ? 'pet-admin-chart-series is-muted' : 'pet-admin-chart-series' },
                                React.createElement("path", { d: revenueLine, fill: "none", stroke: "#EC802B", strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round", pointerEvents: "none" }),
                                React.createElement("path", { d: revenueLine, fill: "none", stroke: "transparent", strokeWidth: "18", className: "pet-admin-chart-hit-area", pointerEvents: "stroke", role: "button", tabIndex: 0, "aria-label": "Làm nổi bật doanh thu đã thu", "aria-pressed": focusedChartSeries === 'revenue', onClick: () => toggleChartSeries('revenue'), onKeyDown: (event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            toggleChartSeries('revenue');
                                        }
                                    } }),
                                monthlyPerformance.map((month, index) => (React.createElement("circle", { key: month.label + index, cx: chartX(index), cy: chartY(month.revenue, maxMonthlyRevenue), r: "4.5", fill: "#EC802B", stroke: "white", strokeWidth: "2", pointerEvents: "none" })))),
                            monthlyPerformance.map((month, index) => (React.createElement("text", { key: month.label + index, x: chartX(index), y: "306", textAnchor: "middle", className: "pet-admin-chart-axis-label" }, month.label)))))))),
            activeTab === 'bookings' && (React.createElement("div", { className: "space-y-6" },
                React.createElement("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" },
                    React.createElement("div", null,
                        React.createElement("h2", { className: "text-2xl font-black text-[#81451F] font-heading" },
                            "Quản Lý Lịch Hẹn Chăm Sóc Bé Cưng ",
                            React.createElement("span", { className: "pet-admin-title-count" },
                                "(",
                                bookingCount,
                                ")"))),
                    React.createElement("div", { className: "flex flex-wrap gap-2 items-center" },
                        React.createElement("div", { className: "relative" },
                            React.createElement(Search, { className: "w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" }),
                            React.createElement("input", { type: "text", value: bookingSearch, onChange: (e) => setBookingSearch(e.target.value), placeholder: "Tìm mã, khách, bé...", className: "bg-white border border-[#E8CCAD] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]" })),
                        React.createElement("select", { value: bookingStatusFilter, onChange: (e) => setBookingStatusFilter(e.target.value), className: "bg-white border border-[#E8CCAD] rounded-xl px-3 py-1.5 text-xs text-[#81451F] font-bold focus:outline-none" },
                            React.createElement("option", { value: "all" }, "Tất cả trạng thái"),
                            React.createElement("option", { value: "pending" }, "Chờ xác nhận"),
                            React.createElement("option", { value: "confirmed" }, "Đã xác nhận"),
                            React.createElement("option", { value: "in_progress" }, "Đang phục vụ"),
                            React.createElement("option", { value: "completed" }, "Hoàn thành"),
                            React.createElement("option", { value: "cancelled" }, "Đã hủy")))),
                React.createElement("div", { className: "bg-white rounded-3xl border-2 border-[#E8CCAD] overflow-hidden shadow-xs" },
                    React.createElement("div", { className: "overflow-x-auto" },
                        React.createElement("table", { className: "w-full text-left text-xs" },
                            React.createElement("thead", { className: "bg-[#FAF6F0] text-[#81451F] font-black uppercase tracking-wider border-b border-[#E8CCAD]" },
                                React.createElement("tr", null,
                                    React.createElement("th", { className: "p-4" }, "Mã Booking"),
                                    React.createElement("th", { className: "p-4" }, "Khách hàng & Bé cưng"),
                                    React.createElement("th", { className: "p-4" }, "Dịch vụ"),
                                    React.createElement("th", { className: "p-4" }, "Ngày & Giờ"),
                                    React.createElement("th", { className: "p-4" }, "Thanh toán"),
                                    React.createElement("th", { className: "p-4" }, "Trạng thái"),
                                    React.createElement("th", { className: "p-4 text-center" }, "Thao tác"))),
                            React.createElement("tbody", { className: "divide-y divide-[#FAF6F0]" }, allBookings
                                .filter((b) => {
                                const mStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
                                const mSearch = b.id.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                                    b.user_name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                                    b.pet_name.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                                    b.service_name.toLowerCase().includes(bookingSearch.toLowerCase());
                                return mStatus && mSearch;
                            })
                                .map((b) => (React.createElement("tr", { key: b.id, className: "hover:bg-[#FAF6F0]/60 transition-colors" },
                                React.createElement("td", { className: "p-4 font-mono font-bold text-[#81451F]" },
                                    "#",
                                    b.id),
                                React.createElement("td", { className: "p-4" },
                                    React.createElement("strong", { className: "block text-[#81451F]" }, b.user_name),
                                    React.createElement("span", { className: "text-neutral-500" }, b.user_phone),
                                    React.createElement("div", { className: "text-[11px] text-[#EC802B] font-bold mt-0.5" },
                                        "🐾 ",
                                        b.pet_name,
                                        " (",
                                        b.pet_species,
                                        " - ",
                                        b.pet_weight,
                                        "kg)")),
                                React.createElement("td", { className: "p-4" },
                                    React.createElement("span", { className: "font-semibold text-neutral-700 block" }, b.service_name),
                                    React.createElement("span", { className: "font-black text-[#EC802B]" }, formatVND(b.total_amount))),
                                React.createElement("td", { className: "p-4 text-neutral-600" },
                                    React.createElement("strong", null,
                                        b.booking_time,
                                        " - ",
                                        b.end_time),
                                    React.createElement("span", { className: "block text-[11px] text-neutral-400" }, formatDateDMY(b.booking_date))),
                                React.createElement("td", { className: "p-4" },
                                    React.createElement("span", { className: "block font-bold text-[#81451F]" }, b.payment_method),
                                    React.createElement("span", { className: `text-[10px] font-bold ${b.payment_status === 'paid'
                                            ? 'text-emerald-600'
                                            : b.payment_status === 'pending_reconcile'
                                                ? 'text-blue-600'
                                                : 'text-amber-600'}` },
                                        b.payment_status === 'paid' && 'Đã thanh toán',
                                        b.payment_status === 'pending_reconcile' && 'Chờ đối chiếu',
                                        b.payment_status === 'unpaid' && 'Chưa thanh toán')),
                                React.createElement("td", { className: "p-4" },
                                    React.createElement("span", { className: `px-2 py-0.5 rounded-full text-[11px] font-bold ${b.status === 'confirmed'
                                            ? 'bg-blue-100 text-blue-800'
                                            : b.status === 'pending'
                                                ? 'bg-amber-100 text-amber-800'
                                                : b.status === 'in_progress'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : b.status === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-red-100 text-red-800'}` }, b.status)),
                                React.createElement("td", { className: "p-4 text-center" },
                                    React.createElement("div", { className: "flex items-center justify-center gap-1.5" },
                                        b.status === 'pending' && (React.createElement("button", { onClick: () => handleUpdateBookingStatus(b.id, 'confirmed'), className: "px-2.5 py-1 bg-[#66BCB4] hover:bg-[#4DA39B] text-white rounded-lg font-bold text-[11px] cursor-pointer", title: "Xác nhận lịch hẹn" }, "Xác nhận")),
                                        b.status === 'confirmed' && (React.createElement("button", { onClick: () => handleUpdateBookingStatus(b.id, 'in_progress'), className: "px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] cursor-pointer", title: "Bắt đầu phục vụ" }, "Bắt đầu")),
                                        b.status === 'in_progress' && (React.createElement("button", { onClick: () => handleUpdateBookingStatus(b.id, 'completed'), className: "px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer", title: "Đánh dấu hoàn thành" }, "Hoàn thành")),
                                        b.status !== 'completed' && b.status !== 'cancelled' && (React.createElement("button", { onClick: () => handleUpdateBookingStatus(b.id, 'cancelled'), className: "px-2 py-1 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-bold text-[11px] cursor-pointer", title: "Hủy lịch hẹn" }, "Từ chối"))))))))))))),
            activeTab === 'services' && (React.createElement("div", { className: "space-y-6" },
                React.createElement("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" },
                    React.createElement("div", null,
                        React.createElement("h2", { className: "text-2xl font-black text-[#81451F] font-heading" }, "Quản Lý Dịch Vụ & Bảng Giá Cân Nặng")),
                    React.createElement("button", { onClick: () => {
                            setEditingService(null);
                            setSrvName('');
                            setSrvPrice(200000);
                            setSrvDuration(60);
                            setSrvDesc('');
                            setSrvImage('https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80');
                            setSrvIsWeightBased(false);
                            setServiceModalOpen(true);
                        }, className: "px-4 py-2.5 rounded-2xl bg-[#EC802B] hover:bg-[#D46917] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5" },
                        React.createElement(Plus, { className: "w-4 h-4" }),
                        " Thêm dịch vụ mới")),
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, allServices.map((srv) => (React.createElement("div", { key: srv.id, className: "bg-white rounded-3xl border-2 border-[#E8CCAD] overflow-hidden shadow-xs flex flex-col justify-between" },
                    React.createElement("div", null,
                        React.createElement("div", { className: "relative h-40 bg-neutral-100" },
                            React.createElement("img", { src: srv.image_url, alt: srv.service_name, className: "w-full h-full object-cover" }),
                            React.createElement("button", { onClick: () => {
                                    store.updateService(srv.id, { is_active: !srv.is_active });
                                    triggerRefresh();
                                }, title: srv.is_active ? 'Dịch vụ đang nhận đặt lịch. Nhấn để tạm ngừng.' : 'Dịch vụ đang tạm ngừng nhận lịch. Nhấn để mở lại.', "aria-pressed": srv.is_active, className: `absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer shadow-xs border border-white/70 ${srv.is_active ? 'bg-[#66BCB4] text-white' : 'bg-[#81451F] text-white'}` }, srv.is_active ? '● Đang nhận lịch' : '○ Tạm ngừng')),
                        React.createElement("div", { className: "p-4 space-y-2" },
                            React.createElement("h3", { className: "font-bold text-base text-[#81451F] font-heading line-clamp-1" }, srv.service_name),
                            React.createElement("p", { className: "text-xs text-neutral-500 line-clamp-2" }, srv.description),
                            React.createElement("div", { className: "flex items-center justify-between text-xs pt-1" },
                                React.createElement("span", { className: "text-neutral-500" },
                                    srv.duration_minutes,
                                    " phút"),
                                React.createElement("span", { className: "font-black text-[#EC802B] text-base" }, formatVND(srv.base_price))),
                            srv.is_weight_based && srv.pricing_tiers && (React.createElement("div", { className: "mt-2 p-2 bg-[#FAF6F0] rounded-xl text-[10px] text-neutral-600 space-y-0.5" },
                                React.createElement("strong", { className: "text-[#81451F] block" }, "Khung giá theo cân nặng:"),
                                srv.pricing_tiers.map((t) => (React.createElement("div", { key: t.id, className: "flex justify-between" },
                                    React.createElement("span", null,
                                        t.min_weight,
                                        "-",
                                        t.max_weight,
                                        "kg:"),
                                    React.createElement("strong", null, formatVND(t.price))))))))),
                    React.createElement("div", { className: "p-3 bg-[#FAF6F0] border-t border-[#E8CCAD] flex items-center justify-end gap-2" },
                        React.createElement("button", { onClick: () => {
                                setEditingService(srv);
                                setSrvName(srv.service_name);
                                setSrvCatId(srv.category_id);
                                setSrvPrice(srv.base_price);
                                setSrvDuration(srv.duration_minutes);
                                setSrvDesc(srv.description);
                                setSrvImage(srv.image_url);
                                setSrvIsWeightBased(srv.is_weight_based);
                                setServiceModalOpen(true);
                            }, className: "px-3 py-1.5 rounded-xl border border-[#81451F] text-[#81451F] hover:bg-white text-xs font-bold cursor-pointer flex items-center gap-1" },
                            React.createElement(Edit2, { className: "w-3.5 h-3.5" }),
                            " Chỉnh sửa")))))))),
            activeTab === 'schedules' && (React.createElement("div", { className: "space-y-6" },
                React.createElement("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" },
                    React.createElement("div", null,
                        React.createElement("h2", { className: "text-2xl font-black text-[#81451F] font-heading" }, "Quản Lý Lịch Làm Việc & Sức Chứa Đồng Thời")),
                    React.createElement("button", { onClick: () => setScheduleModalOpen(true), className: "px-4 py-2.5 rounded-2xl bg-[#EC802B] hover:bg-[#D46917] text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5" },
                        React.createElement(Clock, { className: "w-4 h-4" }),
                        " Cấu hình ngày làm việc")),
                React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }, allSchedules.map((sch) => (React.createElement("div", { key: sch.id, className: `p-4 rounded-3xl border-2 transition-all ${sch.is_available
                        ? 'bg-white border-[#E8CCAD]'
                        : 'bg-neutral-100 border-neutral-300 opacity-60'}` },
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("strong", { className: "text-sm text-[#81451F]" }, sch.work_date),
                        React.createElement("span", { className: `text-[10px] font-black px-2 py-0.5 rounded-full ${sch.is_available
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'}` }, sch.is_available ? 'Hoạt động' : 'Nghỉ')),
                    React.createElement("div", { className: "mt-3 space-y-1 text-xs text-neutral-600" },
                        React.createElement("p", null,
                            "Giờ mở cửa: ",
                            React.createElement("strong", null,
                                sch.start_time,
                                " - ",
                                sch.end_time)),
                        React.createElement("p", null,
                            "Sức chứa tối đa: ",
                            React.createElement("strong", { className: "text-[#EC802B]" },
                                sch.max_concurrent_capacity,
                                " bé"),
                            " / cùng ca")),
                    React.createElement("button", { onClick: () => {
                            setTargetScheduleDate(sch.work_date);
                            setSchStartTime(sch.start_time);
                            setSchEndTime(sch.end_time);
                            setSchCapacity(sch.max_concurrent_capacity);
                            setSchIsAvailable(sch.is_available);
                            setScheduleModalOpen(true);
                        }, className: "mt-3 w-full py-1.5 text-center text-xs font-bold text-[#81451F] hover:bg-[#FAF6F0] rounded-xl border border-[#E8CCAD] cursor-pointer" }, "Chỉnh sửa"))))))),
            activeTab === 'customers' && (React.createElement("div", { className: "space-y-6" },
                React.createElement("div", null,
                    React.createElement("h2", { className: "text-2xl font-black text-[#81451F] font-heading" },
                        "Danh Sách Khách Hàng & Thú Cưng ",
                        React.createElement("span", { className: "pet-admin-title-count" },
                            "(",
                            customerCount,
                            ")"))),
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, allUsers.filter((u) => u.role === 'customer').map((customer) => {
                    const pets = allPets.filter((p) => p.user_id === customer.id && p.is_active);
                    const bookings = allBookings.filter((b) => b.user_id === customer.id);
                    const points = store.getUserPetPoints(customer.id);
                    return (React.createElement("div", { key: customer.id, className: "bg-white rounded-3xl border-2 border-[#E8CCAD] p-5 shadow-xs space-y-4" },
                        React.createElement("div", { className: "flex items-center gap-3" },
                            React.createElement("div", null,
                                React.createElement("h3", { className: "font-bold text-base text-[#81451F]" }, customer.full_name),
                                React.createElement("p", { className: "text-xs text-neutral-500" },
                                    customer.phone,
                                    " • ",
                                    customer.email),
                                React.createElement("span", { className: "text-[11px] text-[#EC802B] font-bold" },
                                    "Điểm tích lũy: ",
                                    points,
                                    " Pet Point"))),
                        React.createElement("div", { className: "border-t border-[#FAF6F0] pt-3" },
                            React.createElement("h4", { className: "text-xs font-bold text-[#81451F] mb-2" },
                                "Thú cưng sở hữu (",
                                pets.length,
                                "):"),
                            React.createElement("div", { className: "flex flex-wrap gap-2" }, pets.map((pet) => (React.createElement("div", { key: pet.id, className: "p-2 rounded-xl bg-[#FAF6F0] border border-[#E8CCAD] text-xs flex items-center gap-2" },
                                React.createElement("img", { src: pet.avatar_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=100&q=80', alt: pet.pet_name, className: "w-7 h-7 rounded-lg object-cover" }),
                                React.createElement("div", null,
                                    React.createElement("strong", { className: "block text-[#81451F]" }, pet.pet_name),
                                    React.createElement("span", { className: "text-[10px] text-neutral-500" },
                                        pet.species,
                                        " - ",
                                        pet.weight,
                                        "kg"))))))),
                        React.createElement("div", { className: "text-[11px] text-neutral-400" },
                            "Tổng số lượt đặt lịch: ",
                            React.createElement("strong", { className: "text-[#81451F]" }, bookings.length))));
                })))),
            activeTab === 'reviews' && (React.createElement("div", { className: "space-y-6" },
                React.createElement("div", null,
                    React.createElement("h2", { className: "text-2xl font-black text-[#81451F] font-heading" },
                        "Đánh Giá Khách Hàng & Phản Hồi Chính Thức ",
                        React.createElement("span", { className: "pet-admin-title-count" },
                            "(",
                            allReviews.length,
                            ")"))),
                React.createElement("div", { className: "space-y-4" }, allReviews.map((rev) => (React.createElement("div", { key: rev.id, className: "bg-white rounded-3xl border-2 border-[#E8CCAD] p-5 shadow-xs space-y-3" },
                    React.createElement("div", { className: "flex items-start justify-between" },
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-bold text-sm text-[#81451F]" },
                                rev.user_name,
                                " (chủ bé ",
                                rev.pet_name,
                                ")"),
                            React.createElement("div", { className: "flex items-center gap-1 text-[#EDC55B] text-xs mt-0.5" },
                                '★'.repeat(rev.rating),
                                React.createElement("span", { className: "text-neutral-400 text-[10px] ml-1" }, formatDateDMY(rev.created_at)))),
                        rev.points_awarded > 0 && (React.createElement("span", { className: "text-[10px] text-[#66BCB4] font-bold bg-[#E5F6F4] px-2 py-0.5 rounded-full" },
                            "Đã cộng +",
                            rev.points_awarded.toLocaleString('vi-VN'),
                            " pts"))),
                    React.createElement("p", { className: "text-xs text-neutral-700 italic font-vietnamese" },
                        "\"",
                        rev.comment,
                        "\""),
                    rev.admin_reply ? (React.createElement("div", { className: "p-3 bg-[#FAF6F0] rounded-2xl border-l-4 border-[#EC802B] text-xs text-[#81451F] space-y-1" },
                        React.createElement("p", { className: "font-bold text-[11px] text-[#EC802B]" }, "Phản hồi của Admin:"),
                        React.createElement("p", null, rev.admin_reply))) : (React.createElement("button", { onClick: () => {
                            setReplyReviewTarget(rev);
                            setReplyText('');
                        }, className: "px-3 py-1.5 bg-[#FAF6F0] hover:bg-[#FDE8D7] text-[#81451F] rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5" },
                        React.createElement(MessageSquare, { className: "w-3.5 h-3.5 text-[#EC802B]" }),
                        " Phản hồi khách hàng")))))))),
            activeTab === 'coupons' && (React.createElement("div", { className: "space-y-6" },
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement("div", null,
                        React.createElement("h2", { className: "text-2xl font-black text-[#81451F] font-heading" }, "Quản Lý Mã Giảm Giá & Vouchers")),
                    React.createElement("button", { onClick: () => { setEditingCoupon(null); setCpCode(''); setCpType('fixed'); setCpValue(50000); setCpMinSpend(200000); setCpUsageLimit(100); setCpExpiresAt('2029-12-31'); setCpDesc(''); setCouponModalOpen(true); }, className: "px-4 py-2.5 rounded-2xl bg-[#EC802B] hover:bg-[#D46917] text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5" },
                        React.createElement(Plus, { className: "w-4 h-4" }),
                        " Tạo mã giảm giá mới")),
                React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" }, allCoupons.map((cp) => (React.createElement("div", { key: cp.id, className: "bg-white rounded-3xl border-2 border-[#E8CCAD] p-5 shadow-xs space-y-3" },
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("span", { className: "font-mono font-black text-base text-[#EC802B] bg-[#FDE8D7] px-3 py-1 rounded-xl" }, cp.code),
                        React.createElement("button", { onClick: () => {
                                store.updateCoupon(cp.id, { is_active: !cp.is_active });
                                triggerRefresh();
                            }, className: `text-[10px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer ${cp.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'}` }, cp.is_active ? 'Khả dụng' : 'Khóa')),
                    React.createElement("p", { className: "text-xs text-neutral-700 font-semibold" }, cp.description),
                    React.createElement("div", { className: "text-[11px] text-neutral-500 space-y-1" },
                        React.createElement("p", null,
                            "Đơn tối thiểu: ",
                            React.createElement("strong", null, formatVND(cp.min_order_value))),
                        React.createElement("p", null,
                            "Đã sử dụng: ",
                            React.createElement("strong", null, cp.used_count),
                            " / ",
                            cp.usage_limit,
                            " lượt"),
                        React.createElement("p", null,
                            "Hết hạn: ",
                            React.createElement("strong", null, new Intl.DateTimeFormat('en-GB').format(new Date(cp.expires_at))))),
                    React.createElement("button", { type: "button", onClick: () => { setEditingCoupon(cp); setCpCode(cp.code); setCpType(cp.discount_type); setCpValue(cp.discount_value); setCpMinSpend(cp.min_order_value); setCpUsageLimit(cp.usage_limit); setCpExpiresAt(cp.expires_at.slice(0, 10)); setCpDesc(cp.description); setCouponModalOpen(true); }, className: "inline-flex items-center gap-1 rounded-xl border border-[#E8CCAD] px-3 py-2 text-xs font-bold text-[#81451F] hover:bg-[#FFF4E5]" },
                        React.createElement(Edit3, { size: 14 }),
                        " Chỉnh sửa")))))))),
        serviceModalOpen && (React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs", onMouseDown: (event) => { if (event.target === event.currentTarget)
                setServiceModalOpen(false); } },
            React.createElement("div", { className: "w-full max-w-lg bg-white rounded-3xl border-2 border-[#E8CCAD] p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto" },
                React.createElement("h3", { className: "font-bold text-lg text-[#81451F] font-heading" }, editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'),
                React.createElement("form", { onSubmit: handleSaveService, className: "space-y-3" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Tên dịch vụ *"),
                        React.createElement("input", { type: "text", value: srvName, onChange: (e) => setSrvName(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold text-[#81451F]", required: true })),
                    React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Danh mục"),
                            React.createElement("select", { value: srvCatId, onChange: (e) => setSrvCatId(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold text-[#81451F]" }, allCategories.map((c) => (React.createElement("option", { key: c.id, value: c.id }, c.name))))),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Thời lượng (phút)"),
                            React.createElement("input", { type: "number", value: srvDuration, onChange: (e) => setSrvDuration(Number(e.target.value)), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold text-[#81451F]", required: true }))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Giá cơ bản (VNĐ) *"),
                        React.createElement("input", { type: "number", step: "10000", value: srvPrice, onChange: (e) => setSrvPrice(Number(e.target.value)), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold text-[#81451F]", required: true })),
                    React.createElement("div", { className: "flex items-center gap-2 pt-1" },
                        React.createElement("input", { type: "checkbox", id: "weightBased", checked: srvIsWeightBased, onChange: (e) => setSrvIsWeightBased(e.target.checked), className: "rounded text-[#EC802B]" }),
                        React.createElement("label", { htmlFor: "weightBased", className: "text-xs font-bold text-[#81451F]" }, "Dịch vụ tính giá theo cân nặng (Spa/Grooming)")),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Mô tả dịch vụ"),
                        React.createElement("textarea", { rows: 3, value: srvDesc, onChange: (e) => setSrvDesc(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs text-[#81451F]" })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "URL Hình ảnh"),
                        React.createElement("input", { type: "url", value: srvImage, onChange: (e) => setSrvImage(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs text-[#81451F]" })),
                    React.createElement("div", { className: "pt-3 flex justify-end gap-2 border-t border-[#FAF6F0]" },
                        React.createElement("button", { type: "button", onClick: () => setServiceModalOpen(false), className: "px-4 py-2 text-xs font-bold text-neutral-500" }, "Hủy"),
                        React.createElement("button", { type: "submit", className: "px-5 py-2 bg-[#EC802B] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer" }, "Lưu dịch vụ")))))),
        scheduleModalOpen && (React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs", onMouseDown: (event) => { if (event.target === event.currentTarget)
                setScheduleModalOpen(false); } },
            React.createElement("div", { className: "w-full max-w-md bg-white rounded-3xl border-2 border-[#E8CCAD] p-6 space-y-4 shadow-xl" },
                React.createElement("h3", { className: "font-bold text-lg text-[#81451F] font-heading" },
                    "Cấu hình ngày làm việc: ",
                    targetScheduleDate),
                React.createElement("form", { onSubmit: handleSaveSchedule, className: "space-y-3" },
                    React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Giờ mở cửa"),
                            React.createElement("input", { type: "time", value: schStartTime, onChange: (e) => setSchStartTime(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold" })),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Giờ đóng cửa"),
                            React.createElement("input", { type: "time", value: schEndTime, onChange: (e) => setSchEndTime(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold" }))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Sức chứa đồng thời (số bé phục vụ cùng lúc)"),
                        React.createElement("input", { type: "number", min: "1", max: "20", value: schCapacity, onChange: (e) => setSchCapacity(Number(e.target.value)), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold" })),
                    React.createElement("div", { className: "flex items-center gap-2 pt-1" },
                        React.createElement("input", { type: "checkbox", id: "schAvailable", checked: schIsAvailable, onChange: (e) => setSchIsAvailable(e.target.checked), className: "rounded text-[#EC802B]" }),
                        React.createElement("label", { htmlFor: "schAvailable", className: "text-xs font-bold text-[#81451F]" }, "Cơ sở hoạt động nhận lịch vào ngày này")),
                    React.createElement("div", { className: "pt-3 flex justify-end gap-2 border-t border-[#FAF6F0]" },
                        React.createElement("button", { type: "button", onClick: () => setScheduleModalOpen(false), className: "px-4 py-2 text-xs font-bold text-neutral-500" }, "Hủy"),
                        React.createElement("button", { type: "submit", className: "px-5 py-2 bg-[#EC802B] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer" }, "Lưu cấu hình")))))),
        replyReviewTarget && (React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs", onMouseDown: (event) => { if (event.target === event.currentTarget)
                setReplyReviewTarget(null); } },
            React.createElement("div", { className: "w-full max-w-md bg-white rounded-3xl border-2 border-[#E8CCAD] p-6 space-y-4 shadow-xl" },
                React.createElement("h3", { className: "font-bold text-base text-[#81451F] font-heading" },
                    "Phản hồi đánh giá của ",
                    replyReviewTarget.user_name),
                React.createElement("p", { className: "text-xs text-neutral-600 italic" },
                    "\"",
                    replyReviewTarget.comment,
                    "\""),
                React.createElement("form", { onSubmit: handleReplyReviewSubmit, className: "space-y-3" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Nội dung phản hồi chính thức:"),
                        React.createElement("textarea", { rows: 3, value: replyText, onChange: (e) => setReplyText(e.target.value), placeholder: "Dạ cảm ơn bạn nhiều ạ, Pet Phết rất vui được chăm sóc bé...", className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs text-[#81451F]", required: true })),
                    React.createElement("div", { className: "pt-2 flex justify-end gap-2" },
                        React.createElement("button", { type: "button", onClick: () => setReplyReviewTarget(null), className: "px-4 py-2 text-xs font-bold text-neutral-500" }, "Hủy"),
                        React.createElement("button", { type: "submit", className: "px-5 py-2 bg-[#EC802B] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer" }, "Gửi phản hồi")))))),
        couponModalOpen && (React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs", onMouseDown: (event) => { if (event.target === event.currentTarget)
                setCouponModalOpen(false); } },
            React.createElement("div", { className: "w-full max-w-md bg-white rounded-3xl border-2 border-[#E8CCAD] p-6 space-y-4 shadow-xl" },
                React.createElement("h3", { className: "font-bold text-base text-[#81451F] font-heading" }, editingCoupon ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'),
                React.createElement("form", { onSubmit: handleSaveCoupon, className: "space-y-3" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Mã coupon *"),
                        React.createElement("input", { type: "text", value: cpCode, onChange: (e) => setCpCode(e.target.value.toUpperCase()), placeholder: "PETVIP30", className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-mono font-bold", required: true })),
                    React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Loại giảm"),
                            React.createElement("select", { value: cpType, onChange: (e) => setCpType(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold" },
                                React.createElement("option", { value: "fixed" }, "Số tiền cố định (VNĐ)"),
                                React.createElement("option", { value: "percent" }, "Phần trăm (%)"))),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Giá trị giảm"),
                            React.createElement("input", { type: "number", min: 1, max: cpType === 'percent' ? 100 : undefined, value: cpValue, onChange: (e) => setCpValue(Number(e.target.value)), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold", required: true }))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Chi tiêu tối thiểu (VNĐ)"),
                        React.createElement("input", { type: "number", value: cpMinSpend, onChange: (e) => setCpMinSpend(Number(e.target.value)), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold", required: true })),
                    React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Ngày hết hạn"),
                            React.createElement("input", { type: "date", lang: "en-GB", value: cpExpiresAt, onChange: (e) => setCpExpiresAt(e.target.value), min: new Date().toISOString().slice(0, 10), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold", required: true })),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Giới hạn lượt dùng"),
                            React.createElement("input", { type: "number", min: editingCoupon?.used_count || 0, value: cpUsageLimit, onChange: (e) => setCpUsageLimit(Number(e.target.value)), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold", required: true }))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Mô tả hiển thị"),
                        React.createElement("input", { type: "text", value: cpDesc, onChange: (e) => setCpDesc(e.target.value), placeholder: "Giảm 50.000đ cho đơn từ 200k", className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs text-[#81451F]" })),
                    React.createElement("div", { className: "pt-2 flex justify-end gap-2" },
                        React.createElement("button", { type: "button", onClick: () => setCouponModalOpen(false), className: "px-4 py-2 text-xs font-bold text-neutral-500" }, "Hủy"),
                        React.createElement("button", { type: "submit", className: "px-5 py-2 bg-[#EC802B] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer" }, editingCoupon ? 'Lưu thay đổi' : 'Tạo mã'))))))));
};
// Role guard runs before the admin portal reads any privileged data.
export const AdminPortal = (props) => {
    if (props.currentUser.role !== 'admin') {
        return (React.createElement("main", { className: "pet-admin-access-denied" },
            React.createElement("h1", null, "Không có quyền truy cập"),
            React.createElement("p", null, "Tài khoản hiện tại không có quyền quản trị viên."),
            React.createElement("button", { onClick: props.onLogout }, "Quay về trang chủ")));
    }
    return React.createElement(AdminPortalContent, { ...props });
};
