import test from 'node:test';
import assert from 'node:assert/strict';
import './test-setup.js';
import { buildMonthGrid, getBookingMarkersByDate, getRescheduleDeadline, isWithinRescheduleWindow, toDateKey } from '../services/bookingEngine.js';
import { clearSession, getInitialTab, readSessionUserId, restoreSession, saveSession } from '../services/sessionService.js';
import { askChatbot, buildGeminiContents, buildSystemPrompt, resetChatbotConfigCache } from '../services/chatbotService.js';
import { fitWithin, validateImageFile } from '../js/utils/image.js';

const memoryStorage = () => {
    const data = new Map();
    return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key) };
};
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: memoryStorage() });
const { store } = await import('../services/store.js');

const localDatePlus = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return toDateKey(date);
};

// ---------------------------------------------------------------- reschedule within 1 day of ordering
test('Reschedule window is 24 hours from the moment the order was placed', () => {
    const created = '2026-11-05T10:00:00.000Z';
    assert.equal(getRescheduleDeadline(created).toISOString(), '2026-11-06T10:00:00.000Z');
    assert.equal(isWithinRescheduleWindow(created, new Date('2026-11-06T09:59:59.000Z')), true);
    assert.equal(isWithinRescheduleWindow(created, new Date('2026-11-06T10:00:00.000Z')), true);
    assert.equal(isWithinRescheduleWindow(created, new Date('2026-11-06T10:00:01.000Z')), false);
    assert.equal(isWithinRescheduleWindow('not-a-date'), false);
});

test('StoreService only reschedules within 1 day of ordering', () => {
    const customer = store.getCurrentUser();
    const pet = store.getPetsByUser(customer.id)[0];
    let offset = 9;
    while (store.getBookings().some((item) => item.booking_date === localDatePlus(offset) || item.booking_date === localDatePlus(offset + 1))) offset += 1;
    const bookingDate = localDatePlus(offset);
    const newDate = localDatePlus(offset + 1);
    store.setCurrentUser(store.getUserByIdentity('admin@petphet.vn'));
    for (const date of [bookingDate, newDate]) {
        store.updateSchedule(date, { start_time: '08:00', end_time: '20:00', is_available: true, max_concurrent_capacity: 2, slot_duration_minutes: 30 });
    }
    store.setCurrentUser(store.getUserByIdentity('khachhang@petphet.vn'));
    const created = store.createBooking({ userId: customer.id, petId: pet.id, serviceId: 'srv-vet-01', bookingDate, bookingTime: '10:00', paymentMethod: 'COD' });
    assert.equal(created.success, true, created.message);

    const fresh = store.rescheduleBooking(created.booking.id, customer.id, newDate, '10:30');
    assert.equal(fresh.success, true, fresh.message);

    // Pretend the order was placed 25 hours ago.
    store.getBookingById(created.booking.id).created_at = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const late = store.rescheduleBooking(created.booking.id, customer.id, newDate, '11:00');
    assert.equal(late.success, false);
    assert.match(late.message, /1 ngày/);
});

// ---------------------------------------------------------------- booking calendar
test('Calendar markers: ring for pending, dot for confirmed, nothing for cancelled or other customers', () => {
    const bookings = [
        { user_id: 'u1', booking_date: '2026-11-10', status: 'pending' },
        { user_id: 'u1', booking_date: '2026-11-11', status: 'confirmed' },
        { user_id: 'u1', booking_date: '2026-11-12', status: 'cancelled' },
        { user_id: 'u1', booking_date: '2026-11-13', status: 'pending' },
        { user_id: 'u1', booking_date: '2026-11-13', status: 'confirmed' },
        { user_id: 'u2', booking_date: '2026-11-14', status: 'confirmed' }
    ];
    const markers = getBookingMarkersByDate(bookings, 'u1');
    assert.deepEqual(markers['2026-11-10'], { pending: true, confirmed: false });
    assert.deepEqual(markers['2026-11-11'], { pending: false, confirmed: true });
    assert.equal(markers['2026-11-12'], undefined);
    assert.deepEqual(markers['2026-11-13'], { pending: true, confirmed: true });
    assert.equal(markers['2026-11-14'], undefined);
});

test('Month grid starts on Monday and is padded to full weeks', () => {
    const weeks = buildMonthGrid(2026, 10); // November 2026 starts on a Sunday
    assert.ok(weeks.every((week) => week.length === 7));
    assert.deepEqual(weeks[0].slice(0, 6), [null, null, null, null, null, null]);
    assert.equal(weeks[0][6], '2026-11-01');
    assert.equal(weeks.flat().filter(Boolean).length, 30);
    assert.equal(weeks.flat().filter(Boolean).at(-1), '2026-11-30');
});

// ---------------------------------------------------------------- login session
test('Session is saved, restored after a reload and cleared on logout', () => {
    const storage = memoryStorage();
    const customer = store.getUserByIdentity('khachhang@petphet.vn');
    assert.equal(readSessionUserId(storage), null);
    saveSession(customer, storage);
    assert.equal(readSessionUserId(storage), customer.id);
    assert.equal(restoreSession(store, storage)?.id, customer.id);
    clearSession(storage);
    assert.equal(restoreSession(store, storage), null);
});

test('A session for a deleted account is discarded and corrupted storage is ignored', () => {
    const storage = memoryStorage();
    storage.setItem('pet_phet_session_v1', JSON.stringify({ userId: 'usr-missing' }));
    assert.equal(restoreSession(store, storage), null);
    assert.equal(readSessionUserId(storage), null);
    storage.setItem('pet_phet_session_v1', '{broken json');
    assert.equal(readSessionUserId(storage), null);
});

