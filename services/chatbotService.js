/**
 * Chatbot business logic (no UI).
 *
 * 1. askChatbot() sends the question to an AI API when one is configured (data/chatbot-config.json or a key
 *    saved in localStorage) and builds the prompt from the live service catalog.
 * 2. When no API is configured, or the API fails/times out, it falls back to the built-in rule based answers
 *    below, so the chatbot keeps working exactly as before.
 *
 * SECURITY: an API key placed in a static website is visible to every visitor. For production set `proxyUrl`
 * to your own backend endpoint (the key then stays on the server) or restrict the key by HTTP referrer.
 */
import { formatVND } from './bookingEngine.js';

// ---------------------------------------------------------------------------
// Built-in rule based answers (offline fallback)
// ---------------------------------------------------------------------------
export const normalizeText = (value) => value
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const containsAny = (value, terms) => terms.some((term) => value.includes(normalizeText(term)));
function serviceSummary(service) {
    const price = service.is_weight_based
        ? `Giá hiện từ ${formatVND(service.base_price)} và thay đổi theo cân nặng.`
        : `Giá niêm yết hiện tại là ${formatVND(service.base_price)}.`;
    const tiers = service.is_weight_based && service.pricing_tiers?.length
        ? ` Bảng giá theo cân nặng: ${service.pricing_tiers.map((tier) => `${tier.min_weight}–${tier.max_weight}kg ${formatVND(tier.price)}`).join('; ')}.`
        : '';
    return `${service.service_name}: ${service.description} Thời lượng khoảng ${service.duration_minutes} phút, tiếp nhận ${service.species_supported.join(' và ')}. ${price}${tiers}`;
}
export function buildAssistantReply(rawQuestion, services) {
    const question = normalizeText(rawQuestion);
    const serviceMatch = services.find((service) => {
        const name = normalizeText(service.service_name);
        if (question.includes(name))
            return true;
        const words = name.split(' ').filter((word) => word.length > 3);
        return words.length >= 2 && words.filter((word) => question.includes(word)).length >= 2;
    });
    if (serviceMatch)
        return serviceSummary(serviceMatch);
    if (containsAny(question, ['xin chao', 'chao', 'hello', 'hi', 'alo', 'gâu'])) {
        return 'Xin chào bạn và bé cưng! 🐾 Mình là trợ lý Cún Phết. Mình có thể tư vấn dịch vụ, giá theo cân nặng, đặt lịch, thanh toán, hồ sơ thú cưng, lịch hẹn và Pet Point. Bạn đang cần hỗ trợ phần nào nè?';
    }
    if (containsAny(question, ['cam on', 'thanks', 'thank you', 'tuyet voi'])) {
        return 'Dạ, Pet Phết rất vui được hỗ trợ bạn! Chúc bạn và bé cưng có một ngày thật nhiều niềm vui. Nếu cần xem dịch vụ hoặc đặt lịch, cứ nhắn mình nhé. 🧡';
    }
    if (containsAny(question, ['gio mo cua', 'gio lam viec', 'may gio', 'mo cua', 'dong cua', 'ngay le'])) {
        return 'Pet Phết phục vụ từ Thứ 2 đến Chủ Nhật, 08:00–20:00. Ngày lễ có thể tiếp nhận khi bạn đặt trước. Bạn nên chọn ngày và khung giờ còn chỗ trên màn hình Đặt lịch nhé.';
    }
    if (containsAny(question, ['dia chi', 'o dau', 'chi nhanh', 'duong nao', 'ban o dau'])) {
        return 'Địa chỉ mẫu hiện trên website: 123 Đường Thú Cưng Yêu Thương, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh. Bạn nên liên hệ trước qua hotline 0909.123.456 để xác nhận thông tin cơ sở.';
    }
    if (containsAny(question, ['hotline', 'so dien thoai', 'lien he', 'email'])) {
        return 'Bạn có thể liên hệ Pet Phết qua hotline 0909.123.456 hoặc email contact@petphet.vn. Với tình huống sức khỏe khẩn cấp, hãy đưa bé đến cơ sở thú y gần nhất thay vì chờ phản hồi chatbot.';
    }
    if (containsAny(question, ['gia', 'bao nhieu tien', 'bang gia', 'phi dich vu', 'gia ca', 'tinh tien'])) {
        const lines = services.slice(0, 6).map((service) => `• ${service.service_name}: ${service.is_weight_based ? `từ ${formatVND(service.base_price)} (theo cân nặng)` : formatVND(service.base_price)}`).join('\n');
        return `Mình gửi bạn một số mức giá đang hiển thị trong danh mục:\n${lines}\n\nGiá cuối cùng có thể phụ thuộc cân nặng và tình trạng thực tế của bé. Bạn nhấn vào thẻ dịch vụ để xem mô tả và bảng giá chi tiết nhé.`;
    }
    if (containsAny(question, ['can nang', 'kg', 'kilogram', 'nang bao nhieu'])) {
        return 'Một số dịch vụ Spa & Grooming áp dụng giá theo cân nặng. Khi đặt lịch, bạn chọn hồ sơ thú cưng và xác nhận cân nặng hiện tại; hệ thống sẽ tính theo bậc giá tương ứng. Bạn nên cập nhật cân nặng gần nhất để dự toán chính xác hơn.';
    }
    if (containsAny(question, ['dich vu', 'spa', 'grooming', 'tam', 'cat tia', 'tiem', 'vaccine', 'thu y', 'kham benh'])) {
        const lines = services.slice(0, 7).map((service) => `• ${service.service_name} – ${service.duration_minutes} phút – ${service.is_weight_based ? `từ ${formatVND(service.base_price)}` : formatVND(service.base_price)}`).join('\n');
        return `Pet Phết hiện có các dịch vụ đang mở:\n${lines}\n\nBạn mở mục Dịch vụ và chạm vào bất kỳ thẻ dịch vụ nào để xem chi tiết, bảng giá và đánh giá trước khi đặt lịch.`;
    }
    if (containsAny(question, ['dat lich', 'booking', 'hen lich', 'lich hen', 'lich trong'])) {
        return 'Bạn có thể đặt lịch theo các bước: 1) Chọn dịch vụ; 2) Chọn hồ sơ thú cưng; 3) Chọn ngày và khung giờ còn chỗ; 4) Kiểm tra giá tạm tính, ghi chú và mã giảm giá; 5) Chọn COD hoặc QR rồi xác nhận. Hệ thống sẽ kiểm tra lại sức chứa trước khi tạo lịch.';
    }
    if (containsAny(question, ['khong thay gio', 'het cho', 'khong con lich', 'khung gio trong', 'ngay nghi'])) {
        return 'Khung giờ chỉ hiện khi cơ sở mở cửa và còn đủ sức chứa cho toàn bộ thời lượng dịch vụ. Nếu ngày bạn chọn không còn chỗ, hãy thử ngày khác hoặc chọn dịch vụ có thời lượng phù hợp hơn.';
    }
    if (containsAny(question, ['huy lich', 'huy don', 'cancel'])) {
        return 'Bạn mở mục Lịch sử đặt lịch trong menu Tài khoản, chọn đơn cần xem và gửi yêu cầu hủy nếu đơn còn ở trạng thái cho phép. Đơn QR đã chuyển khoản hoặc đang chờ đối chiếu sẽ cần được xử lý thanh toán trước, nên hệ thống có thể khóa thao tác hủy trực tiếp.';
    }
    if (containsAny(question, ['doi lich', 'doi ngay', 'doi gio', 'reschedule'])) {
        return 'Bạn vào Lịch sử đặt lịch trong menu Tài khoản và chọn Đổi lịch trên đơn còn ở trạng thái cho phép. Lưu ý: chỉ đổi lịch được trong vòng 1 ngày (24 giờ) kể từ khi đặt đơn. Hệ thống sẽ kiểm tra ngày, giờ hoạt động, thời lượng dịch vụ và sức chứa trước khi lưu lịch mới.';
    }
    if (containsAny(question, ['qr loi', 'qr het han', 'chua thanh toan', 'chuyen khoan roi', 'da chuyen khoan'])) {
        return 'Nếu chọn QR, bạn hãy kiểm tra đúng số tiền và nội dung chuyển khoản theo đơn. Khi đã chuyển khoản, đừng tạo thanh toán lặp lại; hãy giữ lại biên nhận và liên hệ hotline 0909.123.456 để được đối chiếu. Đơn QR quá hạn 15 phút có thể tự động hủy và giải phóng chỗ.';
    }
    if (containsAny(question, ['thanh toan', 'tra tien', 'cod', 'qr', 'chuyen khoan', 'quet ma'])) {
        return 'Pet Phết hỗ trợ hai phương thức: COD – thanh toán trực tiếp sau khi sử dụng dịch vụ; QR – quét mã và chuyển khoản theo nội dung đơn. Với QR, chỗ được giữ tạm trong 15 phút; Admin cần đối chiếu khoản tiền trước khi xác nhận lịch.';
    }
    if (containsAny(question, ['pet point', 'diem thuong', 'tich diem', '1 000 diem', '1000 diem'])) {
        return 'Bạn nhận 1.000 Pet Point khi gửi đánh giá hợp lệ cho đơn dịch vụ đã hoàn thành. Điểm sẽ được cộng vào tài khoản sau khi đánh giá được lưu thành công.';
    }
    if (containsAny(question, ['danh gia', 'review', 'viet nhan xet', 'cham sao'])) {
        return 'Bạn chỉ có thể đánh giá đơn đã hoàn thành và thuộc tài khoản của mình. Vào Lịch sử đặt lịch trong menu Tài khoản, chọn đơn hoàn thành, chấm từ 1 đến 5 sao và viết nhận xét. Mỗi đánh giá hợp lệ được thưởng 1.000 Pet Point.';
    }
    if (containsAny(question, ['ho so', 'them thu cung', 'them be', 'pet profile', 'can nang cua be'])) {
        return 'Vào mục Thú cưng → Thêm hồ sơ. Bạn cần nhập tên và loài; các thông tin như giống, giới tính, ngày sinh, cân nặng và lưu ý sức khỏe giúp Pet Phết tư vấn dịch vụ phù hợp hơn. Một tài khoản có thể quản lý nhiều bé.';
    }
    if (containsAny(question, ['dang ky', 'tao tai khoan', 'quen mat khau', 'dang nhap', 'mat khau'])) {
        return 'Bạn chọn Đăng ký để tạo tài khoản khách hàng bằng họ tên, email, số điện thoại và mật khẩu. Nếu đã có tài khoản, chọn Đăng nhập. Chức năng quên mật khẩu trong bản demo dùng OTP mô phỏng 123456.';
    }
    if (containsAny(question, ['ma giam gia', 'voucher', 'coupon', 'khuyen mai', 'uu dai'])) {
        return 'Bạn nhập mã giảm giá trong bước xác nhận đặt lịch. Hệ thống sẽ kiểm tra thời hạn và điều kiện áp dụng trước khi tính tổng tiền. Nếu mã không hợp lệ, bạn có thể bỏ mã và tiếp tục đặt lịch.';
    }
    if (containsAny(question, ['benh', 'chan thuong', 'non', 'bo an', 'kho tho', 'co giat', 'ngat', 'ngung tho'])) {
        return 'Mình không thể chẩn đoán bệnh qua chat. Nếu bé khó thở, co giật, chảy máu nhiều, ngất hoặc có dấu hiệu nguy hiểm, hãy đưa bé đến cơ sở thú y gần nhất ngay. Với nhu cầu khám định kỳ, bạn có thể xem nhóm dịch vụ Thú y của Pet Phết.';
    }
    if (containsAny(question, ['long roi', 'rụng lông', 'ngua', 'ngua ngay', 've sinh tai', 've sinh mong', 'cham soc long'])) {
        return 'Bạn nên chải lông phù hợp với loại lông, giữ vùng tai và bàn chân sạch, đồng thời tránh dùng sản phẩm của người cho thú cưng. Nếu bé ngứa kéo dài, rụng lông thành mảng, có mùi hoặc da đỏ, hãy đặt lịch khám thú y để được kiểm tra nguyên nhân thay vì tự dùng thuốc.';
    }
    if (containsAny(question, ['tiem phong', 'vaccin', 'vacxin', 'lich tiem', 'mui tiem'])) {
        return 'Lịch tiêm phòng cần căn cứ vào loài, độ tuổi, tiền sử tiêm và tình trạng sức khỏe của bé. Bạn có thể xem dịch vụ tiêm vaccine trên website và tạo hồ sơ thú cưng trước; bác sĩ sẽ xác nhận loại vaccine và lịch phù hợp khi tiếp nhận.';
    }
    if (containsAny(question, ['triet san', 'steril', 'sinh san', 'dong duc'])) {
        return 'Triệt sản cần được bác sĩ thú y thăm khám và đánh giá độ tuổi, thể trạng cùng các rủi ro gây mê trước khi chỉ định. Bạn có thể tìm dịch vụ thú y trên Pet Phết để gửi yêu cầu tư vấn; chatbot không thể xác nhận bé đủ điều kiện phẫu thuật.';
    }
    if (containsAny(question, ['cho an', 'thuc an', 'an gi', 'dinh duong', 'hat cho', 'pate'])) {
        return 'Khẩu phần nên phù hợp với loài, độ tuổi, cân nặng, mức vận động và bệnh nền của bé. Hãy đổi thức ăn từ từ, luôn có nước sạch và không cho bé ăn thực phẩm độc với chó mèo như chocolate, hành, tỏi hoặc nho. Nếu cần chế độ ăn điều trị, hãy hỏi bác sĩ thú y.';
    }
    if (containsAny(question, ['bao lau', 'mat bao lau', 'thoi gian spa', 'thoi luong'])) {
        return `Thời lượng phụ thuộc vào dịch vụ cụ thể. ${services.slice(0, 5).map((service) => `${service.service_name}: khoảng ${service.duration_minutes} phút`).join('; ')}. Bạn mở thẻ dịch vụ để xem thời lượng chính xác trước khi chọn khung giờ.`;
    }
    if (containsAny(question, ['dat lai', 'dat cho hai be', 'nhieu thu cung', '2 be', 'hai be'])) {
        return 'Bạn có thể tạo nhiều hồ sơ thú cưng trong cùng tài khoản. Khi đặt lịch, hãy chọn đúng hồ sơ cho từng lượt đặt; hệ thống sẽ kiểm tra sức chứa riêng theo khung giờ và nhóm dịch vụ. Nếu đặt cho nhiều bé, bạn nên kiểm tra từng lượt để tránh trùng hoặc hết chỗ.';
    }
    if (containsAny(question, ['cho', 'meo', 'thu cung', 'be cung', 'cach cham soc'])) {
        return 'Pet Phết phục vụ cả chó và mèo. Bạn nên tạo hồ sơ riêng cho từng bé, cập nhật cân nặng và lưu ý sức khỏe; khi chọn dịch vụ, hệ thống sẽ hiển thị nhóm thú cưng được tiếp nhận.';
    }
    const topicHints = ['giá và bảng giá', 'dịch vụ spa/grooming/thú y', 'đặt lịch và đổi/hủy lịch', 'COD/QR', 'hồ sơ thú cưng', 'đánh giá và Pet Point', 'giờ làm việc và liên hệ'];
    return `Mình chưa nắm rõ ý bạn ở câu “${rawQuestion.trim()}”. Bạn có thể hỏi cụ thể hơn về ${topicHints.join(', ')}. Nếu bạn mô tả tên dịch vụ hoặc vấn đề đang gặp, mình sẽ tìm thông tin phù hợp trong dữ liệu Pet Phết nhé.`;
}

