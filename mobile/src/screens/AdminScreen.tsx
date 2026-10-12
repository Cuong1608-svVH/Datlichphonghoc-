import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { api, type Room, type Booking, type DashboardStats } from '../api/client';

export const AdminScreen: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'rooms' | 'bookings'>('rooms');
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [resStats, resRooms, resBookings] = await Promise.all([
        api.getDashboardStats(),
        api.getRooms({}),
        api.getAllBookings(),
      ]);

      if (resStats.success) setStats(resStats.stats);
      if (resRooms.success) setRooms(resRooms.rooms);
      if (resBookings.success) setBookings(resBookings.bookings);
    } catch (err) {
      console.log('Error loading admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleMaintenance = async (room: Room) => {
    const nextStatus = room.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
    try {
      const res = await api.updateRoom(room.id, { status: nextStatus });
      if (res.success) {
        Alert.alert('Thành công', `Đã chuyển phòng sang trạng thái ${nextStatus === 'MAINTENANCE' ? 'Bảo trì' : 'Sẵn sàng'}`);
        loadData();
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái phòng');
    }
  };

  const handleAdminCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Admin Hủy Đặt Phòng',
      `Bạn có chắc chắn muốn hủy lịch đặt của sinh viên ${booking.user_name} tại phòng ${booking.room_name}?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy Lịch',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.cancelBooking(booking.id);
              if (res.success) {
                Alert.alert('Thành công', 'Đã hủy lịch đặt.');
                loadData();
              } else {
                Alert.alert('Lỗi', res.message || 'Không thể hủy lịch này');
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể kết nối máy chủ');
            }
          },
        },
      ]
    );
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.emptyTitle}>Khu Vực Quản Trị Viên</Text>
          <Text style={styles.emptyDesc}>Vui lòng đăng nhập bằng tài khoản Admin để truy cập chức năng này.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản Trị Thư Viện</Text>
        <Text style={styles.headerSubtitle}>Quản lý phòng học & lịch đặt sinh viên</Text>
      </View>

      {/* KPI Stats widgets */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.rooms.total}</Text>
            <Text style={styles.statLabel}>Phòng</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: theme.colors.statusAvailable }]}>{stats.rooms.available}</Text>
            <Text style={styles.statLabel}>Sẵn sàng</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: theme.colors.statusMaintenance }]}>{stats.rooms.maintenance}</Text>
            <Text style={styles.statLabel}>Bảo trì</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: theme.colors.primaryLight }]}>{stats.today.total}</Text>
            <Text style={styles.statLabel}>Đặt hôm nay</Text>
          </View>
        </View>
      )}

      {/* Sub Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'rooms' && styles.tabItemActive]}
          onPress={() => setActiveTab('rooms')}
        >
          <Text style={[styles.tabText, activeTab === 'rooms' && styles.tabTextActive]}>
            Danh Sách Phòng ({rooms.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'bookings' && styles.tabItemActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>
            Lịch Đặt Toàn Trường ({bookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'rooms' ? (
        <FlatList
          data={rooms}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => (
            <View style={styles.roomItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.roomItemName}>{item.name}</Text>
                <Text style={styles.roomItemSub}>
                  {item.code} • Tầng {item.floor} • {item.capacity} người
                </Text>
                <View style={[styles.statusTag, item.status === 'AVAILABLE' ? styles.tagGreen : styles.tagYellow]}>
                  <Text style={[styles.statusTagText, item.status === 'AVAILABLE' ? styles.textGreen : styles.textYellow]}>
                    {item.status === 'AVAILABLE' ? 'Sẵn sàng sử dụng' : 'Đang bảo trì'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.actionBtn, item.status === 'AVAILABLE' ? styles.actionYellow : styles.actionGreen]}
                onPress={() => handleToggleMaintenance(item)}
              >
                <Text style={styles.actionBtnText}>
                  {item.status === 'AVAILABLE' ? 'Bật bảo trì' : 'Mở lại'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => (
            <View style={styles.bookingItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{item.user_name}</Text>
                <Text style={styles.studentSub}>
                  {item.student_id ? `${item.student_id} • ` : ''}{item.user_email}
                </Text>
                <Text style={styles.bookingRoomText}>
                  {item.room_name} ({item.room_code})
                </Text>
                <Text style={styles.bookingTimeText}>
                  {item.booking_date} • {item.slot_name}
                </Text>
              </View>

              {item.status === 'CONFIRMED' && (
                <TouchableOpacity
                  style={styles.adminCancelBtn}
                  onPress={() => handleAdminCancelBooking(item)}
                >
                  <Text style={styles.adminCancelText}>Hủy lịch</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    elevation: 1,
  },
  statVal: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: theme.radius.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.radius.sm,
  },
  tabItemActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  roomItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  roomItemName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  roomItemSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    marginTop: 6,
  },
  tagGreen: {
    backgroundColor: theme.colors.statusAvailableBg,
  },
  tagYellow: {
    backgroundColor: theme.colors.statusMaintenanceBg,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textGreen: {
    color: theme.colors.statusAvailable,
  },
  textYellow: {
    color: theme.colors.statusMaintenance,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  actionYellow: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  actionGreen: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  actionBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  bookingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  studentName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  studentSub: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  bookingRoomText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  bookingTimeText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  adminCancelBtn: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
  },
  adminCancelText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
});
