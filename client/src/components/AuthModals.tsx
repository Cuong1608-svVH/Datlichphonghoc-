import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';

interface AuthModalsProps {
  isOpenLogin: boolean;
  isOpenRegister: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onSwitchToLogin: () => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  isOpenLogin,
  isOpenRegister,
  onClose,
  onSwitchToRegister,
  onSwitchToLogin,
}) => {
  const { login, register } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  if (!isOpenLogin && !isOpenRegister) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    const res = await login({ email: loginEmail, password: loginPassword });
    setLoginLoading(false);
    if (res.success) {
      onClose();
    } else {
      setLoginError(res.message || 'Email hoặc mật khẩu không chính xác');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError(null);

    const res = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      student_id: regStudentId,
      department: regDepartment,
      phone: regPhone,
    });
    setRegLoading(false);
    if (res.success) {
      onClose();
    } else {
      setRegError(res.message || 'Đăng ký không thành công');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '2rem', maxWidth: '460px', backgroundColor: '#ffffff' }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f5f9')}
        >
          <X size={16} />
        </button>

        {isOpenLogin ? (
          /* Login Form */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}
              >
                <Lock size={22} color="#ffffff" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Đăng Nhập Hệ Thống
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                Đăng nhập để đặt phòng và theo dõi lịch sử
              </p>
            </div>

            {loginError && (
              <div
                style={{
                  padding: '0.7rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-booked-bg)',
                  border: '1px solid var(--status-booked-border)',
                  color: 'var(--status-booked)',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                }}
              >
                <AlertCircle size={16} />
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} color="#2563eb" /> Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@studyroom.edu.vn"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Lock size={14} color="#2563eb" /> Mật khẩu
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '1rem', fontWeight: 700 }}
                disabled={loginLoading}
              >
                {loginLoading ? 'Đang xác thực...' : 'Đăng Nhập'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Chưa có tài khoản?{' '}
                <span
                  onClick={onSwitchToRegister}
                  style={{ color: '#2563eb', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Đăng ký ngay
                </span>
              </div>
            </form>
          </div>
        ) : (
          /* Register Form */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}
              >
                <UserIcon size={22} color="#ffffff" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Đăng Ký Tài Khoản
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                Tạo tài khoản sinh viên để bắt đầu đặt phòng học
              </p>
            </div>

            {regError && (
              <div
                style={{
                  padding: '0.7rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-booked-bg)',
                  border: '1px solid var(--status-booked-border)',
                  color: 'var(--status-booked)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                }}
              >
                <AlertCircle size={16} />
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lê Hoàng Nam"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Email trường *</label>
                <input
                  type="email"
                  required
                  placeholder="namlh@studyroom.edu.vn"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Mật khẩu *</label>
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Mã số SV</label>
                  <input
                    type="text"
                    placeholder="SV2024..."
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="0987654321"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Khoa / Ngành</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khoa Công Nghệ Thông Tin"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '1rem', fontWeight: 700 }}
                disabled={regLoading}
              >
                {regLoading ? 'Đang tạo tài khoản...' : 'Hoàn Tất Đăng Ký'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Đã có tài khoản?{' '}
                <span
                  onClick={onSwitchToLogin}
                  style={{ color: '#2563eb', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Đăng nhập
                </span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
