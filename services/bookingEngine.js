/**
 * Converts "HH:mm" to minutes from start of day.
 */
export function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
}
/**
 * Converts minutes from start of day back to "HH:mm".
 */
export function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
/**
 * Calculates end time string "HH:mm" from a start time and duration in minutes.
 */
export function calculateEndTime(startTime, durationMinutes) {
    const startMin = timeToMinutes(startTime);
    return minutesToTime(startMin + durationMinutes);
}
/**
 * Checks if two time intervals [startA, endA) and [startB, endB) overlap.
 */
export function isOverlapping(startA, endA, startB, endB) {
    const sA = timeToMinutes(startA);
    const eA = timeToMinutes(endA);
    const sB = timeToMinutes(startB);
    const eB = timeToMinutes(endB);
    return Math.max(sA, sB) < Math.min(eA, eB);
}
/**
 * Checks capacity throughout the ENTIRE duration of a proposed booking.
 * Returns true if at all 15-minute slices during [startTime, endTime) concurrent active bookings < maxCapacity.
 */
export function checkContinuousCapacity(date, startTime, durationMinutes, existingBookings, maxCapacity, excludeBookingId) {
    const startMin = timeToMinutes(startTime);
    const endMin = startMin + durationMinutes;
    // Filter existing active bookings for that date
    const activeBookings = existingBookings.filter((b) => b.booking_date === date &&
        b.id !== excludeBookingId &&
        ['pending', 'confirmed', 'in_progress'].includes(b.status));
    let maxConcurrent = 0;
    // Check every 15-minute slice within the proposed duration
    for (let t = startMin; t < endMin; t += 15) {
        let concurrentAtSlice = 0;
        for (const b of activeBookings) {
            const bStart = timeToMinutes(b.booking_time);
            const bEnd = timeToMinutes(b.end_time || calculateEndTime(b.booking_time, b.duration_minutes));
            if (t >= bStart && t < bEnd) {
                concurrentAtSlice++;
            }
        }
        if (concurrentAtSlice > maxConcurrent) {
            maxConcurrent = concurrentAtSlice;
        }
        if (concurrentAtSlice >= maxCapacity) {
            return {
                isAvailable: false,
                maxConcurrentFound: concurrentAtSlice,
                reason: `Khung giờ ${minutesToTime(t)} - ${minutesToTime(t + 15)} đã đạt sức chứa tối đa (${concurrentAtSlice}/${maxCapacity} chỗ). Vui lòng chọn khung giờ khác.`
            };
        }
    }
    return {
        isAvailable: true,
        maxConcurrentFound: maxConcurrent
    };
}
/**
 * Calculates price based on pet weight for weight-dependent services.
 */
export function calculateServicePrice(service, petWeightKg) {
    if (!service.is_weight_based || !service.pricing_tiers || service.pricing_tiers.length === 0) {
        return service.base_price;
    }
    // Find matching tier
    const matchedTier = service.pricing_tiers.find((tier) => petWeightKg >= tier.min_weight && petWeightKg < tier.max_weight);
    if (matchedTier) {
        return matchedTier.price;
    }
    // Fallback to highest tier if over max, or base price
    const highestTier = [...service.pricing_tiers].sort((a, b) => b.max_weight - a.max_weight)[0];
    if (highestTier && petWeightKg >= highestTier.max_weight) {
        return highestTier.price;
    }
    return service.base_price;
}
/**
 * Applies a coupon code and calculates discount + final amount.
 */
