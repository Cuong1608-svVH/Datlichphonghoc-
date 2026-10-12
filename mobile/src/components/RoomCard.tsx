import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';
import { type Room } from '../api/client';

interface RoomCardProps {
  room: Room;
  onBook: (room: Room) => void;
  selectedSlotName: string;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onBook, selectedSlotName }) => {
  const isAvailable = room.is_available;
  const isBooked = room.is_booked;
  const isMaintenance = room.status === 'MAINTENANCE';

  return (
    <View style={[styles.card, !isAvailable && styles.cardDisabled]}>
      {/* Image with Badges */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: room.image_url }} style={styles.image} resizeMode="cover" />
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{room.code}</Text>
        </View>

        <View style={styles.statusBadge}>
          {isMaintenance ? (
            <View style={[styles.badgePill, { backgroundColor: theme.colors.statusMaintenanceBg, borderColor: theme.colors.statusMaintenance }]}>
              <Text style={[styles.badgeText, { color: theme.colors.statusMaintenance }]}>Đang bảo trì</Text>
            </View>
          ) : isBooked ? (
            <View style={[styles.badgePill, { backgroundColor: theme.colors.statusBookedBg, borderColor: theme.colors.statusBooked }]}>
              <Text style={[styles.badgeText, { color: theme.colors.statusBooked }]}>Đã có người đặt</Text>
            </View>
          ) : (
            <View style={[styles.badgePill, { backgroundColor: theme.colors.statusAvailableBg, borderColor: theme.colors.statusAvailable }]}>
              <Text style={[styles.badgeText, { color: theme.colors.statusAvailable }]}>• Còn trống</Text>
            </View>
          )}
        </View>

        <View style={styles.overlayDetails}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Tầng {room.floor}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{room.capacity} người</Text>
          </View>
        </View>
      </View>

      {/* Info Content */}
      <View style={styles.content}>
        <Text style={styles.roomName}>{room.name}</Text>
        <Text style={styles.roomDescription} numberOfLines={2}>
          {room.description || 'Không gian học tập chuẩn đại học, yên tĩnh và đầy đủ tiện nghi.'}
        </Text>

        <View style={styles.slotRow}>
          <Text style={styles.slotLabel}>Khung giờ:</Text>
          <Text style={styles.slotValue}>{selectedSlotName}</Text>
        </View>

        {isBooked && room.current_booking && (
          <View style={styles.bookedByBanner}>
            <Text style={styles.bookedByText}>
              Đã được đặt bởi: {room.current_booking.booked_by_name}
            </Text>
          </View>
        )}

        {/* Action Button */}
        {isMaintenance ? (
          <View style={[styles.btn, styles.btnDisabled]}>
            <Text style={styles.btnTextDisabled}>Phòng Đang Bảo Trì</Text>
          </View>
        ) : isBooked ? (
          <View style={[styles.btn, styles.btnDisabled]}>
            <Text style={styles.btnTextDisabled}>Đã Có Người Đặt</Text>
          </View>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => onBook(room)} activeOpacity={0.8}>
            <Text style={styles.btnTextPrimary}>Đặt Phòng Ngay</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardDisabled: {
    opacity: 0.85,
    backgroundColor: '#F8FAFC',
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  codeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codeText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  overlayDetails: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  roomName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  roomDescription: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    borderRadius: theme.radius.sm,
    marginBottom: 12,
  },
  slotLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  slotValue: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  bookedByBanner: {
    backgroundColor: theme.colors.statusBookedBg,
    padding: 8,
    borderRadius: theme.radius.sm,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  bookedByText: {
    color: theme.colors.statusBooked,
    fontSize: 12,
    fontWeight: '600',
  },
  btn: {
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnTextDisabled: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
