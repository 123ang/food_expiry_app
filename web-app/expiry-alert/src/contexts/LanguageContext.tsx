import React, { createContext, useContext, useState, useEffect } from 'react';

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
    'nav.dashboard': 'Dashboard',
    'nav.addItem': 'Add Item',
    'nav.locations': 'Locations',
    'nav.categories': 'Categories',
    'nav.logout': 'Logout',
    
    // Landing Page
    'landing.title': 'Never Let Food Go to Waste Again',
    'landing.subtitle': 'Smart expiry tracking for your kitchen. Get notified before items expire and reduce food waste while saving money.',
    'landing.getStarted': 'Get Started',
    'landing.learnMore': 'Learn More',
    'landing.smartAlerts': 'Smart Alerts',
    'landing.whyChoose': 'Why Choose Expiry Alert?',
    'landing.smartTracking': 'Smart Tracking',
    'landing.smartTrackingDesc': 'Easily track expiry dates for all your food items with our intuitive interface.',
    'landing.timelyAlerts': 'Timely Alerts',
    'landing.timelyAlertsDesc': 'Get notified before items expire so you can use them in time.',
    'landing.visualDashboard': 'Visual Dashboard',
    'landing.visualDashboardDesc': 'See your inventory at a glance with color-coded status indicators.',
    'landing.reduceWaste': 'Reduce Waste',
    'landing.reduceWasteDesc': 'Help the environment by reducing food waste and saving money.',
    'landing.crossPlatform': 'Cross-Platform',
    'landing.crossPlatformDesc': 'Available on web, iOS, and Android for seamless synchronization.',
    'landing.securePrivate': 'Secure & Private',
    'landing.securePrivateDesc': 'Your data is securely stored and synchronized across all devices.',
    'landing.downloadTitle': 'Download Expiry Alert',
    'landing.downloadDesc': 'Get the mobile app for the best experience with notifications and offline access.',
    'landing.preferBrowser': 'Prefer to use it in your browser?',
    'landing.launchWebApp': 'Launch Web App',
    'landing.activeUsers': 'Active Users',
    'landing.itemsTracked': 'Items Tracked',
    'landing.wasteReduced': 'Food Waste Reduced',
    'landing.appStoreRating': 'App Store Rating',
    
    // Dashboard
    'dashboard.recentItems': 'Recent Items',
    'dashboard.getStarted': 'Add your first food item to get started with tracking expiry dates!',
    
    // Home/Welcome
    'home.welcome': 'Welcome Back!',
    'home.categories': 'Categories',
    
    // Status
    'status.fresh': 'Fresh',
    'status.expiring': 'Expiring Soon',
    'status.expired': 'Expired',
    'status.items': 'Items',
    'status.loading': 'Loading...',
    'status.error': 'Error',
    'status.retry': 'Retry',
    'status.refresh': 'Refresh',
    'status.viewAll': 'View All',
    'status.noItems': 'No {status} items found',
    'status.itemsStored': 'Items Stored',
    'status.total': 'Total',
    
    // Items
    'item.quantity': 'Quantity',
    'item.expirestoday': 'Expires today',
    'item.dayLeft': 'day left',
    'item.daysLeft': 'days left',
    'item.dayAgo': 'day ago',
    'item.daysAgo': 'days ago',
    
    // Actions
    'action.add': 'Add',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    
    // Alerts
    'alert.deleteMessage': 'Are you sure you want to delete',
    'alert.success': 'Success',
    'alert.deleteFailed': 'Failed to delete item',
    
    // Form
    'form.itemName': 'Item',
    
    // Lists
    'list.noItems': 'No items found. Add some items to get started!',
    
    // Cleanup
    'cleanup.confirmMessage': 'Are you sure you want to cleanup expired items?',
    'cleanup.success': 'Cleanup completed successfully',
    'cleanup.failed': 'Failed to cleanup expired items',
    'cleanup.itemsDeleted': 'items deleted',
    'cleanup.cleanupExpired': 'Cleanup Expired',
    'cleanup.inProgress': 'Cleaning up...',
    
    // Categories  
    'categories.title': 'Categories',
    'categories.addNew': 'Add New Category',
    'categories.name': 'Category Name',
    'categories.description': 'Description',
    'categories.icon': 'Icon',
    'categories.color': 'Color',
    'categories.delete': 'Delete Category',
    'categories.deleteConfirm': 'Are you sure you want to delete this category?',
    'categories.edit': 'Edit Category',
    'categories.save': 'Save Category',
    'categories.cancel': 'Cancel',
    'categories.noCategories': 'No categories found. Add your first category to get started!',
    'categories.preview': 'Preview',
    
    // Locations
    'locations.title': 'Storage Locations',
    'locations.addNew': 'Add New Location',
    'locations.name': 'Location Name',
    'locations.description': 'Description',
    'locations.temperature': 'Temperature',
    'locations.room': 'Room Temperature',
    'locations.refrigerated': 'Refrigerated',
    'locations.frozen': 'Frozen',
    'locations.delete': 'Delete Location',
    'locations.deleteConfirm': 'Are you sure you want to delete this location?',
    'locations.edit': 'Edit Location',
    'locations.save': 'Save Location',
    'locations.cancel': 'Cancel',
    'locations.noLocations': 'No locations found. Add your first storage location to get started!',
    
    // Food Items
    'foodItems.title': 'Food Items',
    'foodItems.addNew': 'Add New Item',
    'foodItems.name': 'Item Name',
    'foodItems.category': 'Category',
    'foodItems.location': 'Storage Location',
    'foodItems.expiryDate': 'Expiry Date',
    'foodItems.quantity': 'Quantity',
    'foodItems.notes': 'Notes',
    'foodItems.reminderDays': 'Reminder Days',
    'foodItems.save': 'Save Item',
    'foodItems.cancel': 'Cancel',
    'foodItems.edit': 'Edit Item',
    'foodItems.delete': 'Delete Item',
    'foodItems.deleteConfirm': 'Are you sure you want to delete this item?',
    'foodItems.noItems': 'No food items found. Add your first item to start tracking!',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.created': 'Created',
    
    // Validation
    'validation.required': 'This field is required',
    'validation.nameRequired': 'Name is required',
    'validation.categoryRequired': 'Category is required',
    'validation.locationRequired': 'Location is required',
    'validation.dateRequired': 'Date is required',
    'validation.quantityRequired': 'Quantity is required',
    
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.demo': 'Demo Mode',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.displayName': 'Display Name',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.createAccount': 'Create Account',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': "Don't have an account?",
  },
  zh: {
    // Navigation  
    'nav.dashboard': '仪表板',
    'nav.addItem': '添加项目',
    'nav.locations': '位置',
    'nav.categories': '分类',
    'nav.logout': '登出',
    
    // Landing Page
    'landing.title': '再也不让食物浪费',
    'landing.subtitle': '智能厨房保质期跟踪。在食品过期前获得通知，减少食物浪费并节省金钱。',
    'landing.getStarted': '开始使用',
    'landing.learnMore': '了解更多',
    'landing.smartAlerts': '智能提醒',
    'landing.whyChoose': '为什么选择过期提醒？',
    'landing.smartTracking': '智能跟踪',
    'landing.smartTrackingDesc': '通过我们直观的界面轻松跟踪所有食品的保质期。',
    'landing.timelyAlerts': '及时提醒',
    'landing.timelyAlertsDesc': '在食品过期前获得通知，以便及时使用。',
    'landing.visualDashboard': '可视化仪表板',
    'landing.visualDashboardDesc': '通过彩色状态指示器一目了然地查看您的库存。',
    'landing.reduceWaste': '减少浪费',
    'landing.reduceWasteDesc': '通过减少食物浪费来帮助环境并节省金钱。',
    'landing.crossPlatform': '跨平台',
    'landing.crossPlatformDesc': '在网页、iOS和Android上可用，实现无缝同步。',
    'landing.securePrivate': '安全私密',
    'landing.securePrivateDesc': '您的数据安全存储并在所有设备间同步。',
    'landing.downloadTitle': '下载过期提醒',
    'landing.downloadDesc': '获取移动应用程序以获得最佳的通知和离线访问体验。',
    'landing.preferBrowser': '更喜欢在浏览器中使用？',
    'landing.launchWebApp': '启动网页应用',
    'landing.activeUsers': '活跃用户',
    'landing.itemsTracked': '跟踪项目',
    'landing.wasteReduced': '减少食物浪费',
    'landing.appStoreRating': '应用商店评分',
    
    // Dashboard
    'dashboard.recentItems': '最近项目',
    'dashboard.getStarted': '添加您的第一个食品项目以开始跟踪过期日期！',
    
    // Home/Welcome
    'home.welcome': '欢迎回来！',
    'home.categories': '分类',
    
    // Status
    'status.fresh': '新鲜',
    'status.expiring': '即将过期',
    'status.expired': '已过期',
    'status.items': '项目',
    'status.loading': '加载中...',
    'status.error': '错误',
    'status.retry': '重试',
    'status.refresh': '刷新',
    'status.viewAll': '查看全部',
    'status.noItems': '未找到{status}项目',
    'status.itemsStored': '项目已存储',
    'status.total': '总计',
    
    // Items
    'item.quantity': '数量',
    'item.expirestoday': '今天过期',
    'item.dayLeft': '天剩余',
    'item.daysLeft': '天剩余',
    'item.dayAgo': '天前',
    'item.daysAgo': '天前',
    
    // Actions
    'action.add': '添加',
    'action.edit': '编辑',
    'action.delete': '删除',
    
    // Alerts
    'alert.deleteMessage': '您确定要删除吗',
    'alert.success': '成功',
    'alert.deleteFailed': '删除项目失败',
    
    // Form
    'form.itemName': '项目',
    
    // Lists
    'list.noItems': '未找到项目。添加一些项目以开始！',
    
    // Cleanup
    'cleanup.confirmMessage': '您确定要清理过期项目吗？',
    'cleanup.success': '清理成功完成',
    'cleanup.failed': '清理过期项目失败',
    'cleanup.itemsDeleted': '项目已删除',
    'cleanup.cleanupExpired': '清理过期',
    'cleanup.inProgress': '清理中...',
    
    // Categories
    'categories.title': '分类',
    'categories.addNew': '添加新分类',
    'categories.name': '分类名称',
    'categories.description': '描述',
    'categories.icon': '图标',
    'categories.color': '颜色',
    'categories.delete': '删除分类',
    'categories.deleteConfirm': '您确定要删除此分类吗？',
    'categories.edit': '编辑分类',
    'categories.save': '保存分类',
    'categories.cancel': '取消',
    'categories.noCategories': '未找到分类。添加您的第一个分类以开始！',
    'categories.preview': '预览',
    
    // Locations
    'locations.title': '存储位置',
    'locations.addNew': '添加新位置',
    'locations.name': '位置名称',
    'locations.description': '描述',
    'locations.temperature': '温度',
    'locations.room': '室温',
    'locations.refrigerated': '冷藏',
    'locations.frozen': '冷冻',
    'locations.delete': '删除位置',
    'locations.deleteConfirm': '您确定要删除此位置吗？',
    'locations.edit': '编辑位置',
    'locations.save': '保存位置',
    'locations.cancel': '取消',
    'locations.noLocations': '未找到位置。添加您的第一个存储位置以开始！',
    
    // Food Items
    'foodItems.title': '食品项目',
    'foodItems.addNew': '添加新项目',
    'foodItems.name': '项目名称',
    'foodItems.category': '分类',
    'foodItems.location': '存储位置',
    'foodItems.expiryDate': '过期日期',
    'foodItems.quantity': '数量',
    'foodItems.notes': '备注',
    'foodItems.reminderDays': '提醒天数',
    'foodItems.save': '保存项目',
    'foodItems.cancel': '取消',
    'foodItems.edit': '编辑项目',
    'foodItems.delete': '删除项目',
    'foodItems.deleteConfirm': '您确定要删除此项目吗？',
    'foodItems.noItems': '未找到食品项目。添加您的第一个项目以开始跟踪！',
    
    // Common
    'common.save': '保存',
    'common.cancel': '取消',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.add': '添加',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.confirm': '确认',
    'common.close': '关闭',
    'common.created': '已创建',
    
    // Validation
    'validation.required': '此字段为必填项',
    'validation.nameRequired': '名称为必填项',
    'validation.categoryRequired': '分类为必填项',
    'validation.locationRequired': '位置为必填项',
    'validation.dateRequired': '日期为必填项',
    'validation.quantityRequired': '数量为必填项',
    
    // Auth
    'auth.login': '登录',
    'auth.logout': '登出',
    'auth.demo': '演示模式',
    'auth.signIn': '登录',
    'auth.signUp': '注册',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.confirmPassword': '确认密码',
    'auth.displayName': '显示名称',
    'auth.forgotPassword': '忘记密码？',
    'auth.createAccount': '创建账户',
    'auth.alreadyHaveAccount': '已有账户？',
    'auth.dontHaveAccount': '没有账户？',
  },
  ja: {
    // Navigation
    'nav.dashboard': 'ダッシュボード',
    'nav.addItem': 'アイテム追加',
    'nav.locations': '場所',
    'nav.categories': 'カテゴリ',
    'nav.logout': 'ログアウト',
    
    // Landing Page
    'landing.title': '食品を無駄にしないスマートアプリ',
    'landing.subtitle': 'キッチンのためのスマート賞味期限追跡。食品が期限切れになる前に通知を受け取り、食品廃棄を減らしてお金を節約しましょう。',
    'landing.getStarted': '始める',
    'landing.learnMore': '詳細を見る',
    'landing.smartAlerts': 'スマートアラート',
    'landing.whyChoose': 'なぜExpiry Alertを選ぶのか？',
    'landing.smartTracking': 'スマート追跡',
    'landing.smartTrackingDesc': '直感的なインターフェースですべての食品の賞味期限を簡単に追跡できます。',
    'landing.timelyAlerts': 'タイムリーアラート',
    'landing.timelyAlertsDesc': '食品が期限切れになる前に通知を受け取り、時間内に使用できます。',
    'landing.visualDashboard': 'ビジュアルダッシュボード',
    'landing.visualDashboardDesc': 'カラーコード化されたステータスインジケーターで在庫を一目で確認できます。',
    'landing.reduceWaste': '廃棄削減',
    'landing.reduceWasteDesc': '食品廃棄を減らして環境を守り、お金を節約しましょう。',
    'landing.crossPlatform': 'クロスプラットフォーム',
    'landing.crossPlatformDesc': 'ウェブ、iOS、Androidで利用可能でシームレスな同期を実現。',
    'landing.securePrivate': 'セキュアでプライベート',
    'landing.securePrivateDesc': 'あなたのデータは安全に保存され、すべてのデバイス間で同期されます。',
    'landing.downloadTitle': 'Expiry Alertをダウンロード',
    'landing.downloadDesc': '通知とオフラインアクセスの最高の体験のためにモバイルアプリを入手してください。',
    'landing.preferBrowser': 'ブラウザでの使用を希望しますか？',
    'landing.launchWebApp': 'ウェブアプリを起動',
    'landing.activeUsers': 'アクティブユーザー',
    'landing.itemsTracked': '追跡アイテム',
    'landing.wasteReduced': '食品廃棄削減',
    'landing.appStoreRating': 'App Store評価',
    
    // Dashboard
    'dashboard.recentItems': '最近のアイテム',
    'dashboard.getStarted': '最初の食品アイテムを追加して賞味期限の追跡を始めましょう！',
    
    // Home/Welcome
    'home.welcome': 'おかえりなさい！',
    'home.categories': 'カテゴリ',
    
    // Status
    'status.fresh': '新鮮',
    'status.expiring': '期限間近',
    'status.expired': '期限切れ',
    'status.items': 'アイテム',
    'status.loading': '読み込み中...',
    'status.error': 'エラー',
    'status.retry': '再試行',
    'status.refresh': '更新',
    'status.viewAll': 'すべて表示',
    'status.noItems': '{status}アイテムが見つかりません',
    'status.itemsStored': 'アイテムが保存されました',
    'status.total': '合計',
    
    // Items
    'item.quantity': '数量',
    'item.expirestoday': '今日期限',
    'item.dayLeft': '日残り',
    'item.daysLeft': '日残り',
    'item.dayAgo': '日前',
    'item.daysAgo': '日前',
    
    // Actions
    'action.add': '追加',
    'action.edit': '編集',
    'action.delete': '削除',
    
    // Alerts
    'alert.deleteMessage': '削除してもよろしいですか',
    'alert.success': '成功',
    'alert.deleteFailed': 'アイテムの削除に失敗しました',
    
    // Form
    'form.itemName': 'アイテム',
    
    // Lists
    'list.noItems': 'アイテムが見つかりません。始めるためにアイテムを追加してください！',
    
    // Cleanup
    'cleanup.confirmMessage': '期限切れアイテムをクリーンアップしてもよろしいですか？',
    'cleanup.success': 'クリーンアップが正常に完了しました',
    'cleanup.failed': '期限切れアイテムのクリーンアップに失敗しました',
    'cleanup.itemsDeleted': 'アイテムが削除されました',
    'cleanup.cleanupExpired': '期限切れをクリーンアップ',
    'cleanup.inProgress': 'クリーンアップ中...',
    
    // Categories
    'categories.title': 'カテゴリ',
    'categories.addNew': '新しいカテゴリを追加',
    'categories.name': 'カテゴリ名',
    'categories.description': '説明',
    'categories.icon': 'アイコン',
    'categories.color': '色',
    'categories.delete': 'カテゴリを削除',
    'categories.deleteConfirm': 'このカテゴリを削除してもよろしいですか？',
    'categories.edit': 'カテゴリを編集',
    'categories.save': 'カテゴリを保存',
    'categories.cancel': 'キャンセル',
    'categories.noCategories': 'カテゴリが見つかりません。最初のカテゴリを追加して始めましょう！',
    'categories.preview': 'プレビュー',
    
    // Locations
    'locations.title': '保存場所',
    'locations.addNew': '新しい場所を追加',
    'locations.name': '場所名',
    'locations.description': '説明',
    'locations.temperature': '温度',
    'locations.room': '室温',
    'locations.refrigerated': '冷蔵',
    'locations.frozen': '冷凍',
    'locations.delete': '場所を削除',
    'locations.deleteConfirm': 'この場所を削除してもよろしいですか？',
    'locations.edit': '場所を編集',
    'locations.save': '場所を保存',
    'locations.cancel': 'キャンセル',
    'locations.noLocations': '場所が見つかりません。最初の保存場所を追加して始めましょう！',
    
    // Food Items
    'foodItems.title': '食品アイテム',
    'foodItems.addNew': '新しいアイテムを追加',
    'foodItems.name': 'アイテム名',
    'foodItems.category': 'カテゴリ',
    'foodItems.location': '保存場所',
    'foodItems.expiryDate': '賞味期限',
    'foodItems.quantity': '数量',
    'foodItems.notes': 'メモ',
    'foodItems.reminderDays': 'リマインダー日数',
    'foodItems.save': 'アイテムを保存',
    'foodItems.cancel': 'キャンセル',
    'foodItems.edit': 'アイテムを編集',
    'foodItems.delete': 'アイテムを削除',
    'foodItems.deleteConfirm': 'このアイテムを削除してもよろしいですか？',
    'foodItems.noItems': '食品アイテムが見つかりません。最初のアイテムを追加して追跡を始めましょう！',
    
    // Common
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.edit': '編集',
    'common.delete': '削除',
    'common.add': '追加',
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.success': '成功',
    'common.confirm': '確認',
    'common.close': '閉じる',
    'common.created': '作成済み',
    
    // Validation
    'validation.required': 'このフィールドは必須です',
    'validation.nameRequired': '名前は必須です',
    'validation.categoryRequired': 'カテゴリは必須です',
    'validation.locationRequired': '場所は必須です',
    'validation.dateRequired': '日付は必須です',
    'validation.quantityRequired': '数量は必須です',
    
    // Auth
    'auth.login': 'ログイン',
    'auth.logout': 'ログアウト',
    'auth.demo': 'デモモード',
    'auth.signIn': 'サインイン',
    'auth.signUp': 'サインアップ',
    'auth.email': 'メール',
    'auth.password': 'パスワード',
    'auth.confirmPassword': 'パスワード確認',
    'auth.displayName': '表示名',
    'auth.forgotPassword': 'パスワードを忘れましたか？',
    'auth.createAccount': 'アカウントを作成',
    'auth.alreadyHaveAccount': 'すでにアカウントをお持ちですか？',
    'auth.dontHaveAccount': 'アカウントをお持ちでないですか？',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = localStorage.getItem('app_language');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh' || savedLanguage === 'ja')) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
      setLanguage('en'); // Fallback to English
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      localStorage.setItem('app_language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
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