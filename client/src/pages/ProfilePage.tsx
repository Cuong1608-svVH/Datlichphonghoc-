import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, type Booking } from '../services/api';
import {
  Calendar,
  Clock,
  Layers,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit3,
  Phone,
  Building,
  CreditCard,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ProfilePageProps {
  onGoToRooms: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onGoToRooms }) => {
  const { user, refreshUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editStudentId, setEditStudentId] = useState(user?.student_id || '');
  const [editDepartment, setEditDepartment] = useState(user?.department || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [updateMsg, setUpdateMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Cancel booking modal
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await api.getUserBookings();
      if (res.success) {
        setBookings(res.bookings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMsg(null);
    try {
      const res = await api.updateProfile({
        name: editName,
        student_id: editStudentId,
        department: editDepartment,
        phone: editPhone,
      });
      if (res.success) {
        await refreshUser();
        setUpdateMsg({ text: 'Cập nhật hồ sơ thành công!', type: 'success' });
        setIsEditing(false);
      } else {
        setUpdateMsg({ text: res.message || 'Cập nhật thất bại', type: 'error' });
      }
    } catch {
      setUpdateMsg({ text: 'Lỗi kết nối máy chủ', type: 'error' });
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    setCancelError(null);

    try {
      const res = await api.cancelBooking(cancellingBooking.id);
      if (res.success) {
        setCancellingBooking(null);
        await fetchBookings();
      } else {
        setCancelError(res.message || 'Không thể hủy phòng');
      }
    } catch {
      setCancelError('Lỗi kết nối máy chủ');
    } finally {
      setIsCancelling(false);
    }
  };

  // Filter bookings according to active tab
  const upcomingBookings = bookings.filter((b) => b.status === 'CONFIRMED' && !b.is_past);
  const pastBookings = bookings.filter((b) => b.status === 'CONFIRMED' && b.is_past);
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');

  const currentTabBookings =
    activeTab === 'upcoming'
      ? upcomingBookings
      : activeTab === 'past'
      ? pastBookings
      : cancelledBookings;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* User Header Profile Card */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          marginBottom: '2rem',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <img
              src={
                user?.avatar && !user.avatar.includes('bottts')
                  ? user.avatar
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2563eb&color=fff&bold=true`
              }
              alt={user?.name}
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                border: '3px solid #2563eb',
                boxShadow: 'var(--shadow-sm)',
                objectFit: 'cover',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {user?.name}
                </h1>
                <span className={`badge ${user?.role === 'ADMIN' ? 'badge-booked' : 'badge-available'}`}>
                  {user?.role === 'ADMIN' ? 'Ban Quản Trị' : 'Sinh Viên'}
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {user?.email}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                {user?.student_id && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CreditCard size={14} color="#2563eb" /> MSSV: <strong style={{ color: 'var(--text-primary)' }}>{user.student_id}</strong>
                  </span>
                )}
                {user?.department && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building size={14} color="#2563eb" /> {user.department}
                  </span>
                )}
                {user?.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={14} color="#2563eb" /> {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setEditName(user?.name || '');
              setEditStudentId(user?.student_id || '');
              setEditDepartment(user?.department || '');
              setEditPhone(user?.phone || '');
            }}
            className="btn btn-secondary btn-sm"
          >
            <Edit3 size={15} />
            {isEditing ? 'Đóng chỉnh sửa' : 'Cập nhật thông tin'}
          </button>
        </div>

        {/* Edit profile form drawer */}
        {isEditing && (
          <form
            onSubmit={handleUpdateProfile}
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e2e8f0',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mã số sinh viên (MSSV)</label>
                <input
                  type="text"
                  value={editStudentId}
                  onChange={(e) => setEditStudentId(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Khoa / Ngành đào tạo</label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary btn-sm"
              >
                Hủy
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}

        {updateMsg && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.65rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              background: updateMsg.type === 'success' ? 'var(--status-available-bg)' : 'var(--status-booked-bg)',
              border: `1px solid ${updateMsg.type === 'success' ? 'var(--status-available-border)' : 'var(--status-booked-border)'}`,
              color: updateMsg.type === 'success' ? 'var(--status-available)' : 'var(--status-booked)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {updateMsg.text}
          </div>
        )}
      </div>

      {/* Stats Widgets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 700 }}>TỔNG LƯỢT ĐẶT</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {bookings.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Tổng các ca học đã book</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '0.825rem', color: 'var(--status-available)', fontWeight: 700 }}>SẮP DIỄN RA</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--status-available)', marginTop: '0.25rem' }}>
            {upcomingBookings.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ca học hợp lệ sẵn sàng</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '0.825rem', color: '#2563eb', fontWeight: 700 }}>ĐÃ HOÀN THÀNH</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
            {pastBookings.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Đã hoàn tất buổi học</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '0.825rem', color: 'var(--status-booked)', fontWeight: 700 }}>ĐÃ HỦY</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--status-booked)', marginTop: '0.25rem' }}>
            {cancelledBookings.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Lịch đã hủy trả lại phòng</div>
        </div>
      </div>

      {/* Booking History Section */}
      <div className="glass-panel" style={{ padding: '2rem', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Lịch Sử Đặt Phòng Học
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Theo dõi và quản lý các ca học của bạn
            </p>
          </div>

          {/* History Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`btn btn-sm ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              Sắp tới ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`btn btn-sm ${activeTab === 'past' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              Đã xong ({pastBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`btn btn-sm ${activeTab === 'cancelled' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              Đã hủy ({cancelledBookings.length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Đang tải lịch sử đặt phòng...
          </div>
        ) : currentTabBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: 'var(--text-muted)',
              }}
            >
              <Calendar size={28} />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Chưa có lịch đặt nào ở mục này
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Khám phá và đặt các phòng học hiện đại ngay hôm nay.
            </p>
            <button onClick={onGoToRooms} className="btn btn-primary btn-sm">
              Tìm và đặt phòng ngay <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentTabBookings.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: 'var(--shadow-sm)',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={b.image_url}
                    alt={b.room_name}
                    style={{ width: '80px', height: '65px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {b.room_name}
                      </span>
                      <span className="badge badge-floor" style={{ fontSize: '0.72rem' }}>
                        {b.room_code}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--status-available)', fontWeight: 700 }}>
                        <Calendar size={13} /> {b.booking_date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#2563eb', fontWeight: 700 }}>
                        <Clock size={13} /> {b.slot_name} ({b.start_time} - {b.end_time})
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Layers size={13} /> Tầng {b.floor}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Users size={13} /> {b.capacity} người
                      </span>
                    </div>

                    {b.notes && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                        Ghi chú: "{b.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Right action & Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {b.status === 'CANCELLED' ? (
                    <span className="badge badge-booked">
                      <XCircle size={14} /> Đã hủy vào {b.cancelled_at?.split(' ')[0] || ''}
                    </span>
                  ) : b.is_past ? (
                    <span className="badge badge-floor">
                      <CheckCircle size={14} /> Buổi học đã hoàn thành
                    </span>
                  ) : (
                    /* Active booking: Check 3-Hour Cancellation Rule */
                    <div>
                      {b.can_cancel ? (
                        <button
                          onClick={() => setCancellingBooking(b)}
                          className="btn btn-outline-danger btn-sm"
                        >
                          Hủy phòng này
                        </button>
                      ) : (
                        <div
                          title="Quy định: Chỉ được phép hủy phòng trước giờ bắt đầu tối thiểu 3 tiếng."
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.78rem',
                            color: '#b45309',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'help',
                            fontWeight: 600,
                          }}
                        >
                          <ShieldAlert size={14} />
                          Không thể hủy (Dưới 3 tiếng)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancellingBooking && (
        <div className="modal-backdrop" onClick={() => setCancellingBooking(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '2rem', maxWidth: '480px', backgroundColor: '#ffffff' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--status-booked-bg)',
                  border: '1px solid var(--status-booked-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <AlertCircle size={30} color="var(--status-booked)" />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Xác Nhận Hủy Đặt Phòng?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
                Bạn đang chuẩn bị hủy lịch đặt phòng:
              </p>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {cancellingBooking.room_name} ({cancellingBooking.room_code})
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Ngày: <strong style={{ color: 'var(--text-primary)' }}>{cancellingBooking.booking_date}</strong>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Ca học: <strong style={{ color: 'var(--text-primary)' }}>{cancellingBooking.slot_name}</strong>
              </div>
              <div style={{ color: 'var(--status-available)', fontSize: '0.825rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                <Sparkles size={14} /> Sau khi bạn hủy, phòng này sẽ tự động mở lại ngay lập tức cho các bạn sinh viên khác trên toàn hệ thống.
              </div>
            </div>

            {cancelError && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-booked-bg)',
                  border: '1px solid var(--status-booked-border)',
                  color: 'var(--status-booked)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  fontWeight: 600,
                }}
              >
                {cancelError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="btn btn-secondary"
                disabled={isCancelling}
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="btn btn-danger"
                disabled={isCancelling}
              >
                {isCancelling ? 'Đang xử lý...' : 'Xác Nhận Hủy Phòng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
