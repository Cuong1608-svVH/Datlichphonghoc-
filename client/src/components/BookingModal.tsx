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
          colors: ['#2563eb', '#059669', '#d97706', '#ec4899'],
        });
        onBookingSuccess();
      } else {
        if (res.code === 'SLOT_CONFLICT') {
          setIsConflict(true);
        }
        setErrorMsg(res.message || 'Không thể đặt phòng. Vui lòng thử lại.');
      }
    } catch {
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
        style={{ padding: '2rem', backgroundColor: '#ffffff' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#f1f5f9',
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
          onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f5f9')}
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
                background: 'var(--status-available-bg)',
                border: '2px solid var(--status-available-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                animation: 'scaleUp 0.3s ease',
              }}
            >
              <CheckCircle2 size={40} color="var(--status-available)" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Đặt Phòng Thành Công!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Bạn đã giữ chỗ thành công cho <strong style={{ color: '#2563eb' }}>{room.name}</strong> vào ngày <strong>{date}</strong> ({slot.name}).
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã phòng:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{room.code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vị trí:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Tầng {room.floor}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Khung giờ:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{slot.start_time} - {slot.end_time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Người đặt:</span>
                <span style={{ fontWeight: 700, color: 'var(--status-available)' }}>{user?.name}</span>
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
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
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
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
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
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                    <Layers size={14} color="#2563eb" /> Tầng {room.floor}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                    <Users size={14} color="#2563eb" /> {room.capacity} người
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    <Calendar size={14} color="var(--status-available)" /> {date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    <Clock size={14} color="var(--status-available)" /> {slot.name}
                  </span>
                </div>
              </div>
            </div>

            {/* System Rules Pill */}
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                fontSize: '0.8rem',
                color: '#1e40af',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#1d4ed8', marginBottom: '4px' }}>
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
                  background: 'var(--status-booked-bg)',
                  border: '1px solid var(--status-booked-border)',
                  color: 'var(--status-booked)',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--status-booked)', marginBottom: '0.35rem' }}>
                  <AlertTriangle size={18} /> XUNG ĐỘT ĐẶT PHÒNG ĐỒNG THỜI (409 CONFLICT)
                </div>
                <div>{errorMsg}</div>
                <div style={{ marginTop: '0.75rem' }}>
                  <button
                    onClick={onClose}
                    className="btn btn-secondary btn-sm"
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
