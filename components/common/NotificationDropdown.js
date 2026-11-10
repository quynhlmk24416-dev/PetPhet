import React, { useEffect, useRef, useState } from '../../js/react.js';
import { Bell, CheckCheck, Sparkles, Calendar, CreditCard, Award } from '../../js/icons.js';
import { store } from '../../services/store.js';
export const NotificationDropdown = ({ role, userId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        if (!isOpen)
            return;
        const closeIfOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target))
                setIsOpen(false);
        };
        const closeOnEscape = (event) => { if (event.key === 'Escape')
            setIsOpen(false); };
        document.addEventListener('mousedown', closeIfOutside);
        window.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('mousedown', closeIfOutside);
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [isOpen]);
    const allNotifications = store.getNotifications(role, userId);
    const notificationSettings = (() => {
        if (!userId)
            return { booking: true, payment: true, promotion: true };
        try {
            const saved = localStorage.getItem(`pet_phet_notification_preferences_${userId}`);
            return saved ? JSON.parse(saved) : { booking: true, payment: true, promotion: true };
        }
        catch {
            return { booking: true, payment: true, promotion: true };
        }
    })();
    const notifications = allNotifications.filter((notification) => {
        if (notification.type === 'booking')
            return notificationSettings.booking !== false;
        if (notification.type === 'payment')
            return notificationSettings.payment !== false;
        if (notification.type === 'promotion')
            return notificationSettings.promotion !== false;
        return true;
    });
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    const handleMarkAll = () => {
        store.markAllNotificationsRead(role, userId);
    };
    const handleMarkOne = (id) => {
        store.markNotificationAsRead(id);
    };
    const getIcon = (type) => {
        switch (type) {
            case 'points':
                return React.createElement(Award, { className: "w-4 h-4 text-[#EDC55B]" });
            case 'payment':
                return React.createElement(CreditCard, { className: "w-4 h-4 text-[#66BCB4]" });
            case 'booking':
                return React.createElement(Calendar, { className: "w-4 h-4 text-[#EC802B]" });
            default:
                return React.createElement(Sparkles, { className: "w-4 h-4 text-[#81451F]" });
        }
    };
    return (React.createElement("div", { className: "relative", ref: dropdownRef },
        React.createElement("button", { onClick: () => setIsOpen(!isOpen), "aria-label": "Xem thông báo", title: "Thông báo", className: "pet-notification-trigger relative p-2 rounded-xl text-[#81451F] hover:bg-[#FDE8D7] transition-all cursor-pointer" },
            React.createElement(Bell, { className: "w-5 h-5" }),
            unreadCount > 0 && (React.createElement("span", { className: "absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-[#EC802B] rounded-full px-1 border-2 border-white" }, unreadCount))),
        isOpen && (React.createElement("div", { className: "absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E8CCAD] z-50 overflow-hidden animate-in fade-in duration-150" },
            React.createElement("div", { className: "px-4 py-3 bg-[#FAF6F0] border-b border-[#E8CCAD] flex items-center justify-between" },
                React.createElement("h4", { className: "font-bold text-sm text-[#81451F] flex items-center gap-2" },
                    React.createElement(Bell, { className: "w-4 h-4 text-[#EC802B]" }),
                    " Thông báo (",
                    unreadCount,
                    " mới)"),
                unreadCount > 0 && (React.createElement("button", { onClick: handleMarkAll, className: "text-xs text-[#EC802B] hover:text-[#D46917] font-semibold flex items-center gap-1 cursor-pointer" },
                    React.createElement(CheckCheck, { className: "w-3.5 h-3.5" }),
                    " Đã đọc tất cả"))),
            React.createElement("div", { className: "max-h-80 overflow-y-auto divide-y divide-[#FAF6F0]" }, notifications.length === 0 ? (React.createElement("div", { className: "p-6 text-center text-xs text-neutral-400" }, "Chưa có thông báo nào.")) : (notifications.map((n) => (React.createElement("div", { key: n.id, onClick: () => handleMarkOne(n.id), className: `p-3.5 transition-colors cursor-pointer hover:bg-[#FAF6F0] ${!n.is_read ? 'bg-[#FCF5DC]/40' : ''}` },
                React.createElement("div", { className: "flex items-start gap-3" },
                    React.createElement("div", { className: "p-2 rounded-xl bg-white border border-[#E8CCAD] shrink-0 mt-0.5" }, getIcon(n.type)),
                    React.createElement("div", { className: "flex-1 min-w-0" },
                        React.createElement("div", { className: "flex items-center justify-between gap-1" },
                            React.createElement("h5", { className: "text-xs font-bold text-[#81451F] truncate" }, n.title),
                            !n.is_read && (React.createElement("span", { className: "w-2 h-2 rounded-full bg-[#EC802B] shrink-0" }))),
                        React.createElement("p", { className: "text-xs text-neutral-600 mt-1 line-clamp-2 leading-relaxed" }, n.content),
                        React.createElement("span", { className: "text-[10px] text-neutral-400 mt-1.5 block" }, new Date(n.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit'
                        })))))))))))));
};
