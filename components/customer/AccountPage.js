import React, { useState } from '../../js/react.js';
import { Bell, CheckCircle2, KeyRound, Mail, Phone, Save, ShieldCheck, UserRound } from '../../js/icons.js';
import { store } from '../../services/store.js';
import { notifyToast } from '../../js/utils/toast.js';
export const AccountPage = ({ currentUser }) => {
    const [fullName, setFullName] = useState(currentUser.full_name);
    const [phone, setPhone] = useState(currentUser.phone);
    const [profileMessage, setProfileMessage] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const preferencesKey = `pet_phet_notification_preferences_${currentUser.id}`;
    const [preferences, setPreferences] = useState(() => {
        try {
            const saved = localStorage.getItem(preferencesKey);
            return saved ? JSON.parse(saved) : { booking: true, payment: true, promotion: false };
        }
        catch {
            return { booking: true, payment: true, promotion: false };
        }
    });
    const [preferencesSaved, setPreferencesSaved] = useState(false);
    const saveProfile = (event) => {
        event.preventDefault();
        if (fullName.trim().length < 2) {
            setProfileMessage('Họ tên cần có ít nhất 2 ký tự.');
            notifyToast('error', 'Họ tên cần có ít nhất 2 ký tự.');
            return;
        }
        if (phone.replace(/\D/g, '').length < 9) {
            setProfileMessage('Số điện thoại chưa hợp lệ.');
            notifyToast('error', 'Số điện thoại chưa hợp lệ.');
            return;
        }
        try {
            store.updateUserProfile({ full_name: fullName.trim(), phone: phone.trim() });
            setProfileMessage('Thông tin cá nhân đã được cập nhật.');
            notifyToast('success', 'Thông tin cá nhân đã được cập nhật.');
        }
        catch (error) {
            setProfileMessage(error instanceof Error ? error.message : 'Không thể cập nhật thông tin.');
            notifyToast('error', error instanceof Error ? error.message : 'Không thể cập nhật thông tin.');
        }
    };
    const changePassword = async (event) => {
        event.preventDefault();
        setPasswordError('');
        setPasswordMessage('');
        if (newPassword.length < 6) {
            setPasswordError('Mật khẩu mới cần có ít nhất 6 ký tự.');
            notifyToast('error', 'Mật khẩu mới cần có ít nhất 6 ký tự.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Mật khẩu xác nhận không trùng khớp.');
            notifyToast('error', 'Mật khẩu xác nhận không trùng khớp.');
            return;
        }
        try {
            const valid = await store.verifyDemoPassword(currentUser.email, currentPassword);
            if (!valid) {
                setPasswordError('Mật khẩu hiện tại không chính xác.');
                notifyToast('error', 'Mật khẩu hiện tại không chính xác.');
                return;
            }
            await store.setDemoPassword(currentUser.email, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordMessage('Đổi mật khẩu thành công.');
            notifyToast('success', 'Đổi mật khẩu thành công.');
        }
        catch (error) {
            setPasswordError(error instanceof Error ? error.message : 'Không thể cập nhật mật khẩu.');
            notifyToast('error', error instanceof Error ? error.message : 'Không thể cập nhật mật khẩu.');
        }
    };
    const savePreferences = () => {
        localStorage.setItem(preferencesKey, JSON.stringify(preferences));
        notifyToast('success', 'Đã lưu tùy chọn thông báo trên trình duyệt này.');
        setPreferencesSaved(true);
        window.setTimeout(() => setPreferencesSaved(false), 2200);
    };
    return (React.createElement("div", { className: "pet-account-page" },
        React.createElement("div", { className: "pet-page-intro", "data-scroll-reveal": true },
            React.createElement("h1", null, "Tài khoản của tôi")),
        React.createElement("div", { className: "pet-account-grid" },
            React.createElement("section", { className: "pet-account-card", "data-scroll-reveal": true },
                React.createElement("div", { className: "pet-account-card-heading" },
                    React.createElement("span", null,
                        React.createElement(UserRound, null)),
                    React.createElement("div", null,
                        React.createElement("h2", null, "Thông tin cá nhân"))),
                React.createElement("form", { onSubmit: saveProfile, className: "pet-account-form" },
                    React.createElement("label", null,
                        "Họ và tên",
                        React.createElement("input", { value: fullName, onChange: (e) => setFullName(e.target.value), required: true })),
                    React.createElement("label", null,
                        "Email đăng nhập",
                        React.createElement("div", { className: "pet-account-input-icon" },
                            React.createElement(Mail, { size: 17 }),
                            React.createElement("input", { value: currentUser.email, readOnly: true }))),
                    React.createElement("label", null,
                        "Số điện thoại",
                        React.createElement("div", { className: "pet-account-input-icon" },
                            React.createElement(Phone, { size: 17 }),
                            React.createElement("input", { value: phone, onChange: (e) => setPhone(e.target.value), required: true }))),
                    React.createElement("button", { type: "submit", className: "pet-button pet-button-primary" },
                        React.createElement(Save, { size: 17 }),
                        " Lưu thông tin"),
                    profileMessage && React.createElement("p", { className: "pet-account-feedback" },
                        React.createElement(CheckCircle2, { size: 16 }),
                        profileMessage))),
            React.createElement("section", { className: "pet-account-card", "data-scroll-reveal": true },
                React.createElement("div", { className: "pet-account-card-heading" },
                    React.createElement("span", { className: "teal" },
                        React.createElement(KeyRound, null)),
                    React.createElement("div", null,
                        React.createElement("h2", null, "Bảo mật tài khoản"))),
                React.createElement("form", { onSubmit: changePassword, className: "pet-account-form" },
                    React.createElement("label", null,
                        "Mật khẩu hiện tại",
                        React.createElement("input", { type: "password", value: currentPassword, onChange: (e) => setCurrentPassword(e.target.value), autoComplete: "current-password", required: true })),
                    React.createElement("label", null,
                        "Mật khẩu mới",
                        React.createElement("input", { type: "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), autoComplete: "new-password", required: true })),
                    React.createElement("label", null,
                        "Xác nhận mật khẩu mới",
                        React.createElement("input", { type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), autoComplete: "new-password", required: true })),
                    React.createElement("button", { type: "submit", className: "pet-button pet-button-teal" },
                        React.createElement(ShieldCheck, { size: 17 }),
                        " Cập nhật mật khẩu"),
                    passwordError && React.createElement("p", { className: "pet-account-feedback error" }, passwordError),
                    passwordMessage && React.createElement("p", { className: "pet-account-feedback" },
                        React.createElement(CheckCircle2, { size: 16 }),
                        passwordMessage))),
            React.createElement("section", { className: "pet-account-card pet-account-notifications", "data-scroll-reveal": true },
                React.createElement("div", { className: "pet-account-card-heading" },
                    React.createElement("span", { className: "yellow" },
                        React.createElement(Bell, null)),
                    React.createElement("div", null,
                        React.createElement("h2", null, "Cài đặt thông báo"))),
                React.createElement("div", { className: "pet-preference-list" },
                    React.createElement("label", null,
                        React.createElement("span", null,
                            React.createElement("b", null, "Thông báo lịch hẹn")),
                        React.createElement("input", { type: "checkbox", checked: preferences.booking, onChange: (e) => setPreferences((p) => ({ ...p, booking: e.target.checked })) })),
                    React.createElement("label", null,
                        React.createElement("span", null,
                            React.createElement("b", null, "Thông báo thanh toán")),
                        React.createElement("input", { type: "checkbox", checked: preferences.payment, onChange: (e) => setPreferences((p) => ({ ...p, payment: e.target.checked })) })),
                    React.createElement("label", null,
                        React.createElement("span", null,
                            React.createElement("b", null, "Ưu đãi và tin tức")),
                        React.createElement("input", { type: "checkbox", checked: preferences.promotion, onChange: (e) => setPreferences((p) => ({ ...p, promotion: e.target.checked })) }))),
                React.createElement("button", { className: "pet-button pet-button-light", onClick: savePreferences },
                    React.createElement(Save, { size: 17 }),
                    " Lưu tùy chọn"),
                preferencesSaved && React.createElement("p", { className: "pet-account-feedback" },
                    React.createElement(CheckCircle2, { size: 16 }),
                    "Đã lưu tùy chọn thông báo trên trình duyệt này.")))));
};
