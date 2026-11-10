import { applyCouponDiscount, calculateEndTime, calculateServicePrice, checkContinuousCapacity, isWithinRescheduleWindow, PET_POINT_REVIEW_REWARD } from './bookingEngine.js';
/**
 * Loads a JSON file from the /data folder.
 * The URL is resolved relative to this module, so it works no matter which page or sub-folder serves the site.
 */
async function loadJson(fileName) {
    const response = await fetch(new URL(`../data/${fileName}`, import.meta.url));
    if (!response.ok)
        throw new Error(`Cannot load data/${fileName} (HTTP ${response.status})`);
    return (await response.json());
}
const rawDemoReviewData = await loadJson('demo-review-data.json');
const STORAGE_KEY = 'pet_phet_app_state_v1';
const CREDENTIALS_KEY = 'pet_phet_demo_credentials_v1';
const demoReviewData = rawDemoReviewData;
// Seed Initial Data
const SEED_USERS = [
    ...(await loadJson('seed-users.json')),
    ...demoReviewData.accounts.filter((user) => user.id !== 'usr-customer-01')
];
const SEED_CATEGORIES = await loadJson('seed-categories.json');
const SEED_SERVICES = await loadJson('seed-services.json');
const SEED_PETS = await loadJson('seed-pets.json');
const DEMO_PETS = demoReviewData.pets;
const SEED_COUPONS = await loadJson('seed-coupons.json');
const SEED_SCHEDULE = [
    // Generates 14 days schedule from today
    ...Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return {
            id: `sch-${dateStr}`,
            work_date: dateStr,
            start_time: '08:00',
            end_time: '20:00',
            is_available: true,
            max_concurrent_capacity: 4, // 4 slots concurrent maximum
            slot_duration_minutes: 30,
            notes: 'Giờ mở cửa chuẩn: 08:00 - 20:00. Năng lực phục vụ tối đa 4 bé cùng lúc.'
        };
    })
];
const SEED_BOOKINGS = [
    {
        id: 'BK-2610-001',
        user_id: 'usr-customer-01',
        user_name: 'Nguyễn Thị Minh Anh',
        user_phone: '0987654321',
        user_email: 'khachhang@petphet.vn',
        pet_id: 'pet-bm-01',
        pet_name: 'Bánh Mì',
        pet_species: 'Chó',
        pet_weight: 3.8,
        service_id: 'srv-spa-01',
        service_name: 'Combo Tắm Spa & Vệ Sinh',
        booking_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        booking_time: '09:00',
        duration_minutes: 60,
        end_time: '10:00',
        original_price: 220000,
        discount_amount: 50000,
        total_amount: 170000,
        coupon_code: 'PETFIRST50K',
        payment_method: 'QR',
        payment_status: 'paid',
        status: 'completed',
        customer_note: 'Bé ngoan, nhẹ nhàng với bé nha.',
        admin_note: 'Đã hoàn thành xuất sắc, bé rất hợp tác.',
        completed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        is_reviewed: true,
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
        id: 'BK-2610-002',
        user_id: 'usr-customer-01',
        user_name: 'Nguyễn Thị Minh Anh',
        user_phone: '0987654321',
        user_email: 'khachhang@petphet.vn',
        pet_id: 'pet-mm-02',
        pet_name: 'Mây Mây',
        pet_species: 'Mèo',
        pet_weight: 4.6,
        service_id: 'srv-spa-02',
        service_name: 'Grooming Cắt Tỉa Tạo Kiểu',
        booking_date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
        booking_time: '14:00',
        duration_minutes: 90,
        end_time: '15:30',
        original_price: 350000,
        discount_amount: 0,
        total_amount: 350000,
        payment_method: 'COD',
        payment_status: 'unpaid',
        status: 'pending',
        customer_note: 'Tỉa tròn mặt kiểu búp bê giúp mình nhé.',
        is_reviewed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];
const DEMO_BOOKINGS = demoReviewData.appointments.map((appointment) => {
    const user = [...SEED_USERS, ...demoReviewData.accounts].find((item) => item.id === appointment.user_id);
    const pet = [...SEED_PETS, ...DEMO_PETS].find((item) => item.id === appointment.pet_id);
    const service = SEED_SERVICES.find((item) => item.id === appointment.service_id);
    if (!user || !pet || !service) {
        throw new Error(`Demo appointment ${appointment.id} references a missing user, pet, or service.`);
    }
    const endTime = calculateEndTime(appointment.booking_time, appointment.duration_minutes);
    const completedAt = appointment.status === 'completed' || !appointment.status
        ? `${appointment.booking_date}T${endTime}:00.000Z`
        : undefined;
    return {
        id: appointment.id,
        user_id: user.id,
        user_name: user.full_name,
        user_phone: user.phone,
        user_email: user.email,
        pet_id: pet.id,
        pet_name: pet.pet_name,
        pet_species: pet.species,
        pet_weight: pet.weight,
        service_id: service.id,
        service_name: service.service_name,
        booking_date: appointment.booking_date,
        booking_time: appointment.booking_time,
        duration_minutes: appointment.duration_minutes,
        end_time: endTime,
        original_price: appointment.original_price,
        discount_amount: appointment.discount_amount,
        total_amount: appointment.original_price - appointment.discount_amount,
        payment_method: appointment.payment_method,
        payment_status: appointment.payment_status ?? 'paid',
        status: appointment.status ?? 'completed',
        completed_at: completedAt,
        is_reviewed: Boolean(appointment.review),
        created_at: appointment.created_at,
        updated_at: completedAt ?? appointment.created_at
    };
});
const DEMO_REVIEWS = demoReviewData.appointments
    .filter((appointment) => Boolean(appointment.review))
    .map((appointment) => {
    const user = [...SEED_USERS, ...demoReviewData.accounts].find((item) => item.id === appointment.user_id);
    const pet = [...SEED_PETS, ...DEMO_PETS].find((item) => item.id === appointment.pet_id);
    const review = appointment.review;
    if (!user || !pet || !review) {
        throw new Error(`Demo review ${review?.id ?? appointment.id} references a missing user or pet.`);
    }
    return {
        id: review.id,
        booking_id: appointment.id,
        service_id: appointment.service_id,
        user_id: user.id,
        user_name: user.full_name,
        pet_name: pet.pet_name,
        rating: review.rating,
        comment: review.comment,
        admin_reply: review.admin_reply,
        admin_replied_at: review.admin_replied_at,
        points_awarded: review.points_awarded,
        created_at: review.created_at,
        updated_at: review.updated_at
    };
});
const DEMO_PAYMENTS = DEMO_BOOKINGS
    .filter((booking) => booking.payment_method === 'QR' && booking.payment_status === 'paid' && booking.id !== 'BK-2610-001')
    .map((booking) => ({
    id: `pay-demo-${booking.id}`,
    booking_id: booking.id,
    amount: booking.total_amount,
    payment_method: 'QR',
    payment_status: 'paid',
    transaction_reference: `PETPHET-${booking.id}`,
    account_number: '0909123456888',
    bank_name: 'MB Bank (Ngân hàng Quân Đội)',
    account_holder: 'PET PHET VIETNAM',
    transfer_content: `PETPHET ${booking.id}`,
    verified_by: 'usr-admin-01',
    verified_at: booking.completed_at,
    created_at: booking.created_at
}));
const SEED_PAYMENTS = [
    {
        id: 'pay-001',
        booking_id: 'BK-2610-001',
        amount: 170000,
        payment_method: 'QR',
        payment_status: 'paid',
        transaction_reference: 'PETPHET-BK2610001',
        bank_name: 'MB Bank (Ngân hàng Quân Đội)',
        account_number: '0909123456888',
        account_holder: 'PET PHET VIETNAM',
        transfer_content: 'PETPHET BK2610001',
        verified_by: 'usr-admin-01',
        verified_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        created_at: new Date(Date.now() - 4 * 86400000).toISOString()
    }
];
const SEED_PET_POINTS = [
    {
        id: 'pt-001',
        user_id: 'usr-customer-01',
        amount: 1000,
        type: 'earn_review',
        reference_id: 'BK-2610-001',
        description: 'Thưởng 1.000 Pet Point khi gửi đánh giá chất lượng cho lịch hẹn BK-2610-001',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    }
];
const SEED_NOTIFICATIONS = [
    {
        id: 'notif-001',
        user_id: 'usr-customer-01',
        target_role: 'customer',
        title: 'Chúc mừng nhận 1.000 Pet Point! 🎉',
        content: 'Bạn vừa nhận được 1.000 Pet Point cho đánh giá dịch vụ Combo Tắm Spa của bé Bánh Mì.',
        type: 'points',
        is_read: false,
        created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
        id: 'notif-002',
        target_role: 'admin',
        title: 'Lịch hẹn mới cần xác nhận: BK-2610-002',
        content: 'Khách hàng Nguyễn Thị Minh Anh vừa đặt lịch Grooming cho bé Mây Mây (Phương thức COD).',
        type: 'booking',
        is_read: false,
        created_at: new Date().toISOString()
    }
];
class StoreService {
    constructor() {
        this.listeners = [];
        this.state = this.loadState();
    }
    loadState() {
        let loadedState;
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                loadedState = JSON.parse(stored);
            }
            else {
                loadedState = {
                    currentUser: SEED_USERS[1], // Default to Customer Minh Anh
                    users: SEED_USERS,
                    categories: SEED_CATEGORIES,
                    services: SEED_SERVICES,
                    pets: [...SEED_PETS, ...DEMO_PETS.filter((pet) => !SEED_PETS.some((seedPet) => seedPet.id === pet.id))],
                    schedules: SEED_SCHEDULE,
                    bookings: [...SEED_BOOKINGS, ...DEMO_BOOKINGS.filter((booking) => !SEED_BOOKINGS.some((seedBooking) => seedBooking.id === booking.id))],
                    payments: [...SEED_PAYMENTS, ...DEMO_PAYMENTS],
                    reviews: DEMO_REVIEWS,
                    coupons: SEED_COUPONS,
                    petPoints: SEED_PET_POINTS,
                    notifications: SEED_NOTIFICATIONS
                };
            }
        }
        catch (e) {
            console.warn('Failed to parse localStorage, resetting to seed:', e);
            loadedState = {
                currentUser: SEED_USERS[1],
                users: SEED_USERS,
                categories: SEED_CATEGORIES,
                services: SEED_SERVICES,
                pets: [...SEED_PETS, ...DEMO_PETS.filter((pet) => !SEED_PETS.some((seedPet) => seedPet.id === pet.id))],
                schedules: SEED_SCHEDULE,
                bookings: [...SEED_BOOKINGS, ...DEMO_BOOKINGS.filter((booking) => !SEED_BOOKINGS.some((seedBooking) => seedBooking.id === booking.id))],
                payments: [...SEED_PAYMENTS, ...DEMO_PAYMENTS],
                reviews: DEMO_REVIEWS,
                coupons: SEED_COUPONS,
                petPoints: SEED_PET_POINTS,
                notifications: SEED_NOTIFICATIONS
            };
        }
        // A service's rating is derived only from reviews linked to that service.
        // Recalculate on every load so older localStorage data cannot retain fake/stale totals.
        loadedState.currentUser ??= SEED_USERS[1];
        loadedState.users ??= SEED_USERS;
        loadedState.categories ??= SEED_CATEGORIES;
        loadedState.services ??= [];
        loadedState.pets ??= [...SEED_PETS, ...DEMO_PETS];
        loadedState.schedules ??= SEED_SCHEDULE;
        loadedState.bookings ??= [...SEED_BOOKINGS, ...DEMO_BOOKINGS];
        loadedState.payments ??= [...SEED_PAYMENTS, ...DEMO_PAYMENTS];
        loadedState.reviews ??= DEMO_REVIEWS;
        loadedState.coupons ??= SEED_COUPONS;
        loadedState.petPoints ??= SEED_PET_POINTS;
        loadedState.notifications ??= SEED_NOTIFICATIONS;
        const legacyDemoReviewIds = new Set(loadedState.reviews
            .filter((review) => review.id === 'rev-002' || review.id === 'rev-003' || /^rev-demo-(?:spa|vet|dental)-/.test(review.id))
            .map((review) => review.id));
        const legacyDemoBookingIds = new Set(loadedState.reviews
            .filter((review) => legacyDemoReviewIds.has(review.id))
            .map((review) => review.booking_id));
        loadedState.reviews = loadedState.reviews.filter((review) => !legacyDemoReviewIds.has(review.id));
        loadedState.bookings = loadedState.bookings.filter((booking) => !legacyDemoBookingIds.has(booking.id));
        for (const seedUser of SEED_USERS) {
            if (!loadedState.users.some((user) => user.id === seedUser.id)) {
                loadedState.users.push({ ...seedUser });
            }
        }
        for (const seedPet of [...SEED_PETS, ...DEMO_PETS]) {
            if (!loadedState.pets.some((pet) => pet.id === seedPet.id)) {
                loadedState.pets.push({ ...seedPet });
            }
        }
        for (const seedBooking of [...SEED_BOOKINGS, ...DEMO_BOOKINGS]) {
            if (!loadedState.bookings.some((booking) => booking.id === seedBooking.id)) {
                loadedState.bookings.push({ ...seedBooking });
            }
        }
        for (const seedPayment of [...SEED_PAYMENTS, ...DEMO_PAYMENTS]) {
            if (!loadedState.payments.some((payment) => payment.id === seedPayment.id)) {
                loadedState.payments.push({ ...seedPayment });
            }
        }
        for (const seedReview of DEMO_REVIEWS) {
            if (!loadedState.reviews.some((review) => review.id === seedReview.id)) {
                loadedState.reviews.push({ ...seedReview });
            }
        }
        for (const seedCoupon of SEED_COUPONS) {
            if (!loadedState.coupons.some((coupon) => coupon.id === seedCoupon.id)) {
                loadedState.coupons.push({ ...seedCoupon });
            }
        }
        // Add newly introduced demo services to existing localStorage installations without overwriting user edits.
        for (const seedService of SEED_SERVICES) {
            if (!loadedState.services.some((service) => service.id === seedService.id)) {
                loadedState.services.push({ ...seedService });
            }
        }
        for (const seedCategory of SEED_CATEGORIES) {
            if (!loadedState.categories.some((category) => category.id === seedCategory.id)) {
                loadedState.categories.push({ ...seedCategory });
            }
        }
        const legacyCategoryNames = {
            'cat-spa': { oldName: 'Spa & Grooming', newName: 'Spa & Làm đẹp' },
            'cat-vet': { oldName: 'Khám Thú Y & Y Tế', newName: 'Khám Thú Y & Y tế' },
            'cat-dental': { oldName: 'Chăm Sóc Răng Miệng', newName: 'Chăm sóc răng miệng' },
            'cat-hotel': { oldName: 'Khách Sạn & Trông Giữ', newName: 'Khách sạn & Trông giữ' }
        };
        for (const category of loadedState.categories) {
            const legacy = legacyCategoryNames[category.id];
            if (legacy && category.name === legacy.oldName)
                category.name = legacy.newName;
        }
        const legacyServiceNames = {
            'srv-spa-01': { oldName: 'Combo Tắm Spa & Vệ Sinh Toàn Diện', newName: 'Combo Tắm Spa & Vệ Sinh' },
            'srv-spa-02': { oldName: 'Grooming Cắt Tỉa Tạo Kiểu Nghệ Thuật', newName: 'Grooming Cắt Tỉa Tạo Kiểu' },
            'srv-vet-01': { oldName: 'Khám Thú Y Tổng Quát & Tư Vấn Sức Khỏe', newName: 'Khám Thú Y - Tư Vấn Sức Khỏe' },
            'srv-vet-02': { oldName: 'Tiêm Phòng Vaccine Định Kỳ & Cấp Sổ', newName: 'Tiêm Phòng Vaccine' },
            'srv-dental-01': { oldName: 'Vệ Sinh Răng Miệng & Cạo Vôi Siêu Âm', newName: 'Vệ Sinh Răng Miệng - Cạo Vôi' },
            'srv-spa-03': { oldName: 'Vệ Sinh Tai, Mắt & Cắt Móng An Toàn', newName: 'Vệ Sinh Tai, Mắt' },
            'srv-vet-03': { oldName: 'Tư Vấn Dinh Dưỡng & Kiểm Soát Cân Nặng', newName: 'Siêu Âm' }
        };
        for (const service of loadedState.services) {
            const legacy = legacyServiceNames[service.id];
            if (legacy && service.service_name === legacy.oldName) {
                const seedService = SEED_SERVICES.find((seed) => seed.id === service.id);
                service.service_name = legacy.newName;
                if (seedService)
                    service.description = seedService.description;
            }
        }
        const legacyServiceImages = {
            'srv-spa-02': ['./assets/services/grooming.jpg', '/assets/services/grooming.jpg', 'assets/services/grooming.jpg'],
            'srv-dental-01': 'https://images.unsplash.com/photo-1525253013412-55c1a69a5738?auto=format&fit=crop&w=800&q=80',
            'srv-spa-03': 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80',
            'srv-vet-03': 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80',
            'srv-spa-04': 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80'
        };
        for (const service of loadedState.services) {
            const seedService = SEED_SERVICES.find((seed) => seed.id === service.id);
            const legacyImages = legacyServiceImages[service.id];
            if (seedService && (Array.isArray(legacyImages) ? legacyImages.includes(service.image_url) : service.image_url === legacyImages)) {
                service.image_url = seedService.image_url;
            }
        }
        const previousSeedServiceImages = {
            'srv-spa-02': 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80',
            'srv-vet-01': 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=800&q=80',
            'srv-vet-02': 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80',
            'srv-dental-01': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&crop=faces&w=900&h=650&q=85',
            'srv-spa-03': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
            'srv-vet-03': 'https://images.unsplash.com/photo-1551717743-49959800b1f6?auto=format&fit=crop&w=800&q=80',
            'srv-spa-04': 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80'
        };
        for (const service of loadedState.services) {
            const previousSeedImage = previousSeedServiceImages[service.id];
            const seedService = SEED_SERVICES.find((seed) => seed.id === service.id);
            if (previousSeedImage && seedService && service.image_url === previousSeedImage) {
                service.image_url = seedService.image_url;
            }
        }
        // Static images moved from assets/ to images/. Rewrite URLs saved by older versions so they keep loading.
        const legacyAssetPath = /^(?:\.\/|\/)?assets\/(brand|services)\//;
        for (const service of loadedState.services) {
            if (service.image_url && legacyAssetPath.test(service.image_url)) {
                service.image_url = service.image_url.replace(legacyAssetPath, './images/$1/');
            }
        }
        for (const service of loadedState.services) {
            const serviceReviews = loadedState.reviews.filter((review) => review.service_id === service.id);
            service.rating_count = serviceReviews.length;
            service.rating_avg = serviceReviews.length
                ? Number((serviceReviews.reduce((sum, review) => sum + review.rating, 0) / serviceReviews.length).toFixed(1))
                : 0;
        }
        return loadedState;
    }
    saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        }
        catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
        this.notify();
    }
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }
    notify() {
        for (const listener of this.listeners) {
            listener();
        }
    }
    resetToDefault() {
        localStorage.removeItem(STORAGE_KEY);
        this.state = this.loadState();
        this.notify();
    }
    // --- USER & AUTH ---
    getCurrentUser() {
        return this.state.currentUser;
    }
    getAllUsers() {
        return this.state.currentUser.role === 'admin'
            ? [...this.state.users]
            : this.state.users.filter((user) => user.id === this.state.currentUser.id);
    }
    /** Find an account by id (used to restore a saved login session after a page reload). */
    getUserById(userId) {
        return this.state.users.find((user) => user.id === userId);
    }
    /** Find an account by email or phone number without exposing the internal store. */
    getUserByIdentity(identity) {
        const value = identity.trim().toLowerCase();
        const digits = value.replace(/[^0-9]/g, '');
        return this.state.users.find((user) => user.email.toLowerCase() === value ||
            (digits.length > 0 && user.phone.replace(/[^0-9]/g, '') === digits));
    }
    /**
     * Local demo authentication only. A SHA-256 digest is stored in localStorage so
     * the prototype never persists a raw password. Production authentication must
     * be moved to a trusted server / Supabase Auth and must not rely on this method.
     */
    async digestDemoPassword(email, password) {
        if (!globalThis.crypto?.subtle) {
            throw new Error('Trình duyệt chưa hỗ trợ mã hóa an toàn. Hãy chạy website qua localhost hoặc HTTPS.');
        }
        const payload = new TextEncoder().encode(`${email.trim().toLowerCase()}::${password}`);
        const digest = await globalThis.crypto.subtle.digest('SHA-256', payload);
        return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }
    async setDemoPassword(email, password) {
        if (password.length < 6)
            throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
        const credentials = this.readDemoCredentials();
        credentials[email.trim().toLowerCase()] = await this.digestDemoPassword(email, password);
        localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
    }
    async verifyDemoPassword(identity, password) {
        const user = this.getUserByIdentity(identity);
        if (!user)
            return false;
        const credentials = this.readDemoCredentials();
        const savedDigest = credentials[user.email.toLowerCase()];
        // Seed accounts use this explicit demo password until users change it.
        if (!savedDigest)
            return password === 'petphet123';
        return savedDigest === await this.digestDemoPassword(user.email, password);
    }
    readDemoCredentials() {
        try {
            const raw = localStorage.getItem(CREDENTIALS_KEY);
            return raw ? JSON.parse(raw) : {};
        }
        catch {
            return {};
        }
    }
    setCurrentUser(user) {
        this.state.currentUser = user;
        this.saveState();
    }
    /** Role switching is intentionally disabled. A role can change only after credentials are verified. */
    switchRole(role) {
        if (this.state.currentUser.role !== role) {
            throw new Error('Không thể tự chuyển vai trò. Vui lòng đăng nhập bằng tài khoản đúng quyền.');
        }
    }
    updateUserProfile(data) {
        if (this.state.currentUser) {
            // Disallow changing role, id, email or creation time through the profile form.
            const { role, id, email, created_at, ...allowedUpdates } = data;
            const newPhone = allowedUpdates.phone?.replace(/[^0-9]/g, '');
            if (newPhone && this.state.users.some((user) => user.id !== this.state.currentUser.id && user.phone.replace(/[^0-9]/g, '') === newPhone)) {
                throw new Error('Số điện thoại này đã được sử dụng bởi tài khoản khác.');
            }
            this.state.currentUser = { ...this.state.currentUser, ...allowedUpdates };
            this.state.users = this.state.users.map((u) => u.id === this.state.currentUser.id ? this.state.currentUser : u);
            this.saveState();
        }
    }
    registerCustomer(name, email, phone) {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPhone = phone.replace(/[^0-9]/g, '');
        const existingEmail = this.state.users.some((u) => u.email.toLowerCase() === normalizedEmail);
        if (existingEmail)
            return { success: false, message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.' };
        const existingPhone = this.state.users.some((u) => u.phone.replace(/[^0-9]/g, '') === normalizedPhone);
        if (existingPhone)
            return { success: false, message: 'Số điện thoại này đã được liên kết với tài khoản khác.' };
        const newUser = {
            id: `usr-${Date.now()}`,
            email: email.trim(),
            full_name: name.trim(),
            phone: phone.trim(),
            role: 'customer',
            created_at: new Date().toISOString()
        };
        this.state.users.push(newUser);
        this.state.currentUser = newUser;
        this.addNotification({
            user_id: newUser.id,
            target_role: 'customer',
            title: 'Chào mừng bạn đến với Pet Phết! 🐾',
            content: `Xin chào ${name}, cảm ơn bạn đã gia nhập gia đình Pet Phết! Cún Phết và Mèo Bông rất vui được đồng hành cùng bạn chăm sóc bé cưng.`,
            type: 'system'
        });
        this.saveState();
        return { success: true, message: 'Đăng ký tài khoản thành công!', user: newUser };
    }
    // --- PETS ---
    getPetsByUser(userId) {
        if (this.state.currentUser.role !== 'admin' && this.state.currentUser.id !== userId)
            return [];
        return this.state.pets.filter((p) => p.user_id === userId && p.is_active);
    }
    getHiddenPetsByUser(userId) {
        if (this.state.currentUser.role !== 'admin' && this.state.currentUser.id !== userId)
            return [];
        return this.state.pets.filter((pet) => pet.user_id === userId && !pet.is_active);
    }
    unhidePet(petId) {
        const pet = this.state.pets.find((item) => item.id === petId && item.user_id === this.state.currentUser.id);
        if (!pet)
            return { success: false, message: 'Không tìm thấy hồ sơ thú cưng trong tài khoản của bạn.' };
        if (pet.is_active)
            return { success: true, message: 'Hồ sơ này đang được hiển thị.' };
        pet.is_active = true;
        pet.updated_at = new Date().toISOString();
        this.saveState();
        return { success: true, message: `Đã khôi phục hồ sơ bé ${pet.pet_name}.` };
    }
    getAllPets() {
        return this.state.currentUser.role === 'admin'
            ? this.state.pets
            : this.state.pets.filter((pet) => pet.user_id === this.state.currentUser.id);
    }
    addPet(petData) {
        if (this.state.currentUser.role !== 'customer' || petData.user_id !== this.state.currentUser.id)
            throw new Error('Không có quyền tạo hồ sơ thú cưng cho tài khoản khác.');
        if (!petData.pet_name.trim() || (petData.weight != null && petData.weight <= 0))
            throw new Error('Thông tin thú cưng không hợp lệ.');
        const newPet = {
            ...petData,
            id: `pet-${Date.now()}`,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            weight_updated_at: new Date().toISOString()
        };
        this.state.pets.push(newPet);
        this.saveState();
        return newPet;
    }
    updatePet(petId, updates) {
        const petIndex = this.state.pets.findIndex((p) => p.id === petId && p.user_id === this.state.currentUser.id && p.is_active);
        if (petIndex === -1) {
            return { success: false, message: 'Không tìm thấy hồ sơ thú cưng.' };
        }
        const currentPet = this.state.pets[petIndex];
        const weightChanged = updates.weight && updates.weight !== currentPet.weight;
        const { id, user_id, is_active, created_at, ...safeUpdates } = updates;
        this.state.pets[petIndex] = {
            ...currentPet,
            ...safeUpdates,
            weight_updated_at: weightChanged ? new Date().toISOString() : currentPet.weight_updated_at,
            updated_at: new Date().toISOString()
        };
        this.saveState();
        return { success: true, message: 'Cập nhật thông tin bé thành công!' };
    }
    hidePet(petId) {
        // Only the current owner can hide their pet profile.
        const ownedPet = this.state.pets.find((p) => p.id === petId && p.user_id === this.state.currentUser.id && p.is_active);
        if (!ownedPet)
            return { success: false, message: 'Không tìm thấy hồ sơ thú cưng trong tài khoản của bạn.' };
        // Check if pet has active bookings
        const hasActiveBookings = this.state.bookings.some((b) => b.pet_id === petId && ['pending', 'confirmed', 'in_progress'].includes(b.status));
        if (hasActiveBookings) {
            return {
                success: false,
                message: 'Không thể ẩn hồ sơ thú cưng khi đang có lịch hẹn đang chờ phục vụ. Vui lòng hoàn thành hoặc hủy lịch hẹn trước.'
            };
        }
        const petIndex = this.state.pets.findIndex((p) => p.id === petId);
        if (petIndex !== -1) {
            this.state.pets[petIndex].is_active = false;
            this.state.pets[petIndex].updated_at = new Date().toISOString();
            this.saveState();
            return { success: true, message: 'Đã ẩn hồ sơ bé thành công. Lịch sử dịch vụ trước đây vẫn được lưu trữ.' };
        }
        return { success: false, message: 'Không tìm thấy hồ sơ bé.' };
    }
    // --- SERVICES & CATEGORIES ---
    getCategories() {
        return this.state.categories;
    }
    addCategory(name, description, icon = 'scissors') {
        if (this.state.currentUser.role !== 'admin')
            throw new Error('Chỉ Admin mới được thêm danh mục dịch vụ.');
        const newCat = {
            id: `cat-${Date.now()}`,
            name,
            description,
            icon,
            is_active: true
        };
        this.state.categories.push(newCat);
        this.saveState();
        return newCat;
    }
    updateCategory(id, updates) {
        if (this.state.currentUser.role !== 'admin')
            throw new Error('Chỉ Admin mới được cập nhật danh mục dịch vụ.');
        this.state.categories = this.state.categories.map((c) => c.id === id ? { ...c, ...updates } : c);
        this.saveState();
    }
    getServices(onlyActive = true) {
        if (onlyActive) {
            return this.state.services.filter((s) => s.is_active);
        }
        return this.state.services;
    }
    getServiceById(serviceId) {
        return this.state.services.find((s) => s.id === serviceId);
    }
    addService(serviceData) {
        if (this.state.currentUser.role !== 'admin')
            throw new Error('Chỉ Admin mới được thêm dịch vụ.');
        const newService = {
            ...serviceData,
            id: `srv-${Date.now()}`,
            rating_avg: 0,
            rating_count: 0,
            created_at: new Date().toISOString()
        };
        this.state.services.push(newService);
        this.saveState();
        return newService;
    }
    updateService(serviceId, updates) {
        if (this.state.currentUser.role !== 'admin')
            throw new Error('Chỉ Admin mới được cập nhật dịch vụ.');
        this.state.services = this.state.services.map((s) => s.id === serviceId ? { ...s, ...updates } : s);
        this.saveState();
    }
    // --- WORKING SCHEDULE & CAPACITY ---
    getSchedules() {
        return this.state.schedules;
    }
    getScheduleForDate(date) {
        let sch = this.state.schedules.find((s) => s.work_date === date);
        if (!sch) {
            sch = {
                id: `sch-${date}`,
                work_date: date,
                start_time: '08:00',
                end_time: '20:00',
                is_available: true,
                max_concurrent_capacity: 4,
                slot_duration_minutes: 30,
                notes: 'Tiêu chuẩn 08:00 - 20:00'
            };
            this.state.schedules.push(sch);
            this.saveState();
        }
        return sch;
    }
    updateSchedule(date, updates) {
        if (this.state.currentUser.role !== 'admin')
            throw new Error('Chỉ Admin mới được quản lý lịch làm việc.');
        if (updates.start_time && updates.end_time && updates.end_time <= updates.start_time)
            throw new Error('Giờ kết thúc phải sau giờ bắt đầu.');
        if (updates.max_concurrent_capacity != null && updates.max_concurrent_capacity < 1)
            throw new Error('Sức chứa phải ít nhất là 1.');
        const index = this.state.schedules.findIndex((s) => s.work_date === date);
        if (index !== -1) {
            this.state.schedules[index] = { ...this.state.schedules[index], ...updates };
        }
        else {
            const newSch = {
                id: `sch-${date}`,
                work_date: date,
                start_time: '08:00',
                end_time: '20:00',
                is_available: true,
                max_concurrent_capacity: 4,
                slot_duration_minutes: 30,
                ...updates
            };
            this.state.schedules.push(newSch);
        }
        this.saveState();
    }
    // --- BOOKINGS ENGINE ---
    expireOverdueQrBookings() {
        const now = Date.now();
        let changed = false;
        for (const booking of this.state.bookings) {
            if (booking.payment_method === 'QR' &&
                ['unpaid', 'pending_reconcile', 'failed'].includes(booking.payment_status) &&
                ['pending', 'confirmed'].includes(booking.status) &&
                booking.hold_expires_at &&
                new Date(booking.hold_expires_at).getTime() <= now) {
                booking.status = 'cancelled';
                booking.payment_status = 'failed';
                booking.cancellation_reason = 'Đơn QR quá hạn thanh toán; hệ thống đã tự động giải phóng chỗ.';
                booking.cancelled_at = new Date().toISOString();
                booking.updated_at = new Date().toISOString();
                const payment = this.state.payments.find((item) => item.booking_id === booking.id);
                if (payment && payment.payment_status !== 'paid')
                    payment.payment_status = 'failed';
                this.addNotification({
                    user_id: booking.user_id,
                    target_role: 'customer',
                    title: `Đơn #${booking.id} đã hết thời hạn thanh toán`,
                    content: 'Đơn QR đã tự động hủy do quá thời hạn giữ chỗ. Bạn có thể chọn khung giờ khác để đặt lại.',
                    type: 'booking'
                });
                changed = true;
            }
        }
        if (changed)
            this.saveState();
    }
    processExpiredQrBookings() {
        this.expireOverdueQrBookings();
    }
    getBookings() {
        this.expireOverdueQrBookings();
        return this.state.bookings;
    }
    getBookingsByUser(userId) {
        if (this.state.currentUser.role !== 'admin' && this.state.currentUser.id !== userId)
            return [];
        this.expireOverdueQrBookings();
        return this.state.bookings.filter((b) => b.user_id === userId);
    }
    getCompletedBookingsByPet(petId, userId) {
        if (this.state.currentUser.role !== 'admin' && this.state.currentUser.id !== userId)
            return [];
        return this.state.bookings
            .filter((booking) => booking.pet_id === petId && booking.user_id === userId && booking.status === 'completed')
            .sort((a, b) => b.booking_date.localeCompare(a.booking_date));
    }
    getBookingById(bookingId) {
        return this.state.bookings.find((b) => b.id === bookingId);
    }
    createBooking(params) {
        this.expireOverdueQrBookings();
        const user = this.state.users.find((u) => u.id === params.userId);
        const pet = this.state.pets.find((p) => p.id === params.petId);
        const service = this.state.services.find((s) => s.id === params.serviceId);
        if (!user || user.id !== this.state.currentUser.id || user.role !== 'customer')
            return { success: false, message: 'Phiên khách hàng không hợp lệ. Vui lòng đăng nhập lại.' };
        if (!pet || !pet.is_active)
            return { success: false, message: 'Hồ sơ thú cưng không hợp lệ hoặc đã bị ẩn.' };
        if (pet.user_id !== user.id)
            return { success: false, message: 'Bạn không có quyền đặt lịch bằng hồ sơ thú cưng này.' };
        if (!service || !service.is_active)
            return { success: false, message: 'Dịch vụ hiện không hoạt động.' };
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(params.bookingDate))
            return { success: false, message: 'Ngày đặt lịch không hợp lệ.' };
        if (!/^\d{2}:\d{2}$/.test(params.bookingTime))
            return { success: false, message: 'Khung giờ đặt lịch không hợp lệ.' };
        if (params.bookingDate < todayKey)
            return { success: false, message: 'Không thể đặt lịch vào ngày đã qua.' };
        // Species check
        if (!service.species_supported.includes(pet.species)) {
            return {
                success: false,
                message: `Dịch vụ "${service.service_name}" chỉ áp dụng cho ${service.species_supported.join(', ')}. Bé ${pet.pet_name} (${pet.species}) không thuộc diện tiếp nhận.`
            };
        }
        const schedule = this.getScheduleForDate(params.bookingDate);
        if (!schedule.is_available) {
            return { success: false, message: `Cơ sở nghỉ phục vụ vào ngày ${params.bookingDate}. Vui lòng chọn ngày khác.` };
        }
        // A selected start time must sit inside opening hours for the entire service duration.
        const [openHour, openMinute] = schedule.start_time.split(':').map(Number);
        const [closeHour, closeMinute] = schedule.end_time.split(':').map(Number);
        const openingMinutes = openHour * 60 + openMinute;
        const closingMinutes = closeHour * 60 + closeMinute;
        const bookingStartMinutes = Number(params.bookingTime.slice(0, 2)) * 60 + Number(params.bookingTime.slice(3, 5));
        const bookingEndMinutes = bookingStartMinutes + service.duration_minutes;
        if (bookingStartMinutes < openingMinutes || bookingEndMinutes > closingMinutes) {
            return { success: false, message: 'Khung giờ được chọn nằm ngoài giờ hoạt động hoặc không đủ thời lượng dịch vụ.' };
        }
        const slotStep = Math.max(15, schedule.slot_duration_minutes || 30);
        if ((bookingStartMinutes - openingMinutes) % slotStep !== 0) {
            return { success: false, message: 'Khung giờ không khớp với các mốc đặt lịch do cơ sở thiết lập.' };
        }
        if (params.bookingDate === todayKey) {
            const currentMinutes = today.getHours() * 60 + today.getMinutes();
            if (bookingStartMinutes <= currentMinutes)
                return { success: false, message: 'Không thể đặt lịch vào khung giờ đã qua.' };
        }
        // Capacity verification across whole duration.
        const capacityCheck = checkContinuousCapacity(params.bookingDate, params.bookingTime, service.duration_minutes, this.state.bookings, schedule.max_concurrent_capacity);
        if (!capacityCheck.isAvailable) {
            return { success: false, message: capacityCheck.reason || 'Khung giờ này đã kín chỗ.' };
        }
        // Weight snapshot & Price computation
        const effectiveWeight = params.confirmedWeight && params.confirmedWeight > 0 ? params.confirmedWeight : pet.weight;
        if (service.is_weight_based && (!effectiveWeight || effectiveWeight <= 0)) {
            return { success: false, message: 'Dịch vụ này cần cân nặng hợp lệ của thú cưng trước khi đặt lịch.' };
        }
        const originalPrice = calculateServicePrice(service, effectiveWeight);
        // Coupon computation: reject unknown/invalid coupon codes instead of silently ignoring them.
        let coupon;
        if (params.couponCode?.trim()) {
            coupon = this.state.coupons.find((c) => c.code.toUpperCase() === params.couponCode?.trim().toUpperCase());
            if (!coupon)
                return { success: false, message: 'Mã giảm giá không tồn tại.' };
        }
        const couponResult = applyCouponDiscount(originalPrice, coupon);
        if (!couponResult.isValid)
            return { success: false, message: couponResult.message };
        const endTime = calculateEndTime(params.bookingTime, service.duration_minutes);
        const bookingCode = `BK-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
        // Hold expiration for QR payment: 15 minutes hold
        const holdExpiresAt = params.paymentMethod === 'QR'
            ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
            : undefined;
        const newBooking = {
            id: bookingCode,
            user_id: user.id,
            user_name: user.full_name,
            user_phone: user.phone,
            user_email: user.email,
            pet_id: pet.id,
            pet_name: pet.pet_name,
            pet_species: pet.species,
            pet_weight: effectiveWeight,
            service_id: service.id,
            service_name: service.service_name,
            booking_date: params.bookingDate,
            booking_time: params.bookingTime,
            duration_minutes: service.duration_minutes,
            end_time: endTime,
            original_price: originalPrice,
            discount_amount: couponResult.discountAmount,
            total_amount: couponResult.finalTotal,
            coupon_code: coupon ? coupon.code : undefined,
            payment_method: params.paymentMethod,
            payment_status: 'unpaid',
            status: 'pending',
            customer_note: params.customerNote,
            hold_expires_at: holdExpiresAt,
            is_reviewed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        // Keep the pet profile's latest confirmed weight in sync with the booking snapshot.
        if (effectiveWeight > 0 && pet.weight !== effectiveWeight) {
            pet.weight = effectiveWeight;
            pet.weight_updated_at = new Date().toISOString();
            pet.updated_at = new Date().toISOString();
        }
        // Increment coupon count if used.
        if (coupon) {
            coupon.used_count += 1;
        }
        // Create payment record
        const newPayment = {
            id: `pay-${Date.now()}`,
            booking_id: bookingCode,
            amount: couponResult.finalTotal,
            payment_method: params.paymentMethod,
            payment_status: 'unpaid',
            transaction_reference: `PETPHET-${bookingCode}`,
            bank_name: 'MB Bank (Ngân hàng Quân Đội)',
            account_number: '0909123456888',
            account_holder: 'PET PHET VIETNAM',
            transfer_content: `PETPHET ${bookingCode}`,
            created_at: new Date().toISOString()
        };
        this.state.bookings.unshift(newBooking);
        this.state.payments.unshift(newPayment);
        // Notifications
        this.addNotification({
            user_id: user.id,
            target_role: 'customer',
            title: 'Đặt lịch thành công! 📅',
            content: `Lịch hẹn #${bookingCode} dịch vụ ${service.service_name} cho bé ${pet.pet_name} đã được ghi nhận. Trạng thái: Chờ xác nhận.`,
            type: 'booking'
        });
        this.addNotification({
            target_role: 'admin',
            title: `Booking mới: #${bookingCode}`,
            content: `${user.full_name} đặt ${service.service_name} cho bé ${pet.pet_name} lúc ${params.bookingTime} ngày ${params.bookingDate}.`,
            type: 'booking'
        });
        this.saveState();
        return {
            success: true,
            message: 'Đặt lịch thành công! Nhân viên Pet Phết sẽ sớm liên hệ xác nhận.',
            booking: newBooking,
            payment: newPayment
        };
    }
    rescheduleBooking(bookingId, userId, newDate, newTime) {
        this.expireOverdueQrBookings();
        const booking = this.state.bookings.find((b) => b.id === bookingId);
        if (!booking || booking.user_id !== userId || this.state.currentUser.id !== userId)
            return { success: false, message: 'Không tìm thấy lịch hẹn hoặc bạn không có quyền thao tác.' };
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return { success: false, message: 'Chỉ có thể đổi lịch khi lịch hẹn ở trạng thái Chờ xác nhận hoặc Đã xác nhận.' };
        }
        if (!isWithinRescheduleWindow(booking.created_at)) {
            return { success: false, message: 'Đã quá hạn đổi lịch. Bạn chỉ có thể đổi lịch trong vòng 1 ngày (24 giờ) kể từ khi đặt đơn.' };
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate) || !/^\d{2}:\d{2}$/.test(newTime))
            return { success: false, message: 'Ngày hoặc giờ mới không hợp lệ.' };
        const now = new Date();
        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        if (newDate < todayKey)
            return { success: false, message: 'Không thể đổi sang ngày đã qua.' };
        const schedule = this.getScheduleForDate(newDate);
        if (!schedule.is_available) {
            return { success: false, message: `Ngày ${newDate} cơ sở nghỉ làm việc.` };
        }
        const startMinutes = Number(newTime.slice(0, 2)) * 60 + Number(newTime.slice(3, 5));
        const [openH, openM] = schedule.start_time.split(':').map(Number);
        const [closeH, closeM] = schedule.end_time.split(':').map(Number);
        const opening = openH * 60 + openM;
        const closing = closeH * 60 + closeM;
        if (startMinutes < opening || startMinutes + booking.duration_minutes > closing)
            return { success: false, message: 'Khung giờ mới nằm ngoài giờ hoạt động hoặc không đủ thời lượng dịch vụ.' };
        const step = Math.max(15, schedule.slot_duration_minutes || 30);
        if ((startMinutes - opening) % step !== 0)
            return { success: false, message: 'Khung giờ mới không khớp với lịch làm việc.' };
        if (newDate === todayKey && startMinutes <= now.getHours() * 60 + now.getMinutes())
            return { success: false, message: 'Không thể đổi sang khung giờ đã qua.' };
        const capacityCheck = checkContinuousCapacity(newDate, newTime, booking.duration_minutes, this.state.bookings, schedule.max_concurrent_capacity, booking.id // exclude self
        );
        if (!capacityCheck.isAvailable) {
            return { success: false, message: capacityCheck.reason || 'Khung giờ mới đã hết chỗ.' };
        }
        booking.booking_date = newDate;
        booking.booking_time = newTime;
        booking.end_time = calculateEndTime(newTime, booking.duration_minutes);
        booking.updated_at = new Date().toISOString();
        this.addNotification({
            user_id: booking.user_id,
            target_role: 'customer',
            title: `Đổi lịch hẹn thành công: #${booking.id}`,
            content: `Lịch hẹn đã được cập nhật sang ${newTime} ngày ${newDate}.`,
            type: 'booking'
        });
        this.saveState();
        return { success: true, message: 'Đổi lịch hẹn thành công!' };
    }
    cancelBooking(bookingId, userId, reason) {
        this.expireOverdueQrBookings();
        const booking = this.state.bookings.find((b) => b.id === bookingId);
        if (!booking || booking.user_id !== userId || this.state.currentUser.id !== userId)
            return { success: false, message: 'Không tìm thấy lịch hẹn hoặc bạn không có quyền thao tác.' };
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return { success: false, message: 'Chỉ có thể hủy lịch ở trạng thái Chờ xác nhận hoặc Đã xác nhận.' };
        }
        if (booking.payment_method === 'QR' && ['paid', 'pending_reconcile'].includes(booking.payment_status)) {
            return { success: false, message: 'Đơn QR đã gửi xác nhận chuyển khoản hoặc đã thanh toán cần Admin đối chiếu/xử lý trước khi hủy. Vui lòng liên hệ Pet Phết.' };
        }
        booking.status = 'cancelled';
        booking.cancellation_reason = reason;
        booking.cancelled_at = new Date().toISOString();
        booking.updated_at = new Date().toISOString();
        this.addNotification({
            user_id: booking.user_id,
            target_role: 'customer',
            title: `Lịch hẹn #${booking.id} đã hủy`,
            content: `Bạn đã hủy lịch hẹn. Lý do: ${reason}`,
            type: 'booking'
        });
        this.addNotification({
            target_role: 'admin',
            title: `Khách hủy lịch: #${booking.id}`,
            content: `Khách hàng ${booking.user_name} đã hủy lịch ngày ${booking.booking_date}. Lý do: ${reason}`,
            type: 'booking'
        });
        this.saveState();
        return { success: true, message: 'Đã hủy lịch hẹn thành công. Chỗ đã được giải phóng.' };
    }
    updateBookingStatus(bookingId, newStatus, adminNote) {
        if (this.state.currentUser.role !== 'admin')
            return { success: false, message: 'Chỉ Admin mới được cập nhật trạng thái phục vụ.' };
        this.expireOverdueQrBookings();
        const booking = this.state.bookings.find((b) => b.id === bookingId);
        if (!booking)
            return { success: false, message: 'Không tìm thấy lịch hẹn.' };
        const allowedTransitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['in_progress', 'cancelled', 'no_show'],
            in_progress: ['completed', 'no_show'],
            completed: [],
            cancelled: [],
            no_show: []
        };
        if (newStatus !== booking.status && !allowedTransitions[booking.status].includes(newStatus)) {
            return { success: false, message: 'Không thể chuyển đơn sang trạng thái này theo quy trình phục vụ.' };
        }
        if (newStatus === 'confirmed' && booking.payment_method === 'QR' && booking.payment_status !== 'paid') {
            return { success: false, message: 'Đơn thanh toán QR chỉ được xác nhận sau khi Admin đối chiếu và ghi nhận thanh toán thành công.' };
        }
        if (newStatus === 'cancelled' && booking.payment_method === 'QR' && ['paid', 'pending_reconcile'].includes(booking.payment_status)) {
            return { success: false, message: 'Đơn QR đã gửi xác nhận chuyển khoản hoặc đã thanh toán cần được đối chiếu/hoàn tiền trước khi hủy.' };
        }
        booking.status = newStatus;
        if (adminNote)
            booking.admin_note = adminNote;
        if (newStatus === 'completed') {
            booking.completed_at = new Date().toISOString();
            // COD is collected at the service counter. Admin records receipt when marking the service complete.
            if (booking.payment_method === 'COD') {
                booking.payment_status = 'paid';
                const payment = this.state.payments.find((item) => item.booking_id === booking.id);
                if (payment) {
                    payment.payment_status = 'paid';
                    payment.verified_by = this.state.currentUser.id;
                    payment.verified_at = booking.completed_at;
                }
            }
        }
        booking.updated_at = new Date().toISOString();
        let title = `Cập nhật trạng thái lịch hẹn #${booking.id}`;
        let content = `Trạng thái hiện tại: ${newStatus}`;
        if (newStatus === 'confirmed') {
            title = `Lịch hẹn #${booking.id} đã được xác nhận! ✅`;
            content = `Pet Phết rất mong được đón tiếp bé ${booking.pet_name} vào lúc ${booking.booking_time} ngày ${booking.booking_date}.`;
        }
        else if (newStatus === 'completed') {
            title = `Hoàn thành dịch vụ cho bé ${booking.pet_name}! 🐾`;
            content = `Cảm ơn bạn đã tin tưởng Pet Phết. Đánh giá ngay để nhận 1.000 Pet Point bạn nhé!`;
        }
        this.addNotification({
            user_id: booking.user_id,
            target_role: 'customer',
            title,
            content,
            type: 'booking'
        });
        this.saveState();
        return { success: true, message: `Đã cập nhật trạng thái lịch hẹn sang "${newStatus}".` };
    }
    // --- PAYMENTS & RECONCILIATION ---
    getPayments() {
        return this.state.payments;
    }
    submitQrTransfer(bookingId) {
        this.expireOverdueQrBookings();
        const booking = this.state.bookings.find((b) => b.id === bookingId);
        const payment = this.state.payments.find((p) => p.booking_id === bookingId);
        if (!booking || !payment || booking.user_id !== this.state.currentUser.id)
            return { success: false, message: 'Không tìm thấy thông tin đơn thanh toán hoặc bạn không có quyền thao tác.' };
        if (booking.payment_method !== 'QR')
            return { success: false, message: 'Đơn này không sử dụng phương thức QR.' };
        if (booking.status === 'cancelled' || booking.status === 'completed')
            return { success: false, message: 'Đơn đã kết thúc, không thể gửi xác nhận thanh toán.' };
        if (booking.payment_status === 'paid')
            return { success: false, message: 'Đơn này đã được ghi nhận thanh toán.' };
        if (booking.payment_status === 'pending_reconcile')
            return { success: true, message: 'Yêu cầu đối chiếu của bạn đã được gửi và đang chờ Admin.' };
        if (booking.hold_expires_at && new Date(booking.hold_expires_at).getTime() <= Date.now()) {
            this.expireOverdueQrBookings();
            return { success: false, message: 'Đã hết thời gian giữ chỗ. Vui lòng tạo lịch hẹn mới.' };
        }
        booking.payment_status = 'pending_reconcile';
        payment.payment_status = 'pending_reconcile';
        this.addNotification({
            target_role: 'admin',
            title: `Thanh toán QR chờ đối chiếu: #${bookingId}`,
            content: `Khách hàng báo đã chuyển khoản ${payment.amount.toLocaleString('vi-VN')}đ qua mã QR. Vui lòng kiểm tra sao kê.`,
            type: 'payment'
        });
        this.saveState();
        return {
            success: true,
            message: 'Đã gửi xác nhận chuyển khoản! Quản trị viên Pet Phết sẽ đối chiếu giao dịch và cập nhật trạng thái trong ít phút.'
        };
    }
    reconcilePayment(paymentId, isApproved, adminUserId) {
        if (this.state.currentUser.role !== 'admin' || this.state.currentUser.id !== adminUserId)
            return { success: false, message: 'Chỉ Admin đang đăng nhập mới được đối chiếu giao dịch.' };
        this.expireOverdueQrBookings();
        const payment = this.state.payments.find((p) => p.id === paymentId);
        if (!payment)
            return { success: false, message: 'Không tìm thấy giao dịch.' };
        const booking = this.state.bookings.find((b) => b.id === payment.booking_id);
        if (!booking)
            return { success: false, message: 'Không tìm thấy booking tương ứng.' };
        if (booking.payment_method !== 'QR' || payment.payment_method !== 'QR')
            return { success: false, message: 'Chỉ hỗ trợ đối chiếu các giao dịch QR.' };
        if (payment.payment_status !== 'pending_reconcile')
            return { success: false, message: 'Giao dịch không ở trạng thái chờ đối chiếu.' };
        if (['cancelled', 'completed', 'no_show'].includes(booking.status))
            return { success: false, message: 'Đơn đã kết thúc, không thể đối chiếu thanh toán.' };
        if (isApproved) {
            payment.payment_status = 'paid';
            payment.verified_by = adminUserId;
            payment.verified_at = new Date().toISOString();
            booking.payment_status = 'paid';
            // Automatically confirm booking if it was pending
            if (booking.status === 'pending') {
                booking.status = 'confirmed';
            }
            this.addNotification({
                user_id: booking.user_id,
                target_role: 'customer',
                title: `Thanh toán thành công #${booking.id}! 💳`,
                content: `Pet Phết đã đối chiếu và xác nhận nhận được ${payment.amount.toLocaleString('vi-VN')}đ. Lịch hẹn của bé đã được xác nhận.`,
                type: 'payment'
            });
        }
        else {
            payment.payment_status = 'failed';
            booking.payment_status = 'failed';
            this.addNotification({
                user_id: booking.user_id,
                target_role: 'customer',
                title: `Thanh toán chưa hợp lệ #${booking.id}`,
                content: `Chưa tìm thấy sao kê khớp với nội dung chuyển khoản. Vui lòng liên hệ hotline Pet Phết hoặc thanh toán trực tiếp tại cơ sở.`,
                type: 'payment'
            });
        }
        this.saveState();
        return { success: true, message: isApproved ? 'Đối chiếu thành công, đã ghi nhận đã thanh toán.' : 'Đã đánh dấu đối chiếu không khớp.' };
    }
    // --- REVIEWS & PET POINTS ---
    getReviews() {
        return [...this.state.reviews].sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    getReviewsByService(serviceId) {
        return this.getReviews().filter((review) => review.service_id === serviceId);
    }
    getLatestReviewsByService(serviceId) {
        return this.getReviewsByService(serviceId).slice(0, 5);
    }
    getFeaturedReviews() {
        const reviewsById = new Map(this.state.reviews.map((review) => [review.id, review]));
        const featured = demoReviewData.featuredReviewIds
            .map((reviewId) => reviewsById.get(reviewId))
            .filter((review) => Boolean(review));
        const fallbackReviews = this.getReviews().filter((review) => !demoReviewData.featuredReviewIds.includes(review.id));
        return [...featured, ...fallbackReviews].slice(0, 3);
    }
    getReviewsByUser(userId) {
        if (this.state.currentUser.role !== 'admin' && this.state.currentUser.id !== userId)
            return [];
        return this.state.reviews.filter((review) => review.user_id === userId);
    }
    refreshServiceRating(serviceId) {
        const service = this.state.services.find((item) => item.id === serviceId);
        if (!service)
            return;
        const currentReviews = this.state.reviews.filter((review) => review.service_id === serviceId);
        service.rating_count = currentReviews.length;
        service.rating_avg = currentReviews.length
            ? Number((currentReviews.reduce((sum, review) => sum + review.rating, 0) / currentReviews.length).toFixed(1))
            : 0;
    }
    updateReview(params) {
        const review = this.state.reviews.find((item) => item.id === params.reviewId);
        if (!review || review.user_id !== params.userId || this.state.currentUser.id !== params.userId)
            return { success: false, message: 'Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa.' };
        if (!Number.isInteger(params.rating) || params.rating < 1 || params.rating > 5)
            return { success: false, message: 'Điểm đánh giá phải từ 1 đến 5 sao.' };
        if (!params.comment.trim())
            return { success: false, message: 'Nội dung đánh giá không được để trống.' };
        review.rating = params.rating;
        review.comment = params.comment.trim();
        if (params.imageUrl !== undefined)
            review.image_url = params.imageUrl;
        review.updated_at = new Date().toISOString();
        this.refreshServiceRating(review.service_id);
        this.saveState();
        return { success: true, message: 'Đã cập nhật đánh giá của bạn.' };
    }
    deleteReview(reviewId, userId) {
        const index = this.state.reviews.findIndex((item) => item.id === reviewId && item.user_id === userId);
        if (index < 0 || this.state.currentUser.id !== userId)
            return { success: false, message: 'Không tìm thấy đánh giá hoặc bạn không có quyền xóa.' };
        const [review] = this.state.reviews.splice(index, 1);
        const booking = this.state.bookings.find((item) => item.id === review.booking_id);
        if (booking)
            booking.is_reviewed = false;
        // Reverse the reward while retaining an auditable Pet Point ledger entry.
        if (review.points_awarded > 0) {
            this.state.petPoints.unshift({
                id: `pt-reverse-${Date.now()}`,
                user_id: userId,
                amount: -review.points_awarded,
                type: 'system_adjustment',
                reference_id: review.id,
                description: `Thu hồi ${review.points_awarded.toLocaleString('vi-VN')} Pet Point do xóa đánh giá #${review.id}`,
                created_at: new Date().toISOString()
            });
        }
        this.refreshServiceRating(review.service_id);
        this.saveState();
        return { success: true, message: 'Đã xóa đánh giá. Điểm thưởng của đánh giá cũng đã được điều chỉnh lại.' };
    }
    createReview(params) {
        const booking = this.state.bookings.find((b) => b.id === params.bookingId);
        if (!booking || booking.user_id !== params.userId || this.state.currentUser.id !== params.userId)
            return { success: false, message: 'Không tìm thấy lịch hẹn hoặc bạn không có quyền đánh giá.' };
        if (!Number.isInteger(params.rating) || params.rating < 1 || params.rating > 5)
            return { success: false, message: 'Điểm đánh giá phải từ 1 đến 5 sao.' };
        if (!params.comment.trim())
            return { success: false, message: 'Vui lòng nhập nội dung đánh giá.' };
        if (booking.status !== 'completed') {
            return { success: false, message: 'Chỉ có thể đánh giá sau khi lịch hẹn đã Hoàn thành.' };
        }
        const existingReview = this.state.reviews.find((r) => r.booking_id === params.bookingId);
        if (existingReview) {
            return { success: false, message: 'Mỗi lịch hẹn chỉ được đánh giá 1 lần duy nhất.' };
        }
        const newReview = {
            id: `rev-${Date.now()}`,
            booking_id: booking.id,
            service_id: booking.service_id,
            user_id: booking.user_id,
            user_name: booking.user_name,
            pet_name: booking.pet_name,
            rating: params.rating,
            comment: params.comment,
            image_url: params.imageUrl,
            points_awarded: PET_POINT_REVIEW_REWARD,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        booking.is_reviewed = true;
        this.state.reviews.unshift(newReview);
        // Atomically award exactly 1,000 Pet Points
        const pointTx = {
            id: `pt-${Date.now()}`,
            user_id: booking.user_id,
            amount: PET_POINT_REVIEW_REWARD,
            type: 'earn_review',
            reference_id: booking.id,
            description: `Thưởng 1.000 Pet Point khi đánh giá lịch hẹn #${booking.id}`,
            created_at: new Date().toISOString()
        };
        this.state.petPoints.unshift(pointTx);
        // Keep service rating statistics derived from its own review records only.
        this.refreshServiceRating(booking.service_id);
        this.addNotification({
            user_id: booking.user_id,
            target_role: 'customer',
            title: '+1.000 Pet Point thưởng đánh giá! 🌟',
            content: 'Cảm ơn bạn đã chia sẻ trải nghiệm. 1.000 Pet Point đã được cộng vào ví của bạn!',
            type: 'points'
        });
        this.addNotification({
            target_role: 'admin',
            title: `Đánh giá mới cho ${booking.service_name}`,
            content: `Khách hàng ${booking.user_name} đánh giá ${params.rating} sao: "${params.comment.slice(0, 50)}..."`,
            type: 'review'
        });
        this.saveState();
        return {
            success: true,
            message: 'Cảm ơn bạn đã đánh giá! Bạn được nhận thưởng 1.000 Pet Point.',
            review: newReview,
            pointsAwarded: PET_POINT_REVIEW_REWARD
        };
    }
    replyReview(reviewId, replyText) {
        if (this.state.currentUser.role !== 'admin')
            return { success: false, message: 'Chỉ Admin mới được phản hồi đánh giá.' };
        const review = this.state.reviews.find((r) => r.id === reviewId);
        if (!review)
            return { success: false, message: 'Không tìm thấy đánh giá.' };
        review.admin_reply = replyText;
        review.admin_replied_at = new Date().toISOString();
        review.updated_at = new Date().toISOString();
        this.addNotification({
            user_id: review.user_id,
            target_role: 'customer',
            title: 'Pet Phết đã phản hồi đánh giá của bạn ❤️',
            content: `Quản trị viên đã phản hồi: "${replyText.slice(0, 60)}..."`,
            type: 'review'
        });
        this.saveState();
        return { success: true, message: 'Đã gửi phản hồi đánh giá thành công.' };
    }
    getUserPetPoints(userId) {
        return this.state.petPoints
            .filter((tx) => tx.user_id === userId)
            .reduce((sum, tx) => sum + tx.amount, 0);
    }
    getPetPointTransactions(userId) {
        return this.state.petPoints.filter((tx) => tx.user_id === userId);
    }
    // --- COUPONS ---
    getCoupons() {
        return this.state.coupons;
    }
    addCoupon(couponData) {
        if (this.state.currentUser.role !== 'admin')
            throw new Error('Chỉ Admin mới được tạo mã giảm giá.');
        const newCoupon = {
            ...couponData,
            id: `cp-${Date.now()}`,
            used_count: 0
        };
        this.state.coupons.push(newCoupon);
        this.saveState();
        return newCoupon;
    }
    updateCoupon(id, updates) {
        if (this.state.currentUser.role !== 'admin')
            throw new Error('Chỉ Admin mới được cập nhật mã giảm giá.');
        this.state.coupons = this.state.coupons.map((c) => c.id === id ? { ...c, ...updates } : c);
        this.saveState();
    }
    // --- NOTIFICATIONS ---
    getNotifications(role, userId) {
        return this.state.notifications.filter((n) => {
            if (role === 'admin') {
                return n.target_role === 'admin' || n.target_role === 'all';
            }
            return (n.target_role === 'customer' || n.target_role === 'all') && (!n.user_id || n.user_id === userId);
        });
    }
    addNotification(notif) {
        const newN = {
            ...notif,
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            is_read: false,
            created_at: new Date().toISOString()
        };
        this.state.notifications.unshift(newN);
        this.saveState();
    }
    markNotificationAsRead(notifId) {
        const n = this.state.notifications.find((item) => item.id === notifId);
        if (n) {
            n.is_read = true;
            this.saveState();
        }
    }
    markAllNotificationsRead(role, userId) {
        this.state.notifications = this.state.notifications.map((n) => {
            if (role === 'admin' && (n.target_role === 'admin' || n.target_role === 'all')) {
                return { ...n, is_read: true };
            }
            if (role === 'customer' && (n.target_role === 'customer' || n.target_role === 'all') && (!n.user_id || n.user_id === userId)) {
                return { ...n, is_read: true };
            }
            return n;
        });
        this.saveState();
    }
}
export const store = new StoreService();
