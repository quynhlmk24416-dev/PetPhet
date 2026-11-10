-- =========================================================================
-- PET PHẾT – PET FIRST DATABASE SCHEMA (PostgreSQL / Supabase)
-- Hệ thống Quản lý và Đặt lịch Dịch vụ Chăm sóc Thú cưng
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS / PROFILES
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PETS
CREATE TABLE IF NOT EXISTS pets (
    pet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    pet_name VARCHAR(100) NOT NULL,
    species VARCHAR(20) NOT NULL CHECK (species IN ('Chó', 'Mèo', 'Khác')),
    breed VARCHAR(100),
    gender VARCHAR(20) DEFAULT 'Chưa xác định' CHECK (gender IN ('Đực', 'Cái', 'Chưa xác định')),
    birth_date DATE,
    weight NUMERIC(5,2) CHECK (weight > 0),
    weight_updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    health_status TEXT,
    vaccination_history TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SERVICE CATEGORIES
CREATE TABLE IF NOT EXISTS service_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'scissors',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SERVICES
CREATE TABLE IF NOT EXISTS services (
    service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES service_categories(category_id) ON DELETE RESTRICT,
    service_name VARCHAR(150) NOT NULL,
    description TEXT,
    base_price NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
    is_weight_based BOOLEAN DEFAULT FALSE,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    species_supported TEXT[] DEFAULT ARRAY['Chó', 'Mèo'],
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    rating_avg NUMERIC(3,2) DEFAULT 5.0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SERVICE PRICING (Weight Brackets for Spa / Grooming)
CREATE TABLE IF NOT EXISTS service_pricing (
    pricing_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
    min_weight NUMERIC(5,2) NOT NULL CHECK (min_weight >= 0),
    max_weight NUMERIC(5,2) NOT NULL CHECK (max_weight > min_weight),
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_service_weight_range UNIQUE (service_id, min_weight, max_weight)
);

-- 6. WORKING SCHEDULES & CAPACITY
CREATE TABLE IF NOT EXISTS working_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_date DATE NOT NULL UNIQUE,
    start_time TIME NOT NULL DEFAULT '08:00',
    end_time TIME NOT NULL DEFAULT '20:00',
    is_available BOOLEAN DEFAULT TRUE,
    max_concurrent_capacity INTEGER NOT NULL DEFAULT 4 CHECK (max_concurrent_capacity > 0),
    slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    booking_id VARCHAR(30) PRIMARY KEY, -- e.g. 'BK-202610-001'
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    pet_id UUID NOT NULL REFERENCES pets(pet_id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES services(service_id) ON DELETE RESTRICT,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    end_time TIME NOT NULL,
    original_price NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    pet_weight_snapshot NUMERIC(5,2),
    coupon_code VARCHAR(50),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('COD', 'QR')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending_reconcile', 'paid', 'failed', 'refunded')),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    customer_note TEXT,
    admin_note TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    hold_expires_at TIMESTAMPTZ,
    is_reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id VARCHAR(30) NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(30) NOT NULL,
    transaction_reference VARCHAR(100) NOT NULL,
    account_number VARCHAR(50),
    bank_name VARCHAR(100),
    account_holder VARCHAR(150),
    transfer_content VARCHAR(255),
    verified_by UUID REFERENCES users(user_id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id VARCHAR(30) UNIQUE NOT NULL REFERENCES bookings(booking_id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    image_url TEXT,
    admin_reply TEXT,
    admin_replied_at TIMESTAMPTZ,
    points_awarded INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. COUPONS
CREATE TABLE IF NOT EXISTS coupons (
    coupon_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
    min_order_value NUMERIC(12,2) DEFAULT 0,
    max_discount_amount NUMERIC(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    usage_limit INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PET POINT TRANSACTIONS (Loyalty)
CREATE TABLE IF NOT EXISTS pet_point_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    target_role VARCHAR(20) DEFAULT 'customer',
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_point_tx_user_id ON pet_point_transactions(user_id);
