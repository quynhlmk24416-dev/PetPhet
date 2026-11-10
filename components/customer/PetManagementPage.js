import React, { useEffect, useState } from '../../js/react.js';
import { PawPrint, Plus, Edit2, EyeOff, Eye, Calendar, AlertCircle, CheckCircle2, X, Scale } from '../../js/icons.js';
import { store } from '../../services/store.js';
import { notifyToast } from '../../js/utils/toast.js';
import { formatDateDMY } from '../../js/utils/date.js';
import { resizeImageToDataUrl, validateImageFile } from '../../js/utils/image.js';
const DEFAULT_PET_AVATAR = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80';
export const PetManagementPage = ({ currentUser, onNavigateToBookingWithPet }) => {
    const userPets = store.getPetsByUser(currentUser.id);
    const hiddenPets = store.getHiddenPetsByUser(currentUser.id);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPet, setEditingPet] = useState(null);
    // Form states
    const [petName, setPetName] = useState('');
    const [species, setSpecies] = useState('Chó');
    const [breed, setBreed] = useState('');
    const [gender, setGender] = useState('Chưa xác định');
    const [birthDate, setBirthDate] = useState('2024-01-01');
    // Kept as text while typing so the owner can clear the field and type a new value.
    const [weight, setWeight] = useState('4');
    const [healthStatus, setHealthStatus] = useState('');
    const [vaccinationHistory, setVaccinationHistory] = useState('');
    const [notes, setNotes] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    useEffect(() => {
        if (!isModalOpen)
            return;
        const closeOnEscape = (event) => { if (event.key === 'Escape')
            setIsModalOpen(false); };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [isModalOpen]);
    const [message, setMessage] = useState(null);
    const reportMessage = (type, text) => { setMessage({ type, text }); notifyToast(type, text); };
    const openAddModal = () => {
        setEditingPet(null);
        setPetName('');
        setSpecies('Chó');
        setBreed('');
        setGender('Chưa xác định');
        setBirthDate('2024-01-01');
        setWeight('4');
        setHealthStatus('');
        setVaccinationHistory('');
        setNotes('');
        setAvatarUrl('https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=300&q=80');
        setMessage(null);
        setIsModalOpen(true);
    };
    const openEditModal = (pet) => {
        setEditingPet(pet);
        setPetName(pet.pet_name);
        setSpecies(pet.species);
        setBreed(pet.breed || '');
        setGender(pet.gender);
        setBirthDate(pet.birth_date || '2024-01-01');
        setWeight(String(pet.weight || 4.0));
        setHealthStatus(pet.health_status || '');
        setVaccinationHistory(pet.vaccination_history || '');
        setNotes(pet.notes || '');
        setAvatarUrl(pet.avatar_url || '');
        setMessage(null);
        setIsModalOpen(true);
    };
    // Avatar is chosen from the device instead of typing an image URL.
    const handleAvatarFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = ''; // lets the owner pick the same file again later
        if (!file)
            return;
        const problem = validateImageFile(file);
        if (problem) {
            reportMessage('error', problem);
            return;
        }
        try {
            setAvatarUrl(await resizeImageToDataUrl(file));
        }
        catch {
            reportMessage('error', 'Không đọc được ảnh. Vui lòng thử ảnh khác.');
        }
    };
    const handleSavePet = (e) => {
        e.preventDefault();
        if (!petName.trim()) {
            reportMessage('error', 'Tên thú cưng là bắt buộc.');
            return;
        }
        if (!(Number(weight) > 0)) {
            reportMessage('error', 'Cân nặng phải lớn hơn 0 kg.');
            return;
        }
        if (editingPet) {
            const res = store.updatePet(editingPet.id, {
                pet_name: petName,
                species,
                breed,
                gender,
                birth_date: birthDate,
                weight: Number(weight),
                health_status: healthStatus,
                vaccination_history: vaccinationHistory,
                notes,
                avatar_url: avatarUrl
            });
            reportMessage(res.success ? 'success' : 'error', res.message);
            if (res.success) {
                setTimeout(() => setIsModalOpen(false), 900);
            }
        }
        else {
            store.addPet({
                user_id: currentUser.id,
                pet_name: petName,
                species,
                breed,
                gender,
                birth_date: birthDate,
                weight: Number(weight),
                health_status: healthStatus,
                vaccination_history: vaccinationHistory,
                notes,
                avatar_url: avatarUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80'
            });
            reportMessage('success', `Thêm hồ sơ bé ${petName} thành công!`);
            setTimeout(() => setIsModalOpen(false), 900);
        }
    };
    const handleHidePet = (pet) => {
        if (!confirm(`Bạn có chắc chắn muốn ẩn hồ sơ của bé ${pet.pet_name}? Lịch sử dịch vụ đã xong vẫn được lưu trữ.`)) {
            return;
        }
        const res = store.hidePet(pet.id);
        reportMessage(res.success ? 'success' : 'error', res.message);
    };
    return (React.createElement("div", { className: "pet-pet-management-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" },
        React.createElement("div", { "data-scroll-reveal": true, className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8" },
            React.createElement("div", null,
                React.createElement("h1", { className: "text-3xl sm:text-4xl font-black text-[#81451F] font-heading mt-1" }, "Hồ Sơ Thú Cưng Của Bạn")),
            React.createElement("button", { onClick: openAddModal, className: "px-5 py-3 rounded-2xl bg-[#EC802B] hover:bg-[#D46917] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2" },
                React.createElement(Plus, { className: "w-4 h-4" }),
                " Thêm hồ sơ")),
        message && (React.createElement("div", { className: `mb-6 p-4 rounded-2xl text-xs flex items-center gap-2 ${message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'}` },
            message.type === 'success' ? (React.createElement(CheckCircle2, { className: "w-4 h-4 text-emerald-600 shrink-0" })) : (React.createElement(AlertCircle, { className: "w-4 h-4 text-red-600 shrink-0" })),
            React.createElement("span", null, message.text))),
        userPets.length === 0 ? (React.createElement("div", { "data-scroll-reveal": true, className: "text-center py-16 bg-white rounded-3xl border-2 border-dashed border-[#E8CCAD] p-8" },
            React.createElement(PawPrint, { className: "w-16 h-16 text-[#EDC55B] mx-auto mb-3" }),
            React.createElement("h3", { className: "text-lg font-bold text-[#81451F] font-heading" }, "Chưa có hồ sơ thú cưng nào"),
            React.createElement("p", { className: "text-xs text-neutral-500 mt-1 max-w-sm mx-auto" }, "Hãy thêm hồ sơ của bé cưng để đặt lịch spa, tiêm phòng và nhận tư vấn chăm sóc phù hợp nhé!"),
            React.createElement("button", { onClick: openAddModal, className: "mt-5 px-6 py-2.5 bg-[#EC802B] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer" }, "+ Thêm bé ngay"))) : (React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, userPets.map((pet) => (React.createElement("div", { key: pet.id, "data-scroll-reveal": true, className: "bg-white rounded-3xl border-2 border-[#E8CCAD] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between" },
            React.createElement("div", null,
                React.createElement("div", { className: "p-5 pb-4 flex items-center gap-4 border-b border-[#FAF6F0]" },
                    React.createElement("img", { src: pet.avatar_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80', alt: pet.pet_name, className: "w-16 h-16 rounded-2xl object-cover border-2 border-[#EDC55B] shadow-2xs" }),
                    React.createElement("div", { className: "min-w-0 flex-1" },
                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement("h3", { className: "font-black text-xl text-[#81451F] font-heading truncate" }, pet.pet_name),
                            React.createElement("span", { className: "text-[11px] bg-[#FAF6F0] text-[#EC802B] font-bold px-2 py-0.5 rounded-full border border-[#E8CCAD]" }, pet.species)),
                        React.createElement("p", { className: "text-xs text-neutral-500 truncate mt-0.5" },
                            pet.breed || 'Chưa cập nhật giống',
                            " • ",
                            pet.gender))),
                React.createElement("div", { className: "p-5 space-y-3 text-xs" },
                    React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                        React.createElement("div", { className: "p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8CCAD]/60" },
                            React.createElement("span", { className: "text-neutral-400 text-[10px] block font-semibold" }, "CÂN NẶNG"),
                            React.createElement("span", { className: "font-black text-sm text-[#81451F] flex items-center gap-1" },
                                React.createElement(Scale, { className: "w-3.5 h-3.5 text-[#EC802B]" }),
                                " ",
                                pet.weight,
                                " kg"),
                            pet.weight_updated_at && (React.createElement("span", { className: "text-[9px] text-neutral-400 block mt-0.5" },
                                "Cập nhật: ",
                                formatDateDMY(pet.weight_updated_at)))),
                        React.createElement("div", { className: "p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E8CCAD]/60" },
                            React.createElement("span", { className: "text-neutral-400 text-[10px] block font-semibold" }, "NGÀY SINH"),
                            React.createElement("span", { className: "font-bold text-xs text-[#81451F] flex items-center gap-1 mt-1" },
                                React.createElement(Calendar, { className: "w-3.5 h-3.5 text-[#66BCB4]" }),
                                pet.birth_date ? formatDateDMY(pet.birth_date) : 'Chưa rõ'))),
                    pet.health_status && (React.createElement("div", { className: "p-2.5 rounded-xl bg-[#FCF5DC]/50 border border-[#EDC55B]/40 text-neutral-700" },
                        React.createElement("strong", { className: "text-[10px] text-[#81451F] block uppercase font-bold" }, "Sức khỏe:"),
                        React.createElement("p", { className: "text-[11px] mt-0.5" }, pet.health_status))),
                    pet.vaccination_history && (React.createElement("div", { className: "p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200/50 text-neutral-700" },
                        React.createElement("strong", { className: "text-[10px] text-emerald-800 block uppercase font-bold" }, "Tiêm chủng:"),
                        React.createElement("p", { className: "text-[11px] mt-0.5" }, pet.vaccination_history))),
                    pet.notes && (React.createElement("div", { className: "text-[11px] text-neutral-500 italic" },
                        "Ghi chú: \"",
                        pet.notes,
                        "\"")),
                    (() => {
                        const completedHistory = store.getCompletedBookingsByPet(pet.id, currentUser.id);
                        return completedHistory.length > 0 ? (React.createElement("div", { className: "p-2.5 rounded-xl bg-[#F0F9F7] border border-[#CDE8E4] text-neutral-700" },
                            React.createElement("strong", { className: "text-[10px] text-[#356E69] block uppercase font-bold" }, "Lịch sử dịch vụ hoàn thành"),
                            React.createElement("div", { className: "mt-1.5 space-y-1.5" }, completedHistory.slice(0, 3).map((booking) => (React.createElement("div", { key: booking.id, className: "flex justify-between gap-2 text-[10px]" },
                                React.createElement("span", { className: "font-semibold" }, booking.service_name),
                                React.createElement("span", { className: "shrink-0 text-neutral-500" }, formatDateDMY(booking.booking_date)))))))) : null;
                    })())),
            React.createElement("div", { className: "p-4 bg-[#FAF6F0] border-t border-[#E8CCAD] flex items-center justify-between gap-2" },
                React.createElement("div", { className: "flex items-center gap-1" },
                    React.createElement("button", { onClick: () => openEditModal(pet), className: "p-2 rounded-xl text-neutral-600 hover:text-[#EC802B] hover:bg-white transition-colors cursor-pointer", title: "Chỉnh sửa thông tin" },
                        React.createElement(Edit2, { className: "w-4 h-4" })),
                    React.createElement("button", { onClick: () => handleHidePet(pet), className: "p-2 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer", title: "Ẩn hồ sơ bé" },
                        React.createElement(EyeOff, { className: "w-4 h-4" }))),
                React.createElement("button", { onClick: () => onNavigateToBookingWithPet?.(pet.id), className: "px-4 py-2 rounded-xl bg-[#EC802B] hover:bg-[#D46917] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5" },
                    React.createElement(Calendar, { className: "w-3.5 h-3.5" }),
                    " Đặt lịch cho bé"))))))),
        hiddenPets.length > 0 && (React.createElement("section", { className: "mt-10 rounded-3xl border border-dashed border-[#D8B995] bg-[#FFF9F1] p-5" },
            React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 mb-4" },
                React.createElement("div", null,
                    React.createElement("h2", { className: "text-lg font-black text-[#81451F]" },
                        "Hồ sơ đã ẩn (",
                        hiddenPets.length,
                        ")"),
                    React.createElement("p", { className: "text-xs text-[#927459]" }, "Hồ sơ này tạm thời không xuất hiện trong danh sách đặt lịch."))),
            React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" }, hiddenPets.map((pet) => React.createElement("article", { key: pet.id, className: "flex items-center gap-3 rounded-2xl bg-white border border-[#E8CCAD] p-3" },
                React.createElement("img", { src: pet.avatar_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=120&q=80', alt: pet.pet_name, className: "w-12 h-12 rounded-xl object-cover" }),
                React.createElement("div", { className: "min-w-0 flex-1" },
                    React.createElement("strong", { className: "block text-sm text-[#81451F] truncate" }, pet.pet_name),
                    React.createElement("span", { className: "text-xs text-[#987757]" },
                        pet.species,
                        " · ",
                        pet.breed || 'Chưa cập nhật giống')),
                React.createElement("button", { type: "button", onClick: () => { const result = store.unhidePet(pet.id); reportMessage(result.success ? 'success' : 'error', result.message); }, className: "inline-flex items-center gap-1 rounded-xl bg-[#E7F4F1] px-3 py-2 text-xs font-bold text-[#356E69] hover:bg-[#D7EEEA]" },
                    React.createElement(Eye, { size: 14 }),
                    " Bỏ ẩn")))))),
        isModalOpen && (React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200", onMouseDown: (event) => { if (event.target === event.currentTarget)
                setIsModalOpen(false); } },
            React.createElement("div", { className: "relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-[#E8CCAD] overflow-hidden max-h-[90vh] flex flex-col" },
                React.createElement("div", { className: "p-5 bg-[#FCF5DC] border-b border-[#E8CCAD] flex items-center justify-between shrink-0" },
                    React.createElement("h3", { className: "font-black text-xl text-[#81451F] font-heading" }, editingPet ? `Chỉnh sửa hồ sơ: ${editingPet.pet_name}` : 'Thêm hồ sơ'),
                    React.createElement("button", { onClick: () => setIsModalOpen(false), className: "p-1 rounded-full text-[#81451F] hover:bg-white/80 cursor-pointer" },
                        React.createElement(X, { className: "w-5 h-5" }))),
                React.createElement("form", { onSubmit: handleSavePet, className: "p-6 overflow-y-auto space-y-4" },
                    React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Tên thú cưng *"),
                            React.createElement("input", { type: "text", value: petName, onChange: (e) => setPetName(e.target.value), placeholder: "Bánh Mì, Mây Mây...", className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-sm text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]", required: true })),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Loài thú cưng *"),
                            React.createElement("select", { value: species, onChange: (e) => setSpecies(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-sm text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]" },
                                React.createElement("option", { value: "Chó" }, "Chó"),
                                React.createElement("option", { value: "Mèo" }, "Mèo"),
                                React.createElement("option", { value: "Khác" }, "Khác")))),
                    React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Giống"),
                            React.createElement("input", { type: "text", value: breed, onChange: (e) => setBreed(e.target.value), placeholder: "Poodle, Anh lông ngắn...", className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-sm text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]" })),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Giới tính"),
                            React.createElement("select", { value: gender, onChange: (e) => setGender(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-sm text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]" },
                                React.createElement("option", { value: "Đực" }, "Đực"),
                                React.createElement("option", { value: "Cái" }, "Cái"),
                                React.createElement("option", { value: "Chưa xác định" }, "Chưa xác định")))),
                    React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Cân nặng (kg) *"),
                            React.createElement("input", { type: "number", step: "0.1", min: "0.1", max: "100", value: weight, onChange: (e) => setWeight(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-sm text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]", required: true })),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Ngày sinh"),
                            React.createElement("input", { type: "date", lang: "en-GB", value: birthDate, onChange: (e) => setBirthDate(e.target.value), className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-sm text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]" }))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Tình trạng sức khỏe (chủ nuôi cung cấp)"),
                        React.createElement("input", { type: "text", value: healthStatus, onChange: (e) => setHealthStatus(e.target.value), placeholder: "Khỏe mạnh, da hơi ngứa, tai sạch...", className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-sm text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]" })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Lịch sử tiêm phòng (chủ nuôi cung cấp)"),
                        React.createElement("input", { type: "text", value: vaccinationHistory, onChange: (e) => setVaccinationHistory(e.target.value), placeholder: "Đã tiêm 3 mũi, dại định kỳ 2025...", className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-sm text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]" })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-xs font-bold text-[#81451F] mb-1" }, "Ghi chú riêng"),
                        React.createElement("textarea", { rows: 2, value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Bé hơi nhát nước, thích khen ngoan, vuốt cằm...", className: "w-full bg-[#FAF6F0] border border-[#E8CCAD] rounded-xl px-3 py-2 text-sm text-[#81451F] focus:outline-none focus:ring-2 focus:ring-[#EC802B]" })),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "pet-avatar-file", className: "block text-xs font-bold text-[#81451F] mb-1" }, "Ảnh đại diện thú cưng"),
                        React.createElement("div", { className: "pet-avatar-upload" },
                            React.createElement("img", { src: avatarUrl || DEFAULT_PET_AVATAR, alt: "Ảnh đại diện thú cưng", className: "pet-avatar-upload-preview" }),
                            React.createElement("div", { className: "pet-avatar-upload-controls" },
                                React.createElement("input", { id: "pet-avatar-file", type: "file", accept: "image/png,image/jpeg,image/webp", onChange: handleAvatarFile, className: "pet-avatar-upload-input" }),
                                React.createElement("p", { className: "pet-avatar-upload-hint" }, "PNG, JPG hoặc WebP, tối đa 5 MB. Ảnh được thu nhỏ tự động.")))),
                    React.createElement("div", { className: "pt-3 border-t border-[#E8CCAD] flex items-center justify-end gap-3 shrink-0" },
                        React.createElement("button", { type: "button", onClick: () => setIsModalOpen(false), className: "px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer" }, "Hủy"),
                        React.createElement("button", { type: "submit", className: "px-6 py-2.5 rounded-xl bg-[#EC802B] hover:bg-[#D46917] text-white font-bold text-xs shadow-md transition-all cursor-pointer" }, editingPet ? 'Lưu thay đổi' : 'Thêm hồ sơ bé'))))))));
};
