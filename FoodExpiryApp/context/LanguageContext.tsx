import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateDefaultDataForLanguage } from '../database/database';

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
    'nav.settings': 'Settings',
    'nav.add': 'Add',
    
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
    'status.items': 'Items',
    'status.fresh': 'Fresh Items',
    'status.freshItems': 'Fresh Items',
    'status.expiring': 'Expiring',
    'status.expired': 'Expired',
    'status.expiringSoon': 'Expiring Soon',
    'status.expiredItems': 'Expired Items',
    'status.viewAll': 'View all items',
    'status.noItems': 'No {status} items found',
    'status.refresh': 'Refresh',
    'status.retry': 'Retry',
    'status.loading': 'Loading...',
    'status.error': 'Error loading data',
    
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
    
    // Screen Headers
    'header.notifications': 'Notifications',
    'header.settings': 'Settings',
    'header.about': 'About',
    
    // About Section
    'about.appName': 'FoodExpiry Tracker',
    'about.appTagline': 'Never let food go to waste again',
    'about.sectionAbout': 'About',
    'about.description': 'FoodExpiry Tracker is your personal food management assistant. Keep track of expiration dates, organize your pantry, and reduce food waste with our intuitive and feature-rich app.',
    'about.sectionFeatures': 'Key Features',
    'about.featureCalendar': 'Smart expiry date tracking with visual calendar',
    'about.featureCategories': 'Customizable categories and storage locations',
    'about.featureDashboard': 'Dashboard overview with status indicators',
    'about.featureSearch': 'Advanced search and filtering options',
    'about.featureDarkMode': 'Dark mode and multi-language support',
    'about.featureCrossPlatform': 'Cross-platform compatibility (iOS, Android, Web)',
    'about.sectionTechnology': 'Technology',
    'about.technologyDescription': 'Built with React Native and Expo for optimal performance across all platforms.',
    'about.footerText': 'Made with ❤️ for reducing food waste worldwide',
    'about.close': 'Close',

    // Notification Messages
    'notification.testTitle': 'Food Expiry Alert',
    'notification.testBody': 'This is a test notification from Expiry Alert!',
    'notification.expiringTodayTitle': 'Food Expiring Today!',
    'notification.expiringSoonTitle': 'Food Expiring Soon',
    'notification.expiredTitle': 'Food Has Expired',
    'notification.expiringTodayBody': '{quantity}{name}{category} expires today{location}. Use it now!',
    'notification.expiringSoonBody': '{quantity}{name}{category} will expire in {days} day{plural}{location}',
    'notification.expiredBody': '{quantity}{name}{category} expired {days} day{plural} ago{location}',
    'notification.in': 'in',
    'notification.days': 'days',
    'notification.day': 'day',

    // Notification Settings Screen
    'notification.enabledTitle': 'Notifications Enabled',
    'notification.enableTitle': 'Enable Notifications',
    'notification.enabledDesc': 'You will receive alerts when your food items are about to expire.',
    'notification.disabledDesc': 'Allow notifications to get alerts about expiring food items.',
    'notification.enableButton': 'Enable Notifications',
    'notification.alertSettings': 'Alert Settings',
    'notification.enableNotifications': 'Enable Notifications',
    'notification.enableNotificationsDesc': 'Receive alerts about expiring food',
    'notification.expiringSoonAlerts': 'Expiring Soon Alerts',
    'notification.expiringSoonAlertsDesc': 'Alert when food items are about to expire',
    'notification.expiringTodayAlerts': 'Expiring Today Alerts',
    'notification.expiringTodayAlertsDesc': 'Alert when food items expire today',
    'notification.expiredAlerts': 'Expired Alerts',
    'notification.expiredAlertsDesc': 'Alert when food items have expired',
    'notification.reminderTiming': 'Reminder Timing',
    'notification.alertMeBefore': 'Alert me before expiry',
    'notification.alertMeBeforeDesc': 'How many days before expiry to alert',
    'notification.testNotification': 'Test Notification',
    'notification.testNotificationDesc': 'Send a test notification',
    'notification.testButton': 'Test',
    'notification.testSent': 'Test Sent',
    'notification.testSentDesc': 'Check your notifications!',
    'notification.notEnabledError': 'Notifications not enabled',
    'notification.enabledSuccess': 'Notifications Enabled',
    'notification.enabledSuccessDesc': 'You will now receive alerts when your food items are about to expire!',
    'notification.disabledError': 'Notifications Disabled',
    'notification.disabledErrorDesc': 'Please enable notifications in your device settings to receive expiry alerts.',

    // Additional Settings Translations
    'deleteCategory': 'Delete Category',
    'deleteCategoryConfirm': 'Are you sure you want to delete this category?',
    'deleteLocation': 'Delete Location',
    'deleteLocationConfirm': 'Are you sure you want to delete this location?',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'close': 'Close',
    'save': 'Save',
    'edit': 'Edit',
    'add': 'Add',
    'settings.title': 'Settings',

    // Edit Modal Translations
    'editCategory': 'Edit Category',
    'addCategory': 'Add Category',
    'editLocation': 'Edit Location',
    'addLocation': 'Add Location',
    'categoryName': 'Category Name',
    'locationName': 'Location Name',
    'selectIcon': 'Select Icon',

    // Default Categories
    'defaultCategory.vegetables': 'Vegetables',
    'defaultCategory.fruits': 'Fruits', 
    'defaultCategory.dairy': 'Dairy',
    'defaultCategory.meat': 'Meat',
    'defaultCategory.snacks': 'Snacks',
    'defaultCategory.desserts': 'Desserts',
    'defaultCategory.seafood': 'Seafood',
    'defaultCategory.bread': 'Bread',

    // Default Locations
    'defaultLocation.fridge': 'Fridge',
    'defaultLocation.freezer': 'Freezer',
    'defaultLocation.pantry': 'Pantry',
    'defaultLocation.counter': 'Counter',
    'defaultLocation.cabinet': 'Cabinet',

    // Add/Edit Food Item Page
    'addItem.title': '食品アイテムを追加',
    'addItem.editTitle': '食品アイテムを編集',
    'addItem.itemName': 'アイテム名',
    'addItem.itemNamePlaceholder': '食品アイテム名を入力',
    'addItem.quantity': '数量',
    'addItem.quantityPlaceholder': '数量を入力',
    'addItem.category': 'カテゴリ',
    'addItem.storageLocation': '保存場所',
    'addItem.expiryDate': '賞味期限',
    'addItem.reminderDays': 'リマインダー日数',
    'addItem.reminderDaysPlaceholder': '期限前のリマインダー日数',
    'addItem.notes': 'メモ',
    'addItem.notesPlaceholder': 'アイテムについてのメモを追加',
    'addItem.loading': 'アイテムの詳細を読み込み中...',
    
    // Detail Pages
    'detail.itemsIn': 'アイテム数：',
    'detail.noItemsYet': 'このカテゴリにはまだアイテムがありません',
    'detail.noItemsInLocation': '{location}にはまだアイテムがありません。\nアイテムを追加してここで確認してください！',
    'detail.locationNotFound': '場所が見つかりません',

    // Error Messages  
    'error.enterItemName': 'アイテム名を入力してください',
    'error.selectStorageLocation': '保存場所を選択してください',
    'error.failedToCreate': 'アイテムの作成に失敗しました',
    'error.failedToUpdate': 'アイテムの更新に失敗しました',
    'error.failedToLoadData': 'データの読み込みに失敗しました',
    'error.tryAgain': 'もう一度お試しください',

    // Food Item Status
    'foodStatus.fresh': 'Fresh',
    'foodStatus.expiring': 'Expiring',
    'foodStatus.expired': 'Expired',
    'foodStatus.expirestoday': 'Expires today',
    'foodStatus.daysLeft': 'days left',
    'foodStatus.expiredDays': 'days ago',
    'foodStatus.noCategory': 'No category',
    'foodStatus.noLocation': 'No location',
  },
  zh: {
    // Navigation
    'nav.home': '首页',
    'nav.list': '列表',
    'nav.calendar': '日历',
    'nav.locations': '储存位置',
    'nav.categories': '分类',
    'nav.settings': '设置',
    'nav.add': '添加',
    
    // Home Screen
    'home.welcome': '欢迎回来！',
    'home.expiring': '即将过期',
    'home.item': '项',
    'home.items': '食品',
    'home.fresh': '新鲜',
    'home.expired': '已过期',
    'home.storageLocations': '储存位置',
    'home.categories': '分类',
    'home.loading': '正在加载仪表板...',
    
    // List Screen
    'list.search': '搜索食品...',
    'list.all': '全部',
    'list.fresh': '新鲜',
    'list.expiring': '即将过期',
    'list.expired': '已过期',
    'list.loading': '正在加载食品...',
    'list.noItems': '未找到食品。开始添加一些食品吧！',
    'list.noSearch': '没有食品匹配您的搜索',
    'list.noCategory': '此分类中未找到食品。',
    
    // Calendar Screen
    'calendar.noItems': '此日期没有过期的食品',
    'calendar.items': '食品',
    
    // Status Screens
    'status.items': '食品',
    'status.fresh': '新鲜食品',
    'status.freshItems': '新鲜食品',
    'status.expiring': '即将过期',
    'status.expired': '已过期',
    'status.expiringSoon': '即将过期食品',
    'status.expiredItems': '已过期食品',
    'status.viewAll': '查看所有食品',
    'status.noItems': '未找到{status}食品',
    'status.refresh': '刷新',
    'status.retry': '重试',
    'status.loading': '正在加载...',
    'status.error': '加载数据错误',
    
    // Food Item Details
    'item.details': '食品详情',
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
    'form.itemName': '食品名称',
    'form.quantity': '数量',
    'form.category': '分类',
    'form.location': '储存位置',
    'form.expiryDate': '过期日期',
    'form.reminderDays': '过期前提醒天数',
    'form.notes': '备注',
    'form.save': '保存',
    'form.cancel': '取消',
    'form.edit': '编辑食品物品',
    'form.new': '新食品物品',
    
    // Actions
    'action.edit': '编辑',
    'action.delete': '删除',
    'action.add': '添加',
    
    // Alerts
    'alert.error': '错误',
    'alert.success': '成功',
    'alert.deleteTitle': '删除食品',
    'alert.deleteMessage': '您确定要删除吗',
    'alert.nameRequired': '请输入食品名称',
    'alert.quantityRequired': '请输入有效数量（最少1个）',
    'alert.saveFailed': '保存食品物品失败',
    'alert.deleteFailed': '删除食品失败',
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
    
    // Screen Headers
    'header.notifications': '通知',
    'header.settings': '设置',
    'header.about': '关于',
    
    // About Section
    'about.appName': '过期警报',
    'about.appTagline': '再也不让食物浪费',
    'about.sectionAbout': '关于',
    'about.description': '食品过期跟踪器是您的个人食品管理助手。跟踪过期日期，整理您的食品储藏室，并通过我们直观且功能丰富的应用程序减少食物浪费。',
    'about.sectionFeatures': '主要功能',
    'about.featureCalendar': '智能过期日期跟踪与视觉日历',
    'about.featureCategories': '可自定义的分类和储存位置',
    'about.featureDashboard': '带状态指示器的仪表板概览',
    'about.featureSearch': '高级搜索和过滤选项',
    'about.featureDarkMode': '暗模式和多语言支持',
    'about.featureCrossPlatform': '跨平台兼容性（iOS、Android、Web）',
    'about.sectionTechnology': '技术',
    'about.technologyDescription': '使用React Native和Expo构建，在所有平台上实现最佳性能。使用SQLite进行可靠的本地数据存储，使用React Navigation提供流畅的用户体验。',
    'about.footerText': '为减少食物浪费而用❤️制作\n© 2024 食品过期跟踪器。保留所有权利。',
    'about.close': '关闭',

    // Notification Messages
    'notification.testTitle': '食品过期警报',
    'notification.testBody': '这是一个测试通知，来自过期警报！',
    'notification.expiringTodayTitle': '今天过期的食品！',
    'notification.expiringSoonTitle': '即将过期的食品',
    'notification.expiredTitle': '食品已过期',
    'notification.expiringTodayBody': '{quantity}{name}{category} 今天过期{location}。现在使用它！',
    'notification.expiringSoonBody': '{quantity}{name}{category} 将在 {days} 天{plural}{location} 后过期',
    'notification.expiredBody': '{quantity}{name}{category} 已过期 {days} 天{plural} 前{location}',
    'notification.in': '在',
    'notification.days': '天',
    'notification.day': '天',

    // Notification Settings Screen
    'notification.enabledTitle': '通知已启用',
    'notification.enableTitle': '启用通知',
    'notification.enabledDesc': '当您的食品即将过期时，您将收到提醒。',
    'notification.disabledDesc': '允许通知以获取即将过期食品的提醒。',
    'notification.enableButton': '启用通知',
    'notification.alertSettings': '通知设置',
    'notification.enableNotifications': '启用通知',
    'notification.enableNotificationsDesc': '接收即将过期食品的提醒',
    'notification.expiringSoonAlerts': '即将过期提醒',
    'notification.expiringSoonAlertsDesc': '当食品即将过期时提醒',
    'notification.expiringTodayAlerts': '今天过期提醒',
    'notification.expiringTodayAlertsDesc': '当食品今天过期时提醒',
    'notification.expiredAlerts': '已过期提醒',
    'notification.expiredAlertsDesc': '当食品已过期时提醒',
    'notification.reminderTiming': '提醒时间',
    'notification.alertMeBefore': '在过期前提醒我',
    'notification.alertMeBeforeDesc': '在过期前多少天提醒',
    'notification.testNotification': '测试通知',
    'notification.testNotificationDesc': '发送测试通知',
    'notification.testButton': '测试',
    'notification.testSent': '测试已发送',
    'notification.testSentDesc': '检查您的通知！',
    'notification.notEnabledError': '通知未启用',
    'notification.enabledSuccess': '通知已启用',
    'notification.enabledSuccessDesc': '您现在将收到即将过期食品的提醒！',
    'notification.disabledError': '通知已禁用',
    'notification.disabledErrorDesc': '请在设备设置中启用通知以接收过期提醒。',

    // Additional Settings Translations
    'deleteCategory': '删除分类',
    'deleteCategoryConfirm': '您确定要删除这个分类吗？',
    'deleteLocation': '删除位置',
    'deleteLocationConfirm': '您确定要删除这个位置吗？',
    'cancel': '取消',
    'delete': '删除',
    'close': '关闭',
    'save': '保存',
    'edit': '编辑',
    'add': '添加',
    'settings.title': '设置',

    // Edit Modal Translations
    'editCategory': '编辑分类',
    'addCategory': '添加分类',
    'editLocation': '编辑位置',
    'addLocation': '添加位置',
    'categoryName': '分类名称',
    'locationName': '位置名称',
    'selectIcon': '选择图标',

    // Default Categories
    'defaultCategory.vegetables': '蔬菜',
    'defaultCategory.fruits': '水果', 
    'defaultCategory.dairy': '乳制品',
    'defaultCategory.meat': '肉类',
    'defaultCategory.snacks': '零食',
    'defaultCategory.desserts': '甜点',
    'defaultCategory.seafood': '海鲜',
    'defaultCategory.bread': '面包',

    // Default Locations
    'defaultLocation.fridge': '冰箱',
    'defaultLocation.freezer': '冷冻室',
    'defaultLocation.pantry': '储藏室',
    'defaultLocation.counter': '台面',
    'defaultLocation.cabinet': '橱柜',

    // Add/Edit Food Item Page
    'addItem.title': '添加食品',
    'addItem.editTitle': '编辑食品',
    'addItem.itemName': '食品名称',
    'addItem.itemNamePlaceholder': '输入食品名称',
    'addItem.quantity': '数量',
    'addItem.quantityPlaceholder': '输入数量',
    'addItem.category': '分类',
    'addItem.storageLocation': '储存位置',
    'addItem.expiryDate': '过期日期',
    'addItem.reminderDays': '提醒天数',
    'addItem.reminderDaysPlaceholder': '过期前提醒天数',
    'addItem.notes': '备注',
    'addItem.notesPlaceholder': '添加关于此食品的备注',
    'addItem.loading': '正在加载食品详情...',
    
    // Detail Pages
    'detail.itemsIn': '食品在',
    'detail.noItemsYet': '此分类中还没有食品',
    'detail.noItemsInLocation': '{location}中还没有食品。\n添加一些食品以在此处查看！',
    'detail.locationNotFound': '未找到位置',

    // Error Messages  
    'error.enterItemName': '请输入食品名称',
    'error.selectStorageLocation': '请选择储存位置',
    'error.failedToCreate': '创建食品失败',
    'error.failedToUpdate': '更新食品失败',
    'error.failedToLoadData': '加载数据失败',
    'error.tryAgain': '请重试',

    // Food Item Status
    'foodStatus.fresh': '新鲜',
    'foodStatus.expiring': '即将过期',
    'foodStatus.expired': '已过期',
    'foodStatus.expirestoday': '今天过期',
    'foodStatus.daysLeft': '天剩余',
    'foodStatus.expiredDays': '天前',
    'foodStatus.noCategory': '无分类',
    'foodStatus.noLocation': '无位置',
  },
  ja: {
    // Navigation
    'nav.home': 'ホーム',
    'nav.list': 'リスト',
    'nav.calendar': 'カレンダー',
    'nav.locations': '保存場所',
    'nav.categories': 'カテゴリ',
    'nav.settings': '設定',
    'nav.add': '追加',
    
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
    'status.items': 'アイテム',
    'status.fresh': '新鮮なアイテム',
    'status.freshItems': '新鮮なアイテム',
    'status.expiring': '期限切れ間近',
    'status.expired': '期限切れ',
    'status.expiringSoon': '期限切れ間近のアイテム',
    'status.expiredItems': '期限切れのアイテム',
    'status.viewAll': 'すべてのアイテムを表示',
    'status.noItems': '{status}アイテムが見つかりません',
    'status.refresh': '更新',
    'status.retry': '再試行',
    'status.loading': '読み込み中...',
    'status.error': 'データ読み込みエラー',
    
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
    
    // Screen Headers
    'header.notifications': '通知',
    'header.settings': '設定',
    'header.about': 'について',
    
    // About Section
    'about.appName': '食品期限追跡アプリ',
    'about.appTagline': '二度と食べ物を無駄にしません',
    'about.sectionAbout': 'について',
    'about.description': '食品期限追跡アプリは、あなたの個人的な食品管理アシスタントです。賞味期限を追跡し、パントリーを整理し、直感的で機能豊富なアプリで食品廃棄を削減します。',
    'about.sectionFeatures': '主な機能',
    'about.featureCalendar': 'ビジュアルカレンダーによるスマートな期限追跡',
    'about.featureCategories': 'カスタマイズ可能なカテゴリと保存場所',
    'about.featureDashboard': 'ステータスインジケーター付きダッシュボード概要',
    'about.featureSearch': '高度な検索とフィルタリングオプション',
    'about.featureDarkMode': 'ダークモードと多言語サポート',
    'about.featureCrossPlatform': 'クロスプラットフォーム対応（iOS、Android、Web）',
    'about.sectionTechnology': '技術',
    'about.technologyDescription': 'すべてのプラットフォームで最適なパフォーマンスを実現するため、React NativeとExpoで構築されています。信頼性の高いローカルデータストレージにはSQLite、スムーズなユーザーエクスペリエンスにはReact Navigationを使用しています。',
    'about.footerText': '食品廃棄削減のために❤️で作成\n© 2024 食品期限追跡アプリ。全著作権所有。',
    'about.close': '閉じる',

    // Notification Messages
    'notification.testTitle': '食品期限警報',
    'notification.testBody': 'これは過期警報からのテスト通知です！',
    'notification.expiringTodayTitle': '今日期限切れの食品！',
    'notification.expiringSoonTitle': '期限切れ間近の食品',
    'notification.expiredTitle': '食品が期限切れ',
    'notification.expiringTodayBody': '{quantity}{name}{category} 今日期限切れ{location}。今すぐ使用してください！',
    'notification.expiringSoonBody': '{quantity}{name}{category} は {days} 日{plural}{location} 後に期限切れになります',
    'notification.expiredBody': '{quantity}{name}{category} は {days} 日{plural} 前に期限切れになりました{location}',
    'notification.in': 'に',
    'notification.days': '日',
    'notification.day': '日',

    // Notification Settings Screen
    'notification.enabledTitle': '通知が有効になりました',
    'notification.enableTitle': '通知を有効にする',
    'notification.enabledDesc': '食品の期限が近づくとお知らせが届きます。',
    'notification.disabledDesc': '期限切れ間近の食品についてのお知らせを受け取るために通知を許可してください。',
    'notification.enableButton': '通知を有効にする',
    'notification.alertSettings': '通知設定',
    'notification.enableNotifications': '通知を有効にする',
    'notification.enableNotificationsDesc': '期限切れ間近の食品のお知らせを受け取る',
    'notification.expiringSoonAlerts': '期限切れ間近のお知らせ',
    'notification.expiringSoonAlertsDesc': '食品が期限切れ間近になったときのお知らせ',
    'notification.expiringTodayAlerts': '今日期限切れのお知らせ',
    'notification.expiringTodayAlertsDesc': '食品が今日期限切れになるときのお知らせ',
    'notification.expiredAlerts': '期限切れのお知らせ',
    'notification.expiredAlertsDesc': '食品が期限切れになったときのお知らせ',
    'notification.reminderTiming': 'リマインダーのタイミング',
    'notification.alertMeBefore': '期限切れ前にお知らせ',
    'notification.alertMeBeforeDesc': '期限切れ何日前にお知らせするか',
    'notification.testNotification': 'テスト通知',
    'notification.testNotificationDesc': 'テスト通知を送信',
    'notification.testButton': 'テスト',
    'notification.testSent': 'テスト送信完了',
    'notification.testSentDesc': '通知をご確認ください！',
    'notification.notEnabledError': '通知が有効になっていません',
    'notification.enabledSuccess': '通知が有効になりました',
    'notification.enabledSuccessDesc': '食品の期限切れが近づくとお知らせが届くようになりました！',
    'notification.disabledError': '通知が無効になっています',
    'notification.disabledErrorDesc': '期限切れのお知らせを受け取るには、デバイス設定で通知を有効にしてください。',

    // Additional Settings Translations
    'deleteCategory': 'カテゴリを削除',
    'deleteCategoryConfirm': 'このカテゴリを削除してもよろしいですか？',
    'deleteLocation': '場所を削除',
    'deleteLocationConfirm': 'この場所を削除してもよろしいですか？',
    'cancel': 'キャンセル',
    'delete': '削除',
    'close': '閉じる',
    'save': '保存',
    'edit': '編集',
    'add': '追加',
    'settings.title': '設定',

    // Edit Modal Translations
    'editCategory': 'カテゴリを編集',
    'addCategory': 'カテゴリを追加',
    'editLocation': '場所を編集',
    'addLocation': '場所を追加',
    'categoryName': 'カテゴリ名',
    'locationName': '場所名',
    'selectIcon': 'アイコンを選択',

    // Default Categories
    'defaultCategory.vegetables': '野菜',
    'defaultCategory.fruits': '果物', 
    'defaultCategory.dairy': '乳製品',
    'defaultCategory.meat': '肉',
    'defaultCategory.snacks': 'スナック',
    'defaultCategory.desserts': 'デザート',
    'defaultCategory.seafood': '海鮮',
    'defaultCategory.bread': 'パン',

    // Default Locations
    'defaultLocation.fridge': '冷蔵庫',
    'defaultLocation.freezer': '冷凍庫',
    'defaultLocation.pantry': 'パントリー',
    'defaultLocation.counter': '台面',
    'defaultLocation.cabinet': 'キャビネット',

    // Add/Edit Food Item Page
    'addItem.title': '食品アイテムを追加',
    'addItem.editTitle': '食品アイテムを編集',
    'addItem.itemName': 'アイテム名',
    'addItem.itemNamePlaceholder': '食品アイテム名を入力',
    'addItem.quantity': '数量',
    'addItem.quantityPlaceholder': '数量を入力',
    'addItem.category': 'カテゴリ',
    'addItem.storageLocation': '保存場所',
    'addItem.expiryDate': '賞味期限',
    'addItem.reminderDays': 'リマインダー日数',
    'addItem.reminderDaysPlaceholder': '期限前のリマインダー日数',
    'addItem.notes': 'メモ',
    'addItem.notesPlaceholder': 'アイテムについてのメモを追加',
    'addItem.loading': 'アイテムの詳細を読み込み中...',
    
    // Detail Pages
    'detail.itemsIn': 'アイテム数：',
    'detail.noItemsYet': 'このカテゴリにはまだアイテムがありません',
    'detail.noItemsInLocation': '{location}にはまだアイテムがありません。\nアイテムを追加してここで確認してください！',
    'detail.locationNotFound': '場所が見つかりません',

    // Error Messages  
    'error.enterItemName': 'アイテム名を入力してください',
    'error.selectStorageLocation': '保存場所を選択してください',
    'error.failedToCreate': 'アイテムの作成に失敗しました',
    'error.failedToUpdate': 'アイテムの更新に失敗しました',
    'error.failedToLoadData': 'データの読み込みに失敗しました',
    'error.tryAgain': 'もう一度お試しください',

    // Food Item Status
    'foodStatus.fresh': '新鮮',
    'foodStatus.expiring': '期限切れ間近',
    'foodStatus.expired': '期限切れ',
    'foodStatus.expirestoday': '今日期限',
    'foodStatus.daysLeft': '日残り',
    'foodStatus.expiredDays': '日前',
    'foodStatus.noCategory': 'カテゴリなし',
    'foodStatus.noLocation': '場所なし',
  }
};

// Export translations for use in other services
export { translations };

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
      
      // Update default categories and locations with new language
      try {
        await updateDefaultDataForLanguage(lang);
        console.log('Default data updated for new language');
      } catch (error) {
        console.error('Error updating default data for language:', error);
        // Continue even if this fails - the main language change should work
      }
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