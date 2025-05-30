import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';

type IconName = keyof typeof FontAwesome.glyphMap;

// Sample data
const sampleItems = [
  {
    id: 1,
    name: 'Milk',
    daysLeft: 2,
    location: 'Fridge',
    locationIcon: 'building' as IconName,
    category: 'Dairy',
    categoryIcon: 'glass' as IconName,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=120',
    expiryDate: '2024-03-20',
    status: 'expiring_soon',
  },
  {
    id: 2,
    name: 'Tomatoes',
    daysLeft: 4,
    location: 'Fridge',
    locationIcon: 'building' as IconName,
    category: 'Vegetables',
    categoryIcon: 'leaf' as IconName,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=120',
    expiryDate: '2024-03-22',
    status: 'expiring_soon',
  },
  {
    id: 3,
    name: 'Bread',
    daysLeft: 7,
    location: 'Pantry',
    locationIcon: 'archive' as IconName,
    category: 'Bread',
    categoryIcon: 'shopping-basket' as IconName,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120',
    expiryDate: '2024-03-25',
    status: 'fresh',
  },
];

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarScreen() {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const windowHeight = Dimensions.get('window').height;
  const isWeb = Platform.OS === 'web';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
      ...(isWeb && {
        maxWidth: 800,
        alignSelf: 'center',
        height: '100vh',
      }),
    },
    calendarSection: {
      height: isWeb ? 'auto' : windowHeight * 0.45,
      minHeight: 380,
    },
    calendarContainer: {
      backgroundColor: theme.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      paddingBottom: 16,
    },
    header: {
      padding: 16,
    },
    monthSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    monthText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textColor,
    },
    monthButton: {
      padding: 8,
    },
    weekDaysRow: {
      flexDirection: 'row',
      paddingHorizontal: 8,
      marginBottom: 8,
    },
    weekDay: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 4,
    },
    weekDayText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: '500',
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 8,
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      padding: 2,
    },
    dayContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: theme.backgroundColor,
      ...(isWeb && {
        cursor: 'pointer',
      }),
    },
    dayContentSelected: {
      backgroundColor: theme.primaryColor,
    },
    dayContentHasItems: {
      borderWidth: 1,
      borderColor: theme.primaryColor,
    },
    dayText: {
      fontSize: 14,
      color: theme.textColor,
    },
    dayTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    dayTextOtherMonth: {
      color: theme.textSecondary,
    },
    itemsDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.primaryColor,
      marginTop: 2,
    },
    listSection: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    listTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textColor,
    },
    listCount: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    listContent: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    emptyList: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: theme.backgroundColor,
    },
    emptyListText: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    foodItem: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: theme.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      ...(isWeb && {
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
      }),
    },
    foodImage: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginRight: 12,
    },
    foodInfo: {
      flex: 1,
    },
    foodName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textColor,
      marginBottom: 4,
    },
    foodMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      color: theme.textSecondary,
      fontSize: 14,
      marginLeft: 4,
    },
    foodActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.backgroundColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const previousMonth = new Date(year, month, 0);
    const daysInPreviousMonth = previousMonth.getDate();
    
    const days = [];
    
    // Previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPreviousMonth - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  };

  const getItemsForDate = (date: Date) => {
    return sampleItems.filter(item => {
      const itemDate = new Date(item.expiryDate);
      return (
        itemDate.getDate() === date.getDate() &&
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const renderDay = (dayInfo: { date: Date; isCurrentMonth: boolean }) => {
    const isSelected = 
      selectedDate.getDate() === dayInfo.date.getDate() &&
      selectedDate.getMonth() === dayInfo.date.getMonth() &&
      selectedDate.getFullYear() === dayInfo.date.getFullYear();
    
    const items = getItemsForDate(dayInfo.date);
    const hasItems = items.length > 0;

    return (
      <TouchableOpacity
        key={dayInfo.date.toISOString()}
        style={styles.dayCell}
        onPress={() => setSelectedDate(dayInfo.date)}
      >
        <View
          style={[
            styles.dayContent,
            isSelected && styles.dayContentSelected,
            hasItems && !isSelected && styles.dayContentHasItems,
          ]}
        >
          <Text
            style={[
              styles.dayText,
              !dayInfo.isCurrentMonth && styles.dayTextOtherMonth,
              isSelected && styles.dayTextSelected,
            ]}
          >
            {dayInfo.date.getDate()}
          </Text>
          {hasItems && !isSelected && <View style={styles.itemsDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFoodItem = (item: any) => (
    <View key={item.id} style={styles.foodItem}>
      <Image source={{ uri: item.image }} style={styles.foodImage} />
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <View style={styles.foodMeta}>
          <View style={styles.metaItem}>
            <FontAwesome name={'clock-o' as IconName} size={14} color={theme.textSecondary} />
            <Text style={styles.metaText}>{item.daysLeft} days left</Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome name={item.locationIcon} size={14} color={theme.textSecondary} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
        </View>
      </View>
      <View style={styles.foodActions}>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name={'pencil' as IconName} size={14} color={theme.primaryColor} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name={'trash' as IconName} size={14} color={theme.dangerColor} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const selectedItems = getItemsForDate(selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.calendarSection}>
        <View style={styles.calendarContainer}>
          <View style={styles.header}>
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              >
                <FontAwesome name={'chevron-left' as IconName} size={20} color={theme.textColor} />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              >
                <FontAwesome name={'chevron-right' as IconName} size={20} color={theme.textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {weekDays.map((day) => (
                <View key={day} style={styles.weekDay}>
                  <Text style={styles.weekDayText}>{day}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.calendarGrid}>
            {getDaysInMonth(currentMonth).map(renderDay)}
          </View>
        </View>
      </View>

      <View style={styles.listSection}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Expiring on {selectedDate.toLocaleDateString()}
          </Text>
          <Text style={styles.listCount}>
            {selectedItems.length} items
          </Text>
        </View>

        {selectedItems.length > 0 ? (
          <ScrollView 
            style={styles.listContent}
            contentContainerStyle={styles.scrollContent}
          >
            {selectedItems.map(renderFoodItem)}
          </ScrollView>
        ) : (
          <View style={styles.emptyList}>
            <FontAwesome name={'calendar-check-o' as IconName} size={40} color={theme.textSecondary} />
            <Text style={styles.emptyListText}>
              No items expiring on this date
            </Text>
          </View>
        )}
      </View>

      <BottomNav />
    </SafeAreaView>
  );
} 