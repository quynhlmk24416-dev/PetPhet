import test from 'node:test';
import assert from 'node:assert/strict';
import './test-setup.js';
import { calculateServicePrice } from '../services/bookingEngine.js';
const localStorageData = new Map();
Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
        getItem: (key) => localStorageData.get(key) ?? null,
        setItem: (key, value) => localStorageData.set(key, String(value)),
        removeItem: (key) => localStorageData.delete(key)
    }
});
const { store } = await import('../services/store.js');
function localDatePlus(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
test('Seven service photos use new local assets while the bath combo keeps its existing image', () => {
    const services = store.getServices(true);
    const updatedImages = {
        'srv-spa-02': 'grooming.png',
        'srv-vet-01': 'vet-consult.jpg',
        'srv-vet-02': 'vaccination.jpg',
        'srv-dental-01': 'dental-care.jpg',
        'srv-spa-03': 'ear-exam.jpg',
        'srv-vet-03': 'ultrasound.jpg',
        'srv-spa-04': 'nail-trim.jpg'
    };
    for (const [serviceId, imageName] of Object.entries(updatedImages)) {
        const service = services.find((item) => item.id === serviceId);
        assert.ok(service);
        assert.ok(service.image_url.endsWith(`/images/services/${imageName}`));
    }
    assert.equal(services.find((item) => item.id === 'srv-spa-01')?.image_url, 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80');
});
test('Landing page has three demo reviews from separate customer accounts', () => {
    const reviews = store.getFeaturedReviews();
    assert.equal(reviews.length, 3);
    assert.equal(new Set(reviews.map((review) => review.user_id)).size, 3);
    assert.ok(store.getUserByIdentity('khachhang@petphet.vn'));
    assert.ok(store.getUserByIdentity('thanhha@petphet.vn'));
    assert.ok(store.getUserByIdentity('minhquan@petphet.vn'));
});
test('Demo account, appointment and review records stay linked and service ratings use all reviews', () => {
    const reviews = store.getReviews();
    const services = store.getServices(false);
    const bookings = store.getBookings();
    assert.equal(reviews.length, 132);
    assert.equal(bookings.length, 157);
    assert.ok(bookings.length > reviews.length);
    assert.equal(new Set(reviews.map((review) => review.id)).size, reviews.length);
    assert.equal(new Set(reviews.map((review) => review.booking_id)).size, reviews.length);
    assert.equal(new Set(reviews.map((review) => review.user_id)).size, reviews.length);
    assert.equal(new Set(reviews.map((review) => review.user_name)).size, reviews.length);
    assert.equal(new Set(reviews.map((review) => review.pet_name)).size, reviews.length);
    const ratingAverages = new Set();
    const ratingCounts = new Set();
    for (const review of reviews) {
        const booking = store.getBookingById(review.booking_id);
        assert.ok(booking, `Missing booking ${review.booking_id}`);
        assert.equal(booking.user_id, review.user_id);
        assert.equal(booking.user_name, review.user_name);
        assert.equal(booking.service_id, review.service_id);
        assert.equal(booking.pet_name, review.pet_name);
        assert.equal(booking.total_amount, booking.original_price - booking.discount_amount);
        assert.equal(booking.status, 'completed');
        assert.equal(booking.is_reviewed, true);
        assert.ok(store.getUserByIdentity(booking.user_email));
        assert.ok(review.rating >= 1 && review.rating <= 5);
        const service = store.getServiceById(review.service_id);
        assert.ok(service);
        assert.equal(booking.service_name, service.service_name);
        assert.equal(booking.duration_minutes, service.duration_minutes);
        assert.equal(booking.original_price, calculateServicePrice(service, booking.pet_weight));
        if (booking.payment_method === 'QR') {
            const payment = store.getPayments().find((item) => item.booking_id === booking.id);
            assert.ok(payment, `Missing QR payment ${booking.id}`);
            assert.equal(payment.amount, booking.total_amount);
            assert.equal(payment.payment_status, 'paid');
        }
    }
    for (const service of services) {
        const serviceReviews = reviews.filter((review) => review.service_id === service.id);
        const expectedAverage = Number((serviceReviews.reduce((sum, review) => sum + review.rating, 0) / serviceReviews.length).toFixed(1));
        assert.ok(serviceReviews.length >= 13);
        assert.equal(service.rating_count, serviceReviews.length);
        assert.equal(service.rating_avg, expectedAverage);
        assert.equal(new Set(serviceReviews.map((review) => review.rating)).size, 5);
        assert.equal(store.getLatestReviewsByService(service.id).length, 5);
        ratingAverages.add(service.rating_avg);
        ratingCounts.add(service.rating_count);
    }
    assert.equal(ratingAverages.size, services.length);
    assert.equal(ratingCounts.size, services.length);
    const unreviewedBookings = bookings.filter((booking) => !booking.is_reviewed);
    assert.ok(unreviewedBookings.length >= 24);
    for (const booking of unreviewedBookings) {
        assert.equal(reviews.some((review) => review.booking_id === booking.id), false);
    }
    const customer = store.getUserByIdentity('khachhang@petphet.vn');
    const anotherCustomerBooking = bookings.find((booking) => booking.user_id !== customer.id && booking.status === 'completed');
    assert.equal(store.createReview({
        bookingId: anotherCustomerBooking.id,
        userId: customer.id,
        rating: 5,
        comment: 'Không được phép đánh giá lịch hẹn của khách khác.'
    }).success, false);
    assert.equal(store.createReview({
        bookingId: 'BK-2610-002',
        userId: customer.id,
        rating: 5,
        comment: 'Chỉ được đánh giá sau khi hoàn thành.'
    }).success, false);
    const couponCodes = store.getCoupons().map((coupon) => coupon.code);
    assert.ok(couponCodes.includes('PETTHANKS10'));
    assert.ok(couponCodes.includes('QUAYLAI30K'));
    assert.ok(couponCodes.includes('DATLICH15'));
});
test('Customer cannot promote their own session to Admin', () => {
    const customer = store.getUserByIdentity('khachhang@petphet.vn');
    store.setCurrentUser(customer);
    assert.throws(() => store.switchRole('admin'), /Không thể tự chuyển vai trò/);
    assert.equal(store.getCurrentUser().role, 'customer');
});
test('StoreService booking, QR reconciliation, capacity, review reward and expiry flow', () => {
    const customer = store.getCurrentUser();
    assert.equal(customer.role, 'customer');
    const pet = store.getPetsByUser(customer.id)[0];
    assert.ok(pet);
    const initialPoints = store.getUserPetPoints(customer.id);
    // Pick a day without fixed demo appointments (demo-review-data.json) so the capacity assertions
    // below do not depend on today's date.
    let dayOffset = 5;
    while (store.getBookings().some((item) => item.booking_date === localDatePlus(dayOffset)))
        dayOffset += 1;
    const bookingDate = localDatePlus(dayOffset);
    store.setCurrentUser(store.getUserByIdentity('admin@petphet.vn'));
    store.updateSchedule(bookingDate, {
        start_time: '08:00', end_time: '20:00', is_available: true,
        max_concurrent_capacity: 1, slot_duration_minutes: 30
    });
    store.setCurrentUser(store.getUserByIdentity('khachhang@petphet.vn'));
    const bookingResult = store.createBooking({
        userId: customer.id, petId: pet.id, serviceId: 'srv-spa-01',
        bookingDate, bookingTime: '09:00', confirmedWeight: pet.weight,
        couponCode: 'PETFIRST50K', paymentMethod: 'QR'
    });
    assert.equal(bookingResult.success, true);
    assert.ok(bookingResult.booking && bookingResult.payment);
    const booking = bookingResult.booking;
    const payment = bookingResult.payment;
    assert.equal(store.submitQrTransfer(booking.id).success, true);
    assert.equal(store.cancelBooking(booking.id, customer.id, 'Thử hủy đơn QR').success, false);
    store.setCurrentUser(store.getUserByIdentity('admin@petphet.vn'));
    assert.equal(store.updateBookingStatus(booking.id, 'confirmed').success, false);
    assert.equal(store.updateBookingStatus(booking.id, 'cancelled').success, false);
    assert.equal(store.reconcilePayment(payment.id, true, store.getCurrentUser().id).success, true);
    assert.equal(store.getBookingById(booking.id)?.status, 'confirmed');
    store.setCurrentUser(store.getUserByIdentity('khachhang@petphet.vn'));
    const overlappingBooking = store.createBooking({
        userId: customer.id, petId: pet.id, serviceId: 'srv-spa-01',
        bookingDate, bookingTime: '09:00', confirmedWeight: pet.weight,
        paymentMethod: 'COD'
    });
    assert.equal(overlappingBooking.success, false);
    store.setCurrentUser(store.getUserByIdentity('admin@petphet.vn'));
    assert.equal(store.updateBookingStatus(booking.id, 'in_progress').success, true);
    assert.equal(store.updateBookingStatus(booking.id, 'completed').success, true);
    store.setCurrentUser(store.getUserByIdentity('khachhang@petphet.vn'));
    const codDate = localDatePlus(7);
    const codBooking = store.createBooking({
        userId: customer.id, petId: pet.id, serviceId: 'srv-vet-01',
        bookingDate: codDate, bookingTime: '11:00', paymentMethod: 'COD'
    });
    assert.equal(codBooking.success, true);
    store.setCurrentUser(store.getUserByIdentity('admin@petphet.vn'));
    assert.equal(store.updateBookingStatus(codBooking.booking.id, 'confirmed').success, true);
    assert.equal(store.updateBookingStatus(codBooking.booking.id, 'in_progress').success, true);
    assert.equal(store.updateBookingStatus(codBooking.booking.id, 'completed').success, true);
    assert.equal(store.getBookingById(codBooking.booking.id)?.payment_status, 'paid');
    assert.equal(store.getPayments().find((item) => item.booking_id === codBooking.booking.id)?.payment_status, 'paid');
    store.setCurrentUser(store.getUserByIdentity('khachhang@petphet.vn'));
    const reviewResult = store.createReview({
        bookingId: booking.id, userId: customer.id,
        rating: 5, comment: 'Dịch vụ tốt, bé được chăm sóc chu đáo.'
    });
    assert.equal(reviewResult.success, true);
    assert.equal(store.getUserPetPoints(customer.id), initialPoints + 1000);
    assert.equal(store.updateReview({
        reviewId: reviewResult.review.id, userId: customer.id,
        rating: 4, comment: 'Cập nhật đánh giá.'
    }).success, true);
    assert.equal(store.deleteReview(reviewResult.review.id, customer.id).success, true);
    assert.equal(store.getUserPetPoints(customer.id), initialPoints);
    const expiredBookingResult = store.createBooking({
        userId: customer.id, petId: pet.id, serviceId: 'srv-spa-01',
        bookingDate: localDatePlus(6), bookingTime: '10:00',
        confirmedWeight: pet.weight, paymentMethod: 'QR'
    });
    assert.equal(expiredBookingResult.success, true);
    expiredBookingResult.booking.hold_expires_at = new Date(Date.now() - 1000).toISOString();
    store.processExpiredQrBookings();
    assert.equal(store.getBookingById(expiredBookingResult.booking.id)?.status, 'cancelled');
    assert.equal(store.getBookingById(expiredBookingResult.booking.id)?.payment_status, 'failed');
});
