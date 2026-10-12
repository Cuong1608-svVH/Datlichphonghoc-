import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User as UserIcon, LogOut, Calendar } from 'lucide-react';

interface NavbarProps {
  currentTab: 'rooms' | 'profile' | 'admin';
  setCurrentTab: (tab: 'rooms' | 'profile' | 'admin') => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenLogin,
  onOpenRegister,
}) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header
      className="glass-panel"
      style={{
        margin: '1rem 1.5rem 0',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Left Section: Brand Title + Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
          {/* Brand Title (Bỏ icon, chỉ để lại tên booking studyroom) */}
          <div
            onClick={() => setCurrentTab('rooms')}
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#0f172a',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            Booking Studyroom
          </div>

          {/* Navigation Tabs (Đẩy 2 element này qua bên trái) */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentTab('rooms')}
              className={`btn btn-sm ${currentTab === 'rooms' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <Calendar size={15} />
              Tìm & Đặt Phòng
            </button>

            {user && (
              <button
                onClick={() => setCurrentTab('profile')}
                className={`btn btn-sm ${currentTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                <UserIcon size={15} />
                Lịch Sử & Cá Nhân
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`btn btn-sm ${currentTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  borderRadius: 'var(--radius-full)',
                  background: currentTab === 'admin' ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : undefined,
                  color: currentTab === 'admin' ? '#ffffff' : undefined,
                }}
              >
                <Shield size={15} />
                Quản Trị Admin
              </button>
            )}
          </nav>
        </div>

        {/* Right Section: User Profile / Auth buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                onClick={() => setCurrentTab('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#f1f5f9',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: user.role === 'ADMIN' ? '#7c3aed' : 'var(--status-available)',
                      fontWeight: 700,
                    }}
                  >
                    {user.role === 'ADMIN' ? 'Ban Quản Trị' : 'Sinh viên'}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title="Đăng xuất"
                style={{ padding: '0.5rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={onOpenLogin} className="btn btn-secondary btn-sm">
                Đăng Nhập
              </button>
              <button onClick={onOpenRegister} className="btn btn-primary btn-sm">
                Đăng Ký
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

