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
        pointerEvents: 'none',
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
            background: '#ffffff',
            border: `1.5px solid ${n.type === 'warning' ? '#fde68a' : '#a7f3d0'}`,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: n.type === 'warning' ? '#fffbeb' : '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={18} color={n.type === 'warning' ? '#d97706' : '#059669'} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: n.type === 'warning' ? '#b45309' : '#047857',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Đồng bộ Realtime
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.35, marginTop: '2px', fontWeight: 600 }}>
                {n.text}
              </div>
            </div>
          </div>

          <button
            onClick={() => dismissNotification(n.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
