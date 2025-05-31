import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'zh' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.list': 'List',
    'nav.calendar': 'Calendar',
    'nav.locations': 'Locations',
    'nav.categories': 'Categories',
    
    // Home Screen
    'home.welcome': 'Welcome Back!',
    'home.expiring': 'expiring',
    'home.item': 'item',
    'home.items': 'items',
    'home.fresh': 'Fresh',
    'home.expired': 'Expired',
    'home.storageLocations': 'Storage Locations',
    'home.categories': 'Categories',
    'home.loading': 'Loading dashboard...',
    
    // List Screen
    'list.search': 'Search items...',
    'list.all': 'All',
    'list.fresh': 'Fresh',
    'list.expiring': 'Expiring',
    'list.expired': 'Expired',
    'list.loading': 'Loading items...',
    'list.noItems': 'No items found. Add some items to get started!',
    'list.noSearch': 'No items match your search',
    'list.noCategory': 'No items found in this category.',
    
    // Calendar Screen
    'calendar.noItems': 'No items expiring on this date',
    'calendar.items': 'items',
    
    // Status Screens
    'status.fresh': 'Fresh Items',
    'status.expiring': 'Expiring Items',
    'status.expired': 'Expired Items',
    'status.viewAll': 'View all items',
    
    // Food Item Details
    'item.details': 'Item Details',
    'item.daysLeft': 'days left',
    'item.expirestoday': 'Expires today',
    'item.expiredDays': 'days ago',
    'item.quantity': 'Quantity',
    'item.category': 'Category',
    'item.location': 'Location',
    'item.notes': 'Notes',
    'item.reminderDays': 'Reminder Days',
    'item.expiryDate': 'Expiry Date',
    
    // Forms
    'form.itemName': 'Item Name',
    'form.quantity': 'Quantity',
    'form.category': 'Category',
    'form.location': 'Storage Location',
    'form.expiryDate': 'Expiry Date',
    'form.reminderDays': 'Reminder Days Before Expiry',
    'form.notes': 'Notes',
    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.edit': 'Edit Food Item',
    'form.new': 'New Food Item',
    
    // Actions
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.add': 'Add',
    
    // Alerts
    'alert.error': 'Error',
    'alert.success': 'Success',
    'alert.deleteTitle': 'Delete Item',
    'alert.deleteMessage': 'Are you sure you want to delete',
    'alert.nameRequired': 'Please enter a name for the item',
    'alert.quantityRequired': 'Please enter a valid quantity (minimum 1)',
    'alert.saveFailed': 'Failed to save food item',
    'alert.deleteFailed': 'Failed to delete item',
    'alert.loadFailed': 'Failed to load data',
    
    // Months
    'month.january': 'January',
    'month.february': 'February',
    'month.march': 'March',
    'month.april': 'April',
    'month.may': 'May',
    'month.june': 'June',
    'month.july': 'July',
    'month.august': 'August',
    'month.september': 'September',
    'month.october': 'October',
    'month.november': 'November',
    'month.december': 'December',
    
    // Week Days
    'weekday.sun': 'Sun',
    'weekday.mon': 'Mon',
    'weekday.tue': 'Tue',
    'weekday.wed': 'Wed',
    'weekday.thu': 'Thu',
    'weekday.fri': 'Fri',
    'weekday.sat': 'Sat',
    
    // Settings
    'settings.language': 'Language',
    'settings.languageDescription': 'Change app language',
    'settings.darkMode': 'Dark Mode',
    'settings.darkModeDescription': 'Toggle dark theme',
    'settings.categories': 'Categories',
    'settings.categoriesDescription': 'Manage food categories',
    'settings.storageLocations': 'Storage Locations',
    'settings.storageLocationsDescription': 'Manage storage locations',
    'settings.notifications': 'Notifications',
    'settings.notificationsDescription': 'Manage notification settings',
    'settings.backupSync': 'Backup & Sync',
    'settings.backupSyncDescription': 'Backup and sync your data',
    'settings.about': 'About',
    'settings.aboutDescription': 'App information and version',
    
    // Language Names
    'language.english': 'English',
    'language.chinese': 'Chinese',
    'language.japanese': 'Japanese',
    'language.close': 'Close',
  },
  zh: {
    // Navigation
    'nav.home': '首页',
    'nav.list': '列表',
    'nav.calendar': '日历',
    'nav.locations': '储存位置',
    'nav.categories': '分类',
    
    // Home Screen
    'home.welcome': '欢迎回来！',
    'home.expiring': '即将过期',
    'home.item': '项',
    'home.items': '项',
    'home.fresh': '新鲜',
    'home.expired': '已过期',
    'home.storageLocations': '储存位置',
    'home.categories': '分类',
    'home.loading': '正在加载仪表板...',
    
    // List Screen
    'list.search': '搜索项目...',
    'list.all': '全部',
    'list.fresh': '新鲜',
    'list.expiring': '即将过期',
    'list.expired': '已过期',
    'list.loading': '正在加载项目...',
    'list.noItems': '未找到项目。开始添加一些项目吧！',
    'list.noSearch': '没有项目匹配您的搜索',
    'list.noCategory': '此分类中未找到项目。',
    
    // Calendar Screen
    'calendar.noItems': '此日期没有过期的项目',
    'calendar.items': '项',
    
    // Status Screens
    'status.fresh': '新鲜项目',
    'status.expiring': '即将过期项目',
    'status.expired': '已过期项目',
    'status.viewAll': '查看所有项目',
    
    // Food Item Details
    'item.details': '项目详情',
    'item.daysLeft': '天剩余',
    'item.expirestoday': '今天过期',
    'item.expiredDays': '天前过期',
    'item.quantity': '数量',
    'item.category': '分类',
    'item.location': '位置',
    'item.notes': '备注',
    'item.reminderDays': '提醒天数',
    'item.expiryDate': '过期日期',
    
    // Forms
    'form.itemName': '项目名称',
    'form.quantity': '数量',
    'form.category': '分类',
    'form.location': '储存位置',
    'form.expiryDate': '过期日期',
    'form.reminderDays': '过期前提醒天数',
    'form.notes': '备注',
    'form.save': '保存',
    'form.cancel': '取消',
    'form.edit': '编辑食品项目',
    'form.new': '新食品项目',
    
    // Actions
    'action.edit': '编辑',
    'action.delete': '删除',
    'action.add': '添加',
    
    // Alerts
    'alert.error': '错误',
    'alert.success': '成功',
    'alert.deleteTitle': '删除项目',
    'alert.deleteMessage': '您确定要删除吗',
    'alert.nameRequired': '请输入项目名称',
    'alert.quantityRequired': '请输入有效数量（最少1个）',
    'alert.saveFailed': '保存食品项目失败',
    'alert.deleteFailed': '删除项目失败',
    'alert.loadFailed': '加载数据失败',
    
    // Months
    'month.january': '一月',
    'month.february': '二月',
    'month.march': '三月',
    'month.april': '四月',
    'month.may': '五月',
    'month.june': '六月',
    'month.july': '七月',
    'month.august': '八月',
    'month.september': '九月',
    'month.october': '十月',
    'month.november': '十一月',
    'month.december': '十二月',
    
    // Week Days
    'weekday.sun': '日',
    'weekday.mon': '一',
    'weekday.tue': '二',
    'weekday.wed': '三',
    'weekday.thu': '四',
    'weekday.fri': '五',
    'weekday.sat': '六',
    
    // Settings
    'settings.language': '语言',
    'settings.languageDescription': '更改应用语言',
    'settings.darkMode': '暗模式',
    'settings.darkModeDescription': '切换暗主题',
    'settings.categories': '分类',
    'settings.categoriesDescription': '管理食品分类',
    'settings.storageLocations': '储存位置',
    'settings.storageLocationsDescription': '管理储存位置',
    'settings.notifications': '通知',
    'settings.notificationsDescription': '管理通知设置',
    'settings.backupSync': '备份与同步',
    'settings.backupSyncDescription': '备份和同步您的数据',
    'settings.about': '关于',
    'settings.aboutDescription': '应用信息和版本',
    
    // Language Names
    'language.english': '英语',
    'language.chinese': '中文',
    'language.japanese': '日语',
    'language.close': '关闭',
  },
  ja: {
    // Navigation
    'nav.home': 'ホーム',
    'nav.list': 'リスト',
    'nav.calendar': 'カレンダー',
    'nav.locations': '保存場所',
    'nav.categories': 'カテゴリ',
    
    // Home Screen
    'home.welcome': 'おかえりなさい！',
    'home.expiring': '期限切れ間近',
    'home.item': '項目',
    'home.items': '項目',
    'home.fresh': '新鮮',
    'home.expired': '期限切れ',
    'home.storageLocations': '保存場所',
    'home.categories': 'カテゴリ',
    'home.loading': 'ダッシュボードを読み込み中...',
    
    // List Screen
    'list.search': 'アイテムを検索...',
    'list.all': 'すべて',
    'list.fresh': '新鮮',
    'list.expiring': '期限切れ間近',
    'list.expired': '期限切れ',
    'list.loading': 'アイテムを読み込み中...',
    'list.noItems': 'アイテムが見つかりません。アイテムを追加してください！',
    'list.noSearch': '検索に一致するアイテムがありません',
    'list.noCategory': 'このカテゴリにアイテムが見つかりません。',
    
    // Calendar Screen
    'calendar.noItems': 'この日付に期限切れのアイテムはありません',
    'calendar.items': '項目',
    
    // Status Screens
    'status.fresh': '新鮮なアイテム',
    'status.expiring': '期限切れ間近のアイテム',
    'status.expired': '期限切れのアイテム',
    'status.viewAll': 'すべてのアイテムを表示',
    
    // Food Item Details
    'item.details': 'アイテムの詳細',
    'item.daysLeft': '日残り',
    'item.expirestoday': '今日期限切れ',
    'item.expiredDays': '日前に期限切れ',
    'item.quantity': '数量',
    'item.category': 'カテゴリ',
    'item.location': '場所',
    'item.notes': 'メモ',
    'item.reminderDays': 'リマインダー日数',
    'item.expiryDate': '賞味期限',
    
    // Forms
    'form.itemName': 'アイテム名',
    'form.quantity': '数量',
    'form.category': 'カテゴリ',
    'form.location': '保存場所',
    'form.expiryDate': '賞味期限',
    'form.reminderDays': '期限前のリマインダー日数',
    'form.notes': 'メモ',
    'form.save': '保存',
    'form.cancel': 'キャンセル',
    'form.edit': '食品アイテムを編集',
    'form.new': '新しい食品アイテム',
    
    // Actions
    'action.edit': '編集',
    'action.delete': '削除',
    'action.add': '追加',
    
    // Alerts
    'alert.error': 'エラー',
    'alert.success': '成功',
    'alert.deleteTitle': 'アイテムを削除',
    'alert.deleteMessage': '削除してもよろしいですか',
    'alert.nameRequired': 'アイテム名を入力してください',
    'alert.quantityRequired': '有効な数量を入力してください（最小1）',
    'alert.saveFailed': '食品アイテムの保存に失敗しました',
    'alert.deleteFailed': 'アイテムの削除に失敗しました',
    'alert.loadFailed': 'データの読み込みに失敗しました',
    
    // Months
    'month.january': '1月',
    'month.february': '2月',
    'month.march': '3月',
    'month.april': '4月',
    'month.may': '5月',
    'month.june': '6月',
    'month.july': '7月',
    'month.august': '8月',
    'month.september': '9月',
    'month.october': '10月',
    'month.november': '11月',
    'month.december': '12月',
    
    // Week Days
    'weekday.sun': '日',
    'weekday.mon': '月',
    'weekday.tue': '火',
    'weekday.wed': '水',
    'weekday.thu': '木',
    'weekday.fri': '金',
    'weekday.sat': '土',
    
    // Settings
    'settings.language': '言語',
    'settings.languageDescription': 'アプリの言語を変更',
    'settings.darkMode': 'ダークモード',
    'settings.darkModeDescription': 'ダークテーマを切り替え',
    'settings.categories': 'カテゴリ',
    'settings.categoriesDescription': '食品カテゴリを管理',
    'settings.storageLocations': '保存場所',
    'settings.storageLocationsDescription': '保存場所を管理',
    'settings.notifications': '通知',
    'settings.notificationsDescription': '通知設定を管理',
    'settings.backupSync': 'バックアップと同期',
    'settings.backupSyncDescription': 'データをバックアップして同期',
    'settings.about': 'について',
    'settings.aboutDescription': 'アプリの情報とバージョン',
    
    // Language Names
    'language.english': '英語',
    'language.chinese': '中国語',
    'language.japanese': '日本語',
    'language.close': '閉じる',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh' || savedLanguage === 'ja')) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 