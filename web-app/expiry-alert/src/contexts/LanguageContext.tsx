import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'zh' | 'ja';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.dashboard': { en: 'Dashboard', zh: '仪表板', ja: 'ダッシュボード' },
  'nav.addItem': { en: 'Add Item', zh: '添加项目', ja: 'アイテム追加' },
  'nav.locations': { en: 'Locations', zh: '位置', ja: 'ロケーション' },
  'nav.categories': { en: 'Categories', zh: '分类', ja: 'カテゴリ' },
  'nav.logout': { en: 'Logout', zh: '登出', ja: 'ログアウト' },
  
  // Dashboard
  'dashboard.title': { en: 'Food Inventory Dashboard', zh: '食品库存仪表板', ja: '食品在庫ダッシュボード' },
  'dashboard.subtitle': { en: 'Track your food items and reduce waste', zh: '跟踪您的食品并减少浪费', ja: '食材を管理して廃棄を削減' },
  'dashboard.totalItems': { en: 'Total Items', zh: '总项目', ja: '総アイテム数' },
  'dashboard.freshItems': { en: 'Fresh Items', zh: '新鲜物品', ja: '新鮮アイテム' },
  'dashboard.expiringSoon': { en: 'Expiring Soon', zh: '即将过期', ja: '期限間近' },
  'dashboard.expiredItems': { en: 'Expired Items', zh: '已过期项目', ja: '期限切れアイテム' },
  
  // Status
  'status.fresh': { en: 'Fresh', zh: '新鲜', ja: '新鮮' },
  'status.expiringSoon': { en: 'Expiring Soon', zh: '即将过期', ja: '期限間近' },
  'status.expired': { en: 'Expired', zh: '已过期', ja: '期限切れ' },
  
  // Time
  'time.expiresIn': { en: 'days left', zh: '天剩余', ja: '日残り' },
  'time.expiresAt': { en: 'Expires', zh: '过期时间', ja: '賞味期限' },
  'time.overdue': { en: 'days overdue', zh: '天逾期', ja: '日経過' },
  'time.expirestoday': { en: 'Expires today', zh: '今天过期', ja: '今日期限' },
  'time.expirestomorrow': { en: 'Expires tomorrow', zh: '明天过期', ja: '明日期限' },
  
  // Actions
  'action.edit': { en: 'Edit', zh: '编辑', ja: '編集' },
  'action.delete': { en: 'Delete', zh: '删除', ja: '削除' },
  'action.addFood': { en: 'Add Food Item', zh: '添加食品', ja: '食材追加' },
  'action.addLocation': { en: 'Add Location', zh: '添加位置', ja: 'ロケーション追加' },
  'action.addCategory': { en: 'Add Category', zh: '添加分类', ja: 'カテゴリ追加' },
  'action.cleanup': { en: 'Cleanup Expired', zh: '清理过期', ja: '期限切れを整理' },
  
  // Quick Actions
  'quickActions.title': { en: 'Quick Actions', zh: '快速操作', ja: 'クイックアクション' },
  
  // Recent Items
  'recent.title': { en: 'Recent Food Items', zh: '最近食品', ja: '最近の食材' },
  'recent.viewAll': { en: 'View All', zh: '查看全部', ja: 'すべて表示' },
  
  // Priority Alerts
  'alerts.title': { en: 'Priority Alerts', zh: '优先警报', ja: '優先アラート' },
  'alerts.itemsExpired': { en: 'item(s) have expired', zh: '项目已过期', ja: 'アイテムが期限切れ' },
  'alerts.itemsExpiring': { en: 'item(s) expiring soon', zh: '项目即将过期', ja: 'アイテムが期限間近' },
  
  // Confirmation
  'confirm.delete': { en: 'Are you sure you want to delete', zh: '您确定要删除', ja: '削除してもよろしいですか' },
  'confirm.deleted': { en: 'Deleted', zh: '已删除', ja: '削除しました' },
  'confirm.demoMode': { en: '(Demo mode)', zh: '（演示模式）', ja: '（デモモード）' },
  
  // Loading
  'loading.inventory': { en: 'Loading your food inventory...', zh: '正在加载您的食品库存...', ja: '食品在庫を読み込み中...' },
  
  // Landing Page
  'landing.title': { en: 'Never Let Food Go to Waste Again', zh: '再也不让食物浪费', ja: '食材を無駄にしない' },
  'landing.subtitle': { en: 'Track expiry dates, get smart notifications, and reduce food waste with our intelligent food management system.', zh: '跟踪保质期，获得智能通知，通过我们的智能食品管理系统减少食品浪费。', ja: '賞味期限を追跡し、スマート通知を受け取り、インテリジェントな食品管理システムで食品ロスを削減。' },
  'landing.getStarted': { en: 'Get Started Free', zh: '免费开始', ja: '無料で始める' },
  'landing.learnMore': { en: 'Learn More', zh: '了解更多', ja: '詳細を見る' }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation key "${key}" not found`);
      return key;
    }
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
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