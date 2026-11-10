import React, { useEffect, useState } from '../../js/react.js';
import { X, Lock, Mail, Phone, UserRound, CheckCircle2, ArrowRight, ShieldCheck, Eye, EyeOff, PawPrint, UserRoundPlus } from '../../js/icons.js';
import { store } from '../../services/store.js';
import { notifyToast } from '../../js/utils/toast.js';
import { ASSETS } from '../../js/constants/assets.js';
export const AuthModal = ({ isOpen, onClose, defaultMode = 'login', onSuccess }) => {
    const [mode, setMode] = useState(defaultMode);
    const [identity, setIdentity] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const reportError = (message) => { setError(message); notifyToast('error', message); };
    const reportSuccess = (message) => { setSuccessMsg(message); notifyToast('success', message); };
    useEffect(() => {
        if (!isOpen)
            return;
        setMode(defaultMode);
        setIdentity('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setPhone('');
        setOtp('');
        setNewPassword('');
        setShowPassword(false);
        setError('');
        setSuccessMsg('');
        setOtpSent(false);
    }, [isOpen, defaultMode]);
    useEffect(() => {
        if (!isOpen)
            return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape')
                onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const switchMode = (next) => {
        setMode(next);
        setError('');
        setSuccessMsg('');
        setOtpSent(false);
        setIdentity('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setPhone('');
        setFullName('');
        setOtp('');
        setNewPassword('');
        setShowPassword(false);
    };
    const finishAuth = (user) => {
        onSuccess?.(user);
        onClose();
    };
    const handleLogin = async (event) => {
        event.preventDefault();
        setError('');
        setSuccessMsg('');
        if (!identity.trim() || !password) {
            reportError('Vui lòng nhập email hoặc số điện thoại và mật khẩu.');
            return;
        }
        setBusy(true);
        try {
            const matched = store.getUserByIdentity(identity);
            if (!matched || !(await store.verifyDemoPassword(identity, password))) {
                reportError('Thông tin đăng nhập chưa chính xác. Vui lòng kiểm tra lại.');
                return;
            }
            const isApprovedAdmin = matched.role === 'admin' && matched.email.toLowerCase() === 'admin@petphet.vn';
            if (matched.role === 'admin' && !isApprovedAdmin) {
                reportError('Chỉ tài khoản admin@petphet.vn được phép truy cập Admin Portal.');
                return;
            }
            store.setCurrentUser(matched);
            reportSuccess(`Đăng nhập thành công. Xin chào ${matched.full_name}!`);
            window.setTimeout(() => finishAuth(matched), 450);
        }
        catch (e) {
            reportError(e instanceof Error ? e.message : 'Không thể xác thực tài khoản.');
        }
        finally {
            setBusy(false);
        }
    };
    const handleRegister = async (event) => {
        event.preventDefault();
        setError('');
        setSuccessMsg('');
        if (fullName.trim().length < 2)
            return reportError('Vui lòng nhập họ tên hợp lệ.');
        if (!email.includes('@'))
            return reportError('Vui lòng nhập địa chỉ email hợp lệ.');
        if (phone.replace(/\D/g, '').length < 9)
            return reportError('Vui lòng nhập số điện thoại hợp lệ.');
        if (password.length < 6)
            return reportError('Mật khẩu phải có ít nhất 6 ký tự.');
        if (password !== confirmPassword)
            return reportError('Mật khẩu xác nhận không trùng khớp.');
        if (store.getUserByIdentity(email))
            return reportError('Email đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.');
        if (store.getUserByIdentity(phone))
            return reportError('Số điện thoại đã được liên kết với tài khoản khác.');
        setBusy(true);
        try {
            const result = store.registerCustomer(fullName.trim(), email.trim(), phone.trim());
            if (!result.success || !result.user) {
                reportError(result.message);
                return;
            }
            await store.setDemoPassword(email, password);
            reportSuccess('Tạo tài khoản thành công. Pet Phết chào mừng bạn!');
            window.setTimeout(() => finishAuth(result.user), 500);
        }
        catch (e) {
            reportError(e instanceof Error ? e.message : 'Không thể tạo tài khoản. Vui lòng thử lại.');
        }
        finally {
            setBusy(false);
        }
    };
    const handleSendOtp = (event) => {
        event.preventDefault();
        setError('');
        const user = store.getUserByIdentity(email);
        if (!email.includes('@') || !user) {
            reportError('Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại.');
            return;
        }
        setOtpSent(true);
        reportSuccess('Mã OTP mô phỏng đã được tạo. Trong bản demo, hãy nhập mã 123456.');
    };
    const handleVerifyOtpAndReset = async (event) => {
        event.preventDefault();
        setError('');
        if (!/^\d{6}$/.test(otp) || otp !== '123456') {
            reportError('Mã OTP không chính xác. Mã OTP thử nghiệm là 123456.');
            return;
        }
        if (newPassword.length < 6) {
            reportError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }
        setBusy(true);
        try {
            await store.setDemoPassword(email, newPassword);
            reportSuccess('Mật khẩu demo đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.');
            window.setTimeout(() => switchMode('login'), 700);
        }
        catch (e) {
            reportError(e instanceof Error ? e.message : 'Không thể cập nhật mật khẩu.');
        }
        finally {
            setBusy(false);
        }
    };
    return (React.createElement("div", { className: "pet-auth-overlay", role: "dialog", "aria-modal": "true", "aria-label": "Đăng nhập Pet Phết", onMouseDown: (event) => { if (event.target === event.currentTarget)
            onClose(); } },
        React.createElement("div", { className: "pet-auth-shell" },
            React.createElement("button", { className: "pet-auth-close", onClick: onClose, "aria-label": "Đóng cửa sổ" },
                React.createElement(X, { size: 21 })),
            React.createElement("div", { className: "pet-auth-visual" },
                React.createElement("img", { className: "pet-auth-visual-image", src: ASSETS.authMascots, alt: "", "aria-hidden": "true" }),
                React.createElement("a", { className: "pet-auth-brand", href: "#home", onClick: (e) => { e.preventDefault(); onClose(); } },
                    React.createElement("img", { src: ASSETS.brandLogo, alt: "Pet Phết – Pet First" })),
                React.createElement("div", { className: "pet-auth-visual-caption" },
                    React.createElement("span", null,
                        React.createElement(PawPrint, { size: 17 }),
                        " PET FIRST"),
                    React.createElement("h2", null,
                        "Chăm sóc bé cưng",
                        React.createElement("br", null),
                        "bằng cả trái tim."),
                    React.createElement("p", null, "Cún Phết & Mèo Bông luôn sẵn sàng đồng hành cùng bạn."))),
            React.createElement("div", { className: "pet-auth-panel" },
                React.createElement("div", { className: "pet-auth-heading" },
                    React.createElement("span", { className: "pet-auth-heading-mark" },
                        React.createElement(PawPrint, { size: 19 })),
                    React.createElement("h2", null, mode === 'login' ? 'Chào bạn!' : mode === 'register' ? 'Gia nhập Pet Phết!' : 'Khôi phục mật khẩu'),
                    React.createElement("p", null, mode === 'login' ? 'Đăng nhập để tiếp tục khám phá thế giới thú cưng của Pet Phết.' : mode === 'register' ? 'Tạo tài khoản để quản lý hồ sơ và lịch chăm sóc các bé.' : 'Xác minh email để thiết lập mật khẩu mới.')),
                error && React.createElement("div", { className: "pet-auth-alert error", role: "alert" }, error),
                successMsg && React.createElement("div", { className: "pet-auth-alert success", role: "status" },
                    React.createElement(CheckCircle2, { size: 16 }),
                    " ",
                    successMsg),
                mode === 'login' && (React.createElement(React.Fragment, null,
                    React.createElement("form", { onSubmit: handleLogin, className: "pet-auth-form" },
                        React.createElement("label", { className: "pet-auth-field" },
                            React.createElement(Mail, { size: 18 }),
                            React.createElement("input", { value: identity, onChange: (e) => setIdentity(e.target.value), placeholder: "Email hoặc số điện thoại", autoComplete: "username", required: true })),
                        React.createElement("label", { className: "pet-auth-field" },
                            React.createElement(Lock, { size: 18 }),
                            React.createElement("input", { value: password, onChange: (e) => setPassword(e.target.value), type: showPassword ? 'text' : 'password', placeholder: "Mật khẩu", autoComplete: "current-password", required: true }),
                            React.createElement("button", { type: "button", onClick: () => setShowPassword((v) => !v), "aria-label": showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu' }, showPassword ? React.createElement(EyeOff, { size: 18 }) : React.createElement(Eye, { size: 18 }))),
                        React.createElement("div", { className: "pet-auth-options" },
                            React.createElement("label", null,
                                React.createElement("input", { type: "checkbox", defaultChecked: true }),
                                " Ghi nhớ đăng nhập"),
                            React.createElement("button", { type: "button", onClick: () => switchMode('forgot') }, "Quên mật khẩu?")),
                        React.createElement("button", { className: "pet-auth-submit", type: "submit", disabled: busy },
                            busy ? 'Đang xác thực…' : 'Đăng nhập ngay',
                            " ",
                            React.createElement(ArrowRight, { size: 18 })),
                        React.createElement("p", { className: "pet-auth-switch" },
                            "Chưa có tài khoản? ",
                            React.createElement("button", { type: "button", onClick: () => switchMode('register') }, "Đăng ký thành viên mới"))))),
                mode === 'register' && (React.createElement("form", { onSubmit: handleRegister, className: "pet-auth-form" },
                    React.createElement("label", { className: "pet-auth-field" },
                        React.createElement(UserRound, { size: 18 }),
                        React.createElement("input", { value: fullName, onChange: (e) => setFullName(e.target.value), placeholder: "Họ và tên", autoComplete: "name", required: true })),
                    React.createElement("label", { className: "pet-auth-field" },
                        React.createElement(Mail, { size: 18 }),
                        React.createElement("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Email", autoComplete: "email", required: true })),
                    React.createElement("label", { className: "pet-auth-field" },
                        React.createElement(Phone, { size: 18 }),
                        React.createElement("input", { type: "tel", value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "Số điện thoại", autoComplete: "tel", required: true })),
                    React.createElement("label", { className: "pet-auth-field" },
                        React.createElement(Lock, { size: 18 }),
                        React.createElement("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Mật khẩu (ít nhất 6 ký tự)", autoComplete: "new-password", required: true })),
                    React.createElement("label", { className: "pet-auth-field" },
                        React.createElement(ShieldCheck, { size: 18 }),
                        React.createElement("input", { type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "Xác nhận mật khẩu", autoComplete: "new-password", required: true })),
                    React.createElement("button", { className: "pet-auth-submit", type: "submit", disabled: busy },
                        busy ? 'Đang tạo tài khoản…' : 'Tạo tài khoản Pet Phết',
                        " ",
                        React.createElement(UserRoundPlus, { size: 18 })),
                    React.createElement("p", { className: "pet-auth-switch" },
                        "Đã có tài khoản? ",
                        React.createElement("button", { type: "button", onClick: () => switchMode('login') }, "Đăng nhập")))),
                mode === 'forgot' && (React.createElement("div", { className: "pet-auth-form" },
                    !otpSent ? (React.createElement("form", { onSubmit: handleSendOtp, className: "pet-auth-form" },
                        React.createElement("label", { className: "pet-auth-field" },
                            React.createElement(Mail, { size: 18 }),
                            React.createElement("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Email đã đăng ký", required: true })),
                        React.createElement("button", { className: "pet-auth-submit", type: "submit" },
                            "Tạo mã OTP ",
                            React.createElement(ArrowRight, { size: 18 })))) : (React.createElement("form", { onSubmit: handleVerifyOtpAndReset, className: "pet-auth-form" },
                        React.createElement("label", { className: "pet-auth-field" },
                            React.createElement(ShieldCheck, { size: 18 }),
                            React.createElement("input", { value: otp, onChange: (e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)), inputMode: "numeric", maxLength: 6, placeholder: "Mã OTP 6 chữ số", required: true })),
                        React.createElement("label", { className: "pet-auth-field" },
                            React.createElement(Lock, { size: 18 }),
                            React.createElement("input", { type: "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), placeholder: "Mật khẩu mới", autoComplete: "new-password", required: true })),
                        React.createElement("button", { className: "pet-auth-submit", type: "submit", disabled: busy },
                            busy ? 'Đang cập nhật…' : 'Xác nhận & cập nhật',
                            " ",
                            React.createElement(ArrowRight, { size: 18 })))),
                    React.createElement("p", { className: "pet-auth-switch" },
                        React.createElement("button", { type: "button", onClick: () => switchMode('login') }, "← Quay lại đăng nhập")))),
                React.createElement("div", { className: "pet-auth-demo pet-auth-demo-credentials" },
                    React.createElement("div", null,
                        React.createElement("b", null, "Tài khoản dùng thử"),
                        React.createElement("span", null, "Đăng nhập bằng đúng khu vực và tài khoản tương ứng.")),
                    React.createElement("p", null,
                        React.createElement("strong", null, "Khách hàng:"),
                        " khachhang@petphet.vn")),
                React.createElement("p", { className: "pet-auth-note" }, "Mật khẩu dùng thử khách hàng: petphet123. Tài khoản Admin do chủ hệ thống cấp riêng, không thể tự đăng ký hoặc nâng quyền từ tài khoản khách hàng.")))));
};
