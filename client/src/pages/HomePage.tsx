import React, { useState, useEffect, useCallback } from 'react';
import { type Room, type Slot, api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { FilterBar } from '../components/FilterBar';
import { RoomCard } from '../components/RoomCard';
import { BookingModal } from '../components/BookingModal';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface HomePageProps {
  onGoToProfile: () => void;
  onOpenLogin?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onGoToProfile }) => {
  const { lastEvent } = useSocket();

  // Filter state
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedSlotId, setSelectedSlotId] = useState<number>(1);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedCapacity, setSelectedCapacity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // Rooms data state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking modal state
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);

  // Fetch slots on mount
  useEffect(() => {
    api.getSlots().then((res) => {
      if (res.success && res.slots.length > 0) {
        setSlots(res.slots);
        // Default to slot 1 or first available
        setSelectedSlotId(res.slots[0].id);
      }
    });
  }, []);

  // Fetch rooms whenever date, slot, or filters change
  const fetchRooms = useCallback(async () => {
    if (!selectedSlotId) return;
    setIsLoading(true);
    setError(null);

    let capMin: number | undefined;
    let capMax: number | undefined;

    if (selectedCapacity === 'small') {
      capMin = 2;
      capMax = 4;
    } else if (selectedCapacity === 'medium') {
      capMin = 5;
      capMax = 8;
    } else if (selectedCapacity === 'large') {
      capMin = 9;
      capMax = 15;
    } else if (selectedCapacity === 'hall') {
      capMin = 16;
    }

    try {
      const res = await api.getRooms({
        date: selectedDate,
        slot_id: selectedSlotId,
        floor: selectedFloor || undefined,
        capacity_min: capMin,
        capacity_max: capMax,
        search: searchQuery || undefined,
        only_available: onlyAvailable ? true : undefined,
      });

      if (res.success) {
        setRooms(res.rooms);
      } else {
        setError('Không thể tải danh sách phòng học');
      }
    } catch {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedSlotId, selectedFloor, selectedCapacity, searchQuery, onlyAvailable]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Real-time listener: Update room availability immediately when a WebSocket event arrives
  useEffect(() => {
    if (!lastEvent) return;

    // Check if the event matches currently selected date & slot
    if (lastEvent.bookingDate === selectedDate && Number(lastEvent.slotId) === Number(selectedSlotId)) {
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.id === Number(lastEvent.roomId)) {
            if (lastEvent.action === 'BOOKED') {
              return {
                ...room,
                is_booked: true,
                is_available: false,
                current_booking: {
                  booking_id: lastEvent.bookingId || 0,
                  booked_by_user_id: lastEvent.bookedByUserId || 0,
                  booked_by_name: lastEvent.bookedBy || 'Người dùng khác',
                },
              };
            } else if (lastEvent.action === 'CANCELLED') {
              return {
                ...room,
                is_booked: false,
                is_available: room.status === 'AVAILABLE',
                current_booking: null,
              };
            }
          }
          return room;
        })
      );
    }
  }, [lastEvent, selectedDate, selectedSlotId]);

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) || null;
  const selectedSlotName = selectedSlot ? `${selectedSlot.name} (${selectedSlot.start_time} - ${selectedSlot.end_time})` : '';

  return (
    <div>
      {/* Filter Bar with Date, Fixed Slots, Floor, Capacity, Keyword */}
      <FilterBar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedSlotId={selectedSlotId}
        setSelectedSlotId={setSelectedSlotId}
        slots={slots}
        selectedFloor={selectedFloor}
        setSelectedFloor={setSelectedFloor}
        selectedCapacity={selectedCapacity}
        setSelectedCapacity={setSelectedCapacity}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onlyAvailable={onlyAvailable}
        setOnlyAvailable={setOnlyAvailable}
        totalRoomsFound={rooms.length}
      />

      {/* Room Grid Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Danh Sách Phòng Học
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Hiển thị tình trạng phòng cho ngày <strong style={{ color: '#2563eb' }}>{selectedDate}</strong> -{' '}
            <strong style={{ color: '#2563eb' }}>{selectedSlotName}</strong>
          </p>
        </div>

        <button
          onClick={fetchRooms}
          className="btn btn-secondary btn-sm"
          style={{ gap: '0.4rem' }}
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'pulse' : ''} />
          Làm mới danh sách
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-booked-bg)',
            border: '1px solid var(--status-booked-border)',
            color: 'var(--status-booked)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '2rem',
          }}
        >
          <AlertCircle size={20} />
          <div style={{ fontWeight: 600 }}>{error}</div>
        </div>
      )}

      {/* Loading state skeleton */}
      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="glass-panel shimmer"
              style={{ height: '380px', borderRadius: 'var(--radius-lg)' }}
            />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        /* Empty state */
        <div
          className="glass-panel"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: 'var(--text-muted)',
            }}
          >
            <AlertCircle size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Không tìm thấy phòng phù hợp
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Không có phòng nào thỏa mãn tiêu chí tìm kiếm hoặc tất cả phòng đã được đặt kín ở ca này. Hãy thử đổi ca học, tầng hoặc kích cỡ phòng.
          </p>
          <button
            onClick={() => {
              setSelectedFloor('');
              setSelectedCapacity('');
              setSearchQuery('');
              setOnlyAvailable(false);
            }}
            className="btn btn-secondary"
          >
            Đặt lại bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        /* Room Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onBook={(r) => setBookingRoom(r)}
              selectedDate={selectedDate}
              selectedSlotName={selectedSlot ? `${selectedSlot.name} (${selectedSlot.start_time} - ${selectedSlot.end_time})` : ''}
            />
          ))}
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {bookingRoom && (
        <BookingModal
          room={bookingRoom}
          slot={selectedSlot}
          date={selectedDate}
          onClose={() => setBookingRoom(null)}
          onBookingSuccess={() => {
            fetchRooms();
          }}
          onGoToProfile={onGoToProfile}
        />
      )}
    </div>
  );
};
