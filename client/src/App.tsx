import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { ToastNotification } from './components/ToastNotification';
import { AuthModals } from './components/AuthModals';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'rooms' | 'profile' | 'admin'>('rooms');
  const [isOpenLogin, setIsOpenLogin] = useState<boolean>(false);
  const [isOpenRegister, setIsOpenRegister] = useState<boolean>(false);

  const handleOpenLogin = () => {
    setIsOpenRegister(false);
    setIsOpenLogin(true);
  };

  const handleOpenRegister = () => {
    setIsOpenLogin(false);
    setIsOpenRegister(true);
  };

  const handleCloseAuth = () => {
    setIsOpenLogin(false);
    setIsOpenRegister(false);
  };

  return (
    <div className="app-container">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
      />

      {/* Main View */}
      <main className="main-content">
        {currentTab === 'rooms' && (
          <HomePage
            onGoToProfile={() => setCurrentTab('profile')}
            onOpenLogin={handleOpenLogin}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage onGoToRooms={() => setCurrentTab('rooms')} />
        )}

        {currentTab === 'admin' && <AdminDashboardPage />}
      </main>

      {/* Live WebSocket Toast Notifications */}
      <ToastNotification />

      {/* Authentication Modals */}
      <AuthModals
        isOpenLogin={isOpenLogin}
        isOpenRegister={isOpenRegister}
        onClose={handleCloseAuth}
        onSwitchToLogin={handleOpenLogin}
        onSwitchToRegister={handleOpenRegister}
      />

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          marginTop: 'auto',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>UniStudy Booking</strong> • Hệ thống đặt phòng học trực tuyến thông minh
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
            <span>SQLite ACID Transaction</span>
            <span>WebSocket Live Sync</span>
            <span>Bảo vệ xung đột 409 Conflict</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
