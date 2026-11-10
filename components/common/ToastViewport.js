import React, { useEffect, useState } from '../../js/react.js';
import { X } from '../../js/icons.js';
export const ToastViewport = () => {
    const [items, setItems] = useState([]);
    useEffect(() => {
        const onToast = (event) => {
            const detail = event.detail;
            if (!detail)
                return;
            setItems((current) => [...current.slice(-2), detail]);
            window.setTimeout(() => {
                setItems((current) => current.filter((item) => item.id !== detail.id));
            }, 4600);
        };
        window.addEventListener('petphet:toast', onToast);
        return () => window.removeEventListener('petphet:toast', onToast);
    }, []);
    if (!items.length)
        return null;
    return (React.createElement("div", { className: "pet-toast-viewport", "aria-live": "polite", "aria-relevant": "additions text" }, items.map((item) => (React.createElement("article", { key: item.id, className: `pet-toast-card ${item.type}`, role: item.type === 'error' ? 'alert' : 'status' },
        React.createElement("div", { className: "pet-toast-copy" },
            React.createElement("strong", null, item.type === 'success' ? 'Thành công rồi!' : 'Có lỗi xảy ra'),
            React.createElement("p", null, item.message)),
        React.createElement("button", { className: "pet-toast-close", onClick: () => setItems((current) => current.filter((toast) => toast.id !== item.id)), "aria-label": "Đóng thông báo" },
            React.createElement(X, { size: 16 })))))));
};
