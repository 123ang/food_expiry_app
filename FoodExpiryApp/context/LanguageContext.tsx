import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateDefaultDataForLanguage } from '../database/database';
import { DeviceEventEmitter } from 'react-native';

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
    'home.welcomeToApp': 'Welcome to Expiry Alert',
    'home.expiring': 'expiring',
    'home.item': 'item',
    'home.items': 'items',
    'home.indate': 'In-date',
    'home.expired': 'Expired',
    'home.storageLocations': 'Storage Locations',
    'home.categories': 'Categories',
    'home.loading': 'Loading dashboard...',
    
    // List Screen
    'list.search': 'Search items...',
    'list.all': 'All',
    'list.indate': 'In-date',
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
    'status.indate': 'In-date Items',
    'status.indateItems': 'In-date Items',
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
    'form.photo': 'Photo (Optional)',
    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.fillAllFields': 'Please fill in all fields',
    'form.edit': 'Edit Food Item',
    'form.new': 'New Food Item',
    
    // Image Picker
    'image.selectTitle': 'Add Photo',
    'image.selectMessage': 'Choose how you want to add a photo',
    'image.camera': 'Take Photo',
    'image.photoLibrary': 'Choose from Gallery',
    'image.chooseEmoji': 'Use Food Emoji',
    'image.mySavedPhotos': 'My Saved Photos',
    'image.addPhoto': 'Add Photo',
    'image.changePhoto': 'Change',
    'image.removePhoto': 'Remove',
    'image.selectEmoji': 'Choose Food Emoji',
    'image.selectSavedPhoto': 'Choose from My Photos',
    'image.noSavedPhotos': 'No saved photos yet. Take some photos to see them here!',
    'image.permissionCameraTitle': 'Camera Permission Required',
    'image.permissionCameraMessage': 'Permission to access camera is required!',
    'image.permissionLibraryTitle': 'Photo Library Permission Required',
    'image.permissionLibraryMessage': 'Permission to access photo library is required!',
    'image.noPhotoAdded': 'No Photo Added',
    'image.tapToAddPhoto': 'Tap to add a photo, emoji, or choose from saved photos',
    'image.takePhoto': 'Take Photo',
    'image.chooseFromGallery': 'Choose from Gallery',
    'image.useFoodEmoji': 'Use Food Emoji',
    'image.failedToSave': 'Failed to save image. Please try again.',
    'image.failedToProcess': 'Failed to process image. Please try again.',
    
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
    'alert.unexpectedError': 'An unexpected error occurred',
    'alert.noItemsSelected': 'No Items Selected',
    'alert.selectItemsFirst': 'Please select items to clear from your inventory.',
    
    // Common
    'common.cancel': 'Cancel',
    'common.success': 'Success',
    'common.error': 'Error',
    
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
    'settings.theme': 'Theme',
    'settings.themeDescription': 'Choose your preferred theme',
    'settings.themeOriginal': 'Original',
    'settings.themeOriginalDesc': 'Clean white background with dark green accents',
    'settings.themeRecycled': 'Recycled',
    'settings.themeRecycledDesc': 'Warm eco-friendly peach and cream tones',
    'settings.themeDarkBrown': 'Dark Brown',
    'settings.themeDarkBrownDesc': 'Dark warm brown with green accents',
    'settings.themeBlack': 'Black',
    'settings.themeBlackDesc': 'Pure black background with high contrast',
    'settings.themeBlue': 'Blue',
    'settings.themeBlueDesc': 'Clean blue background with modern design',
    'settings.themeGreen': 'Green',
    'settings.themeGreenDesc': 'Natural earth tones with green accents',
    'settings.themeSoftPink': 'Soft Pink',
    'settings.themeSoftPinkDesc': 'Warm and cozy pink tones',
    'settings.themeBrightPink': 'Bright Pink',
    'settings.themeBrightPinkDesc': 'Vibrant and energetic pink theme',
    'settings.themeYellow': 'Yellow',
    'settings.themeYellowDesc': 'Warm and bright yellow tones',
    'settings.themeMintRed': 'Mint-Red',
    'settings.themeMintRedDesc': 'Fresh mint with vibrant red accents',
    'settings.themeDarkGold': 'Dark Gold',
    'settings.themeDarkGoldDesc': 'Elegant dark theme with gold accents',
    'settings.themeDark': 'Dark',
    'settings.themeDarkDesc': 'Dark warm brown with green accents',
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
    'settings.resetDatabase': 'Reset Database',
    'settings.resetDatabaseDescription': 'Reset to original 8 categories and 4 locations',
    'settings.resetDatabaseConfirmation': 'This will reset all categories and locations to the original 8 categories and 4 locations. Your food items will be preserved. This action cannot be undone.',
    'settings.reset': 'Reset',
    'settings.resetDatabaseSuccess': 'Database has been reset to original defaults!',
    'settings.resetDatabaseError': 'Failed to reset database. Please try again.',
    'settings.clearExpiredItems': 'Clear Expired Items',
    'settings.clearExpiredItemsDescription': 'Remove all expired items from your inventory',
    'settings.clearUsedItems': 'Clear Used Items',
    'settings.clearUsedItemsDescription': 'Mark items as used or removed from inventory',
    'settings.clearExpiredConfirmTitle': 'Clear Expired Items',
    'settings.clearExpiredConfirmMessage': 'This will permanently delete all expired items. This action cannot be undone.',
    'settings.clearExpiredButton': 'Clear Expired',
    'settings.clearExpiredSuccess': 'Successfully deleted {count} expired item{plural}.',
    'settings.clearExpiredError': 'Failed to delete expired items. Please try again.',
    
    // Clear Items Screen
    'clearItems.title': 'Clear Used Items',
    'clearItems.selectAll': 'Select All',
    'clearItems.clearSelection': 'Clear Selection',
    'clearItems.selectedCount': '{count} selected',
    'clearItems.clearSelected': 'Clear Selected',
    'clearItems.confirmTitle': 'Clear Selected Items',
    'clearItems.confirmMessage': 'This will permanently delete {count} selected item{plural}. This action cannot be undone.',
    'clearItems.success': 'Successfully deleted {count} item{plural}.',
    'clearItems.error': 'Failed to delete items. Please try again.',
    'clearItems.noItems': 'No items to clear',
    
    // Item Actions
    'item.useItem': 'Use Item',
    'item.throwAway': 'Throw Away',
    'item.reduceQuantity': 'Reduce Quantity',
    'item.useQuantity': 'How many did you use?',
    'item.throwQuantity': 'How many to throw away?',
    'item.quantityUsed': 'Quantity used successfully!',
    'item.quantityThrown': 'Items thrown away successfully!',
    'item.itemDeleted': 'Item deleted (quantity reached 0)',
    'item.invalidQuantity': 'Please enter a valid quantity',
    'item.quantityTooHigh': 'Quantity cannot be higher than available ({available})',
    
    // App Name
    'app.name': 'Expiry Alert',
    
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
    'about.appName': 'Expiry Alert',
    'about.appTagline': 'Never let food go to waste again',
    'about.sectionAbout': 'About',
    'about.description': 'Expiry Alert is your personal food management assistant. Keep track of expiration dates, organize your pantry, and reduce food waste with our intuitive and feature-rich app.',
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
    'notification.expiringSoonAlertsDesc': 'Alert when items are about to expire',
    'notification.expiringTodayAlerts': 'Expiring Today Alerts',
    'notification.expiringTodayAlertsDesc': 'Alert when items expire today',
    'notification.expiredAlerts': 'Expired Alerts',
    'notification.expiredAlertsDesc': 'Alert when items have expired',
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
    
    // Categories Screen
    'categories.title': 'Categories',
    'categories.updateCategory': 'Update Category',
    'categories.addCategory': 'Add Category',
    'categories.deleteCategory': 'Delete Category',
    'categories.deleteConfirm': 'Are you sure you want to delete this category?',
    'categories.errorDelete': 'Failed to delete category',
    
    // Theme Setup Modal
    'themeSetup.title': 'Setup Category Themes',
    'themeSetup.subtitle': 'Select themes to quickly add suggested categories to your app',
    'themeSetup.quickSetup': 'Quick Setup with Themes',
    'themeSetup.categories': 'categories',
    'themeSetup.cancel': 'Cancel',
    'themeSetup.apply': 'Apply Themes',
    'themeSetup.added': 'Added',
    
    // Theme Names
    'theme.food': 'Food & Beverages',
    'theme.foodDesc': 'Essential food categories for kitchen management',
    'theme.health': 'Health & Medical',
    'theme.healthDesc': 'Medical supplies and health products',
    'theme.beauty': 'Beauty & Personal Care',
    'theme.beautyDesc': 'Cosmetics and personal hygiene products',
    'theme.household': 'Household Items',
    'theme.householdDesc': 'Cleaning supplies and home maintenance',
    'theme.automotive': 'Automotive & Chemical',
    'theme.automotiveDesc': 'Car maintenance and chemical products',
    
    // Category Names
    'category.vegetables': 'Vegetables',
    'category.fruits': 'Fruits',
    'category.dairy': 'Dairy',
    'category.meat': 'Meat',
    'category.snacks': 'Snacks',
    'category.desserts': 'Desserts',
    'category.seafood': 'Seafood',
    'category.bread': 'Bread',
    'category.medications': 'Medications',
    'category.vitamins': 'Vitamins & Supplements',
    'category.firstAid': 'First Aid',
    'category.contactLenses': 'Contact Lenses',
    'category.bloodTestKits': 'Blood Test Kits',
    'category.medicalDevices': 'Medical Devices',
    'category.makeup': 'Makeup',
    'category.skincare': 'Skincare',
    'category.hairCare': 'Hair Care',
    'category.perfume': 'Perfume & Fragrance',
    'category.sunscreen': 'Sunscreen',
    'category.beautyTools': 'Beauty Tools',
    'category.cleaningSupplies': 'Cleaning Supplies',
    'category.laundryProducts': 'Laundry Products',
    'category.batteries': 'Batteries',
    'category.safetyEquipment': 'Safety Equipment',
    'category.paintCoatings': 'Paint & Coatings',
    'category.motorOil': 'Motor Oil',
    'category.fuelAdditives': 'Fuel Additives',
    
    // Emoji Category Labels
    'emojiCategory.food': 'Food',
    'emojiCategory.personalCare': 'Personal Care & Beauty',
    'emojiCategory.medical': 'Medical & Health',
    'emojiCategory.household': 'Household Items',
    'emojiCategory.chemical': 'Chemical & Automotive',
    'emojiCategory.other': 'Other',
    
    // Locations Screen
    'locations.title': 'Storage Locations',
    'locations.updateLocation': 'Update Location',
    'locations.addLocation': 'Add Location',
    'locations.deleteLocation': 'Delete Location',
    'locations.deleteConfirm': 'Are you sure you want to delete this location?',
    'locations.errorDelete': 'Failed to delete location',

    // Calendar Theme Instructions
    'calendar.androidThemeNote': 'Note: Calendar appearance on Android follows your device\'s system theme settings, not the app theme.',
    'calendar.systemThemeInstructions': 'To change calendar colors, adjust your device\'s dark/light mode in system settings.',

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
    'addItem.title': 'Add Item',
    'addItem.editTitle': 'Edit Item',
    'addItem.itemName': 'Item Name',
    'addItem.itemNamePlaceholder': 'Enter food item name',
    'addItem.quantity': 'Quantity',
    'addItem.quantityPlaceholder': 'Enter quantity',
    'addItem.category': 'Category',
    'addItem.storageLocation': 'Storage Location',
    'addItem.expiryDate': 'Expiry Date',
    'addItem.reminderDays': 'Reminder Days',
    'addItem.reminderDaysPlaceholder': 'Days before expiry to remind',
    'addItem.notes': 'Notes',
    'addItem.notesPlaceholder': 'Add any notes about the item',
    'addItem.loading': 'Loading...',
    
    // Error Messages for Add/Edit
    'error.enterItemName': 'Please enter an item name',
    'error.selectStorageLocation': 'Please select a storage location',
    'error.failedToCreate': 'Failed to create item',
    'error.itemNotFound': 'Item not found',
    'error.failedToLoad': 'Failed to load item',
    'errorSaving': 'Error saving item',
    
    // Detail Pages
    'detail.itemsIn': 'Item Count:',
    'detail.noItemsYet': 'No items in this category yet',
    'detail.noItemsInLocation': 'No items in {location} yet.\nAdd some items here to check!',
    'detail.locationNotFound': 'Location not found',

    // Food Item Status
    'foodStatus.indate': 'In-date',
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
    'home.welcomeToApp': '欢迎使用过期警报',
    'home.expiring': '即将过期',
    'home.item': '项',
    'home.items': '食品',
    'home.indate': '未过期',
    'home.expired': '已过期',
    'home.storageLocations': '储存位置',
    'home.categories': '分类',
    'home.loading': '正在加载仪表板...',
    
    // List Screen
    'list.search': '搜索食品...',
    'list.all': '全部',
    'list.indate': '未过期',
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
    'status.indate': '未过期食品',
    'status.indateItems': '未过期食品',
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
    'form.photo': '照片（可选）',
    'form.save': '保存',
    'form.cancel': '取消',
    'form.fillAllFields': '请填写所有字段',
    'form.edit': '编辑食品物品',
    'form.new': '新食品物品',
    
    // Image Picker
    'image.selectTitle': '添加照片',
    'image.selectMessage': '选择如何添加照片',
    'image.camera': '拍照',
    'image.photoLibrary': '从相册选择',
    'image.chooseEmoji': '使用食物表情',
    'image.mySavedPhotos': '我的保存照片',
    'image.addPhoto': '添加照片',
    'image.changePhoto': '更换',
    'image.removePhoto': '删除',
    'image.selectEmoji': '选择食物表情',
    'image.selectSavedPhoto': '从我的照片选择',
    'image.noSavedPhotos': '还没有保存的照片。拍一些照片就能在这里看到！',
    'image.permissionCameraTitle': '需要相机权限',
    'image.permissionCameraMessage': '需要访问相机的权限！',
    'image.permissionLibraryTitle': '需要相册权限',
    'image.permissionLibraryMessage': '需要访问相册的权限！',
    'image.noPhotoAdded': '未添加照片',
    'image.tapToAddPhoto': '点击添加照片、表情或从保存的照片中选择',
    'image.takePhoto': '拍照',
    'image.chooseFromGallery': '从相册选择',
    'image.useFoodEmoji': '使用食物表情',
    'image.failedToSave': '保存图片失败。请重试。',
    'image.failedToProcess': '处理图片失败。请重试。',
    
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
    'alert.unexpectedError': '发生意外错误',
    'alert.noItemsSelected': '未选择物品',
    'alert.selectItemsFirst': '请选择要从库存中清除的物品。',
    
    // Common
    'common.cancel': '取消',
    'common.success': '成功',
    'common.error': '错误',
    
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
    'settings.theme': '主题',
    'settings.themeDescription': '选择您喜欢的主题',
    'settings.themeOriginal': '原始',
    'settings.themeOriginalDesc': '干净的白色背景，带有深绿色装饰',
    'settings.themeRecycled': '回收',
    'settings.themeRecycledDesc': '温暖的环保桃子和奶油色调',
    'settings.themeDarkBrown': '深棕色',
    'settings.themeDarkBrownDesc': '暖棕色背景，带有绿色装饰',
    'settings.themeBlack': '黑色',
    'settings.themeBlackDesc': '纯黑色背景，高对比度',
    'settings.themeBlue': '蓝色',
    'settings.themeBlueDesc': '清洁的蓝色背景，现代设计',
    'settings.themeGreen': '绿色',
    'settings.themeGreenDesc': '自然大地色调与绿色点缀',
    'settings.themeSoftPink': '柔和粉色',
    'settings.themeSoftPinkDesc': '温暖舒适的粉色调',
    'settings.themeBrightPink': '鲜艳粉色',
    'settings.themeBrightPinkDesc': '充满活力的鲜艳粉色主题',
    'settings.themeYellow': '黄色',
    'settings.themeYellowDesc': '温暖明亮的黄色调',
    'settings.themeMintRed': '薄荷红',
    'settings.themeMintRedDesc': '清新薄荷配鲜艳红色',
    'settings.themeDarkGold': '深色金',
    'settings.themeDarkGoldDesc': '优雅深色主题配金色装饰',
    'settings.themeDark': '深色',
    'settings.themeDarkDesc': '暖色背景，带有绿色装饰',
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
    'settings.resetDatabase': '重置数据库',
    'settings.resetDatabaseDescription': '重置为原始的8个分类和4个位置',
    'settings.resetDatabaseConfirmation': '这将重置所有分类和位置为原始的8个分类和4个位置。您的食品项目将被保留。此操作无法撤销。',
    'settings.reset': '重置',
    'settings.resetDatabaseSuccess': '数据库已重置为原始默认设置！',
    'settings.resetDatabaseError': '重置数据库失败。请重试。',
    'settings.clearExpiredItems': '清除过期食品',
    'settings.clearExpiredItemsDescription': '从您的库存中删除所有过期食品',
    'settings.clearUsedItems': '清除已使用食品',
    'settings.clearUsedItemsDescription': '将食品标记为已使用或从库存中删除',
    'settings.clearExpiredConfirmTitle': '清除过期食品',
    'settings.clearExpiredConfirmMessage': '这将永久删除所有过期食品。此操作无法撤销。',
    'settings.clearExpiredButton': '清除过期',
    'settings.clearExpiredSuccess': '成功删除了 {count} 个过期食品{plural}。',
    'settings.clearExpiredError': '删除过期食品失败。请重试。',
    
    // Clear Items Screen
    'clearItems.title': '清除已使用食品',
    'clearItems.selectAll': '全选',
    'clearItems.clearSelection': '清除选择',
    'clearItems.selectedCount': '已选择 {count} 个',
    'clearItems.clearSelected': '清除选中项',
    'clearItems.confirmTitle': '清除选中食品',
    'clearItems.confirmMessage': '这将永久删除 {count} 个选中的食品{plural}。此操作无法撤销。',
    'clearItems.success': '成功删除了 {count} 个食品{plural}。',
    'clearItems.error': '删除食品失败。请重试。',
    'clearItems.noItems': '没有要清除的食品',
    
    // Item Actions
    'item.useItem': '使用食品',
    'item.throwAway': '丢弃',
    'item.reduceQuantity': '减少数量',
    'item.useQuantity': '您使用了多少？',
    'item.throwQuantity': '要丢弃多少？',
    'item.quantityUsed': '数量使用成功！',
    'item.quantityThrown': '食品丢弃成功！',
    'item.itemDeleted': '食品已删除（数量为0）',
    'item.invalidQuantity': '请输入有效数量',
    'item.quantityTooHigh': '数量不能超过可用数量（{available}）',
    
    // App Name
    'app.name': '过期警报',
    
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
    'about.description': '过期警报是您的个人食品管理助手。跟踪过期日期，整理您的食品储藏室，并通过我们直观且功能丰富的应用程序减少食物浪费。',
    'about.sectionFeatures': '主要功能',
    'about.featureCalendar': '智能过期日期跟踪与视觉日历',
    'about.featureCategories': '可自定义的分类和储存位置',
    'about.featureDashboard': '带状态指示器的仪表板概览',
    'about.featureSearch': '高级搜索和过滤选项',
    'about.featureDarkMode': '暗模式和多语言支持',
    'about.featureCrossPlatform': '跨平台兼容性（iOS、Android、Web）',
    'about.sectionTechnology': '技术',
    'about.technologyDescription': '使用React Native和Expo构建，在所有平台上实现最佳性能。使用SQLite进行可靠的本地数据存储，使用React Navigation提供流畅的用户体验。',
    'about.footerText': '为减少食物浪费而用❤️制作\n© 2024 过期警报。保留所有权利。',
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
    
    // Categories Screen
    'categories.title': '分类',
    'categories.updateCategory': '更新分类',
    'categories.addCategory': '添加分类',
    'categories.deleteCategory': '删除分类',
    'categories.deleteConfirm': '您确定要删除这个分类吗？',
    'categories.errorDelete': '删除分类失败',
    
    // Theme Setup Modal
    'themeSetup.title': '设置分类主题',
    'themeSetup.subtitle': '选择主题以快速添加建议的分类到您的应用',
    'themeSetup.quickSetup': '主题快速设置',
    'themeSetup.categories': '分类',
    'themeSetup.cancel': '取消',
    'themeSetup.apply': '应用主题',
    'themeSetup.added': '已添加',
    
    // Theme Names
    'theme.food': '食品饮料',
    'theme.foodDesc': '厨房管理的基本食品分类',
    'theme.health': '健康医疗',
    'theme.healthDesc': '医疗用品和健康产品',
    'theme.beauty': '美容个护',
    'theme.beautyDesc': '化妆品和个人卫生用品',
    'theme.household': '家居用品',
    'theme.householdDesc': '清洁用品和家庭维护',
    'theme.automotive': '汽车化工',
    'theme.automotiveDesc': '汽车保养和化工产品',
    
    // Category Names
    'category.vegetables': '蔬菜',
    'category.fruits': '水果',
    'category.dairy': '乳制品',
    'category.meat': '肉类',
    'category.snacks': '零食',
    'category.desserts': '甜点',
    'category.seafood': '海鲜',
    'category.bread': '面包',
    'category.medications': '药物',
    'category.vitamins': '维生素补充剂',
    'category.firstAid': '急救用品',
    'category.contactLenses': '隐形眼镜',
    'category.bloodTestKits': '血液检测包',
    'category.medicalDevices': '医疗设备',
    'category.makeup': '化妆品',
    'category.skincare': '护肤品',
    'category.hairCare': '护发用品',
    'category.perfume': '香水香氛',
    'category.sunscreen': '防晒霜',
    'category.beautyTools': '美容工具',
    'category.cleaningSupplies': '清洁用品',
    'category.laundryProducts': '洗衣用品',
    'category.batteries': '电池',
    'category.safetyEquipment': '安全设备',
    'category.paintCoatings': '油漆涂料',
    'category.motorOil': '机油',
    'category.fuelAdditives': '燃油添加剂',
    
    // Emoji Category Labels
    'emojiCategory.food': '食品',
    'emojiCategory.personalCare': '个人护理美容',
    'emojiCategory.medical': '医疗健康',
    'emojiCategory.household': '家居用品',
    'emojiCategory.chemical': '化工汽车',
    'emojiCategory.other': '其他',
    
    // Locations Screen
    'locations.title': '储存位置',
    'locations.updateLocation': '更新位置',
    'locations.addLocation': '添加位置',
    'locations.deleteLocation': '删除位置',
    'locations.deleteConfirm': '您确定要删除这个位置吗？',
    'locations.errorDelete': '删除位置失败',

    // Calendar Theme Instructions
    'calendar.androidThemeNote': '注意：Android上的日历外观遵循设备系统主题设置，而不是应用程序主题。',
    'calendar.systemThemeInstructions': '要更改日历颜色，请在系统设置中调整设备暗/亮模式。',

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
    
    // Error Messages for Add/Edit
    'error.enterItemName': '请输入食品名称',
    'error.selectStorageLocation': '请选择储存位置',
    'error.failedToCreate': '创建食品失败',
    'error.failedToUpdate': '更新食品失败',
    'error.failedToLoadData': '加载数据失败',
    'error.tryAgain': '请重试',
    'error.itemNotFound': '食品未找到',
    'error.failedToLoad': '加载食品失败',
    'errorSaving': '保存食品时出错',

    // Detail Pages
    'detail.itemsIn': '食品在',
    'detail.noItemsYet': '此分类中还没有食品',
    'detail.noItemsInLocation': '{location}中还没有食品。\n添加一些食品以在此处查看！',
    'detail.locationNotFound': '未找到位置',

    // Food Item Status
    'foodStatus.indate': '未过期',
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
    'home.welcomeToApp': '期限警報へようこそ',
    'home.expiring': '期限切れ間近',
    'home.item': '項目',
    'home.items': '項目',
    'home.indate': '期限内',
    'home.expired': '期限切れ',
    'home.storageLocations': '保存場所',
    'home.categories': 'カテゴリ',
    'home.loading': 'ダッシュボードを読み込み中...',
    
    // List Screen
    'list.search': 'アイテムを検索...',
    'list.all': 'すべて',
    'list.indate': '期限内',
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
    'status.indate': '期限内アイテム',
    'status.indateItems': '期限内アイテム',
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
    'form.photo': '写真（オプション）',
    'form.save': '保存',
    'form.cancel': 'キャンセル',
    'form.fillAllFields': 'すべてのフィールドを入力してください',
    'form.edit': '食品アイテムを編集',
    'form.new': '新しい食品アイテム',
    
    // Image Picker
    'image.selectTitle': '写真を追加',
    'image.selectMessage': '写真を追加する方法を選択してください',
    'image.camera': '写真を撮る',
    'image.photoLibrary': 'ギャラリーから選択',
    'image.chooseEmoji': '食べ物絵文字を使用',
    'image.mySavedPhotos': '保存済み写真',
    'image.addPhoto': '写真を追加',
    'image.changePhoto': '変更',
    'image.removePhoto': '削除',
    'image.selectEmoji': '食べ物絵文字を選択',
    'image.selectSavedPhoto': '保存済み写真から選択',
    'image.noSavedPhotos': 'まだ保存された写真がありません。写真を撮るとここに表示されます！',
    'image.permissionCameraTitle': 'カメラの許可が必要',
    'image.permissionCameraMessage': 'カメラへのアクセス許可が必要です！',
    'image.permissionLibraryTitle': 'フォトライブラリの許可が必要',
    'image.permissionLibraryMessage': 'フォトライブラリへのアクセス許可が必要です！',
    'image.noPhotoAdded': '写真が追加されていません',
    'image.tapToAddPhoto': 'タップして写真、絵文字を追加するか、保存済み写真から選択',
    'image.takePhoto': '写真を撮る',
    'image.chooseFromGallery': 'ギャラリーから選択',
    'image.useFoodEmoji': '食べ物絵文字を使用',
    'image.failedToSave': '画像の保存に失敗しました。再試行してください。',
    'image.failedToProcess': '画像の処理に失敗しました。再試行してください。',
    
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
    'alert.unexpectedError': '予期しないエラーが発生しました',
    'alert.noItemsSelected': 'アイテムが選択されていません',
    'alert.selectItemsFirst': '在庫からクリアするアイテムを選択してください。',
    
    // Common
    'common.cancel': 'キャンセル',
    'common.success': '成功',
    'common.error': 'エラー',
    
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
    'settings.theme': 'テーマ',
    'settings.themeDescription': 'お好みのテーマを選択',
    'settings.themeOriginal': 'オリジナル',
    'settings.themeOriginalDesc': 'ダークグリーンのアクセントが付いたクリーンな白い背景',
    'settings.themeRecycled': 'リサイクル',
    'settings.themeRecycledDesc': 'ウォームなエコフレンドリーなピンクとクリームのトーン',
    'settings.themeDarkBrown': 'ダークブラウン',
    'settings.themeDarkBrownDesc': '暖かい茶色の背景に緑のアクセント',
    'settings.themeBlack': 'ブラック',
    'settings.themeBlackDesc': '純黒背景で高コントラスト',
    'settings.themeBlue': 'ブルー',
    'settings.themeBlueDesc': 'クリーンなブルー背景でモダンデザイン',
    'settings.themeGreen': 'グリーン',
    'settings.themeGreenDesc': '自然なアースカラーとグリーンアクセント',
    'settings.themeSoftPink': 'ソフトピンク',
    'settings.themeSoftPinkDesc': '温かく居心地の良いピンクトーン',
    'settings.themeBrightPink': 'ブライトピンク',
    'settings.themeBrightPinkDesc': '鮮やかで活気のあるピンクテーマ',
    'settings.themeYellow': 'イエロー',
    'settings.themeYellowDesc': '温かく明るい黄色調',
    'settings.themeMintRed': 'ミントレッド',
    'settings.themeMintRedDesc': '新鮮なミントと鮮やかな赤のアクセント',
    'settings.themeDarkGold': 'ダークゴールド',
    'settings.themeDarkGoldDesc': 'エレガントなダークテーマにゴールドアクセント',
    'settings.themeDark': 'ダーク',
    'settings.themeDarkDesc': '暖かい茶色の背景に緑のアクセント',
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
    'settings.resetDatabase': 'データベースをリセット',
    'settings.resetDatabaseDescription': '元の8つのカテゴリと4つの場所にリセット',
    'settings.resetDatabaseConfirmation': 'これにより、すべてのカテゴリと場所が元の8つのカテゴリと4つの場所にリセットされます。食品アイテムは保持されます。この操作は元に戻せません。',
    'settings.reset': 'リセット',
    'settings.resetDatabaseSuccess': 'データベースが元のデフォルト設定にリセットされました！',
    'settings.resetDatabaseError': 'データベースのリセットに失敗しました。もう一度お試しください。',
    'settings.clearExpiredItems': '期限切れアイテムをクリア',
    'settings.clearExpiredItemsDescription': '在庫からすべての期限切れアイテムを削除',
    'settings.clearUsedItems': '使用済みアイテムをクリア',
    'settings.clearUsedItemsDescription': 'アイテムを使用済みまたは在庫から削除済みとしてマーク',
    'settings.clearExpiredConfirmTitle': '期限切れアイテムをクリア',
    'settings.clearExpiredConfirmMessage': 'これにより、すべての期限切れアイテムが永久に削除されます。この操作は元に戻せません。',
    'settings.clearExpiredButton': '期限切れをクリア',
    'settings.clearExpiredSuccess': '{count}個の期限切れアイテム{plural}を正常に削除しました。',
    'settings.clearExpiredError': '期限切れアイテムの削除に失敗しました。もう一度お試しください。',
    
    // Clear Items Screen
    'clearItems.title': '使用済みアイテムをクリア',
    'clearItems.selectAll': 'すべて選択',
    'clearItems.clearSelection': '選択をクリア',
    'clearItems.selectedCount': '{count}個選択済み',
    'clearItems.clearSelected': '選択済みをクリア',
    'clearItems.confirmTitle': '選択したアイテムをクリア',
    'clearItems.confirmMessage': 'これにより、選択した{count}個のアイテム{plural}が永久に削除されます。この操作は元に戻せません。',
    'clearItems.success': '{count}個のアイテム{plural}を正常に削除しました。',
    'clearItems.error': 'アイテムの削除に失敗しました。もう一度お試しください。',
    'clearItems.noItems': 'クリアするアイテムがありません',
    
    // Item Actions
    'item.useItem': 'アイテムを使用',
    'item.throwAway': '捨てる',
    'item.reduceQuantity': '数量を減らす',
    'item.useQuantity': 'いくつ使用しましたか？',
    'item.throwQuantity': 'いくつ捨てますか？',
    'item.quantityUsed': '数量が正常に使用されました！',
    'item.quantityThrown': 'アイテムが正常に捨てられました！',
    'item.itemDeleted': 'アイテムが削除されました（数量が0になりました）',
    'item.invalidQuantity': '有効な数量を入力してください',
    'item.quantityTooHigh': '数量は利用可能数量を超えることはできません（{available}）',
    
    // App Name
    'app.name': '期限切れ警報',
    
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
    'about.appName': '期限切れ警報',
    'about.appTagline': '二度と食べ物を無駄にしません',
    'about.sectionAbout': 'について',
    'about.description': '期限切れ警報は、あなたの個人的な食品管理アシスタントです。賞味期限を追跡し、パントリーを整理し、直感的で機能豊富なアプリで食品廃棄を削減します。',
    'about.sectionFeatures': '主な機能',
    'about.featureCalendar': 'ビジュアルカレンダーによるスマートな期限追跡',
    'about.featureCategories': 'カスタマイズ可能なカテゴリと保存場所',
    'about.featureDashboard': 'ステータスインジケーター付きダッシュボード概要',
    'about.featureSearch': '高度な検索とフィルタリングオプション',
    'about.featureDarkMode': 'ダークモードと多言語サポート',
    'about.featureCrossPlatform': 'クロスプラットフォーム対応（iOS、Android、Web）',
    'about.sectionTechnology': '技術',
    'about.technologyDescription': 'すべてのプラットフォームで最適なパフォーマンスを実現するため、React NativeとExpoで構築されています。信頼性の高いローカルデータストレージにはSQLite、スムーズなユーザーエクスペリエンスにはReact Navigationを使用しています。',
    'about.footerText': '食品廃棄削減のために❤️で作成\n© 2024 期限切れ警報。全著作権所有。',
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
    'notification.expiringSoonAlertsDesc': '商品が期限切れ間近になったときのお知らせ',
    'notification.expiringTodayAlerts': '今日期限切れのお知らせ',
    'notification.expiringTodayAlertsDesc': '商品が今日期限切れになるときのお知らせ',
    'notification.expiredAlerts': '期限切れのお知らせ',
    'notification.expiredAlertsDesc': '商品が期限切れになったときのお知らせ',
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
    
    // Categories Screen
    'categories.title': 'カテゴリ',
    'categories.updateCategory': 'カテゴリを更新',
    'categories.addCategory': 'カテゴリを追加',
    'categories.deleteCategory': 'カテゴリを削除',
    'categories.deleteConfirm': 'このカテゴリを削除してもよろしいですか？',
    'categories.errorDelete': 'カテゴリの削除に失敗しました',
    
    // Theme Setup Modal
    'themeSetup.title': 'カテゴリテーマ設定',
    'themeSetup.subtitle': 'テーマを選択してアプリに推奨カテゴリを素早く追加',
    'themeSetup.quickSetup': 'テーマクイック設定',
    'themeSetup.categories': 'カテゴリ',
    'themeSetup.cancel': 'キャンセル',
    'themeSetup.apply': 'テーマを適用',
    'themeSetup.added': '追加済み',
    
    // Theme Names
    'theme.food': '食品・飲料',
    'theme.foodDesc': 'キッチン管理のための基本的な食品カテゴリ',
    'theme.health': '健康・医療',
    'theme.healthDesc': '医療用品と健康製品',
    'theme.beauty': '美容・パーソナルケア',
    'theme.beautyDesc': '化粧品と個人衛生用品',
    'theme.household': '家庭用品',
    'theme.householdDesc': '清掃用品と家庭メンテナンス',
    'theme.automotive': '自動車・化学',
    'theme.automotiveDesc': '自動車メンテナンスと化学製品',
    
    // Category Names
    'category.vegetables': '野菜',
    'category.fruits': '果物',
    'category.dairy': '乳製品',
    'category.meat': '肉類',
    'category.snacks': 'スナック',
    'category.desserts': 'デザート',
    'category.seafood': '魚介類',
    'category.bread': 'パン',
    'category.medications': '薬',
    'category.vitamins': 'ビタミン・サプリメント',
    'category.firstAid': '救急用品',
    'category.contactLenses': 'コンタクトレンズ',
    'category.bloodTestKits': '血液検査キット',
    'category.medicalDevices': '医療機器',
    'category.makeup': '化粧品',
    'category.skincare': 'スキンケア',
    'category.hairCare': 'ヘアケア',
    'category.perfume': '香水・フレグランス',
    'category.sunscreen': '日焼け止め',
    'category.beautyTools': '美容ツール',
    'category.cleaningSupplies': '清掃用品',
    'category.laundryProducts': '洗濯用品',
    'category.batteries': '電池',
    'category.safetyEquipment': '安全機器',
    'category.paintCoatings': '塗料・コーティング',
    'category.motorOil': 'エンジンオイル',
    'category.fuelAdditives': '燃料添加剤',
    
    // Emoji Category Labels
    'emojiCategory.food': '食品',
    'emojiCategory.personalCare': 'パーソナルケア・美容',
    'emojiCategory.medical': '医療・健康',
    'emojiCategory.household': '家庭用品',
    'emojiCategory.chemical': '化学・自動車',
    'emojiCategory.other': 'その他',
    
    // Locations Screen
    'locations.title': '保存場所',
    'locations.updateLocation': '場所を更新',
    'locations.addLocation': '場所を追加',
    'locations.deleteLocation': '場所を削除',
    'locations.deleteConfirm': 'この場所を削除してもよろしいですか？',
    'locations.errorDelete': '場所の削除に失敗しました',

    // Calendar Theme Instructions
    'calendar.androidThemeNote': '注意：Androidのカレンダー外観はデバイスのシステムテーマ設定に従います。アプリのテーマではありません。',
    'calendar.systemThemeInstructions': 'カレンダーの色を変更するには、デバイスの暗/明モードをシステム設定で調整してください。',

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
    
    // Error Messages for Add/Edit
    'error.enterItemName': 'アイテム名を入力してください',
    'error.selectStorageLocation': '保存場所を選択してください',
    'error.failedToCreate': 'アイテムの作成に失敗しました',
    'error.failedToUpdate': 'アイテムの更新に失敗しました',
    'error.failedToLoadData': 'データの読み込みに失敗しました',
    'error.tryAgain': 'もう一度お試しください',
    'error.itemNotFound': 'アイテムが見つかりません',
    'error.failedToLoad': 'アイテムの読み込みに失敗しました',
    'errorSaving': 'アイテムの保存中にエラーが発生しました',

    // Detail Pages
    'detail.itemsIn': 'アイテム数：',
    'detail.noItemsYet': 'このカテゴリにはまだアイテムがありません',
    'detail.noItemsInLocation': '{location}にはまだアイテムがありません。\nアイテムを追加してここで確認してください！',
    'detail.locationNotFound': '場所が見つかりません',

    // Food Item Status
    'foodStatus.indate': '期限内',
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
      // Silent error handling in production
      setLanguageState('en'); // Fallback to English
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
      setLanguageState(lang);
      
      // Update default categories and locations with new language
      try {
        await updateDefaultDataForLanguage(lang);
        
        // Force a small delay to ensure database writes complete on iOS
        // This helps with iOS caching issues where UI doesn't update immediately
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Emit event to notify DatabaseContext to refresh cache
        DeviceEventEmitter.emit('languageChanged', { language: lang });
        
      } catch (error) {
        // Silent error handling in production
      }
    } catch (error) {
      // Silent error handling in production
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