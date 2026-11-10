/** Dispatch a branded Pet Phết toast to the global application viewport. */
export function notifyToast(type, message) {
    if (typeof window === 'undefined' || !message.trim())
        return;
    const detail = {
        id: `pet-toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        message: message.trim()
    };
    window.dispatchEvent(new CustomEvent('petphet:toast', { detail }));
}
