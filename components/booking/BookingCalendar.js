import React, { useEffect, useState } from '../../js/react.js';
import { ArrowLeft, ArrowRight } from '../../js/icons.js';
import { buildMonthGrid, getBookingMarkersByDate, toDateKey } from '../../services/bookingEngine.js';

/**
 * Month calendar shown next to the date picker of the booking wizard.
 *   ring  = the customer has an appointment that the admin has not confirmed yet
 *   dot   = the customer has an appointment that the admin has confirmed
 * Days before `minDate` cannot be chosen (same rule as the date input).
 */
const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const monthOf = (dateKey) => {
    const [year, month] = dateKey.split('-').map(Number);
    return { year, monthIndex: month - 1 };
};

export const BookingCalendar = ({ selectedDate, minDate, bookings, userId, onSelectDate }) => {
    const [view, setView] = useState(() => monthOf(selectedDate));
    // Follow the date input when it moves to another month.
    useEffect(() => {
        if (selectedDate)
            setView(monthOf(selectedDate));
    }, [selectedDate]);
    const markers = getBookingMarkersByDate(bookings, userId);
    const weeks = buildMonthGrid(view.year, view.monthIndex);
    const todayKey = toDateKey(new Date());
    const shiftMonth = (offset) => {
        const next = new Date(view.year, view.monthIndex + offset, 1);
        setView({ year: next.getFullYear(), monthIndex: next.getMonth() });
    };
    return (React.createElement("div", { className: "pet-booking-calendar", "aria-label": "Lịch hẹn của bạn" },
        React.createElement("div", { className: "pet-booking-calendar-header" },
            React.createElement("button", { type: "button", onClick: () => shiftMonth(-1), "aria-label": "Tháng trước" },
                React.createElement(ArrowLeft, { size: 14 })),
            React.createElement("strong", null,
                "Tháng ",
                view.monthIndex + 1,
                "/",
                view.year),
            React.createElement("button", { type: "button", onClick: () => shiftMonth(1), "aria-label": "Tháng sau" },
                React.createElement(ArrowRight, { size: 14 }))),
        React.createElement("div", { className: "pet-booking-calendar-grid", role: "grid" },
            WEEKDAY_LABELS.map((label) => (React.createElement("span", { key: label, className: "pet-booking-calendar-weekday" }, label))),
            weeks.flat().map((dateKey, index) => {
                if (!dateKey)
                    return React.createElement("span", { key: `empty-${index}`, className: "pet-booking-calendar-empty" });
                const marker = markers[dateKey];
                const isPast = dateKey < minDate;
                const classes = [
                    'pet-booking-calendar-day',
                    dateKey === selectedDate ? 'is-selected' : '',
                    dateKey === todayKey ? 'is-today' : ''
                ].filter(Boolean).join(' ');
                const description = [
                    marker?.pending ? 'có lịch chờ xác nhận' : '',
                    marker?.confirmed ? 'có lịch đã xác nhận' : ''
                ].filter(Boolean).join(', ');
                return (React.createElement("button", { key: dateKey, type: "button", disabled: isPast, className: classes, onClick: () => onSelectDate(dateKey), "aria-pressed": dateKey === selectedDate, "aria-label": `Ngày ${Number(dateKey.slice(8))} tháng ${Number(dateKey.slice(5, 7))}${description ? `, ${description}` : ''}`, title: description || undefined },
                    React.createElement("span", { className: "pet-booking-calendar-number" }, Number(dateKey.slice(8))),
                    React.createElement("span", { className: "pet-booking-calendar-marks", "aria-hidden": "true" },
                        marker?.pending && React.createElement("i", { className: "pet-calendar-mark pet-calendar-mark-pending" }),
                        marker?.confirmed && React.createElement("i", { className: "pet-calendar-mark pet-calendar-mark-confirmed" }))));
            })),
        React.createElement("div", { className: "pet-booking-calendar-legend" },
            React.createElement("span", null,
                React.createElement("i", { className: "pet-calendar-mark pet-calendar-mark-pending", "aria-hidden": "true" }),
                " Chờ admin xác nhận"),
            React.createElement("span", null,
                React.createElement("i", { className: "pet-calendar-mark pet-calendar-mark-confirmed", "aria-hidden": "true" }),
                " Đã xác nhận"))));
};
