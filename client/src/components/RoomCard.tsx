import React, { useState, useEffect } from 'react';
import type { Room } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Layers, ShieldAlert, CheckCircle, Calendar } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onBook: (room: Room) => void;
  selectedDate?: string;
  selectedSlotName: string;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onBook,
  selectedSlotName,
}) => {
  const { user } = useAuth();
  const [justUpdated, setJustUpdated] = useState(false);

  // Flash highlight when room availability updates in real time
  useEffect(() => {
    setJustUpdated(true);
    const timer = setTimeout(() => setJustUpdated(false), 2000);
    return () => clearTimeout(timer);
  }, [room.is_available, room.is_booked, room.status]);

  const isMyBooking = room.current_booking?.booked_by_user_id === user?.id;

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: justUpdated
          ? '2px solid #2563eb'
          : room.is_available
          ? '1px solid #e2e8f0'
          : '1px solid #f1f5f9',
        boxShadow: justUpdated
          ? '0 0 20px rgba(37, 99, 235, 0.25)'
          : '0 2px 8px rgba(15, 23, 42, 0.04)',
        background: room.is_available ? '#ffffff' : '#f8fafc',
      }}
    >
      {/* Image Header with Badges */}
      <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
        <img
          src={room.image_url}
          alt={room.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
            filter: room.status === 'MAINTENANCE' || room.is_booked ? 'grayscale(25%) contrast(0.95)' : 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />

        {/* Room Code Pill */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            color: '#0f172a',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
          }}
        >
          {room.code}
        </div>

        {/* Status Badge */}
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          {room.status === 'MAINTENANCE' ? (
            <span className="badge badge-maintenance" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
              <ShieldAlert size={12} />
              Đang bảo trì
            </span>
          ) : room.is_booked ? (
            <span className="badge badge-booked" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
              <span className="pulse-dot booked" />
              Đã có người đặt
            </span>
          ) : (
            <span className="badge badge-available" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
              <span className="pulse-dot available pulse" />
              Có thể đặt ngay
            </span>
          )}
        </div>

        {/* Floor and Capacity tags over image */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            display: 'flex',
            gap: '0.5rem',
          }}
        >
          <span
            className="badge badge-floor"
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              color: '#1d4ed8',
              border: '1px solid rgba(191, 219, 254, 0.9)',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            <Layers size={12} />
            Tầng {room.floor}
          </span>
          <span
            className="badge badge-capacity"
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              color: '#334155',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            <Users size={12} />
            {room.capacity} chỗ ngồi
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.45rem', color: 'var(--text-primary)' }}>
            {room.name}
          </h3>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem', minHeight: '42px' }}>
            {room.description || 'Không gian học tập chuẩn đại học, yên tĩnh và đầy đủ tiện nghi.'}
          </p>

          {/* Current slot info tag */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.8rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
              <Calendar size={14} color="#2563eb" />
              <span style={{ fontWeight: 600 }}>Khung giờ:</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedSlotName}
            </span>
          </div>

          {/* If booked, show who booked */}
          {room.is_booked && room.current_booking && (
            <div
              style={{
                fontSize: '0.78rem',
                color: isMyBooking ? 'var(--status-available)' : 'var(--status-booked)',
                background: isMyBooking ? 'var(--status-available-bg)' : 'var(--status-booked-bg)',
                border: `1px solid ${isMyBooking ? 'var(--status-available-border)' : 'var(--status-booked-border)'}`,
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle size={14} />
              {isMyBooking
                ? 'Bạn đã đặt phòng này ở ca học này'
                : `Đã được đặt bởi: ${room.current_booking.booked_by_name}`}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div>
          {room.status === 'MAINTENANCE' ? (
            <button className="btn btn-secondary" style={{ width: '100%', opacity: 0.7 }} disabled>
              Phòng Đang Bảo Trì
            </button>
          ) : room.is_booked ? (
            <button className="btn btn-secondary" style={{ width: '100%', opacity: 0.65, cursor: 'not-allowed' }} disabled>
              {isMyBooking ? 'Bạn Đã Đặt Ca Này' : 'Đã Có Người Đặt Ca Này'}
            </button>
          ) : (
            <button
              onClick={() => onBook(room)}
              className="btn btn-primary"
              style={{ width: '100%', fontWeight: 700 }}
            >
              Đặt Phòng Ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
