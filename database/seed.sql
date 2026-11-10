-- =========================================================================
-- PET PHẾT – PET FIRST SEED DATA
-- =========================================================================

-- 1. SEED USERS (1 Admin, 1 Demo Customer)
INSERT INTO users (user_id, email, full_name, phone, role)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'admin@petphet.vn', 'Quản trị viên Pet Phết', '0909123456', 'admin'),
  ('c0000000-0000-0000-0000-000000000001', 'khachhang@petphet.vn', 'Nguyễn Thị Minh Anh', '0987654321', 'customer')
ON CONFLICT (email) DO NOTHING;

-- 2. SEED CATEGORIES
INSERT INTO service_categories (category_id, category_name, description, icon)
VALUES
  ('c1111111-0000-0000-0000-000000000001', 'Spa & Grooming', 'Dịch vụ tắm thảo mộc, vệ sinh tai móng, cắt tỉa lông tạo kiểu chuyên nghiệp', 'scissors'),
  ('c1111111-0000-0000-0000-000000000002', 'Khám Thú Y & Y Tế', 'Khám tổng quát, tiêm phòng vaccine định kỳ, xét nghiệm và điều trị', 'stethoscope'),
  ('c1111111-0000-0000-0000-000000000003', 'Khách Sạn & Trông Giữ', 'Phòng nghỉ máy lạnh tiêu chuẩn, camera theo dõi 24/7, chế độ dinh dưỡng cao cấp', 'home'),
  ('c1111111-0000-0000-0000-000000000004', 'Chăm Sóc Răng Miệng', 'Cạo vôi răng siêu âm không gây mê, đánh bóng răng và xịt thơm miệng', 'sparkles')
ON CONFLICT DO NOTHING;

-- 3. SEED SERVICES
INSERT INTO services (service_id, category_id, service_name, description, base_price, is_weight_based, duration_minutes, species_supported, image_url, is_active, rating_avg, rating_count)
VALUES
  (
    's2222222-0000-0000-0000-000000000001',
    'c1111111-0000-0000-0000-000000000001',
    'Combo Tắm Spa & Vệ Sinh Toàn Diện',
    'Bao gồm 7 bước: Chải lông rụng, tắm nước ấm massage dầu dưỡng thảo mộc, vắt tuyến hôi, sấy phồng, vệ sinh tai mắt, cắt mài móng, xịt serum dưỡng lông.',
    220000,
    TRUE,
    60,
    ARRAY['Chó', 'Mèo'],
    'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80',
    TRUE,
    4.9,
    18
  ),
  (
    's2222222-0000-0000-0000-000000000002',
    'c1111111-0000-0000-0000-000000000001',
    'Grooming Cắt Tỉa Tạo Kiểu Nghệ Thuật',
    'Cắt tỉa lông chuyên nghiệp theo dáng chuẩn quốc tế (kiểu Teddy Bear, Boo, Búp bê). Bao gồm toàn bộ quy trình tắm spa vệ sinh.',
    350000,
    TRUE,
    90,
    ARRAY['Chó', 'Mèo'],
    './assets/services/grooming.png',
    TRUE,
    5.0,
    24
  ),
  (
    's2222222-0000-0000-0000-000000000003',
    'c1111111-0000-0000-0000-000000000002',
    'Khám Thú Y Tổng Quát & Tư Vấn Sức Khỏe',
    'Bác sĩ thú y trực tiếp thăm khám tim phổi, mắt mũi, da lông, kiểm tra chỉ số sinh hiệu và tư vấn chế độ dinh dưỡng (chưa bao gồm xét nghiệm chuyên sâu phát sinh).',
    150000,
    FALSE,
    45,
    ARRAY['Chó', 'Mèo', 'Khác'],
    './assets/services/vet-consult.jpg',
    TRUE,
    4.8,
    12
  ),
  (
    's2222222-0000-0000-0000-000000000004',
    'c1111111-0000-0000-0000-000000000002',
    'Tiêm Phòng Vaccine Định Kỳ (Mũi Đơn / Đa Giá)',
    'Tiêm vaccine phòng bệnh nhập khẩu chính hãng (Rabies, 5 trong 1, 7 trong 1), cấp sổ theo dõi tiêm phòng có mộc phòng khám.',
    280000,
    FALSE,
    30,
    ARRAY['Chó', 'Mèo'],
    './assets/services/vaccination.jpg',
    TRUE,
    4.9,
    15
  ),
  (
    's2222222-0000-0000-0000-000000000005',
    'c1111111-0000-0000-0000-000000000004',
    'Vệ Sinh Răng Miệng & Cạo Vôi Siêu Âm',
    'Làm sạch mảng bám men răng công nghệ sóng siêu âm nhẹ nhàng không đau rát, xịt thơm miệng diệt khuẩn 99%.',
    250000,
    FALSE,
    45,
    ARRAY['Chó', 'Mèo'],
    './assets/services/dental-care.jpg',
    TRUE,
    4.7,
    9
  )
