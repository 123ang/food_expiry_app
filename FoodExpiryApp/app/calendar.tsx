import React, { useState, useEffect } from 'react';
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
import { useLanguage } from '../context/LanguageContext';
import { useDatabase } from '../context/DatabaseContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { FoodItemWithDetails } from '../database/models';
import { BottomNav } from '../components/BottomNav';
import CategoryIcon from '../components/CategoryIcon';
import LocationIcon from '../components/LocationIcon';

type IconName = keyof typeof FontAwesome.glyphMap;

export default function CalendarScreen() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { foodItems, refreshAll, dataVersion } = useDatabase();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filteredItems, setFilteredItems] = useState<FoodItemWithDetails[]>([]);
  const [lastDataVersion, setLastDataVersion] = useState(0);
  const windowHeight = Dimensions.get('window').height;
  const isWeb = Platform.OS === 'web';

  const months = [
    t('month.january'), t('month.february'), t('month.march'), t('month.april'),
    t('month.may'), t('month.june'), t('month.july'), t('month.august'),
    t('month.september'), t('month.october'), t('month.november'), t('month.december')
  ];

  const weekDays = [
    t('weekday.sun'), t('weekday.mon'), t('weekday.tue'), t('weekday.wed'),
    t('weekday.thu'), t('weekday.fri'), t('weekday.sat')
  ];

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Check if data has changed or no data available
      const dataHasChanged = dataVersion !== lastDataVersion;
      const hasNoData = !foodItems || foodItems.length === 0;
      
      if (dataHasChanged || hasNoData) {
        setLastDataVersion(dataVersion);
        
        const refreshData = async () => {
          try {
            await refreshAll();
          } catch (error) {
            console.error('Calendar: Error refreshing data:', error);
          }
        };
        
        refreshData();
      }
    }, [dataVersion, foodItems?.length, language])
  );

  // Update filtered items when selected date or food items change
  useEffect(() => {
    const items = getItemsForDate(selectedDate);
    setFilteredItems(items);
  }, [selectedDate, foodItems]);

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
      marginBottom: 8,
      borderRadius: 12,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
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
      opacity: 0.4,
    },
    dayContentOtherMonth: {
      opacity: 0.4,
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
      marginTop: 8,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.cardBackground,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    listHeaderLeft: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      flex: 1,
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
    customHeader: {
      backgroundColor: theme.cardBackground,
      padding: 16,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textColor,
      textAlign: 'center',
    },
    addButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: theme.primaryColor,
      marginLeft: 8,
      minWidth: 50,
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
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 1);
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i),
        isCurrentMonth: false
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Add days from next month
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const getItemsForDate = (date: Date) => {
    if (!foodItems) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return foodItems.filter(item => item.expiry_date === dateStr);
  };

  const hasItemsOnDate = (date: Date) => {
    return getItemsForDate(date).length > 0;
  };

  const renderDay = (dayInfo: { date: Date; isCurrentMonth: boolean }) => {
    const isSelected = dayInfo.date.toDateString() === selectedDate.toDateString();
    const hasItems = hasItemsOnDate(dayInfo.date);
    
    return (
      <TouchableOpacity
        key={dayInfo.date.toISOString()}
        style={styles.dayCell}
        onPress={() => setSelectedDate(dayInfo.date)}
      >
        <View style={[
          styles.dayContent,
          isSelected && styles.dayContentSelected,
          hasItems && !isSelected && styles.dayContentHasItems,
          !dayInfo.isCurrentMonth && styles.dayContentOtherMonth
        ]}>
          <Text style={[
            styles.dayText,
            !dayInfo.isCurrentMonth && styles.dayTextOtherMonth,
            isSelected && styles.dayTextSelected
          ]}>
            {dayInfo.date.getDate()}
          </Text>
          {hasItems && !isSelected && <View style={styles.itemsDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFoodItem = (item: FoodItemWithDetails) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.foodItem}
      onPress={() => router.push(`/item/${item.id}`)}
    >
      {item.image_uri ? (
        <Image 
          source={{ uri: item.image_uri }} 
          style={styles.foodImage} 
        />
      ) : (
        <View style={[styles.foodImage, { backgroundColor: `${theme.primaryColor}20`, justifyContent: 'center', alignItems: 'center' }]}>
          <CategoryIcon iconName={item.category_icon} size={24} />
        </View>
      )}
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <View style={styles.foodMeta}>
          <View style={styles.metaItem}>
            <Text style={{ fontSize: 14 }}>⏰</Text>
            <Text style={[
              styles.metaText,
              item.days_until_expiry < 0 && { color: theme.dangerColor },
              item.days_until_expiry >= 0 && item.days_until_expiry <= 5 && { color: theme.warningColor },
              item.days_until_expiry > 5 && { color: theme.successColor }
            ]}>
              {item.days_until_expiry} days left
            </Text>
          </View>
          <View style={styles.metaItem}>
            <LocationIcon iconName={item.location_icon} size={14} />
            <Text style={styles.metaText}>{item.location_name}</Text>
          </View>
          <View style={styles.metaItem}>
            <CategoryIcon iconName={item.category_icon} size={14} />
            <Text style={styles.metaText}>{item.category_name}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={{ fontSize: 14 }}>📦</Text>
            <Text style={styles.metaText}>{item.quantity}</Text>
            <Text style={{ 
              fontSize: 14, 
              marginLeft: 8,
              color: item.status === 'expired' ? '#F44336' :
                     item.status === 'expiring_soon' ? '#FF9800' : '#4CAF50'
            }}>
              {item.status === 'expired' ? '⚠️' :
               item.status === 'expiring_soon' ? '⏰' : '✅'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <Text style={styles.headerTitle}>{t('nav.calendar')}</Text>
      </View>
      
      <View style={styles.calendarSection}>
        <View style={styles.calendarContainer}>
          <View style={styles.header}>
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={() => {
                  const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
                  setCurrentMonth(newDate);
                }}
              >
                <Text style={{ fontSize: 20, color: theme.textColor }}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity
                style={styles.monthButton}
                onPress={() => {
                  const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
                  setCurrentMonth(newDate);
                }}
              >
                <Text style={{ fontSize: 20, color: theme.textColor }}>▶</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.weekDaysRow}>
              {weekDays.map(day => (
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
          <View style={styles.listHeaderLeft}>
            <Text style={styles.listTitle}>
              {selectedDate.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
            <Text style={styles.listCount}>
              {filteredItems.length} {t('calendar.items')}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push({
              pathname: '/add',
              params: { 
                prefilledDate: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
              }
            })}
          >
            <Text style={{ fontSize: 20, color: "#FFFFFF", fontWeight: 'bold' }}>+</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          style={styles.listContent}
          contentContainerStyle={[
            styles.scrollContent,
            filteredItems.length === 0 && styles.emptyList
          ]}
        >
          {filteredItems.length === 0 ? (
            <View>
              <Text style={{ fontSize: 48, color: theme.textSecondary }}>📅</Text>
              <Text style={styles.emptyListText}>
                {t('calendar.noItems')}
              </Text>
            </View>
          ) : (
            filteredItems.map(renderFoodItem)
          )}
        </ScrollView>
      </View>

      <BottomNav />
    </SafeAreaView>
  );
} 