import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../styles/theme';
import { api, type Booking } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const HistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

  const fetchBookings = async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getUserBookings();
      if (res.success) {
        setBookings(res.bookings);
      }
    } catch (err) {
      console.log('Error fetching user bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Xác nhận hủy đặt phòng',
      `Bạn có chắc chắn muốn hủy phòng ${booking.room_name} vào ca ${booking.slot_name}, ngày ${booking.booking_date}? Phòng sẽ được mở lại cho sinh viên khác ngay lập tức.`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Xác Nhận Hủy',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.cancelBooking(booking.id);
              if (res.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Thành công', 'Lịch đặt phòng đã được hủy.');
                fetchBookings();
              } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Lỗi', res.message || 'Không thể hủy phòng');
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể kết nối máy chủ');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
          <Text style={styles.emptyDesc}>Vui lòng chuyển sang tab "Cá Nhân" để đăng nhập và xem lịch sử phòng đã đặt.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const upcomingBookings = bookings.filter((b) => b.status === 'CONFIRMED' && !b.is_past);
  const pastBookings = bookings.filter((b) => b.status === 'CONFIRMED' && b.is_past);
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');

  const currentList =
    activeTab === 'upcoming'
      ? upcomingBookings
      : activeTab === 'past'
      ? pastBookings
      : cancelledBookings;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch Sử Đặt Phòng</Text>
        <Text style={styles.headerSubtitle}>Quản lý các ca học của bạn</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'upcoming' && styles.tabItemActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Sắp tới ({upcomingBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'past' && styles.tabItemActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Đã xong ({pastBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'cancelled' && styles.tabItemActive]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>
            Đã hủy ({cancelledBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <FlatList
        data={currentList}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        renderItem={({ item }) => (
          <View style={styles.bookingCard}>
            <View style={styles.cardHeader}>
              <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
              <View style={styles.cardHeaderInfo}>
                <Text style={styles.roomName}>{item.room_name}</Text>
                <Text style={styles.roomCode}>{item.room_code} • Tầng {item.floor} • {item.capacity} chỗ</Text>
                <Text style={styles.dateSlotText}>
                  {item.booking_date} • {item.slot_name}
                </Text>
                <Text style={styles.timeRangeText}>
                  {item.start_time} - {item.end_time}
                </Text>
              </View>
            </View>

            {item.notes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>Ghi chú: "{item.notes}"</Text>
              </View>
            ) : null}

            {/* Action / Status Footer */}
            <View style={styles.cardFooter}>
              {item.status === 'CANCELLED' ? (
                <View style={styles.badgeCancelled}>
                  <Text style={styles.badgeCancelledText}>Đã hủy</Text>
                </View>
              ) : item.is_past ? (
                <View style={styles.badgeCompleted}>
                  <Text style={styles.badgeCompletedText}>Buổi học đã hoàn thành</Text>
                </View>
              ) : (
                /* Active Booking: 3-Hour Cancellation rule check */
                item.can_cancel ? (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancelBooking(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>Hủy phòng học</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.cancelDisabledPill}
                    onPress={() =>
                      Alert.alert(
                        'Quy định hủy phòng',
                        'Theo quy định, bạn chỉ được phép hủy phòng trước giờ bắt đầu tối thiểu 3 tiếng để nhường phòng cho sinh viên khác.'
                      )
                    }
                  >
                    <Text style={styles.cancelDisabledText}>Không thể hủy (&lt; 3 tiếng)</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.centerBox}>
              <Text style={styles.emptyTitle}>Chưa có lịch đặt nào</Text>
              <Text style={styles.emptyDesc}>Các phòng bạn đã đặt sẽ hiển thị tại đây.</Text>
            </View>
          )
        }
      />
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 12,
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
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
  },
  cardHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  roomName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  roomCode: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  dateSlotText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  timeRangeText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    borderRadius: theme.radius.sm,
    marginTop: 10,
  },
  notesText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.sm,
  },
  cancelBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelDisabledPill: {
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
  },
  cancelDisabledText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeCompleted: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeCompletedText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeCancelled: {
    backgroundColor: theme.colors.statusBookedBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  badgeCancelledText: {
    color: theme.colors.statusBooked,
    fontSize: 11,
    fontWeight: '600',
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