ON CONFLICT DO NOTHING;

-- 4. SEED SERVICE PRICING TIERS (FOR WEIGHT-BASED SPA SERVICES)
INSERT INTO service_pricing (pricing_id, service_id, min_weight, max_weight, price)
VALUES
  -- Combo Tắm Spa
  ('p3333333-0000-0000-0000-000000000001', 's2222222-0000-0000-0000-000000000001', 0, 5, 220000),
  ('p3333333-0000-0000-0000-000000000002', 's2222222-0000-0000-0000-000000000001', 5, 10, 280000),
  ('p3333333-0000-0000-0000-000000000003', 's2222222-0000-0000-0000-000000000001', 10, 20, 380000),
  ('p3333333-0000-0000-0000-000000000004', 's2222222-0000-0000-0000-000000000001', 20, 50, 520000),
  -- Grooming Cắt Tỉa
  ('p3333333-0000-0000-0000-000000000005', 's2222222-0000-0000-0000-000000000002', 0, 5, 350000),
  ('p3333333-0000-0000-0000-000000000006', 's2222222-0000-0000-0000-000000000002', 5, 10, 450000),
  ('p3333333-0000-0000-0000-000000000007', 's2222222-0000-0000-0000-000000000002', 10, 20, 580000),
  ('p3333333-0000-0000-0000-000000000008', 's2222222-0000-0000-0000-000000000002', 20, 50, 750000)
ON CONFLICT DO NOTHING;

-- 5. SEED DEMO PETS FOR CUSTOMER
INSERT INTO pets (pet_id, user_id, pet_name, species, breed, gender, birth_date, weight, notes, is_active)
VALUES
  (
    'p4444444-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Bánh Mì',
    'Chó',
    'Poodle Teacup',
    'Đực',
    '2024-03-15',
    3.8,
    'Bé hơi sợ nước khi mới tắm, thích được vuốt cằm và khen ngoan.',
    TRUE
  ),
  (
    'p4444444-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'Mây Mây',
    'Mèo',
    'British Shorthair (Mèo Anh lông ngắn)',
    'Cái',
    '2023-08-20',
    4.5,
    'Lông dày, rụng lông mùa thay lông, rất ngoan khi cắt móng.',
    TRUE
  )
ON CONFLICT DO NOTHING;

-- 6. SEED COUPONS
INSERT INTO coupons (coupon_id, code, discount_type, discount_value, min_order_value, max_discount_amount, is_active, expires_at, usage_limit, used_count, description)
VALUES
  ('cp111111-0000-0000-0000-000000000001', 'PETFIRST50K', 'fixed', 50000, 200000, NULL, TRUE, '2028-12-31 23:59:59+07', 200, 14, 'Giảm trực tiếp 50.000đ cho đơn từ 200.000đ'),
  ('cp111111-0000-0000-0000-000000000002', 'BANMOI15', 'percent', 15, 150000, 60000, TRUE, '2028-12-31 23:59:59+07', 500, 38, 'Giảm 15% (tối đa 60.000đ) chào mừng bạn mới'),
  ('cp111111-0000-0000-0000-000000000003', 'SPASINHNHAT', 'percent', 20, 300000, 100000, TRUE, '2028-12-31 23:59:59+07', 100, 8, 'Giảm 20% tối đa 100k tháng sinh nhật thú cưng')
ON CONFLICT DO NOTHING;