export function applyCouponDiscount(originalPrice, coupon) {
    if (!coupon) {
        return {
            discountAmount: 0,
            finalTotal: originalPrice,
            isValid: true,
            message: ''
        };
    }
    if (!coupon.is_active) {
        return {
            discountAmount: 0,
            finalTotal: originalPrice,
            isValid: false,
            message: 'Mã giảm giá đã tạm khóa hoặc hết hiệu lực.'
        };
    }
    const now = new Date().toISOString();
    if (coupon.expires_at && coupon.expires_at < now) {
        return {
            discountAmount: 0,
            finalTotal: originalPrice,
            isValid: false,
            message: 'Mã giảm giá đã hết hạn sử dụng.'
        };
    }
    if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
        return {
            discountAmount: 0,
            finalTotal: originalPrice,
            isValid: false,
            message: 'Mã giảm giá đã đạt giới hạn số lượt sử dụng.'
        };
    }
    if (originalPrice < coupon.min_order_value) {
        return {
            discountAmount: 0,
            finalTotal: originalPrice,
            isValid: false,
            message: `Đơn dịch vụ tối thiểu ${coupon.min_order_value.toLocaleString('vi-VN')}đ để sử dụng mã này.`
        };
    }
    let discount = 0;
    if (coupon.discount_type === 'percent') {
        discount = Math.round((originalPrice * coupon.discount_value) / 100);
        if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
            discount = coupon.max_discount_amount;
        }
    }
    else {
        discount = coupon.discount_value;
    }
    // Total can never be negative
    const finalTotal = Math.max(0, originalPrice - discount);
    return {
        discountAmount: Math.min(discount, originalPrice),
        finalTotal,
        isValid: true,
        message: `Áp dụng thành công mã ${coupon.code}!`
    };
}
/**
 * Pet point calculation rule:
 * Customer receives exactly 1,000 Pet Points for each valid, completed review.
 */
export const PET_POINT_REVIEW_REWARD = 1000;
export function canAwardReviewPoints(booking, hasExistingReview) {
    return booking.status === 'completed' && !hasExistingReview && !booking.is_reviewed;
}
/**
 * Format currency helper in VND
 */
export function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}
/**
 * Rescheduling rule: a customer may change the date/time only within 1 day (24 hours)
 * counted from the moment the order was placed (booking.created_at).
 */
export const RESCHEDULE_WINDOW_HOURS = 24;
export function getRescheduleDeadline(createdAt) {
    return new Date(new Date(createdAt).getTime() + RESCHEDULE_WINDOW_HOURS * 60 * 60 * 1000);
}
export function isWithinRescheduleWindow(createdAt, now = new Date()) {
    const created = new Date(createdAt).getTime();
    if (Number.isNaN(created))
        return false;
    return now.getTime() <= getRescheduleDeadline(createdAt).getTime();
}
/**
 * Booking calendar helpers (month view shown next to the date picker).
 * "pending"   -> the customer booked, the admin has not confirmed yet   (drawn as a ring)
 * "confirmed" -> the admin confirmed the appointment                    (drawn as a solid dot)
 */
const PENDING_STATUSES = ['pending'];
const CONFIRMED_STATUSES = ['confirmed', 'in_progress', 'completed'];
export function toDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
/** Maps date key -> { pending: boolean, confirmed: boolean } for one customer's bookings. */
export function getBookingMarkersByDate(bookings, userId) {
    const markers = {};
    for (const booking of bookings) {
        if (booking.user_id !== userId)
            continue;
        const isPending = PENDING_STATUSES.includes(booking.status);
        const isConfirmed = CONFIRMED_STATUSES.includes(booking.status);
        if (!isPending && !isConfirmed)
            continue; // cancelled / no-show days stay empty
        markers[booking.booking_date] ??= { pending: false, confirmed: false };
        if (isPending)
            markers[booking.booking_date].pending = true;
        if (isConfirmed)
            markers[booking.booking_date].confirmed = true;
    }
    return markers;
}
/** Weeks (Monday first) for a month. Cells outside the month are null. */
export function buildMonthGrid(year, monthIndex) {
    const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstWeekday; i += 1)
        cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push(toDateKey(new Date(year, monthIndex, day)));
    }
    while (cells.length % 7 !== 0)
        cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7)
        weeks.push(cells.slice(i, i + 7));
    return weeks;
}
