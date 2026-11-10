import React, { useEffect, useMemo, useRef, useState } from '../../js/react.js';
import { X, Send, Sparkles } from '../../js/icons.js';
import { ASSETS } from '../../js/constants/assets.js';
import { store } from '../../services/store.js';
import { askChatbot } from '../../services/chatbotService.js';
const QUICK_PROMPTS = [
    'Giờ làm việc của Pet Phết?',
    'Giá dịch vụ được tính thế nào?',
    'Hướng dẫn đặt lịch',
    'Thanh toán QR và COD',
    'Cách nhận Pet Point'
];
const getAssistantGreeting = (assistant) => assistant === 'cun'
    ? 'Gâu gâu! Cún Phết xin chào bạn và bé cưng. 🐾 Mình có thể tư vấn dịch vụ, giá, đặt lịch, thanh toán, hồ sơ thú cưng và Pet Point. Bạn cứ hỏi bằng cách diễn đạt tự nhiên nhé!'
    : 'Meo meo! Mèo Bông xin chào bạn và bé cưng. 🐾 Mình có thể hỗ trợ tìm hiểu dịch vụ, giá, đặt lịch, thanh toán, hồ sơ thú cưng và Pet Point. Bạn muốn hỏi điều gì nè?';
const getTime = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
export const ChatbotDrawer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [assistant, setAssistant] = useState('cun');
    const [messages, setMessages] = useState([
        {
            id: 'm1',
            sender: 'bot',
            text: getAssistantGreeting('cun'),
            time: 'Vừa xong',
            assistant: 'cun'
        }
    ]);
    const messageEndRef = useRef(null);
    const launcherRef = useRef(null);
    const drawerRef = useRef(null);
    const promptDragRef = useRef(null);
    const suppressPromptClickRef = useRef(false);
    const serviceCatalog = useMemo(() => store.getServices(true), []);
    const selectAssistant = (nextAssistant) => {
        if (assistant === nextAssistant)
            return;
        setAssistant(nextAssistant);
        setMessages((current) => {
            const greeting = {
                id: `greeting-${nextAssistant}-${Date.now()}`,
                sender: 'bot',
                text: getAssistantGreeting(nextAssistant),
                time: getTime(),
                assistant: nextAssistant
            };
            const hasUserMessages = current.some((message) => message.sender === 'user');
            if (!hasUserMessages)
                return [greeting, ...current.slice(1)];
            return [...current, greeting];
        });
    };
    useEffect(() => {
        if (!isOpen)
            return;
        const closeIfOutside = (event) => {
            const target = event.target;
            if (!launcherRef.current?.contains(target) && !drawerRef.current?.contains(target))
                setIsOpen(false);
        };
        const closeOnEscape = (event) => { if (event.key === 'Escape')
            setIsOpen(false); };
        document.addEventListener('mousedown', closeIfOutside);
        window.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('mousedown', closeIfOutside);
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [isOpen]);
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, isTyping, isOpen]);
    const handleSend = (suggestedText) => {
        const text = (suggestedText ?? input).trim();
        if (!text || isTyping)
            return;
        const userMessage = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text,
            time: getTime()
        };
        setMessages((current) => [...current, userMessage]);
        setInput('');
        setIsTyping(true);
        // Ask the AI API (falls back to the built-in answers). Keep the short "typing" pause so quick local answers feel the same.
        const startedAt = Date.now();
        const replyAssistant = assistant;
        const history = messages;
        askChatbot({ question: text, history, assistant: replyAssistant, services: serviceCatalog }).then(async ({ text: reply }) => {
            const remainingDelay = 420 - (Date.now() - startedAt);
            if (remainingDelay > 0)
                await new Promise((resolve) => window.setTimeout(resolve, remainingDelay));
            const assistantReply = replyAssistant === 'meo'
                ? reply.replaceAll('Cún Phết', 'Mèo Bông')
                : reply;
            setMessages((current) => [...current, {
                    id: `bot-${Date.now()}`,
                    sender: 'bot',
                    text: assistantReply,
                    time: getTime(),
                    assistant: replyAssistant
                }]);
            setIsTyping(false);
        });
    };
    const handlePromptPointerDown = (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0)
            return;
        const strip = event.currentTarget;
        promptDragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            scrollLeft: strip.scrollLeft,
            moved: false
        };
        suppressPromptClickRef.current = false;
    };
    const handlePromptPointerMove = (event) => {
        const drag = promptDragRef.current;
        if (!drag || drag.pointerId !== event.pointerId)
            return;
        const delta = event.clientX - drag.startX;
        if (Math.abs(delta) > 4 && !drag.moved) {
            drag.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        if (drag.moved) {
            event.preventDefault();
            event.currentTarget.scrollLeft = drag.scrollLeft - delta;
        }
    };
    const finishPromptDrag = (event) => {
        const drag = promptDragRef.current;
        if (!drag || drag.pointerId !== event.pointerId)
            return;
        suppressPromptClickRef.current = drag.moved;
        promptDragRef.current = null;
        if (drag.moved) {
            window.setTimeout(() => { suppressPromptClickRef.current = false; }, 250);
        }
    };
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "pet-chatbot-float fixed bottom-6 right-6 z-40 flex items-center gap-3", ref: launcherRef },
            React.createElement("button", { onClick: () => setIsOpen((value) => !value), "aria-label": "Mở khung trò chuyện hỗ trợ", title: `Trò chuyện cùng ${assistant === 'cun' ? 'Cún Phết' : 'Mèo Bông'}`, className: "pet-chatbot-launcher relative shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer" },
                React.createElement("img", { src: assistant === 'cun' ? ASSETS.chatbotDog : ASSETS.meoAssistant, alt: `${assistant === 'cun' ? 'Cún Phết' : 'Mèo Bông'} – trợ lý hỗ trợ Pet Phết` }),
                React.createElement("span", { className: "absolute -top-1 -right-1 flex h-4 w-4" },
                    React.createElement("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-[#66BCB4] opacity-75" }),
                    React.createElement("span", { className: "relative inline-flex rounded-full h-4 w-4 bg-[#66BCB4] border border-white" })))),
        isOpen && (React.createElement("section", { ref: drawerRef, className: "pet-chatbot-drawer fixed bottom-24 right-6 w-[92vw] max-w-md h-[min(620px,calc(100dvh-120px))] bg-white rounded-3xl shadow-2xl border-2 border-[#E8CCAD] z-50 flex flex-col overflow-hidden", "aria-label": "Trợ lý AI Pet Phết", "aria-live": "polite" },
            React.createElement("header", { className: "bg-gradient-to-r from-[#EC802B] to-[#EDC55B] px-5 py-4 text-white flex items-center justify-between shadow-sm shrink-0" },
                React.createElement("div", { className: "flex items-center gap-3 min-w-0" },
                    React.createElement("div", { className: "w-12 h-12 rounded-2xl overflow-hidden bg-[#FAF6F0] border border-white/50 shrink-0 flex items-center justify-center" },
                        React.createElement("img", { src: assistant === 'cun' ? ASSETS.chatbotDog : ASSETS.meoAssistant, alt: assistant === 'cun' ? 'Cún Phết' : 'Mèo Bông', className: "w-full h-full object-contain" })),
                    React.createElement("div", { className: "min-w-0" },
                        React.createElement("h3", { className: "font-bold text-base tracking-wide flex items-center gap-1.5 font-heading" },
                            assistant === 'cun' ? 'Cún Phết' : 'Mèo Bông',
                            " ",
                            React.createElement(Sparkles, { className: "w-4 h-4 text-yellow-200" })),
                        React.createElement("p", { className: "text-xs text-orange-100 font-medium" }, "Trợ lý thông tin Pet Phết"))),
                React.createElement("button", { onClick: () => setIsOpen(false), className: "text-white/90 hover:text-white p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer", "aria-label": "Đóng khung chat" },
                    React.createElement(X, { className: "w-5 h-5" }))),
            React.createElement("div", { className: "pet-assistant-selector", role: "group", "aria-label": "Chọn trợ lý AI" },
                React.createElement("button", { type: "button", onClick: () => selectAssistant('cun'), className: assistant === 'cun' ? 'is-active' : '', "aria-pressed": assistant === 'cun' },
                    React.createElement("img", { src: ASSETS.chatbotDog, alt: "" }),
                    " Cún Phết"),
                React.createElement("button", { type: "button", onClick: () => selectAssistant('meo'), className: assistant === 'meo' ? 'is-active' : '', "aria-pressed": assistant === 'meo' },
                    React.createElement("img", { src: ASSETS.meoAssistant, alt: "" }),
                    " Mèo Bông")),
            React.createElement("div", { className: "pet-chatbot-quick-prompts bg-[#FAF6F0] px-3 py-2 border-b border-[#E8CCAD] flex gap-2 overflow-x-auto overflow-y-hidden text-xs shrink-0", onPointerDown: handlePromptPointerDown, onPointerMove: handlePromptPointerMove, onPointerUp: finishPromptDrag, onPointerCancel: finishPromptDrag }, QUICK_PROMPTS.map((prompt) => (React.createElement("button", { key: prompt, onClick: (event) => {
                    if (suppressPromptClickRef.current) {
                        event.preventDefault();
                        suppressPromptClickRef.current = false;
                        return;
                    }
                    handleSend(prompt);
                }, disabled: isTyping, className: "whitespace-nowrap bg-white border border-[#E8CCAD] text-[#81451F] hover:bg-[#FDE8D7] disabled:opacity-50 px-3 py-2 rounded-full font-semibold transition-colors cursor-pointer" }, prompt)))),
            React.createElement("div", { className: "pet-chatbot-messages flex-1 min-h-0 p-4 overflow-y-auto overflow-x-hidden space-y-3 bg-[#FFFAF4]" },
                messages.map((message) => (React.createElement("div", { key: message.id, className: `pet-chatbot-message-row flex w-full min-w-0 gap-2.5 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}` },
                    message.sender === 'bot' && (React.createElement("div", { className: "pet-chatbot-avatar w-9 h-9 rounded-xl overflow-hidden bg-white border border-[#E8CCAD] shrink-0 mt-0.5 flex items-center justify-center" },
                        React.createElement("img", { src: (message.assistant || 'cun') === 'cun' ? ASSETS.chatbotDog : ASSETS.meoAssistant, alt: (message.assistant || 'cun') === 'cun' ? 'Cún Phết' : 'Mèo Bông', className: "w-full h-full object-contain" }))),
                    React.createElement("div", { className: `pet-chatbot-message-bubble min-w-0 max-w-[84%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${message.sender === 'user' ? 'bg-[#EC802B] text-white rounded-br-sm' : 'bg-white text-[#71421F] border border-[#E8CCAD] rounded-bl-sm'}` },
                        React.createElement("p", { className: "whitespace-pre-line" }, message.text),
                        React.createElement("span", { className: `block text-[10px] mt-1 text-right ${message.sender === 'user' ? 'text-orange-100' : 'text-neutral-400'}` }, message.time))))),
                isTyping && React.createElement("div", { className: "text-xs text-[#8B684A] pl-12" },
                    assistant === 'cun' ? 'Cún Phết' : 'Mèo Bông',
                    " đang soạn câu trả lời…"),
                React.createElement("div", { ref: messageEndRef })),
            React.createElement("div", { className: "pet-chatbot-input-row p-3 bg-white border-t border-[#E8CCAD] flex items-center gap-2 shrink-0" },
                React.createElement("input", { type: "text", value: input, onChange: (event) => setInput(event.target.value), onKeyDown: (event) => { if (event.key === 'Enter')
                        handleSend(); }, placeholder: "Nhập câu hỏi của bạn...", className: "flex-1 min-w-0 bg-[#FAF6F0] border border-[#E8CCAD] rounded-full px-4 py-3 text-sm text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]" }),
                React.createElement("button", { onClick: () => handleSend(), disabled: !input.trim() || isTyping, className: "w-11 h-11 rounded-full bg-[#EC802B] hover:bg-[#D46917] disabled:opacity-50 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0", "aria-label": "Gửi tin nhắn" },
                    React.createElement(Send, { className: "w-4 h-4" }))),
            React.createElement("div", { className: "text-[10px] text-center text-[#9A7C62] pb-2 bg-white" },
                React.createElement("b", null, "! Trợ lý tự động theo dữ liệu website · Không thể thay thế tư vấn thú y"))))));
};
