import React, { useEffect, useState } from '../../js/react.js';
import { Calendar, Clock, PawPrint, CheckCircle2, AlertCircle, XCircle, Award, RefreshCw, Search, CreditCard, X } from '../../js/icons.js';
import { store } from '../../services/store.js';
import { notifyToast } from '../../js/utils/toast.js';
import { formatVND, getRescheduleDeadline, isWithinRescheduleWindow } from '../../services/bookingEngine.js';
import { formatDateDMY, formatDateTimeDMY } from '../../js/utils/date.js';
import { resizeImageToDataUrl, validateImageFile } from '../../js/utils/image.js';
import { MyReviewsPanel } from './MyReviewsPanel.js';
export const BookingHistoryPage = ({ currentUser, onNavigateToBooking, onOpenPaymentForBooking }) => {
    const userBookings = store.getBookingsByUser(currentUser.id);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    // Modals state
    const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);
    // Reschedule state
    const [rescheduleBookingTarget, setRescheduleBookingTarget] = useState(null);
    const [newDate, setNewDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });
    const [newTime, setNewTime] = useState('10:00');
    // Cancel state
    const [cancelBookingTarget, setCancelBookingTarget] = useState(null);
    const [cancelReason, setCancelReason] = useState('Bận việc đột xuất');
    // Review state
    const [reviewBookingTarget, setReviewBookingTarget] = useState(null);
    const [ratingStars, setRatingStars] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewImage, setReviewImage] = useState('');
    const [actionMessage, setActionMessage] = useState(null);
    useEffect(() => {
        const hasOpenModal = Boolean(rescheduleBookingTarget || cancelBookingTarget || reviewBookingTarget || selectedBookingDetail);
        if (!hasOpenModal)
            return;
        const closeOnEscape = (event) => {
            if (event.key !== 'Escape')
                return;
            setRescheduleBookingTarget(null);
            setCancelBookingTarget(null);
            setReviewBookingTarget(null);
            setSelectedBookingDetail(null);
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [rescheduleBookingTarget, cancelBookingTarget, reviewBookingTarget, selectedBookingDetail]);
    // Filtered
    const filteredBookings = userBookings.filter((b) => {
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        const matchesQuery = b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.pet_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesQuery;
    });
    // Handle Reschedule
    const handleRescheduleSubmit = (e) => {
        e.preventDefault();
        if (!rescheduleBookingTarget)
            return;
        const res = store.rescheduleBooking(rescheduleBookingTarget.id, currentUser.id, newDate, newTime);
        setActionMessage({ type: res.success ? 'success' : 'error', text: res.message });
        notifyToast(res.success ? 'success' : 'error', res.message);
        if (res.success) {
            setRescheduleBookingTarget(null);
        }
    };
    // Handle Cancel
    const handleCancelSubmit = (e) => {
        e.preventDefault();
        if (!cancelBookingTarget)
            return;
        const res = store.cancelBooking(cancelBookingTarget.id, currentUser.id, cancelReason);
        setActionMessage({ type: res.success ? 'success' : 'error', text: res.message });
        notifyToast(res.success ? 'success' : 'error', res.message);
        if (res.success) {
            setCancelBookingTarget(null);
        }
    };
    // The photo of the pet is chosen from the device (PNG/JPG/WebP under 5 MB) and scaled down automatically.
    const handleReviewImageFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = ''; // lets the customer pick the same file again later
        if (!file)
            return;
        const problem = validateImageFile(file);
        if (problem) {
            setActionMessage({ type: 'error', text: problem });
            notifyToast('error', problem);
            return;
        }
        try {
            setReviewImage(await resizeImageToDataUrl(file, 640));
        }
        catch {
            const text = 'Không đọc được ảnh. Vui lòng thử ảnh khác.';
            setActionMessage({ type: 'error', text });
            notifyToast('error', text);
        }
    };
    // Handle Review Submission (+1000 Pet Points)
    const handleReviewSubmit = (e) => {
        e.preventDefault();
        if (!reviewBookingTarget)
            return;
        if (!reviewComment.trim()) {
            setActionMessage({ type: 'error', text: 'Vui lòng nhập lời nhận xét của bạn.' });
            notifyToast('error', 'Vui lòng nhập lời nhận xét của bạn.');
            return;
        }
        const res = store.createReview({
            bookingId: reviewBookingTarget.id,
            userId: currentUser.id,
            rating: ratingStars,
            comment: reviewComment,
            imageUrl: reviewImage
        });
        setActionMessage({ type: res.success ? 'success' : 'error', text: res.message });
        notifyToast(res.success ? 'success' : 'error', res.message);
        if (res.success) {
            setReviewBookingTarget(null);
            setReviewComment('');
            setReviewImage('');
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return React.createElement("span", { className: "px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800" }, "Chờ xác nhận");
            case 'confirmed':
                return React.createElement("span", { className: "px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800" }, "Đã xác nhận");
            case 'in_progress':
                return React.createElement("span", { className: "px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800" }, "Đang phục vụ");
            case 'completed':
                return React.createElement("span", { className: "px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800" }, "Hoàn thành");
            case 'cancelled':
                return React.createElement("span", { className: "px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800" }, "Đã hủy");
            case 'no_show':
                return React.createElement("span", { className: "px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-200 text-neutral-700" }, "Khách vắng");
        }
    };
    const getPaymentStatusBadge = (status, method) => {
        if (status === 'paid') {
            return React.createElement("span", { className: "text-emerald-700 font-bold text-xs flex items-center gap-1" },
                React.createElement(CheckCircle2, { className: "w-3.5 h-3.5" }),
                " Đã thanh toán (",
                method,
                ")");
        }
        if (status === 'pending_reconcile') {
            return React.createElement("span", { className: "text-blue-700 font-bold text-xs flex items-center gap-1" },
                React.createElement(RefreshCw, { className: "w-3.5 h-3.5 animate-spin" }),
                " Chờ đối chiếu (",
                method,
                ")");
        }
        return React.createElement("span", { className: "text-amber-700 font-bold text-xs flex items-center gap-1" },
            React.createElement(Clock, { className: "w-3.5 h-3.5" }),
            " Chưa thanh toán (",
            method,
            ")");
    };
    return (React.createElement("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" },
        React.createElement("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8" },
            React.createElement("div", null,
                React.createElement("span", { className: "text-xs font-black uppercase tracking-widest text-[#EC802B]" }, "Theo dõi dịch vụ"),
                React.createElement("h1", { className: "text-3xl sm:text-4xl font-black text-[#81451F] font-heading mt-1" }, "Lịch Hẹn Của Bạn"),
                React.createElement("p", { className: "text-sm text-neutral-600 mt-1 font-vietnamese" }, "Quản lý, đổi giờ hoặc đánh giá dịch vụ sau khi hoàn thành để nhận ngay 1.000 Pet Point thưởng.")),
            React.createElement("button", { onClick: onNavigateToBooking, className: "px-5 py-3 rounded-2xl bg-[#EC802B] hover:bg-[#D46917] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2" },
                React.createElement(Calendar, { className: "w-4 h-4" }),
                " Đặt lịch mới")),
        actionMessage && (React.createElement("div", { className: `mb-6 p-4 rounded-2xl text-xs flex items-center gap-2 ${actionMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'}` },
            actionMessage.type === 'success' ? (React.createElement(CheckCircle2, { className: "w-4 h-4 text-emerald-600 shrink-0" })) : (React.createElement(AlertCircle, { className: "w-4 h-4 text-red-600 shrink-0" })),
            React.createElement("span", null, actionMessage.text))),
        React.createElement("div", { className: "bg-white p-4 rounded-3xl border-2 border-[#E8CCAD] shadow-xs mb-8 space-y-3" },
            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-3 items-center" },
                React.createElement("div", { className: "md:col-span-5 relative" },
                    React.createElement(Search, { className: "w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" }),
                    React.createElement("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Tìm theo mã (BK-...), tên dịch vụ, bé cưng...", className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-2xl pl-10 pr-3 py-2 text-xs text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]" })),
                React.createElement("div", { className: "md:col-span-7 flex flex-wrap gap-1.5" }, [
                    { id: 'all', label: 'Tất cả' },
                    { id: 'pending', label: 'Chờ xác nhận' },
                    { id: 'confirmed', label: 'Đã xác nhận' },
                    { id: 'completed', label: 'Hoàn thành' },
                    { id: 'cancelled', label: 'Đã hủy' }
                ].map((f) => (React.createElement("button", { key: f.id, onClick: () => setStatusFilter(f.id), className: `px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${statusFilter === f.id
                        ? 'bg-[#EC802B] text-white'
                        : 'bg-[#FAF6F0] text-[#81451F] hover:bg-[#FDE8D7]'}` }, f.label)))))),
        filteredBookings.length === 0 ? (React.createElement("div", { className: "text-center py-16 bg-white rounded-3xl border-2 border-dashed border-[#E8CCAD] p-8" },
            React.createElement(Calendar, { className: "w-14 h-14 text-[#EDC55B] mx-auto mb-3" }),
            React.createElement("h3", { className: "text-lg font-bold text-[#81451F] font-heading" }, "Không tìm thấy lịch hẹn nào"),
            React.createElement("p", { className: "text-xs text-neutral-500 mt-1" }, "Bạn chưa có lịch hẹn nào phù hợp với bộ lọc hiện tại."),
            React.createElement("button", { onClick: onNavigateToBooking, className: "mt-4 px-6 py-2.5 bg-[#EC802B] text-white rounded-xl text-xs font-bold cursor-pointer" }, "Đặt lịch chăm sóc ngay"))) : (React.createElement("div", { className: "space-y-4" }, filteredBookings.map((b) => (React.createElement("div", { key: b.id, className: "bg-white rounded-3xl border-2 border-[#E8CCAD] p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4" },
            React.createElement("div", { className: "space-y-2 flex-1" },
                React.createElement("div", { className: "flex flex-wrap items-center gap-2" },
                    React.createElement("span", { className: "font-mono font-black text-sm text-[#81451F] bg-[#FAF6F0] px-2.5 py-1 rounded-xl border border-[#E8CCAD]" },
                        "#",
                        b.id),
                    getStatusBadge(b.status),
                    getPaymentStatusBadge(b.payment_status, b.payment_method)),
                React.createElement("div", null,
                    React.createElement("h3", { className: "font-black text-lg text-[#81451F] font-heading" }, b.service_name),
                    React.createElement("div", { className: "flex flex-wrap items-center gap-3 text-xs text-neutral-600 mt-1" },
                        React.createElement("span", { className: "flex items-center gap-1 font-semibold text-[#81451F]" },
                            React.createElement(PawPrint, { className: "w-3.5 h-3.5 text-[#EC802B]" }),
                            " Bé ",
                            b.pet_name,
                            " (",
                            b.pet_weight,
                            "kg)"),
                        React.createElement("span", null, "•"),
                        React.createElement("span", { className: "flex items-center gap-1 font-semibold text-[#81451F]" },
                            React.createElement(Calendar, { className: "w-3.5 h-3.5 text-[#66BCB4]" }),
                            " ",
                            b.booking_time,
                            " - ",
                            b.end_time,
                            " (",
                            formatDateDMY(b.booking_date),
                            ")"),
                        React.createElement("span", null, "•"),
                        React.createElement("span", { className: "font-black text-[#EC802B] text-sm" }, formatVND(b.total_amount)))),
                b.customer_note && (React.createElement("p", { className: "text-xs text-neutral-500 italic bg-[#FAF6F0] px-3 py-1.5 rounded-xl border border-[#E8CCAD]/50" },
                    "Ghi chú: \"",
                    b.customer_note,
                    "\""))),
            React.createElement("div", { className: "flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#FAF6F0]" },
                b.payment_method === 'QR' && ['unpaid', 'failed'].includes(b.payment_status) && b.status !== 'cancelled' && (React.createElement("button", { onClick: () => onOpenPaymentForBooking(b), className: "px-3.5 py-2 rounded-xl bg-[#66BCB4] hover:bg-[#4DA39B] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5" },
                    React.createElement(CreditCard, { className: "w-3.5 h-3.5" }),
                    " ",
                    b.payment_status === 'failed' ? 'Thanh toán lại' : 'Quét mã QR')),
                ['pending', 'confirmed'].includes(b.status) && (() => {
                    // Rescheduling is allowed only within 1 day of placing the order.
                    const canReschedule = isWithinRescheduleWindow(b.created_at);
                    return (React.createElement("button", { disabled: !canReschedule, title: canReschedule
                            ? `Đổi lịch được đến ${formatDateTimeDMY(getRescheduleDeadline(b.created_at).toISOString())}`
                            : 'Đã quá hạn đổi lịch (1 ngày kể từ khi đặt đơn)', onClick: () => {
                            setRescheduleBookingTarget(b);
                            setNewDate(b.booking_date);
                            setNewTime(b.booking_time);
                            setActionMessage(null);
                        }, className: `px-3 py-2 rounded-xl border border-[#81451F] text-[#81451F] text-xs font-bold flex items-center gap-1.5 ${canReschedule ? 'hover:bg-[#FAF6F0] cursor-pointer' : 'opacity-50 cursor-not-allowed'}` },
                        React.createElement(RefreshCw, { className: "w-3.5 h-3.5" }),
                        " Đổi lịch"));
                })(),
                ['pending', 'confirmed'].includes(b.status) && (React.createElement("button", { onClick: () => {
                        setCancelBookingTarget(b);
                        setActionMessage(null);
                    }, className: "px-3 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer flex items-center gap-1" },
                    React.createElement(XCircle, { className: "w-3.5 h-3.5" }),
                    " Hủy lịch")),
                b.status === 'completed' && !b.is_reviewed && (React.createElement("button", { onClick: () => {
                        setReviewBookingTarget(b);
                        setRatingStars(5);
                        setReviewComment('');
                        setReviewImage('');
                        setActionMessage(null);
                    }, className: "px-4 py-2 rounded-xl bg-[#EDC55B] hover:bg-[#D6AB3D] text-[#81451F] font-black text-xs shadow-xs cursor-pointer flex items-center gap-1.5 animate-pulse" },
                    React.createElement(Award, { className: "w-4 h-4 text-[#EC802B]" }),
                    " Đánh giá (+1.000 Pts)")),
                b.is_reviewed && (React.createElement("span", { className: "text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1" },
                    React.createElement(CheckCircle2, { className: "w-3.5 h-3.5" }),
                    " Đã đánh giá")))))))),
        React.createElement(MyReviewsPanel, { currentUser: currentUser }),
        rescheduleBookingTarget && (React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs", onMouseDown: (event) => { if (event.target === event.currentTarget)
                setRescheduleBookingTarget(null); } },
            React.createElement("div", { className: "w-full max-w-md bg-white rounded-3xl border-2 border-[#E8CCAD] p-6 space-y-4 shadow-xl" },
                React.createElement("div", { className: "flex items-center justify-between border-b border-[#FAF6F0] pb-3" },
                    React.createElement("h3", { className: "font-bold text-base text-[#81451F] font-heading" },
                        "Đổi ngày giờ lịch hẹn #",
                        rescheduleBookingTarget.id),
                    React.createElement("button", { onClick: () => setRescheduleBookingTarget(null), className: "p-1 rounded-full text-neutral-400 hover:text-neutral-700 cursor-pointer" },
                        React.createElement(X, { className: "w-5 h-5" }))),
                React.createElement("p", { className: "text-xs text-neutral-600 font-vietnamese" },
                    "Dịch vụ: ",
                    React.createElement("strong", null, rescheduleBookingTarget.service_name),
                    " cho bé ",
                    React.createElement("strong", null, rescheduleBookingTarget.pet_name),
                    ". Hệ thống sẽ kiểm tra sức chứa tự động tại khung giờ mới."),
                React.createElement("p", { className: "text-[11px] text-[#946d48] bg-[#FFF4E5] rounded-xl px-3 py-2" },
                    "Hạn đổi lịch: ",
                    React.createElement("strong", null, formatDateTimeDMY(getRescheduleDeadline(rescheduleBookingTarget.created_at).toISOString())),
                    " (1 ngày kể từ khi đặt đơn)."),
                React.createElement("form", { onSubmit: handleRescheduleSubmit, className: "space-y-3" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Ngày hẹn mới"),
                        React.createElement("input", { type: "date", min: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(), value: newDate, onChange: (e) => setNewDate(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]", required: true })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Giờ hẹn mới"),
                        React.createElement("select", { value: newTime, onChange: (e) => setNewTime(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs font-bold text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]" }, ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'].map((t) => (React.createElement("option", { key: t, value: t }, t))))),
                    React.createElement("div", { className: "pt-2 flex justify-end gap-2" },
                        React.createElement("button", { type: "button", onClick: () => setRescheduleBookingTarget(null), className: "px-4 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:bg-neutral-100 cursor-pointer" }, "Hủy"),
                        React.createElement("button", { type: "submit", className: "px-5 py-2 rounded-xl bg-[#EC802B] hover:bg-[#D46917] text-white font-bold text-xs cursor-pointer shadow-sm" }, "Xác nhận đổi lịch")))))),
        cancelBookingTarget && (React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs", onMouseDown: (event) => { if (event.target === event.currentTarget)
                setCancelBookingTarget(null); } },
            React.createElement("div", { className: "w-full max-w-md bg-white rounded-3xl border-2 border-red-200 p-6 space-y-4 shadow-xl" },
                React.createElement("div", { className: "flex items-center justify-between border-b border-red-100 pb-3" },
                    React.createElement("h3", { className: "font-bold text-base text-red-700 font-heading" },
                        "Xác nhận hủy lịch #",
                        cancelBookingTarget.id),
                    React.createElement("button", { onClick: () => setCancelBookingTarget(null), className: "p-1 rounded-full text-neutral-400 hover:text-neutral-700 cursor-pointer" },
                        React.createElement(X, { className: "w-5 h-5" }))),
                React.createElement("p", { className: "text-xs text-neutral-600 font-vietnamese" }, "Khi hủy lịch, chỗ sẽ được giải phóng ngay lập tức cho các khách hàng khác."),
                React.createElement("form", { onSubmit: handleCancelSubmit, className: "space-y-3" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Lý do hủy lịch hẹn:"),
                        React.createElement("textarea", { rows: 3, value: cancelReason, onChange: (e) => setCancelReason(e.target.value), placeholder: "Bận việc, đổi kế hoạch, bé không khỏe...", className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs text-[#81451F] focus:outline-none focus:ring-2 focus:ring-red-500", required: true })),
                    React.createElement("div", { className: "pt-2 flex justify-end gap-2" },
                        React.createElement("button", { type: "button", onClick: () => setCancelBookingTarget(null), className: "px-4 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:bg-neutral-100 cursor-pointer" }, "Không hủy"),
                        React.createElement("button", { type: "submit", className: "px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-sm" }, "Xác nhận hủy lịch")))))),
        reviewBookingTarget && (React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs", onMouseDown: (event) => { if (event.target === event.currentTarget)
                setReviewBookingTarget(null); } },
            React.createElement("div", { className: "w-full max-w-lg bg-white rounded-3xl border-2 border-[#EDC55B] p-6 space-y-4 shadow-2xl" },
                React.createElement("div", { className: "flex items-center justify-between border-b border-[#FAF6F0] pb-3" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "text-[10px] font-black uppercase tracking-wider text-[#EC802B]" }, "Đánh giá dịch vụ & Nhận quà"),
                        React.createElement("h3", { className: "font-bold text-lg text-[#81451F] font-heading" },
                            "Đánh giá lịch hẹn #",
                            reviewBookingTarget.id)),
                    React.createElement("button", { onClick: () => setReviewBookingTarget(null), className: "p-1 rounded-full text-neutral-400 hover:text-neutral-700 cursor-pointer" },
                        React.createElement(X, { className: "w-5 h-5" }))),
                React.createElement("div", { className: "p-3 bg-[#FCF5DC] rounded-2xl border border-[#EDC55B] flex items-center gap-3" },
                    React.createElement("div", { className: "w-10 h-10 rounded-xl bg-white border border-[#EDC55B] flex items-center justify-center shrink-0" },
                        React.createElement(Award, { className: "w-6 h-6 text-[#EC802B]" })),
                    React.createElement("div", { className: "text-xs" },
                        React.createElement("strong", { className: "text-[#81451F] block font-bold" }, "+1.000 Pet Point thưởng ngay lập tức"),
                        React.createElement("span", { className: "text-neutral-600" }, "Gửi đánh giá để tích lũy điểm thưởng trong ví Pet Phết của bạn!"))),
                React.createElement("form", { onSubmit: handleReviewSubmit, className: "space-y-4" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1.5" }, "Mức độ hài lòng của bạn:"),
                        React.createElement("div", { className: "flex items-center gap-2" },
                            [1, 2, 3, 4, 5].map((star) => (React.createElement("button", { type: "button", key: star, onClick: () => setRatingStars(star), className: "p-1 text-2xl text-[#EDC55B] hover:scale-125 transition-transform cursor-pointer" }, star <= ratingStars ? '★' : '☆'))),
                            React.createElement("span", { className: "text-xs font-bold text-[#81451F] ml-2" },
                                ratingStars === 5 && 'Tuyệt vời, bé rất thích! 😍',
                                ratingStars === 4 && 'Rất hài lòng! 😊',
                                ratingStars === 3 && 'Tạm ổn! 🙂',
                                ratingStars < 3 && 'Cần cải thiện thêm! 😕'))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Nhận xét chi tiết (quy trình chăm sóc, thái độ nhân viên, hương thơm thảo mộc...):"),
                        React.createElement("textarea", { rows: 3, value: reviewComment, onChange: (e) => setReviewComment(e.target.value), placeholder: "Bé rất ngoan, lông mềm mượt thơm ngát, nhân viên nhẹ nhàng...", className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-xs text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]", required: true })),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "review-image-file", className: "block text-xs font-bold text-[#81451F] mb-1" }, "Hình ảnh bé sau khi spa (tùy chọn):"),
                        React.createElement("div", { className: "pet-avatar-upload" },
                            reviewImage && (React.createElement("img", { src: reviewImage, alt: "Ảnh bé đã chọn", className: "pet-avatar-upload-preview" })),
                            React.createElement("div", { className: "pet-avatar-upload-controls" },
                                React.createElement("input", { id: "review-image-file", type: "file", accept: "image/png,image/jpeg,image/webp", onChange: handleReviewImageFile, className: "pet-avatar-upload-input" }),
                                React.createElement("p", { className: "pet-avatar-upload-hint" }, "PNG, JPG hoặc WebP, tối đa 5 MB. Ảnh được thu nhỏ tự động."),
                                reviewImage && (React.createElement("button", { type: "button", onClick: () => setReviewImage(''), className: "pet-avatar-upload-clear" }, "Xóa ảnh"))))),
                    React.createElement("div", { className: "pt-2 flex justify-end gap-2" },
                        React.createElement("button", { type: "button", onClick: () => setReviewBookingTarget(null), className: "px-4 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:bg-neutral-100 cursor-pointer" }, "Hủy"),
                        React.createElement("button", { type: "submit", className: "px-6 py-2.5 rounded-xl bg-[#EC802B] hover:bg-[#D46917] text-white font-bold text-xs cursor-pointer shadow-md flex items-center gap-1.5" },
                            React.createElement(Award, { className: "w-4 h-4 text-[#EDC55B]" }),
                            " Gửi đánh giá & Nhận 1.000 Pet Point"))))))));
};
