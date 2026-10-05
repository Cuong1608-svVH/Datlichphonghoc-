import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { theme } from '../styles/theme';
import { api, type Room, type Slot } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { DateSelector } from '../components/DateSelector';
import { SlotSelector } from '../components/SlotSelector';
import { RoomCard } from '../components/RoomCard';
import { BookingModal } from '../components/BookingModal';

export const HomeScreen: React.FC = () => {
  const { isConnected, lastEvent } = useSocket();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedSlotId, setSelectedSlotId] = useState<number>(1);
  const [slots, setSlots] = useState<Slot[]>([]);

  // Filters
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedCapacity, setSelectedCapacity] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Booking Modal
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);

  // Load slots
  useEffect(() => {
    api.getSlots().then((res) => {
      if (res.success && res.slots.length > 0) {
        setSlots(res.slots);
        setSelectedSlotId(res.slots[0].id);
      }
    });
  }, []);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    if (!selectedSlotId) return;
    setLoading(true);

    let capMin: number | undefined;
    let capMax: number | undefined;
    if (selectedCapacity === 'small') { capMin = 2; capMax = 4; }
    else if (selectedCapacity === 'medium') { capMin = 5; capMax = 8; }
    else if (selectedCapacity === 'large') { capMin = 9; capMax = 15; }
    else if (selectedCapacity === 'hall') { capMin = 16; }

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
      }
    } catch (err) {
      console.log('Error fetching rooms:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, selectedSlotId, selectedFloor, selectedCapacity, searchQuery, onlyAvailable]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Real-time synchronization
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.bookingDate === selectedDate && Number(lastEvent.slotId) === Number(selectedSlotId)) {
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.id === lastEvent.roomId) {
            const isBooked = lastEvent.status === 'BOOKED';
            return {
              ...room,
              is_booked: isBooked,
              is_available: room.status !== 'MAINTENANCE' && !isBooked,
              current_booking: isBooked
                ? {
                    booking_id: lastEvent.bookingId || 0,
                    booked_by_user_id: lastEvent.bookedByUserId || 0,
                    booked_by_name: lastEvent.bookedBy || 'Sinh viên khác',
                  }
                : null,
            };
          }
          return room;
        })
      );
    }
  }, [lastEvent, selectedDate, selectedSlotId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRooms();
  };

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) || null;
  const selectedSlotName = selectedSlot ? `${selectedSlot.name} (${selectedSlot.start_time} - ${selectedSlot.end_time})` : '';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bgPrimary} />

      {/* Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.brandTitle}>UniStudy</Text>
          <Text style={styles.brandSubtitle}>Hệ Thống Đặt Phòng Học Trực Tuyến</Text>
        </View>

        {/* Real-time Indicator Pill */}
        <View style={[styles.livePill, isConnected ? styles.liveOnline : styles.liveOffline]}>
          <View style={[styles.pulseDot, isConnected ? styles.dotGreen : styles.dotRed]} />
          <Text style={[styles.liveText, isConnected ? styles.textGreen : styles.textRed]}>
            {isConnected ? 'Realtime' : 'Offline'}
          </Text>
        </View>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            onBook={(r) => setSelectedRoomForBooking(r)}
            selectedSlotName={selectedSlotName}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListHeaderComponent={
          <View>
            {/* Step 1: Horizontal Date Selector */}
            <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />

            {/* Step 2: Horizontal Slot Selector */}
            <SlotSelector slots={slots} selectedSlotId={selectedSlotId} onSelectSlot={setSelectedSlotId} />

            {/* Search Box */}
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Tìm theo tên hoặc mã phòng (P.101...)"
                placeholderTextColor={theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Quick Filters */}
            <View style={styles.filterRow}>
              {/* Floor Filters */}
              <TouchableOpacity
                style={[styles.filterChip, selectedFloor === '' && styles.filterChipActive]}
                onPress={() => setSelectedFloor('')}
              >
                <Text style={[styles.filterText, selectedFloor === '' && styles.filterTextActive]}>Tất cả tầng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedFloor === '1' && styles.filterChipActive]}
                onPress={() => setSelectedFloor(selectedFloor === '1' ? '' : '1')}
              >
                <Text style={[styles.filterText, selectedFloor === '1' && styles.filterTextActive]}>Tầng 1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedFloor === '2' && styles.filterChipActive]}
                onPress={() => setSelectedFloor(selectedFloor === '2' ? '' : '2')}
              >
                <Text style={[styles.filterText, selectedFloor === '2' && styles.filterTextActive]}>Tầng 2</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedFloor === '3' && styles.filterChipActive]}
                onPress={() => setSelectedFloor(selectedFloor === '3' ? '' : '3')}
              >
                <Text style={[styles.filterText, selectedFloor === '3' && styles.filterTextActive]}>Tầng 3</Text>
              </TouchableOpacity>

              {/* Only Available Toggle */}
              <TouchableOpacity
                style={[styles.filterChip, onlyAvailable && styles.filterChipGreen]}
                onPress={() => setOnlyAvailable(!onlyAvailable)}
              >
                <Text style={[styles.filterText, onlyAvailable && styles.filterTextGreen]}>
                  {onlyAvailable ? '✓ Chỉ phòng trống' : 'Phòng trống'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Section Heading */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Phòng Học ({rooms.length})</Text>
              <Text style={styles.sectionSubtitle}>Ngày {selectedDate}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
            </View>
          ) : (
            <View style={styles.centerBox}>
              <Text style={styles.emptyTitle}>Không có phòng phù hợp</Text>
              <Text style={styles.emptyDesc}>Hãy thử thay đổi ca học hoặc điều chỉnh bộ lọc tìm kiếm.</Text>
            </View>
          )
        }
      />

      {/* Booking Modal */}
      {selectedRoomForBooking && (
        <BookingModal
          visible={!!selectedRoomForBooking}
          room={selectedRoomForBooking}
          slot={selectedSlot}
          date={selectedDate}
          onClose={() => setSelectedRoomForBooking(null)}
          onSuccess={() => fetchRooms()}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    gap: 6,
  },
  liveOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  liveOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  dotRed: {
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textGreen: {
    color: '#34D399',
  },
  textRed: {
    color: '#F87171',
  },
  listContent: {
    paddingBottom: 24,
  },
  searchBox: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  searchInput: {
    backgroundColor: theme.colors.bgInput,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryLight,
  },
  filterChipGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: theme.colors.statusAvailable,
  },
  filterText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterTextGreen: {
    color: '#34D399',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: theme.colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 10,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
