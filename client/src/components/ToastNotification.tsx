import React from 'react';
import { useSocket } from '../context/SocketContext';
import { X, Zap } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { liveNotifications, dismissNotification } = useSocket();

  if (liveNotifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none'
      }}
    >
      {liveNotifications.map((n) => (
        <div
          key={n.id}
          className="glass-panel"
          style={{
            pointerEvents: 'auto',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: n.type === 'warning' ? 'rgba(30, 27, 75, 0.9)' : 'rgba(6, 78, 59, 0.9)',
            border: `1px solid ${n.type === 'warning' ? 'rgba(129, 140, 248, 0.4)' : 'rgba(52, 211, 153, 0.4)'}`,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: n.type === 'warning' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Zap size={18} color={n.type === 'warning' ? '#818cf8' : '#34d399'} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Đồng bộ Realtime
              </div>
              <div style={{ fontSize: '0.825rem', color: '#e2e8f0', lineHeight: 1.3, marginTop: '2px' }}>
                {n.text}
              </div>
            </div>
          </div>

          <button
            onClick={() => dismissNotification(n.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex'
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
