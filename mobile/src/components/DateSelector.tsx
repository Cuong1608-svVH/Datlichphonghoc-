import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelectDate }) => {
  // Generate next 7 days
  const days = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const dayName = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `Thứ ${d.getDay() === 0 ? 'CN' : d.getDay() + 1}`;
    const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;

    days.push({ dateStr, dayName, displayDate });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CHỌN NGÀY ĐẶT PHÒNG</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {days.map((item) => {
          const isSelected = selectedDate === item.dateStr;
          return (
            <TouchableOpacity
              key={item.dateStr}
              style={[styles.dateChip, isSelected && styles.dateChipSelected]}
              onPress={() => onSelectDate(item.dateStr)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>{item.dayName}</Text>
              <Text style={[styles.displayDate, isSelected && styles.displayDateSelected]}>{item.displayDate}</Text>
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
  dateChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    minWidth: 80,
  },
  dateChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryLight,
  },
  dayName: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayNameSelected: {
    color: '#FFFFFF',
  },
  displayDate: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  displayDateSelected: {
    color: '#FFFFFF',
  },
});
