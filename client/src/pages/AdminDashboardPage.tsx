import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, type Room, type Booking, type DashboardStats } from '../services/api';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Power,
  X,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<'rooms' | 'bookings'>('rooms');

  // Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Rooms management state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Room Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formFloor, setFormFloor] = useState<number>(1);
  const [formCapacity, setFormCapacity] = useState<number>(6);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'AVAILABLE' | 'MAINTENANCE'>('AVAILABLE');
  const [formError, setFormError] = useState<string | null>(null);

  // Bookings management state
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');

  // Admin Cancel Booking
  const [adminCancelModal, setAdminCancelModal] = useState<Booking | null>(null);

  const fetchStats = async () => {
    try {
      const res = await api.getDashboardStats();
      if (res.success) setStats(res.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.getRooms({});
      if (res.success) setRooms(res.rooms);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllBookings = async () => {
    setBookingsLoading(true);
    try {
      const res = await api.getAllBookings({
        date: bookingDateFilter || undefined,
        status: bookingStatusFilter || undefined,
        search: bookingSearch || undefined,
      });
      if (res.success) setAllBookings(res.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchRooms();
      fetchAllBookings();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (activeAdminTab === 'bookings' && isAdmin) {
      fetchAllBookings();
    }
  }, [bookingDateFilter, bookingStatusFilter, bookingSearch, activeAdminTab]);

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto' }}>
        <Shield size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Truy Cập Bị Từ Chối</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Bạn cần đăng nhập bằng tài khoản Quản trị viên (Admin) để truy cập bảng điều khiển này.
        </p>
      </div>
    );
  }

  const openCreateModal = () => {
    setEditingRoom(null);
    setFormName('');
    setFormCode('');
    setFormFloor(1);
    setFormCapacity(6);
    setFormImageUrl('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80');
    setFormDescription('');
    setFormStatus('AVAILABLE');
    setFormError(null);
    setRoomModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormName(room.name);
    setFormCode(room.code);
    setFormFloor(room.floor);
    setFormCapacity(room.capacity);
    setFormImageUrl(room.image_url);
    setFormDescription(room.description || '');
    setFormStatus(room.status);
    setFormError(null);
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      name: formName,
      code: formCode,
      floor: Number(formFloor),
      capacity: Number(formCapacity),
      image_url: formImageUrl,
      description: formDescription,
      status: formStatus,
    };

    try {
      let res;
      if (editingRoom) {
        res = await api.updateRoom(editingRoom.id, payload);
      } else {
        res = await api.createRoom(payload);
      }

      if (res.success) {
        setRoomModalOpen(false);
        fetchRooms();
        fetchStats();
      } else {
        setFormError(res.message || 'Thao tác không thành công');
      }
    } catch (err) {
      setFormError('Lỗi kết nối máy chủ');
    }
  };

  const handleToggleStatus = async (room: Room) => {
    const nextStatus = room.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
    try {
      const res = await api.updateRoom(room.id, { status: nextStatus });
      if (res.success) {
        fetchRooms();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn phòng ${room.name} (${room.code})?`)) return;
    try {
      const res = await api.deleteRoom(room.id);
      if (res.success) {
        fetchRooms();
        fetchStats();
      } else {
        alert(res.message || 'Không thể xóa phòng này');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleAdminCancelBooking = async () => {
    if (!adminCancelModal) return;
    try {
      const res = await api.cancelBooking(adminCancelModal.id);
      if (res.success) {
        setAdminCancelModal(null);
        fetchAllBookings();
        fetchStats();
      } else {
        alert(res.message || 'Không thể hủy lịch đặt này');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#f472b6', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <Shield size={16} /> BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', color: '#ffffff' }}>
              Quản Trị Thư Viện & Phòng Học
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Quản lý toàn bộ danh mục phòng học, giám sát lịch đặt phòng của sinh viên và kiểm soát tình trạng vận hành
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setActiveAdminTab('rooms')}
              className={`btn ${activeAdminTab === 'rooms' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Quản Lý Phòng ({rooms.length})
            </button>
            <button
              onClick={() => setActiveAdminTab('bookings')}
              className={`btn ${activeAdminTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Lịch Đặt Toàn Trường
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI Widgets */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TỔNG SỐ PHÒNG</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
              {stats.rooms.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '4px' }}>
              {stats.rooms.available} phòng đang sẵn sàng
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PHÒNG BẢO TRÌ</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.25rem' }}>
              {stats.rooms.maintenance}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Đang tạm ngưng nhận lịch</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>LƯỢT ĐẶT HÔM NAY</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#818cf8', marginTop: '0.25rem' }}>
              {stats.today.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '4px' }}>
              {stats.today.confirmed} thành công • {stats.today.cancelled} đã hủy
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TỔNG LƯỢT ĐẶT TOÀN THỜI GIAN</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ec4899', marginTop: '0.25rem' }}>
              {stats.allTime.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
              {stats.allTime.confirmed} lượt học thành công
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Room Management */}
      {activeAdminTab === 'rooms' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                Danh Sách Phòng Học Hiện Có
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Thêm mới, sửa thông tin hoặc chuyển trạng thái bảo trì phòng
              </p>
            </div>

            <button onClick={openCreateModal} className="btn btn-primary btn-sm">
              <Plus size={16} /> Thêm Phòng Mới
            </button>
          </div>

          {/* Rooms Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Phòng học</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Vị trí</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Sức chứa</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Trạng thái</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr
                    key={room.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.2s',
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <img
                          src={room.image_url}
                          alt={room.name}
                          style={{ width: '56px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{room.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>{room.code}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-floor">Tầng {room.floor}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-capacity">{room.capacity} người</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {room.status === 'AVAILABLE' ? (
                        <span className="badge badge-available">
                          <span className="pulse-dot available" /> Sẵn sàng
                        </span>
                      ) : (
                        <span className="badge badge-maintenance">
                          <Power size={12} /> Đang bảo trì
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleToggleStatus(room)}
                          className="btn btn-secondary btn-sm"
                          title="Bật/Tắt bảo trì"
                        >
                          <Power size={14} color={room.status === 'AVAILABLE' ? '#fbbf24' : '#34d399'} />
                        </button>
                        <button
                          onClick={() => openEditModal(room)}
                          className="btn btn-secondary btn-sm"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room)}
                          className="btn btn-outline-danger btn-sm"
                          title="Xóa phòng"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: All Bookings Management */}
      {activeAdminTab === 'bookings' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                Danh Sách Tất Cả Lịch Đặt Phòng
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Giám sát sinh viên đặt phòng, lọc theo ngày và can thiệp hủy phòng khi cần
              </p>
            </div>

            <button onClick={fetchAllBookings} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} className={bookingsLoading ? 'pulse' : ''} /> Làm mới
            </button>
          </div>

          {/* Bookings Filter Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
              background: 'rgba(15, 23, 42, 0.4)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Lọc theo ngày</label>
              <input
                type="date"
                value={bookingDateFilter}
                onChange={(e) => setBookingDateFilter(e.target.value)}
                className="form-input"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Trạng thái</label>
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="form-select"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Tìm sinh viên / Phòng</label>
              <input
                type="text"
                placeholder="Tên, MSSV, Email..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="form-input"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Bookings Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Sinh viên</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Phòng</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Thời gian học</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Ghi chú</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Trạng thái</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.map((b) => (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{b.user_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {b.student_id ? `MSSV: ${b.student_id} • ` : ''}{b.user_email}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#c7d2fe' }}>{b.room_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{b.room_code} (Tầng {b.floor})</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#34d399' }}>{b.booking_date}</div>
                      <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>{b.slot_name}</div>
                    </td>
                    <td style={{ padding: '1rem', color: '#cbd5e1', maxWidth: '200px' }}>
                      {b.notes || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {b.status === 'CONFIRMED' ? (
                        <span className="badge badge-available">
                          <CheckCircle size={12} /> Đã xác nhận
                        </span>
                      ) : (
                        <span className="badge badge-booked">
                          <XCircle size={12} /> Đã hủy
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => setAdminCancelModal(b)}
                          className="btn btn-outline-danger btn-sm"
                        >
                          Hủy lịch này
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Room Modal (Create / Edit) */}
      {roomModalOpen && (
        <div className="modal-backdrop" onClick={() => setRoomModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '2rem', maxWidth: '540px' }}
          >
            <button
              onClick={() => setRoomModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              {editingRoom ? 'Chỉnh Sửa Phòng Học' : 'Thêm Phòng Học Mới'}
            </h2>

            {formError && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveRoom}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Tên phòng học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: P.204 - Không Gian Nghiên Cứu AI"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Mã phòng *</label>
                  <input
                    type="text"
                    required
                    placeholder="R-204"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vị trí (Tầng) *</label>
                  <select
                    value={formFloor}
                    onChange={(e) => setFormFloor(Number(e.target.value))}
                    className="form-select"
                  >
                    <option value={1}>Tầng 1</option>
                    <option value={2}>Tầng 2</option>
                    <option value={3}>Tầng 3</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Sức chứa (Người) *</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Trạng thái vận hành *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="AVAILABLE">Sẵn sàng sử dụng</option>
                    <option value="MAINTENANCE">Đang bảo trì</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Đường dẫn ảnh phòng (Image URL)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Tiện nghi, đặc điểm phòng học..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRoom ? 'Lưu Cập Nhật' : 'Tạo Phòng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Cancel Booking Modal */}
      {adminCancelModal && (
        <div className="modal-backdrop" onClick={() => setAdminCancelModal(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '2rem', maxWidth: '480px' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 0.75rem' }} />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Admin Hủy Lịch Đặt Phòng</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Bạn đang sử dụng quyền Quản trị viên để hủy lịch đặt của sinh viên:
              </p>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>Sinh viên: <strong>{adminCancelModal.user_name}</strong></div>
              <div>Phòng: <strong>{adminCancelModal.room_name}</strong> ({adminCancelModal.room_code})</div>
              <div>Ngày: <strong>{adminCancelModal.booking_date}</strong> - {adminCancelModal.slot_name}</div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setAdminCancelModal(null)}
                className="btn btn-secondary"
              >
                Đóng
              </button>
              <button
                onClick={handleAdminCancelBooking}
                className="btn btn-danger"
              >
                Xác Nhận Hủy (Admin Override)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