// ---------------------------------------------------------------------------
// AI API
// ---------------------------------------------------------------------------
export const API_KEY_STORAGE_KEY = 'pet_phet_chatbot_api_key';
export const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_QUESTION_LENGTH = 600;

export const DEFAULT_CHATBOT_CONFIG = {
    enabled: true,
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: '',
    proxyUrl: '',
    timeoutMs: 15000,
    temperature: 0.4,
    maxOutputTokens: 600,
    maxHistoryMessages: 8
};

let configPromise = null;

/** Loads data/chatbot-config.json once. A missing or broken file simply means "no API configured". */
export function loadChatbotConfig(fetchImpl = globalThis.fetch) {
    configPromise ??= (async () => {
        try {
            const response = await fetchImpl(new URL('../data/chatbot-config.json', import.meta.url));
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            return { ...DEFAULT_CHATBOT_CONFIG, ...(await response.json()) };
        }
        catch {
            return { ...DEFAULT_CHATBOT_CONFIG };
        }
    })();
    return configPromise;
}
/** Test helper: forget the cached configuration. */
export function resetChatbotConfigCache() {
    configPromise = null;
}

export function resolveApiKey(config, storage = globalThis.localStorage) {
    if (config.apiKey)
        return config.apiKey;
    try {
        return storage?.getItem(API_KEY_STORAGE_KEY) || '';
    }
    catch {
        return '';
    }
}

