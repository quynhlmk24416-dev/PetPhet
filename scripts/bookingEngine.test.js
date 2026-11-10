import test from 'node:test';
import assert from 'node:assert/strict';
import { timeToMinutes, minutesToTime, calculateEndTime, isOverlapping, checkContinuousCapacity, calculateServicePrice, applyCouponDiscount, canAwardReviewPoints, PET_POINT_REVIEW_REWARD } from '../services/bookingEngine.js';
test('time utilities convert correctly', () => {
    assert.equal(timeToMinutes('09:00'), 540);
    assert.equal(timeToMinutes('10:30'), 630);
    assert.equal(minutesToTime(540), '09:00');
    assert.equal(minutesToTime(630), '10:30');
    assert.equal(calculateEndTime('09:00', 90), '10:30');
});
test('overlap checking works across intervals', () => {
    // 09:00 - 10:30 overlaps with 09:30 - 10:00
    assert.equal(isOverlapping('09:00', '10:30', '09:30', '10:00'), true);
    // 09:00 - 10:00 does not overlap with 10:00 - 11:00
    assert.equal(isOverlapping('09:00', '10:00', '10:00', '11:00'), false);
    // 09:00 - 10:00 does not overlap with 08:00 - 09:00
    assert.equal(isOverlapping('09:00', '10:00', '08:00', '09:00'), false);
});
test('continuous duration capacity check across entire service span', () => {
    const existingBookings = [
        {
            id: 'B1',
            user_id: 'u1',
            user_name: 'Nguyen Van A',
            user_phone: '0901234567',
            user_email: 'a@example.com',
            pet_id: 'p1',
            pet_name: 'Milu',
            pet_species: 'Chó',
            pet_weight: 4,
            service_id: 's1',
            service_name: 'Tắm spa',
            booking_date: '2026-11-01',
            booking_time: '09:00',
            duration_minutes: 60,
            end_time: '10:00',
            original_price: 200000,
            discount_amount: 0,
            total_amount: 200000,
            payment_method: 'COD',
            payment_status: 'unpaid',
            status: 'confirmed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'B2',
            user_id: 'u2',
            user_name: 'Le Thi B',
            user_phone: '0901234568',
            user_email: 'b@example.com',
            pet_id: 'p2',
            pet_name: 'Miu',
            pet_species: 'Mèo',
            pet_weight: 3,
            service_id: 's1',
            service_name: 'Tắm spa',
            booking_date: '2026-11-01',
            booking_time: '09:30',
            duration_minutes: 60,
            end_time: '10:30',
            original_price: 200000,
            discount_amount: 0,
            total_amount: 200000,
            payment_method: 'COD',
            payment_status: 'unpaid',
            status: 'confirmed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];
    // Capacity is 2. At 09:30 - 10:00 both B1 and B2 are present (capacity 2/2).
    // Requesting a new booking from 09:15 to 10:15 should FAIL because at 09:30 it would be 3 concurrent.
    const checkFail = checkContinuousCapacity('2026-11-01', '09:15', 60, existingBookings, 2);
    assert.equal(checkFail.isAvailable, false);
    // Requesting at 10:30 for 60 mins should SUCCEED
    const checkSuccess = checkContinuousCapacity('2026-11-01', '10:30', 60, existingBookings, 2);
    assert.equal(checkSuccess.isAvailable, true);
});
test('calculateServicePrice handles flat and weight-based tiers', () => {
    const spaService = {
        id: 's-spa',
        category_id: 'cat-spa',
        service_name: 'Grooming Cắt Tỉa Toàn Diện',
        description: 'Cắt tỉa tạo kiểu',
        base_price: 250000,
        is_weight_based: true,
        pricing_tiers: [
            { id: 't1', service_id: 's-spa', min_weight: 0, max_weight: 5, price: 250000 },
            { id: 't2', service_id: 's-spa', min_weight: 5, max_weight: 10, price: 350000 },
            { id: 't3', service_id: 's-spa', min_weight: 10, max_weight: 20, price: 480000 },
            { id: 't4', service_id: 's-spa', min_weight: 20, max_weight: 50, price: 650000 }
        ],
        duration_minutes: 90,
        species_supported: ['Chó', 'Mèo'],
        image_url: '',
        is_active: true,
        rating_avg: 5,
        rating_count: 10,
        created_at: ''
    };
    // Under 5kg
    assert.equal(calculateServicePrice(spaService, 3.5), 250000);
    // 5kg - 10kg
    assert.equal(calculateServicePrice(spaService, 8.2), 350000);
    // 10kg - 20kg
    assert.equal(calculateServicePrice(spaService, 15), 480000);
    // Over 20kg
    assert.equal(calculateServicePrice(spaService, 25), 650000);
});
test('applyCouponDiscount handles percent, fixed, min order and limits', () => {
    const couponPercent = {
        id: 'c1',
        code: 'PETFIRST20',
        discount_type: 'percent',
        discount_value: 20,
        min_order_value: 200000,
        max_discount_amount: 50000,
        is_active: true,
        expires_at: '2029-12-31T23:59:59Z',
        usage_limit: 100,
        used_count: 5,
        description: 'Giảm 20% tối đa 50k'
    };
    // Order below min value: fails
    const res1 = applyCouponDiscount(150000, couponPercent);
    assert.equal(res1.isValid, false);
    assert.equal(res1.finalTotal, 150000);
    // Order 300,000 -> 20% is 60,000, capped at 50,000 max -> final 250,000
    const res2 = applyCouponDiscount(300000, couponPercent);
    assert.equal(res2.isValid, true);
    assert.equal(res2.discountAmount, 50000);
    assert.equal(res2.finalTotal, 250000);
    // Coupon without coupon returns clean base
    const res3 = applyCouponDiscount(200000, null);
    assert.equal(res3.isValid, true);
    assert.equal(res3.finalTotal, 200000);
});
test('pet point rules: 1000 points on completed review, no duplicates', () => {
    assert.equal(PET_POINT_REVIEW_REWARD, 1000);
    const completedBooking = {
        id: 'B-done',
        user_id: 'u1',
        user_name: 'Customer',
        user_phone: '0900000000',
        user_email: 'c@example.com',
        pet_id: 'p1',
        pet_name: 'Bông',
        pet_species: 'Mèo',
        pet_weight: 4,
        service_id: 's1',
        service_name: 'Tắm',
        booking_date: '2026-10-25',
        booking_time: '10:00',
        duration_minutes: 60,
        end_time: '11:00',
        original_price: 200000,
        discount_amount: 0,
        total_amount: 200000,
        payment_method: 'COD',
        payment_status: 'paid',
        status: 'completed',
        is_reviewed: false,
        created_at: '',
        updated_at: ''
    };
    // Eligible when completed and not yet reviewed
    assert.equal(canAwardReviewPoints(completedBooking, false), true);
    // Ineligible if already reviewed
    assert.equal(canAwardReviewPoints(completedBooking, true), false);
    // Ineligible if pending
    assert.equal(canAwardReviewPoints({ ...completedBooking, status: 'pending' }, false), false);
});
