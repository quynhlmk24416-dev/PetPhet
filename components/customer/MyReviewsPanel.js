import React, { useEffect, useState } from '../../js/react.js';
import { Edit3, MessageSquareQuote, Save, Star, Trash2, X } from '../../js/icons.js';
import { store } from '../../services/store.js';
import { formatDateDMY } from '../../js/utils/date.js';
import { notifyToast } from '../../js/utils/toast.js';
export const MyReviewsPanel = ({ currentUser }) => {
    const [, setRevision] = useState(0);
    const [editingReview, setEditingReview] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [message, setMessage] = useState('');
    useEffect(() => store.subscribe(() => setRevision((value) => value + 1)), []);
    const reviews = store.getReviewsByUser(currentUser.id);
    useEffect(() => {
        if (!editingReview)
            return;
        const closeOnEscape = (event) => { if (event.key === 'Escape')
            setEditingReview(null); };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [editingReview]);
    const beginEdit = (review) => {
        setEditingReview(review);
        setRating(review.rating);
        setComment(review.comment);
        setMessage('');
    };
    const saveEdit = (event) => {
        event.preventDefault();
        if (!editingReview)
            return;
        const result = store.updateReview({ reviewId: editingReview.id, userId: currentUser.id, rating, comment });
        setMessage(result.message);
        notifyToast(result.success ? 'success' : 'error', result.message);
        if (result.success)
            setEditingReview(null);
    };
    const removeReview = (review) => {
        const accepted = window.confirm(`Bạn có chắc muốn xóa đánh giá cho dịch vụ ${store.getServiceById(review.service_id)?.service_name || ''}? Điểm thưởng đã nhận sẽ được điều chỉnh lại.`);
        if (!accepted)
            return;
        const result = store.deleteReview(review.id, currentUser.id);
        setMessage(result.message);
        notifyToast(result.success ? 'success' : 'error', result.message);
    };
    return (React.createElement("section", { className: "mt-10" },
        React.createElement("div", { className: "flex items-end justify-between gap-3 mb-4" },
            React.createElement("div", null,
                React.createElement("h2", { className: "text-2xl font-black text-[#81451F] mt-1" }, "Đánh giá của tôi")),
            React.createElement("span", { className: "rounded-full bg-[#FFF4E5] border border-[#E8CCAD] px-3 py-1.5 text-xs font-bold text-[#81451F]" },
                reviews.length,
                " đánh giá")),
        message && React.createElement("p", { className: "mb-3 rounded-xl bg-[#FFF4E5] border border-[#E8CCAD] px-4 py-3 text-xs text-[#81451F]" }, message),
        reviews.length === 0 ? (React.createElement("div", { className: "rounded-2xl border border-dashed border-[#E8CCAD] bg-white/70 p-6 text-center text-sm text-neutral-500" },
            React.createElement(MessageSquareQuote, { className: "mx-auto mb-2 text-[#EDC55B]" }),
            " Bạn chưa gửi đánh giá nào.")) : (React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, reviews.map((review) => (React.createElement("article", { key: review.id, className: "rounded-2xl border border-[#E8CCAD] bg-white p-5 shadow-sm" },
            React.createElement("div", { className: "flex items-start justify-between gap-3" },
                React.createElement("div", null,
                    React.createElement("h3", { className: "font-extrabold text-[#81451F]" }, store.getServiceById(review.service_id)?.service_name || 'Dịch vụ Pet Phết'),
                    React.createElement("p", { className: "text-[11px] text-neutral-400 mt-1" },
                        "Bé ",
                        review.pet_name,
                        " · ",
                        formatDateDMY(review.created_at))),
                React.createElement("span", { className: "shrink-0 rounded-full bg-[#FFF4E5] px-2.5 py-1 text-[11px] font-bold text-[#A66A20]" },
                    "+",
                    review.points_awarded.toLocaleString('vi-VN'),
                    " điểm")),
            React.createElement("div", { className: "flex gap-0.5 mt-3 text-[#EC802B]" }, Array.from({ length: 5 }, (_, index) => React.createElement(Star, { key: index, size: 15, fill: index < review.rating ? 'currentColor' : 'none' }))),
            React.createElement("p", { className: "mt-2 text-sm leading-relaxed text-neutral-700" }, review.comment),
            review.admin_reply && React.createElement("div", { className: "mt-3 rounded-xl bg-[#F0F9F7] border border-[#CDE8E4] p-3 text-xs text-[#356E69]" },
                React.createElement("b", null, "Pet Phết phản hồi:"),
                " ",
                review.admin_reply),
            React.createElement("div", { className: "flex justify-end gap-2 mt-4 pt-3 border-t border-[#FAF0E4]" },
                React.createElement("button", { onClick: () => beginEdit(review), className: "inline-flex items-center gap-1.5 rounded-lg border border-[#E8CCAD] px-3 py-2 text-xs font-bold text-[#81451F] hover:bg-[#FFF4E5]" },
                    React.createElement(Edit3, { size: 14 }),
                    " Chỉnh sửa"),
                React.createElement("button", { onClick: () => removeReview(review), className: "inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50" },
                    React.createElement(Trash2, { size: 14 }),
                    " Xóa"))))))),
        editingReview && (React.createElement("div", { className: "fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4", onMouseDown: (event) => { if (event.target === event.currentTarget)
                setEditingReview(null); } },
            React.createElement("form", { onSubmit: saveEdit, className: "w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#E8CCAD]" },
                React.createElement("div", { className: "flex items-center justify-between mb-4" },
                    React.createElement("div", null,
                        React.createElement("h3", { className: "text-xl font-black text-[#81451F]" }, "Chỉnh sửa đánh giá"),
                        React.createElement("p", { className: "text-xs text-neutral-500 mt-1" }, store.getServiceById(editingReview.service_id)?.service_name || 'Dịch vụ Pet Phết')),
                    React.createElement("button", { type: "button", onClick: () => setEditingReview(null), "aria-label": "Đóng", className: "p-2 rounded-xl hover:bg-[#FFF4E5]" },
                        React.createElement(X, { size: 20 }))),
                React.createElement("label", { className: "block text-xs font-bold text-[#81451F]" }, "Số sao"),
                React.createElement("div", { className: "flex gap-2 my-2" }, [1, 2, 3, 4, 5].map((value) => React.createElement("button", { key: value, type: "button", onClick: () => setRating(value), "aria-label": `${value} sao`, className: "p-1" },
                    React.createElement(Star, { size: 25, fill: value <= rating ? '#EC802B' : 'none', color: "#EC802B" })))),
                React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mt-4" },
                    "Nhận xét",
                    React.createElement("textarea", { rows: 4, required: true, value: comment, onChange: (event) => setComment(event.target.value), className: "mt-2 w-full rounded-xl border border-[#E8CCAD] p-3 text-sm outline-none focus:ring-2 focus:ring-[#EC802B]" })),
                React.createElement("div", { className: "flex justify-end gap-2 mt-5" },
                    React.createElement("button", { type: "button", onClick: () => setEditingReview(null), className: "rounded-xl px-4 py-2.5 text-xs font-bold border border-[#E8CCAD] text-[#81451F]" }, "Hủy"),
                    React.createElement("button", { type: "submit", className: "rounded-xl px-4 py-2.5 text-xs font-bold bg-[#EC802B] text-white inline-flex items-center gap-2" },
                        React.createElement(Save, { size: 15 }),
                        " Lưu thay đổi")))))));
};
