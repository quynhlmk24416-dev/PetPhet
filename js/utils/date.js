/** Format ISO dates consistently as dd/mm/yyyy without UTC day shifts. */
export function formatDateDMY(value) {
    if (!value)
        return '—';
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime()))
            return '—';
        return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(value);
    }
    const raw = value.trim();
    const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDate)
        return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime()))
        return '—';
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}
/** Format a timestamp as dd/mm/yyyy HH:mm in the user's local time zone. */
export function formatDateTimeDMY(value) {
    if (!value)
        return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime()))
        return '—';
    const datePart = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    const timePart = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
    return `${datePart} ${timePart}`;
}