/** Facts and rules the AI may rely on. Service names and prices come from the live catalog. */
export function buildSystemPrompt({ services, assistant }) {
    const name = assistant === 'meo' ? 'Mèo Bông' : 'Cún Phết';
    const catalog = services.map((service) => `- ${service.service_name}: ${service.duration_minutes} phút, nhận ${service.species_supported.join(' và ')}, ` +
        `${service.is_weight_based ? `giá từ ${formatVND(service.base_price)} (tính theo cân nặng)` : formatVND(service.base_price)}`).join('\n');
    return [
        `Bạn là ${name}, trợ lý chăm sóc khách hàng của tiệm spa và thú y thú cưng Pet Phết. Luôn trả lời bằng tiếng Việt, thân thiện, ngắn gọn (tối đa khoảng 120 từ).`,
        'Chỉ trả lời các câu hỏi liên quan đến Pet Phết và chăm sóc thú cưng cơ bản. Nếu không chắc, hãy nói chưa rõ và mời khách gọi hotline thay vì bịa thông tin.',
        'Không chẩn đoán bệnh hay kê đơn; với dấu hiệu nguy hiểm (khó thở, co giật, chảy máu nhiều, ngất) hãy khuyên đưa bé đến cơ sở thú y gần nhất ngay.',
        '',
        'Thông tin Pet Phết:',
        '- Giờ làm việc: Thứ 2 đến Chủ Nhật, 08:00–20:00.',
        '- Địa chỉ: 123 Đường Thú Cưng Yêu Thương, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh. Hotline 0909.123.456, email contact@petphet.vn.',
        '- Đặt lịch gồm 4 bước: chọn dịch vụ, chọn hồ sơ thú cưng và xác nhận cân nặng, chọn ngày và khung giờ còn chỗ, xác nhận cùng thanh toán.',
        '- Thanh toán COD (trả sau khi dùng dịch vụ) hoặc QR (giữ chỗ 15 phút, admin đối chiếu rồi mới xác nhận lịch).',
        '- Đổi lịch chỉ thực hiện được trong vòng 1 ngày (24 giờ) kể từ khi đặt đơn. Hủy lịch ở mục Lịch sử đặt lịch khi đơn còn Chờ xác nhận hoặc Đã xác nhận.',
        '- Mỗi đánh giá hợp lệ cho đơn đã hoàn thành được thưởng 1.000 Pet Point.',
        '',
        'Danh mục dịch vụ hiện tại:',
        catalog || '- (đang cập nhật)'
    ].join('\n');
}