test('First screen after reload: admin dashboard, customer page from the URL hash, otherwise landing', () => {
    assert.equal(getInitialTab(null, '#pets'), 'landing');
    assert.equal(getInitialTab({ role: 'admin' }, '#pets'), 'admin-dashboard');
    assert.equal(getInitialTab({ role: 'customer' }, '#my-bookings'), 'my-bookings');
    assert.equal(getInitialTab({ role: 'customer' }, '#payment'), 'landing');
    assert.equal(getInitialTab({ role: 'customer' }, '#admin-dashboard'), 'landing');
});

// ---------------------------------------------------------------- avatar upload checks
test('Avatar upload accepts small PNG/JPG/WebP only and scales images down', () => {
    assert.equal(validateImageFile({ type: 'image/png', size: 1024 }), null);
    assert.match(validateImageFile({ type: 'application/pdf', size: 1024 }), /PNG, JPG hoặc WebP/);
    assert.match(validateImageFile({ type: 'image/jpeg', size: 6 * 1024 * 1024 }), /5 MB/);
    assert.deepEqual(fitWithin(2000, 1000, 400), { width: 400, height: 200 });
    assert.deepEqual(fitWithin(300, 200, 400), { width: 300, height: 200 });
});

// ---------------------------------------------------------------- chatbot API with fallback
const services = store.getServices(true);
const configResponse = (config) => ({ ok: true, json: async () => config });

test('Chatbot falls back to the built-in answers when no API key is configured', async () => {
    resetChatbotConfigCache();
    const calls = [];
    const fetchImpl = async (url) => {
        calls.push(String(url));
        return configResponse({ enabled: true, apiKey: '' });
    };
    const result = await askChatbot({ question: 'Giờ làm việc của Pet Phết?', services, fetchImpl, storage: memoryStorage() });
    assert.equal(result.source, 'rules');
    assert.match(result.text, /08:00–20:00/);
    assert.equal(calls.length, 1); // only the config file was requested, no AI call
});

test('Chatbot calls Gemini when a key is configured and sends the live service catalog', async () => {
    resetChatbotConfigCache();
    const requests = [];
    const fetchImpl = async (url, init) => {
        if (String(url).includes('chatbot-config')) return configResponse({ enabled: true, apiKey: 'test-key', model: 'gemini-test' });
        requests.push({ url: String(url), init });
        return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Xin chào từ AI' }] } }] }) };
    };
    const history = [
        { sender: 'bot', text: 'Chào bạn' },
        { sender: 'user', text: 'Cho mình hỏi giá' },
        { sender: 'bot', text: 'Dạ mức giá...' }
    ];
    const result = await askChatbot({ question: 'Spa bao lâu?', history, assistant: 'cun', services, fetchImpl, storage: memoryStorage() });
    assert.deepEqual(result, { text: 'Xin chào từ AI', source: 'api' });
    assert.equal(requests.length, 1);
    assert.ok(requests[0].url.endsWith('/models/gemini-test:generateContent'));
    assert.equal(requests[0].init.headers['x-goog-api-key'], 'test-key');
    const body = JSON.parse(requests[0].init.body);
    assert.equal(body.contents[0].role, 'user'); // a Gemini conversation must start with a user turn
    assert.equal(body.contents.at(-1).parts[0].text, 'Spa bao lâu?');
    assert.ok(body.systemInstruction.parts[0].text.includes(services[0].service_name));
});

test('Chatbot uses a backend proxy URL when one is configured (no key in the browser)', async () => {
    resetChatbotConfigCache();
    let proxyBody;
    const fetchImpl = async (url, init) => {
        if (String(url).includes('chatbot-config')) return configResponse({ enabled: true, proxyUrl: 'https://example.test/chat' });
        assert.equal(String(url), 'https://example.test/chat');
        proxyBody = JSON.parse(init.body);
        return { ok: true, json: async () => ({ reply: 'Trả lời từ máy chủ' }) };
    };
    const result = await askChatbot({ question: 'Xin chào', services, fetchImpl, storage: memoryStorage() });
    assert.deepEqual(result, { text: 'Trả lời từ máy chủ', source: 'api' });
    assert.equal(proxyBody.question, 'Xin chào');
});

test('Chatbot falls back to the built-in answers when the API fails', async () => {
    resetChatbotConfigCache();
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
        const fetchImpl = async (url) => {
            if (String(url).includes('chatbot-config')) return configResponse({ enabled: true, apiKey: 'test-key' });
            return { ok: false, status: 503, json: async () => ({}) };
        };
        const result = await askChatbot({ question: 'Hướng dẫn đặt lịch', services, fetchImpl, storage: memoryStorage() });
        assert.equal(result.source, 'rules');
        assert.match(result.text, /Chọn dịch vụ/);
    } finally {
        console.warn = originalWarn;
    }
});

test('Gemini conversation helper drops a leading bot greeting and keeps the newest turns', () => {
    const contents = buildGeminiContents([
        { sender: 'bot', text: 'Greeting' },
        { sender: 'user', text: 'Q1' },
        { sender: 'bot', text: 'A1' }
    ], 'Q2', 8);
    assert.deepEqual(contents.map((item) => item.role), ['user', 'model', 'user']);
    assert.ok(buildSystemPrompt({ services, assistant: 'meo' }).includes('Mèo Bông'));
    assert.ok(buildSystemPrompt({ services, assistant: 'cun' }).includes('1 ngày'));
});
