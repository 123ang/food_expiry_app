export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    
    // Navigation
    dashboard: 'Dashboard',
    categories: 'Categories',
    settings: 'Settings',
    
    // Dashboard
    totalItems: 'Total Items',
    expiringSoon: 'Expiring Soon',
    expired: 'Expired',
    fresh: 'Fresh',
    addFoodItem: 'Add Food Item',
    
    // Food Items
    itemName: 'Item Name',
    quantity: 'Quantity',
    category: 'Category',
    storageLocation: 'Storage Location',
    expiryDate: 'Expiry Date',
    reminderDays: 'Reminder Days',
    notes: 'Notes',
    daysLeft: 'days left',
    daysExpired: 'days expired',
    
    // Categories
    vegetables: 'Vegetables',
    fruits: 'Fruits',
    dairy: 'Dairy',
    meat: 'Meat',
    snacks: 'Snacks',
    desserts: 'Desserts',
    seafood: 'Seafood',
    bread: 'Bread',
    
    // Locations
    fridge: 'Fridge',
    freezer: 'Freezer',
    pantry: 'Pantry',
    cabinet: 'Cabinet',
    
    // Settings
    language: 'Language',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    systemDefault: 'System Default',
    english: 'English',
    chinese: 'Chinese',
    
    // Placeholders
    enterItemName: 'Enter food item name',
    enterQuantity: 'Enter quantity',
    daysBeforeExpiry: 'Days before expiry to remind',
    addNotes: 'Add any notes about the item',
    
    // Messages
    confirmDelete: 'Are you sure you want to delete this item?',
    itemSaved: 'Item saved successfully',
    itemDeleted: 'Item deleted successfully',
    errorSaving: 'Error saving item',
    errorDeleting: 'Error deleting item',
    pleaseEnterName: 'Please enter an item name',
    pleaseSelectLocation: 'Please select a storage location',
    
    // Category Screen
    categoryNotFound: 'Category not found',
    itemsIn: 'Items in',
    noItemsInCategory: 'No items in this category',
    
    // Settings Screen
    languageDescription: 'Change app language',
    darkModeDescription: 'Switch between light and dark theme',
    notifications: 'Notifications',
    notificationsDescription: 'Manage notification preferences',
    storageLocations: 'Storage Locations',
    storageLocationsDescription: 'Manage your storage locations',
    categoriesDescription: 'Manage food categories',
    backupSync: 'Backup & Sync',
    backupSyncDescription: 'Manage your data backup',
    about: 'About',
    aboutDescription: 'App information and help',
  },
  zh: {
    // Common
    save: '保存',
    cancel: '取消',
    back: '返回',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    
    // Navigation
    dashboard: '仪表板',
    categories: '分类',
    settings: '设置',
    
    // Dashboard
    totalItems: '总项目',
    expiringSoon: '即将过期',
    expired: '已过期',
    fresh: '新鲜',
    addFoodItem: '添加食品',
    
    // Food Items
    itemName: '项目名称',
    quantity: '数量',
    category: '分类',
    storageLocation: '存储位置',
    expiryDate: '过期日期',
    reminderDays: '提醒天数',
    notes: '备注',
    daysLeft: '天剩余',
    daysExpired: '天已过期',
    
    // Categories
    vegetables: '蔬菜',
    fruits: '水果',
    dairy: '乳制品',
    meat: '肉类',
    snacks: '零食',
    desserts: '甜点',
    seafood: '海鲜',
    bread: '面包',
    
    // Locations
    fridge: '冰箱',
    freezer: '冷冻室',
    pantry: '储藏室',
    cabinet: '橱柜',
    
    // Settings
    language: '语言',
    theme: '主题',
    darkMode: '深色模式',
    lightMode: '浅色模式',
    systemDefault: '系统默认',
    english: '英语',
    chinese: '中文',
    
    // Placeholders
    enterItemName: '输入食品名称',
    enterQuantity: '输入数量',
    daysBeforeExpiry: '过期前提醒天数',
    addNotes: '添加关于此项目的备注',
    
    // Messages
    confirmDelete: '确定要删除此项目吗？',
    itemSaved: '项目保存成功',
    itemDeleted: '项目删除成功',
    errorSaving: '保存项目时出错',
    errorDeleting: '删除项目时出错',
    pleaseEnterName: '请输入项目名称',
    pleaseSelectLocation: '请选择存储位置',
    
    // Category Screen
    categoryNotFound: '未找到分类',
    itemsIn: '项目在',
    noItemsInCategory: '此分类中没有项目',
    
    // Settings Screen
    languageDescription: '更改应用语言',
    darkModeDescription: '切换浅色和深色主题',
    notifications: '通知',
    notificationsDescription: '管理通知首选项',
    storageLocations: '存储位置',
    storageLocationsDescription: '管理您的存储位置',
    categoriesDescription: '管理食品分类',
    backupSync: '备份和同步',
    backupSyncDescription: '管理您的数据备份',
    about: '关于',
    aboutDescription: '应用信息和帮助',
  }
}; 