/** Converts the chat log to Gemini "contents" (must start with a user turn, then the new question). */
export function buildGeminiContents(history, question, maxHistoryMessages) {
    const turns = history
        .filter((message) => message.text && (message.sender === 'user' || message.sender === 'bot'))
        .slice(-maxHistoryMessages)
        .map((message) => ({ role: message.sender === 'user' ? 'user' : 'model', parts: [{ text: message.text }] }));
    while (turns.length > 0 && turns[0].role !== 'user')
        turns.shift();
    turns.push({ role: 'user', parts: [{ text: question.slice(0, MAX_QUESTION_LENGTH) }] });
    return turns;
}

export function extractGeminiText(data) {
    const text = (data?.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('').trim();
    if (!text)
        throw new Error('Empty AI response');
    return text;
}

/** Calls the configured API and returns the answer text. Throws on any problem so the caller can fall back. */
export async function requestApiReply({ config, apiKey, question, history, assistant, services, fetchImpl = globalThis.fetch }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
        const systemPrompt = buildSystemPrompt({ services, assistant });
        if (config.proxyUrl) {
            // Your own backend keeps the key: POST {question, history, assistant, systemPrompt} -> {reply}
            const response = await fetchImpl(config.proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question.slice(0, MAX_QUESTION_LENGTH), history: history.slice(-config.maxHistoryMessages), assistant, systemPrompt }),
                signal: controller.signal
            });
            if (!response.ok)
                throw new Error(`Proxy HTTP ${response.status}`);
            const data = await response.json();
            if (typeof data?.reply !== 'string' || !data.reply.trim())
                throw new Error('Empty proxy response');
            return data.reply.trim();
        }
        const response = await fetchImpl(`${GEMINI_ENDPOINT}/${encodeURIComponent(config.model)}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: buildGeminiContents(history, question, config.maxHistoryMessages),
                generationConfig: { temperature: config.temperature, maxOutputTokens: config.maxOutputTokens }
            }),
            signal: controller.signal
        });
        if (!response.ok)
            throw new Error(`Gemini HTTP ${response.status}`);
        return extractGeminiText(await response.json());
    }
    finally {
        clearTimeout(timer);
    }
}

/**
 * Answers one question. Returns { text, source } where source is "api" or "rules".
 * `history` is the chat log (objects with sender "user" | "bot" and text) WITHOUT the new question.
 */
export async function askChatbot({ question, history = [], assistant = 'cun', services, fetchImpl = globalThis.fetch, storage = globalThis.localStorage }) {
    const fallback = () => ({ text: buildAssistantReply(question, services), source: 'rules' });
    try {
        const config = await loadChatbotConfig(fetchImpl);
        const apiKey = resolveApiKey(config, storage);
        if (!config.enabled || (!config.proxyUrl && !apiKey))
            return fallback();
        const text = await requestApiReply({ config, apiKey, question, history, assistant, services, fetchImpl });
        return { text, source: 'api' };
    }
    catch (error) {
        console.warn('Chatbot API unavailable, using built-in answers.', error);
        return fallback();
    }
}
