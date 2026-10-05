import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../styles/theme';
import { api, type Room, type Slot } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface BookingModalProps {
  visible: boolean;
  room: Room | null;
  slot: Slot | null;
  date: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  visible,
  room,
  slot,
  date,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  if (!room || !slot) return null;

  const handleBooking = async () => {
    if (!user) {
      Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để đặt phòng học.');
      return;
    }

    setLoading(true);
    setConflictError(null);

    try {
      const res = await api.bookRoom({
        room_id: room.id,
        booking_date: date,
        slot_id: slot.id,
        notes,
      });

      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '🎉 Đặt Phòng Thành Công!',
          `Bạn đã đặt thành công phòng ${room.name} vào ngày ${date} (${slot.name}).`,
          [{ text: 'OK', onPress: () => { onClose(); onSuccess(); } }]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (res.code === 'SLOT_CONFLICT') {
          setConflictError(res.message || 'Phòng vừa có người đặt trước vài giây!');
        } else {
          Alert.alert('Không thể đặt phòng', res.message || 'Vui lòng thử lại');
        }
      }
    } catch (err) {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Xác Nhận Đặt Phòng</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Room Details Card */}
            <View style={styles.detailCard}>
              <Text style={styles.roomName}>{room.name}</Text>
              <Text style={styles.roomCode}>Mã: {room.code} • Tầng {room.floor} • {room.capacity} chỗ</Text>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày học:</Text>
                <Text style={styles.infoValue}>{date}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ca học:</Text>
                <Text style={styles.infoValue}>{slot.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Thời gian:</Text>
                <Text style={styles.infoValue}>{slot.start_time} - {slot.end_time}</Text>
              </View>
            </View>

            {/* Rules reminder */}
            <View style={styles.rulesBox}>
              <Text style={styles.rulesTitle}>🛡️ Quy định phòng học:</Text>
              <Text style={styles.rulesText}>• Tối đa 3 ca học / sinh viên / ngày.</Text>
              <Text style={styles.rulesText}>• Chỉ được hủy phòng trước giờ học tối thiểu 3 tiếng.</Text>
            </View>

            {/* Concurrency Conflict Alert */}
            {conflictError && (
              <View style={styles.conflictBox}>
                <Text style={styles.conflictTitle}>⚠️ Xung đột đặt phòng (409 Conflict):</Text>
                <Text style={styles.conflictText}>{conflictError}</Text>
              </View>
            )}

            {/* Notes input */}
            <Text style={styles.inputLabel}>Mục đích sử dụng / Ghi chú (không bắt buộc):</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Học nhóm ôn thi, làm đồ án..."
              placeholderTextColor={theme.colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, conflictError ? styles.btnDisabled : null]}
                onPress={handleBooking}
                disabled={loading || !!conflictError}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Xác Nhận Đặt</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.bgSecondary,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailCard: {
    backgroundColor: theme.colors.bgCard,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  roomName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  roomCode: {
    color: theme.colors.primaryLight,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  infoValue: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  rulesBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 14,
  },
  rulesTitle: {
    color: theme.colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  rulesText: {
    color: '#C7D2FE',
    fontSize: 12,
    lineHeight: 18,
  },
  conflictBox: {
    backgroundColor: theme.colors.statusBookedBg,
    borderWidth: 1,
    borderColor: theme.colors.statusBooked,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 14,
  },
  conflictTitle: {
    color: theme.colors.statusBooked,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  conflictText: {
    color: '#FECACA',
    fontSize: 12,
    lineHeight: 18,
  },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.bgInput,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    color: '#FFFFFF',
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
