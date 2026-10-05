import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';
import { type Slot } from '../api/client';

interface SlotSelectorProps {
  slots: Slot[];
  selectedSlotId: number;
  onSelectSlot: (slotId: number) => void;
}

export const SlotSelector: React.FC<SlotSelectorProps> = ({ slots, selectedSlotId, onSelectSlot }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CHỌN CA HỌC CỐ ĐỊNH</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;
          return (
            <TouchableOpacity
              key={slot.id}
              style={[styles.slotChip, isSelected && styles.slotChipSelected]}
              onPress={() => onSelectSlot(slot.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.slotName, isSelected && styles.slotNameSelected]}>
                {slot.name.split('(')[0].trim()}
              </Text>
              <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
                {slot.start_time} - {slot.end_time}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  slotChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    minWidth: 110,
  },
  slotChipSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
    borderColor: theme.colors.primary,
  },
  slotName: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  slotNameSelected: {
    color: '#FFFFFF',
  },
  slotTime: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  slotTimeSelected: {
    color: '#C7D2FE',
  },
});
