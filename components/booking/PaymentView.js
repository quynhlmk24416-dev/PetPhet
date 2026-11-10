import React, { useState, useEffect } from '../../js/react.js';
import { QrCode, Copy, CheckCircle2, Clock, AlertTriangle, ArrowRight } from '../../js/icons.js';
import { store } from '../../services/store.js';
import { notifyToast } from '../../js/utils/toast.js';
import { formatVND } from '../../services/bookingEngine.js';
import { formatDateDMY } from '../../js/utils/date.js';
export const PaymentView = ({ booking, onViewBookingHistory }) => {
    const [copiedField, setCopiedField] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(booking.payment_status === 'pending_reconcile');
    const [timeLeft, setTimeLeft] = useState(() => booking.hold_expires_at ? Math.max(0, Math.ceil((new Date(booking.hold_expires_at).getTime() - Date.now()) / 1000)) : 0);
    useEffect(() => {
        if (booking.payment_method !== 'QR' || booking.payment_status === 'paid' || !booking.hold_expires_at)
            return;
        const refreshRemaining = () => {
            const remaining = Math.max(0, Math.ceil((new Date(booking.hold_expires_at).getTime() - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining === 0)
                store.processExpiredQrBookings();
        };
        refreshRemaining();
        const timer = window.setInterval(refreshRemaining, 1000);
        return () => window.clearInterval(timer);
    }, [booking.id, booking.hold_expires_at, booking.payment_method, booking.payment_status]);
    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    const handleCopy = async (text, field) => {
        try {
            if (!navigator.clipboard?.writeText)
                throw new Error('Trình duyệt không hỗ trợ sao chép tự động.');
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            window.setTimeout(() => setCopiedField(null), 2000);
            notifyToast('success', 'Đã sao chép thông tin vào bộ nhớ tạm.');
        }
        catch (error) {
            notifyToast('error', error instanceof Error ? error.message : 'Không thể sao chép thông tin.');
        }
    };
    const handleConfirmTransferred = () => {
        const result = store.submitQrTransfer(booking.id);
        if (result.success) {
            setIsSubmitted(true);
            notifyToast('success', result.message || 'Đã gửi xác nhận chuyển khoản. Pet Phết sẽ đối chiếu giao dịch.');
        }
        else {
            notifyToast('error', result.message || 'Không thể gửi xác nhận chuyển khoản.');
        }
    };
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`2|99|0909123456888|PET PHET VIETNAM||0|0|${booking.total_amount}|PETPHET ${booking.id}|transfer_myqr`)}`;
    return (React.createElement("div", { className: "max-w-2xl mx-auto px-4 py-10" },
        React.createElement("div", { className: "bg-white rounded-3xl border-2 border-[#E8CCAD] shadow-xl overflow-hidden" },
            React.createElement("div", { className: "p-6 bg-gradient-to-r from-[#EC802B] to-[#EDC55B] text-white text-center" },
                React.createElement("div", { className: "w-14 h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-2" },
                    React.createElement(CheckCircle2, { className: "w-8 h-8 text-white" })),
                React.createElement("h2", { className: "text-2xl font-black font-heading" },
                    "Ghi nhận lịch hẹn #",
                    booking.id),
                React.createElement("p", { className: "text-xs text-orange-100 mt-1 font-vietnamese" },
                    "Dịch vụ: ",
                    React.createElement("strong", null, booking.service_name),
                    " cho bé ",
                    React.createElement("strong", null, booking.pet_name))),
            React.createElement("div", { className: "p-6 sm:p-8 space-y-6" },
                booking.payment_method === 'COD' && (React.createElement("div", { className: "space-y-4 text-center" },
                    React.createElement("div", { className: "p-5 rounded-2xl bg-[#FCF5DC] border border-[#EDC55B] space-y-2" },
                        React.createElement("span", { className: "text-xs font-black uppercase text-[#81451F] tracking-wider block" }, "Phương thức: Thanh toán trực tiếp tại quầy (COD)"),
                        React.createElement("p", { className: "text-sm text-neutral-700" }, "Số tiền cần thanh toán khi sử dụng dịch vụ:"),
                        React.createElement("p", { className: "text-3xl font-black text-[#EC802B]" }, formatVND(booking.total_amount)),
                        React.createElement("p", { className: "text-xs text-neutral-500 font-vietnamese" },
                            "Trạng thái hiện tại: ",
                            React.createElement("strong", { className: "text-[#81451F]" }, booking.payment_status === 'paid' ? 'Đã thanh toán' : booking.status === 'cancelled' ? 'Đã hủy' : 'Chờ xác nhận & Chưa thanh toán'),
                            ". ",
                            booking.payment_status === 'paid' ? 'Pet Phết đã ghi nhận khoản thu.' : 'Chuyên viên sẽ gọi điện hoặc kiểm tra xác nhận lịch hẹn trước giờ phục vụ.')),
                    React.createElement("div", { className: "p-4 bg-[#FAF6F0] rounded-2xl border border-[#E8CCAD] text-xs text-neutral-600 space-y-1 text-left" },
                        React.createElement("p", null,
                            "📍 ",
                            React.createElement("strong", null, "Địa chỉ tiệm:"),
                            " 123 Đường Thú Cưng Yêu Thương, Q.1, TP.HCM"),
                        React.createElement("p", null,
                            "⏰ ",
                            React.createElement("strong", null, "Thời gian hẹn:"),
                            " ",
                            booking.booking_time,
                            " ngày ",
                            formatDateDMY(booking.booking_date)),
                        React.createElement("p", null,
                            "🐾 ",
                            React.createElement("strong", null, "Bé cưng:"),
                            " ",
                            booking.pet_name,
                            " (",
                            booking.pet_weight,
                            "kg)")),
                    React.createElement("button", { onClick: onViewBookingHistory, className: "w-full py-3 bg-[#EC802B] hover:bg-[#D46917] text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2" },
                        "Xem lịch hẹn của tôi ",
                        React.createElement(ArrowRight, { className: "w-4 h-4" })))),
                booking.payment_method === 'QR' && (React.createElement("div", { className: "space-y-6" },
                    React.createElement("div", { className: "flex items-center justify-between p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#E8CCAD]" },
                        React.createElement("div", { className: "flex items-center gap-2 text-xs font-bold text-[#81451F]" },
                            React.createElement(Clock, { className: "w-4 h-4 text-[#EC802B]" }),
                            React.createElement("span", null, "Thời gian giữ chỗ tự động:")),
                        React.createElement("span", { className: "font-mono text-base font-black text-[#EC802B] bg-white px-3 py-1 rounded-xl border border-[#EDC55B]" }, formatTimer(timeLeft))),
                    React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6 items-center" },
                        React.createElement("div", { className: "flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-[#E8CCAD] shadow-xs" },
                            React.createElement("img", { src: qrImageUrl, alt: "Mã QR Chuyển khoản VietQR", className: "w-48 h-48 rounded-xl" }),
                            React.createElement("span", { className: "text-[11px] text-neutral-500 font-semibold mt-2 flex items-center gap-1" },
                                React.createElement(QrCode, { className: "w-3.5 h-3.5 text-[#66BCB4]" }),
                                " Quét nhanh bằng app Ngân hàng")),
                        React.createElement("div", { className: "space-y-2.5 text-xs" },
                            React.createElement("div", null,
                                React.createElement("span", { className: "text-neutral-400 text-[10px] uppercase font-bold block" }, "Ngân hàng"),
                                React.createElement("strong", { className: "text-sm text-[#81451F]" }, "MB Bank (Ngân hàng Quân Đội)")),
                            React.createElement("div", null,
                                React.createElement("span", { className: "text-neutral-400 text-[10px] uppercase font-bold block" }, "Chủ tài khoản"),
                                React.createElement("strong", { className: "text-sm text-[#81451F]" }, "PET PHET VIETNAM")),
                            React.createElement("div", null,
                                React.createElement("span", { className: "text-neutral-400 text-[10px] uppercase font-bold block" }, "Số tài khoản"),
                                React.createElement("div", { className: "flex items-center gap-2 mt-0.5" },
                                    React.createElement("strong", { className: "text-base text-[#EC802B] font-mono" }, "0909123456888"),
                                    React.createElement("button", { onClick: () => handleCopy('0909123456888', 'stk'), className: "p-1 text-xs text-neutral-500 hover:text-[#EC802B] cursor-pointer", title: "Sao chép số tài khoản" }, copiedField === 'stk' ? React.createElement(CheckCircle2, { className: "w-3.5 h-3.5 text-emerald-600" }) : React.createElement(Copy, { className: "w-3.5 h-3.5" })))),
                            React.createElement("div", null,
                                React.createElement("span", { className: "text-neutral-400 text-[10px] uppercase font-bold block" }, "Số tiền cần chuyển"),
                                React.createElement("div", { className: "flex items-center gap-2 mt-0.5" },
                                    React.createElement("strong", { className: "text-lg text-[#EC802B] font-black" }, formatVND(booking.total_amount)),
                                    React.createElement("button", { onClick: () => handleCopy(booking.total_amount.toString(), 'amount'), className: "p-1 text-xs text-neutral-500 hover:text-[#EC802B] cursor-pointer", title: "Sao chép số tiền" }, copiedField === 'amount' ? React.createElement(CheckCircle2, { className: "w-3.5 h-3.5 text-emerald-600" }) : React.createElement(Copy, { className: "w-3.5 h-3.5" })))),
                            React.createElement("div", null,
                                React.createElement("span", { className: "text-neutral-400 text-[10px] uppercase font-bold block" }, "Nội dung chuyển khoản (bắt buộc)"),
                                React.createElement("div", { className: "flex items-center gap-2 mt-0.5 bg-[#FAF6F0] p-2 rounded-xl border border-[#E8CCAD]" },
                                    React.createElement("strong", { className: "text-xs text-[#81451F] font-mono" },
                                        "PETPHET ",
                                        booking.id),
                                    React.createElement("button", { onClick: () => handleCopy(`PETPHET ${booking.id}`, 'content'), className: "p-1 text-xs text-neutral-500 hover:text-[#EC802B] ml-auto cursor-pointer", title: "Sao chép nội dung" }, copiedField === 'content' ? React.createElement(CheckCircle2, { className: "w-3.5 h-3.5 text-emerald-600" }) : React.createElement(Copy, { className: "w-3.5 h-3.5" })))))),
                    React.createElement("div", { className: "p-3.5 bg-[#FCF5DC] rounded-2xl border border-[#EDC55B] text-xs text-neutral-700 flex items-start gap-2.5" },
                        React.createElement(AlertTriangle, { className: "w-4 h-4 text-[#EC802B] shrink-0 mt-0.5" }),
                        React.createElement("p", { className: "font-vietnamese leading-relaxed" },
                            React.createElement("strong", null, "Lưu ý nghiệp vụ:"),
                            " Sau khi bạn chuyển khoản, quản trị viên Pet Phết sẽ đối chiếu giao dịch với sao kê ngân hàng và cập nhật sang ",
                            React.createElement("strong", null, "Đã thanh toán"),
                            ". Hệ thống không tự động coi là thanh toán thành công nếu chưa có đối chiếu.")),
                    booking.payment_status === 'paid' ? (React.createElement("div", { className: "p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3" },
                        React.createElement("span", { className: "flex items-center gap-2" },
                            React.createElement(CheckCircle2, { className: "w-5 h-5" }),
                            " Giao dịch đã được Pet Phết xác nhận thanh toán thành công."),
                        React.createElement("button", { onClick: onViewBookingHistory, className: "shrink-0 px-4 py-2 bg-white border border-emerald-200 rounded-xl font-bold" }, "Xem lịch hẹn"))) : booking.status === 'cancelled' || timeLeft === 0 ? (React.createElement("div", { className: "p-4 bg-red-50 rounded-2xl border border-red-200 text-red-800 text-xs flex items-center justify-between gap-3" },
                        React.createElement("span", null, booking.status === 'cancelled' ? 'Đơn đặt lịch đã bị hủy và không còn hiệu lực.' : 'Thời gian giữ chỗ đã kết thúc. Đơn không còn hiệu lực; vui lòng tạo lịch hẹn mới.'),
                        React.createElement("button", { onClick: onViewBookingHistory, className: "shrink-0 px-4 py-2 bg-white border border-red-200 rounded-xl font-bold" }, "Xem lịch hẹn"))) : isSubmitted ? (React.createElement("div", { className: "p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between" },
                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement(CheckCircle2, { className: "w-5 h-5 text-emerald-600" }),
                            React.createElement("span", null, "Đã ghi nhận yêu cầu đối chiếu chuyển khoản! Đang chờ Admin xác nhận.")),
                        React.createElement("button", { onClick: onViewBookingHistory, className: "px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 cursor-pointer text-xs" }, "Xem lịch hẹn"))) : (React.createElement("div", { className: "flex flex-col sm:flex-row gap-3 pt-2" },
                        React.createElement("button", { onClick: handleConfirmTransferred, className: "flex-1 py-3 bg-[#66BCB4] hover:bg-[#4DA39B] text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2" },
                            React.createElement(CheckCircle2, { className: "w-4 h-4" }),
                            " Tôi đã chuyển khoản thành công"),
                        React.createElement("button", { onClick: onViewBookingHistory, className: "px-6 py-3 border border-[#81451F] text-[#81451F] hover:bg-[#FAF6F0] font-bold text-xs rounded-2xl transition-all cursor-pointer" }, "Về danh sách lịch hẹn")))))))));
};
