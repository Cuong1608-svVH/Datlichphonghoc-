import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { BookOpen, Shield, User as UserIcon, LogOut, Radio, Calendar } from 'lucide-react';

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
  const { isConnected } = useSocket();

  return (
    <header className="glass-panel" style={{ margin: '1rem 1.5rem 0', borderRadius: 'var(--radius-lg)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Logo */}
        <div
          onClick={() => setCurrentTab('rooms')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            background: 'var(--primary-gradient)',
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}>
            <BookOpen size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'var(--font-heading)'
            }}>
              UniStudy
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '-2px' }}>
              Booking Room Hub
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setCurrentTab('rooms')}
            className={`btn btn-sm ${currentTab === 'rooms' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <Calendar size={16} />
            Tìm & Đặt Phòng
          </button>

          {user && (
            <button
              onClick={() => setCurrentTab('profile')}
              className={`btn btn-sm ${currentTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <UserIcon size={16} />
              Lịch Sử & Cá Nhân
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`btn btn-sm ${currentTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: 'var(--radius-full)',
                background: currentTab === 'admin' ? 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' : undefined
              }}
            >
              <Shield size={16} />
              Quản Trị Admin
            </button>
          )}
        </nav>

        {/* Right Section: Socket Status + Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Real-time Indicator */}
          <div
            title={isConnected ? 'Đang kết nối Realtime Socket.io đồng bộ trực tiếp' : 'Mất kết nối máy chủ realtime'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isConnected ? '#34d399' : '#f87171'
            }}
          >
            <Radio size={14} className={isConnected ? 'pulse' : ''} />
            {isConnected ? 'Realtime Live' : 'Offline'}
          </div>

          {/* User profile / Auth buttons */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                onClick={() => setCurrentTab('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                  alt={user.name}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: user.role === 'ADMIN' ? '#f472b6' : '#34d399', fontWeight: 600 }}>
                    {user.role === 'ADMIN' ? 'Quản trị viên' : 'Sinh viên'}
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
