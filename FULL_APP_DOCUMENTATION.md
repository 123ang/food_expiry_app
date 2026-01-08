# 🍎 Expiry Alert - Food Expiry Tracker

> **Version:** 2.0.0  
> **Bundle ID:** com.expiryalert.app  
> **Platform:** iOS & Android (Cross-platform)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Database Design](#database-design)
6. [UI/UX Design](#uiux-design)
7. [Project Structure](#project-structure)
8. [Services & Business Logic](#services--business-logic)
9. [Internationalization (i18n)](#internationalization-i18n)
10. [Cloud Sync & Authentication](#cloud-sync--authentication)
11. [Notifications](#notifications)
12. [Build & Deployment](#build--deployment)

---

## 📖 Overview

**Expiry Alert** is a comprehensive food expiration tracking mobile application that helps users reduce food waste and save money by monitoring expiration dates of food items. The app provides intelligent categorization, storage location tracking, visual calendars, and proactive expiry notifications.

### Mission Statement
*"Never let food go to waste again! Track expiration dates, organize your pantry, and reduce food waste with our intuitive food management app."*

---

## ✨ Features

### Core Features
| Feature | Description |
|---------|-------------|
| **Food Item Tracking** | Add, edit, and manage food items with expiration dates |
| **Smart Organization** | Categorize items by food type and storage location |
| **Visual Calendar** | Calendar view showing when items expire |
| **Expiry Notifications** | Push notifications before food expires |
| **Photo Capture** | Add photos to easily identify items |
| **Quantity Management** | Track quantity with use/throw away actions |

### Advanced Features
| Feature | Description |
|---------|-------------|
| **Offline-First** | Full functionality without internet connection |
| **Cloud Sync** | Supabase-powered cloud synchronization |
| **Family Groups** | Share inventory with family members |
| **Multi-theme** | 11 customizable color themes |
| **Multilingual** | 5 language support (EN, ZH, JA, TH, MS) |
| **Shopping List** | Integrated shopping list management |
| **Wish List** | Track items you want to buy |
| **Quick Setup Themes** | Pre-configured category templates |

### Status Tracking
- ✅ **In-date** - Fresh items
- ⏰ **Expiring Soon** - Within 3 days of expiry
- ⚠️ **Expired** - Past expiration date

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.79.5 | Cross-platform mobile framework |
| **Expo** | 53.0.20 | Development & deployment tooling |
| **Expo Router** | 5.1.4 | File-based navigation system |
| **TypeScript** | 5.3.3 | Type-safe development |
| **React** | 19.0.0 | UI component library |

### State Management
| Technology | Purpose |
|------------|---------|
| **React Context API** | Global state management |
| **AsyncStorage** | Local key-value storage |
| **Expo SQLite** | Local relational database |

### Backend & Cloud
| Technology | Purpose |
|------------|---------|
| **Supabase** | Authentication, database, cloud sync |
| **PostgreSQL** | Cloud database (via Supabase) |

### UI & Styling
| Technology | Purpose |
|------------|---------|
| **React Native Reanimated** | Smooth animations |
| **React Native Gesture Handler** | Touch interactions |
| **Expo Vector Icons** | Icon library |
| **Custom Typography System** | Language-aware fonts |

### Device Features
| Technology | Purpose |
|------------|---------|
| **Expo Notifications** | Local push notifications |
| **Expo Image Picker** | Camera & gallery access |
| **Expo File System** | Image storage & management |
| **NetInfo** | Network connectivity detection |

---

## 🏗 Architecture

### Application Architecture Pattern
The app follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    UI LAYER (Screens)                   │
│  app/index.tsx, app/list.tsx, app/calendar.tsx, etc.   │
├─────────────────────────────────────────────────────────┤
│                 COMPONENT LAYER                         │
│  components/BottomNav, DatePicker, ImagePicker, etc.   │
├─────────────────────────────────────────────────────────┤
│                  CONTEXT LAYER                          │
│  ThemeContext, LanguageContext, DatabaseContext,       │
│  ApiContext                                            │
├─────────────────────────────────────────────────────────┤
│                 SERVICE LAYER                           │
│  NotificationService, SyncService, InAppPurchase       │
├─────────────────────────────────────────────────────────┤
│                 REPOSITORY LAYER                        │
│  CategoryRepository, LocationRepository,               │
│  FoodItemRepository, ShoppingRepository                │
├─────────────────────────────────────────────────────────┤
│                 DATABASE LAYER                          │
│  SQLite (Local) | Supabase (Cloud)                     │
└─────────────────────────────────────────────────────────┘
```

### Context Providers Hierarchy
```tsx
<ThemeProvider>
  <LanguageProvider>
    <DatabaseProvider>
      <ApiProvider>
        <RootLayoutContent />
      </ApiProvider>
    </DatabaseProvider>
  </LanguageProvider>
</ThemeProvider>
```

---

## 🗄 Database Design

### Local Database (SQLite)

The app uses **Expo SQLite** for local data persistence with the following schema:

#### Core Tables

**users**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supabase_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT DEFAULT CURRENT_TIMESTAMP,
  subscription_type TEXT CHECK (subscription_type IN ('free', 'family')),
  subscription_expires_at TEXT
);
```

**categories**
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,  -- Emoji icon
  translation_key TEXT,  -- For i18n support
  cloud_id TEXT UNIQUE,
  sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'conflict')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**locations**
```sql
CREATE TABLE locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,  -- Emoji icon
  translation_key TEXT,
  cloud_id TEXT UNIQUE,
  sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'conflict')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**food_items**
```sql
CREATE TABLE food_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
  group_id TEXT,  -- For group/family sharing
  cloud_id TEXT UNIQUE,
  expiry_date TEXT NOT NULL,
  reminder_days INTEGER NOT NULL DEFAULT 3,
  notes TEXT,
  image_uri TEXT,
  sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'conflict')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**shopping_items**
```sql
CREATE TABLE shopping_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image_uri TEXT,
  done BOOLEAN NOT NULL DEFAULT 0,
  cloud_id TEXT UNIQUE,
  group_id TEXT,
  sync_status TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**wish_items**
```sql
CREATE TABLE wish_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  notes TEXT,
  price TEXT,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  image_uri TEXT,
  done BOOLEAN NOT NULL DEFAULT 0,
  cloud_id TEXT UNIQUE,
  group_id TEXT,
  sync_status TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### Default Data

**8 Default Categories:**
| Icon | Translation Key | Description |
|------|-----------------|-------------|
| 🥬 | category.vegetables | Vegetables |
| 🍎 | category.fruits | Fruits |
| 🥛 | category.dairy | Dairy Products |
| 🥩 | category.meat | Meat |
| 🍿 | category.snacks | Snacks |
| 🍰 | category.desserts | Desserts |
| 🐟 | category.seafood | Seafood |
| 🍞 | category.bread | Bread & Bakery |

**4 Default Locations:**
| Icon | Translation Key | Description |
|------|-----------------|-------------|
| ❄️ | defaultLocation.fridge | Refrigerator |
| 🧊 | defaultLocation.freezer | Freezer |
| 🏠 | defaultLocation.pantry | Pantry |
| 📦 | defaultLocation.counter | Counter |

### Cloud Database (Supabase/PostgreSQL)

For cloud sync and family sharing, the app uses Supabase with:

**Custom Types:**
```sql
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE plan_type AS ENUM ('free', 'family');
```

**Groups & Memberships:**
- Family groups with max 4 members
- Role-based access (owner, admin, member)
- Invite code system for joining groups

**Subscriptions:**
- Stripe integration for payments
- Family package support
- Subscription status tracking

---

## 🎨 UI/UX Design

### Theme System

The app features **11 customizable themes**:

| Theme | Background | Primary | Description |
|-------|------------|---------|-------------|
| **Original** | #F8F9FA | #2E7D32 | Clean white with dark green |
| **Recycled** | #F3C88B | #2E7D32 | Warm eco-friendly peach |
| **Dark Brown** | #2C2417 | #4CAF50 | Warm dark tones |
| **Black** | #000000 | #4CAF50 | Pure AMOLED black |
| **Blue** | #c1d9e3 | #2d4e68 | Clean blue design |
| **Green** | #dbe1c0 | #2d4e20 | Natural earth tones |
| **Soft Pink** | #fce7dd | #8B5A47 | Warm and cozy |
| **Bright Pink** | #fdd0d4 | #8B3A42 | Vibrant and energetic |
| **Yellow** | #fbfcee | #3971b8 | Warm and bright |
| **Mint-Red** | #d8f2c9 | #d84444 | Fresh mint with red |
| **Dark Gold** | #2c2c2c | #d4a332 | Elegant dark with gold |

### Theme Interface
```typescript
interface Theme {
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  tertiaryColor: string;
  cardBackground: string;
  borderColor: string;
  shadowColor: string;
  textSecondary: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  headerBackground: string;
  gradientPrimary: string[];
  gradientSecondary: string[];
  borderRadius: number;
}
```

### Responsive Design

The app uses a custom responsive hook for tablet/iPad support:

```typescript
const responsive = useResponsive();

// Breakpoints
{
  isSmall: width < 375,
  isMedium: width >= 375 && width < 768,
  isTablet: width >= 768 && width < 1024,
  isLargeTablet: width >= 1024
}

// Grid system adapts:
// - 2 columns on phones
// - 3-4 columns on tablets
// - Larger cards and fonts on tablets
```

### Navigation Structure

**Bottom Navigation:**
- 🏠 Home (Dashboard)
- 📋 List (All Items)
- ➕ Add (Quick Add)
- 📅 Calendar
- ⚙️ Settings

**Screen Hierarchy:**
```
/ (index) - Dashboard
├── /list - All Items List
├── /add - Add New Item
├── /edit/[id] - Edit Item
├── /item/[id] - Item Details
├── /calendar - Calendar View
├── /categories - Category Management
│   └── /categories/[id] - Category Items
├── /locations - Location Management
│   └── /locations/[id] - Location Items
├── /items/[status] - Status Filtered Items
├── /settings - Settings Page
├── /notifications - Notification Settings
├── /clear-items - Bulk Delete
├── /image-recovery - iOS Image Fix
└── /auth
    ├── /login
    └── /signup
```

---

## 📁 Project Structure

```
FoodExpiryApp/
├── app/                      # Expo Router screens
│   ├── _layout.tsx          # Root layout with providers
│   ├── index.tsx            # Dashboard/Home screen
│   ├── list.tsx             # All items list
│   ├── add.tsx              # Add new item form
│   ├── calendar.tsx         # Calendar view
│   ├── settings.tsx         # Settings page
│   ├── notifications.tsx    # Notification settings
│   ├── clear-items.tsx      # Bulk delete screen
│   ├── image-recovery.tsx   # iOS image recovery
│   ├── auth/                # Authentication screens
│   ├── categories/          # Category screens
│   ├── locations/           # Location screens
│   ├── items/               # Status-based item lists
│   ├── item/                # Item detail screen
│   └── edit/                # Edit item screen
│
├── components/               # Reusable UI components
│   ├── BottomNav.tsx        # Bottom navigation bar
│   ├── DatePicker.tsx       # Cross-platform date picker
│   ├── ImagePicker.tsx      # Photo/emoji picker
│   ├── CategoryIcon.tsx     # Category emoji renderer
│   ├── LocationIcon.tsx     # Location emoji renderer
│   ├── LanguageSwitcher.tsx # Language selection
│   ├── ThemeSelector.tsx    # Theme selection
│   ├── ShoppingList.tsx     # Shopping list component
│   ├── WishList.tsx         # Wish list component
│   ├── GroupSelector.tsx    # Family group selector
│   ├── SyncButton.tsx       # Cloud sync button
│   └── ManagementModals.tsx # Edit/Add modals
│
├── context/                  # React Context providers
│   ├── ThemeContext.tsx     # Theme state management
│   ├── LanguageContext.tsx  # Internationalization
│   ├── DatabaseContext.tsx  # Database operations
│   └── ApiContext.tsx       # Supabase API & auth
│
├── database/                 # Database layer
│   ├── database.ts          # SQLite initialization
│   ├── models.ts            # TypeScript interfaces
│   ├── repository.ts        # CRUD operations
│   ├── shoppingRepository.ts# Shopping/Wish list ops
│   └── migrations.ts        # Schema migrations
│
├── services/                 # Business logic services
│   ├── SimpleNotificationService.ts
│   ├── SyncService.ts       # Cloud synchronization
│   ├── SupabaseSyncService.ts
│   └── InAppPurchaseService.ts
│
├── translations/             # Internationalization
│   ├── en.ts                # English
│   ├── zh.ts                # Chinese (Simplified)
│   ├── ja.ts                # Japanese
│   ├── th.ts                # Thai
│   └── ms.ts                # Malay
│
├── theme/                    # Theme definitions
│   └── index.ts             # All theme configurations
│
├── hooks/                    # Custom React hooks
│   ├── useTypography.ts     # Font management
│   ├── useResponsive.ts     # Responsive design
│   └── useNotificationChecker.ts
│
├── utils/                    # Utility functions
│   ├── iconUtils.ts         # Icon helpers
│   └── fileStorage.ts       # Image storage
│
├── constants/                # App constants
│   ├── emojis.ts            # Emoji definitions
│   └── categoryThemes.ts    # Quick setup themes
│
├── styles/                   # Global styles
│   ├── typography.ts        # Font definitions
│   └── fontLoader.ts        # Font loading
│
├── assets/                   # Static assets
│   ├── food_expiry_logo.png
│   ├── food_expiry_logo_adaptive.png
│   └── fonts/
│
├── lib/                      # External library configs
│   └── supabase.ts          # Supabase client
│
└── android/ & ios/           # Native platform files
```

---

## ⚙️ Services & Business Logic

### DatabaseContext

Central hub for all database operations:

```typescript
interface DatabaseContextType {
  // Data
  foodItems: FoodItemWithDetails[];
  categories: Category[];
  locations: Location[];
  dashboardCounts: { fresh: number; expiring_soon: number; expired: number };
  
  // CRUD Operations
  createFoodItem: (item: FoodItem) => Promise<number>;
  updateFoodItem: (item: FoodItem) => Promise<void>;
  deleteFoodItem: (id: number) => Promise<void>;
  createCategory: (category: Category) => Promise<number>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  // ... similar for locations
  
  // Refresh
  refreshAll: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshLocations: () => Promise<void>;
  refreshFoodItems: () => Promise<void>;
  
  // Group-based queries
  getFoodItemsByGroup: (groupId: string) => Promise<FoodItemWithDetails[]>;
}
```

### Repository Pattern

Each data entity has a repository with consistent interface:

```typescript
interface Repository<T> {
  getAll: () => Promise<T[]>;
  getById: (id: number) => Promise<T | null>;
  create: (item: Omit<T, 'id'>) => Promise<number>;
  update: (item: T) => Promise<void>;
  delete: (id: number) => Promise<void>;
}

interface SyncRepository<T> extends Repository<T> {
  getItemsForSync: (groupId: string, lastSyncTime: string) => Promise<T[]>;
  updateSyncStatus: (id: number, status: SyncStatus) => Promise<void>;
  updateFromCloud: (cloudItem: any) => Promise<number>;
  getByCloudId: (cloudId: string) => Promise<T | null>;
}
```

### Database Queue System

Prevents SQLite lock issues with queued operations:

```typescript
class DatabaseQueue {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private static readonly OPERATION_TIMEOUT = 120000;
  
  async add<T>(operation: () => Promise<T>, operationName?: string): Promise<T> {
    // Queue operation with timeout protection
    // Process sequentially to prevent locks
  }
}
```

---

## 🌍 Internationalization (i18n)

### Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| en | English | English |
| zh | Chinese | 中文 |
| ja | Japanese | 日本語 |
| th | Thai | ไทย |
| ms | Malay | Bahasa Melayu |

### Translation System

Uses translation keys stored in database for dynamic content:

```typescript
// Translation lookup
const t = (key: string): string => {
  return translations[language][key] ?? translations.en[key] ?? key;
};

// Category name with translation key
const getCategoryName = (category: { name: string; translationKey?: string }) => {
  if (category.translationKey) {
    return t(category.translationKey);
  }
  return category.name;
};
```

### Translation Key Architecture

Default categories and locations use translation keys:
- Stored in database: `translation_key` column
- No database rewrite needed on language change
- User-created items use literal names

---

## ☁️ Cloud Sync & Authentication

### Supabase Integration

```typescript
interface ApiContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Auth
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Groups
  currentGroup: Group | null;
  userGroups: GroupMembership[];
  createGroup: (name: string, description?: string) => Promise<void>;
  joinGroup: (inviteCode: string) => Promise<void>;
  
  // Sync
  syncToServer: () => Promise<void>;
}
```

### Sync Strategy

1. **Offline-First**: All operations work locally
2. **Background Sync**: Sync when online
3. **Conflict Resolution**: Timestamp-based, newer wins
4. **Sync Status Tracking**: pending → synced → conflict

### Family Groups

- Create personal and family groups
- Share inventory with family members
- Invite via unique invite codes
- Max 4 members per family group

---

## 🔔 Notifications

### Notification Types

| Type | Trigger | Default |
|------|---------|---------|
| **Expiring Today** | Day of expiry | ✅ Enabled |
| **Expiring Soon** | 1-3 days before | ✅ Enabled |
| **Expired** | After expiry | ❌ Disabled |

### Notification Service

```typescript
class SimpleNotificationService {
  async scheduleNotificationForItem(item: FoodItemWithDetails): Promise<void>;
  async checkAllFoodItemsForExpiry(items: FoodItemWithDetails[]): Promise<void>;
  async sendTestNotification(): Promise<void>;
  async cancelAllNotifications(): Promise<void>;
  
  // Settings
  getSettings(): NotificationSettings;
  saveSettings(settings: Partial<NotificationSettings>): Promise<void>;
}
```

### Multilingual Notifications

Notifications are translated based on app language:
- Title and body text
- Category and location names
- Day/days pluralization

---

## 📦 Build & Deployment

### Development

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

### Production Build

**Android:**
```bash
eas build -p android --profile production
```

**iOS:**
```bash
eas build -p ios --profile production
```

### EAS Configuration

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  }
}
```

### App Permissions

**Android:**
- CAMERA
- RECEIVE_BOOT_COMPLETED
- VIBRATE, WAKE_LOCK
- WRITE/READ_EXTERNAL_STORAGE
- POST_NOTIFICATIONS
- INTERNET
- BILLING

**iOS:**
- NSCameraUsageDescription
- NSPhotoLibraryUsageDescription
- NSPhotoLibraryAddUsageDescription
- NSDocumentsFolderUsageDescription

---

## 📊 Data Models

### TypeScript Interfaces

```typescript
interface FoodItem {
  id?: number;
  name: string;
  quantity: number;
  category_id: number | null;
  location_id: number | null;
  group_id: string | null;
  cloud_id: string | null;
  expiry_date: string;
  reminder_days: number;
  notes: string | null;
  image_uri: string | null;
  created_at: string;
  updated_at?: string;
  sync_status?: 'pending' | 'synced' | 'conflict';
}

interface FoodItemWithDetails extends FoodItem {
  id: number;
  category_name: string;
  category_icon: string;
  location_name: string;
  location_icon: string;
  days_until_expiry: number;
  status?: 'expired' | 'expiring_soon' | 'fresh';
}

interface Category {
  id?: number;
  name: string;
  icon: string;
  translationKey?: string;
  cloud_id?: string | null;
  sync_status?: 'pending' | 'synced' | 'conflict';
}

interface Location {
  id?: number;
  name: string;
  icon: string;
  translationKey?: string;
  cloud_id?: string | null;
  sync_status?: 'pending' | 'synced' | 'conflict';
}

interface User {
  id: number;
  supabase_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  subscription_type?: 'free' | 'family';
  subscription_expires_at?: string;
}
```

---

## 🔒 Security

### Data Protection
- Local SQLite encrypted storage
- Supabase Row Level Security (RLS)
- Secure token storage via AsyncStorage

### Privacy
- No tracking or analytics without consent
- Local-first data storage
- Optional cloud sync

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | Current | Cloud sync, family groups, 11 themes |
| 1.1.0 | Previous | Translation key system, performance |
| 1.0.0 | Initial | Core functionality |

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Credits

**Developer:** 123ang  
**Project ID:** cb2a08f8-33c5-4312-8a50-44c6e71f0778

---

*Made with ❤️ for reducing food waste worldwide*

