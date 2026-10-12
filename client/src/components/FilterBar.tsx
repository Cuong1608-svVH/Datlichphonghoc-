import React from 'react';
import type { Slot } from '../services/api';
import { Calendar, Clock, Layers, Users, Search } from 'lucide-react';

interface FilterBarProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedSlotId: number;
  setSelectedSlotId: (slotId: number) => void;
  slots: Slot[];
  selectedFloor: string;
  setSelectedFloor: (floor: string) => void;
  selectedCapacity: string;
  setSelectedCapacity: (cap: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onlyAvailable: boolean;
  setOnlyAvailable: (val: boolean) => void;
  totalRoomsFound: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedDate,
  setSelectedDate,
  selectedSlotId,
  setSelectedSlotId,
  slots,
  selectedFloor,
  setSelectedFloor,
  selectedCapacity,
  setSelectedCapacity,
  searchQuery,
  setSearchQuery,
  onlyAvailable,
  setOnlyAvailable,
  totalRoomsFound,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.75rem',
        marginBottom: '2rem',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Top row: Date & Slot (Crucial 2-step selection for room availability) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="#2563eb" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Bước 1: Chọn Ngày Đặt Phòng
            </span>
          </div>

          {/* Quick Date Presets */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => setSelectedDate(today)}
              className={`btn btn-sm ${selectedDate === today ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setSelectedDate(tomorrow)}
              className={`btn btn-sm ${selectedDate === tomorrow ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              Ngày mai
            </button>
            <button
              onClick={() => setSelectedDate(dayAfter)}
              className={`btn btn-sm ${selectedDate === dayAfter ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              Ngày kia
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            min={today}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-input"
            style={{ maxWidth: '240px', fontWeight: 600, color: 'var(--text-primary)' }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hệ thống tự động đồng bộ tình trạng trống của từng phòng theo ngày bạn chọn
          </span>
        </div>
      </div>

      {/* Slots Selection Bar */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Clock size={18} color="#2563eb" />
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Bước 2: Chọn Ca Học Trong Ngày
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {slots.map((slot) => {
            const isSelected = selectedSlotId === slot.id;
            return (
              <button
                key={slot.id}
                onClick={() => setSelectedSlotId(slot.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition-normal)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: isSelected ? '#1d4ed8' : 'var(--text-primary)',
                    }}
                  >
                    {slot.name.split('(')[0].trim()}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: isSelected ? '#2563eb' : 'var(--text-muted)',
                    marginTop: '4px',
                    fontWeight: 600,
                  }}
                >
                  {slot.start_time} - {slot.end_time}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: '1px', background: '#e2e8f0', margin: '1.25rem 0' }} />

      {/* Multi-parameter Filters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'flex-end',
        }}
      >
        {/* Search */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Search size={14} />
            Tìm tên phòng / Mã
          </label>
          <input
            type="text"
            placeholder="Ví dụ: P.101, Alpha, R-102..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Floor Filter */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={14} />
            Vị trí (Tầng)
          </label>
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="form-select"
          >
            <option value="">Tất cả các tầng</option>
            <option value="1">Tầng 1 (Khu Thảo Luận Mở)</option>
            <option value="2">Tầng 2 (Khu Seminar & Nhóm)</option>
            <option value="3">Tầng 3 (Khu Hội Trường & Multimedia)</option>
          </select>
        </div>

        {/* Capacity Filter */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={14} />
            Kích cỡ (Sức chứa người)
          </label>
          <select
            value={selectedCapacity}
            onChange={(e) => setSelectedCapacity(e.target.value)}
            className="form-select"
          >
            <option value="">Tất cả kích cỡ</option>
            <option value="small">Phòng nhỏ (2 - 4 người)</option>
            <option value="medium">Phòng vừa (5 - 8 người)</option>
            <option value="large">Phòng lớn (9 - 15 người)</option>
            <option value="hall">Hội trường (&gt; 15 người)</option>
          </select>
        </div>

        {/* Toggle Available */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '0.7rem 0.85rem',
              background: onlyAvailable ? 'var(--status-available-bg)' : '#f8fafc',
              border: `1px solid ${onlyAvailable ? 'var(--status-available-border)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#059669', cursor: 'pointer' }}
            />
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: onlyAvailable ? 'var(--status-available)' : 'var(--text-secondary)',
              }}
            >
              Chỉ hiện phòng còn trống
            </span>
          </label>
        </div>
      </div>

      {/* Results summary pill */}
      <div
        style={{
          marginTop: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span>
          Đang hiển thị <strong style={{ color: 'var(--text-primary)' }}>{totalRoomsFound}</strong> phòng phù hợp với bộ lọc
        </span>
        {(selectedFloor || selectedCapacity || searchQuery || onlyAvailable) && (
          <button
            onClick={() => {
              setSelectedFloor('');
              setSelectedCapacity('');
              setSearchQuery('');
              setOnlyAvailable(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.825rem',
            }}
          >
            Xóa các bộ lọc nâng cao
          </button>
        )}
      </div>
    </div>
  );
};
