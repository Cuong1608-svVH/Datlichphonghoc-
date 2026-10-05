import React, { useState } from 'react';
import { type Room, type Slot, api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  Layers,
  Users,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface BookingModalProps {
  room: Room | null;
  slot: Slot | null;
  date: string;
  onClose: () => void;
  onBookingSuccess: () => void;
  onGoToProfile: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  room,
  slot,
  date,
  onClose,
  onBookingSuccess,
  onGoToProfile,
}) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!room || !slot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Vui lòng đăng nhập để tiến hành đặt phòng học.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setIsConflict(false);

    try {
      const res = await api.bookRoom({
        room_id: room.id,
        booking_date: date,
        slot_id: slot.id,
        notes,
      });

      if (res.success) {
        setIsSuccess(true);
        // Trigger celebratory confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
        });
        onBookingSuccess();
      } else {
        if (res.code === 'SLOT_CONFLICT') {
          setIsConflict(true);
        }
        setErrorMsg(res.message || 'Không thể đặt phòng. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '2rem' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
        >
          <X size={18} />
        </button>

        {isSuccess ? (
          /* Success Screen */
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '2px solid rgba(16, 185, 129, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                animation: 'scaleUp 0.3s ease',
              }}
            >
              <CheckCircle2 size={40} color="#10b981" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>
              Đặt Phòng Thành Công!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Bạn đã giữ chỗ thành công cho <strong style={{ color: '#818cf8' }}>{room.name}</strong> vào ngày <strong>{date}</strong> ({slot.name}).
            </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã phòng:</span>
                <span style={{ fontWeight: 600 }}>{room.code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vị trí:</span>
                <span style={{ fontWeight: 600 }}>Tầng {room.floor}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Khung giờ:</span>
                <span style={{ fontWeight: 600 }}>{slot.start_time} - {slot.end_time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Người đặt:</span>
                <span style={{ fontWeight: 600, color: '#34d399' }}>{user?.name}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={onClose} className="btn btn-secondary">
                Đặt thêm phòng khác
              </button>
              <button
                onClick={() => {
                  onClose();
                  onGoToProfile();
                }}
                className="btn btn-primary"
              >
                Xem Lịch Sử Đặt Của Tôi
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'inline-block', marginBottom: '0.25rem' }}>
                <span className="badge badge-floor" style={{ fontSize: '0.72rem' }}>
                  XÁC NHẬN ĐẶT PHÒNG
                </span>
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>
                {room.name}
              </h2>
            </div>

            {/* Room Summary Header */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.5rem',
              }}
            >
              <img
                src={room.image_url}
                alt={room.name}
                style={{ width: '90px', height: '70px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#94a3b8' }}>
                    <Layers size={14} color="#818cf8" /> Tầng {room.floor}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#94a3b8' }}>
                    <Users size={14} color="#818cf8" /> {room.capacity} người
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#e2e8f0', fontWeight: 600 }}>
                    <Calendar size={14} color="#34d399" /> {date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#e2e8f0', fontWeight: 600 }}>
                    <Clock size={14} color="#34d399" /> {slot.name}
                  </span>
                </div>
              </div>
            </div>

            {/* System Rules Pill */}
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                fontSize: '0.8rem',
                color: '#c7d2fe',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '4px' }}>
                <ShieldCheck size={16} /> Quy định đặt phòng:
              </div>
              <div>• 1 sinh viên được đăng ký <strong>tối đa 3 ca học / ngày</strong>.</div>
              <div>• Quyền hủy phòng chỉ áp dụng <strong>trước giờ bắt đầu ca học tối thiểu 3 tiếng</strong>.</div>
            </div>

            {/* Conflict Warning Box (Race Condition) */}
            {isConflict && (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#f87171', marginBottom: '0.35rem' }}>
                  <AlertTriangle size={18} /> XUNG ĐỘT ĐẶT PHÒNG ĐỒNG THỜI (409 CONFLICT)
                </div>
                <div>{errorMsg}</div>
                <div style={{ marginTop: '0.75rem' }}>
                  <button
                    onClick={onClose}
                    className="btn btn-secondary btn-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    Quay lại chọn phòng khác
                  </button>
                </div>
              </div>
            )}

            {/* Normal Error Box */}
            {!isConflict && errorMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertTriangle size={16} />
                {errorMsg}
              </div>
            )}

            {/* Booking Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={15} /> Mục đích sử dụng / Ghi chú (Không bắt buộc)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Học nhóm ôn thi môn Lập trình Web, làm đồ án tốt nghiệp..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || isConflict}
                  style={{ minWidth: '150px' }}
                >
                  {isSubmitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="pulse-dot available pulse" /> Đang ghi nhận...
                    </span>
                  ) : (
                    'Xác Nhận Đặt Phòng'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
