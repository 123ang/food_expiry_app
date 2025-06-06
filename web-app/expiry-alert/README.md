# 🍎 Expiry Alert - Food Expiry Tracker

Never let food expire again! Smart expiry tracking for your kitchen with intelligent notifications and comprehensive food management features.

## ✨ Features

### 🔔 Smart Notifications
- **Push Notifications**: Get browser notifications when items are about to expire
- **Customizable Alerts**: Set reminder days (1-7 days before expiry)
- **Smart Timing**: Notifications for expiring today, soon, or already expired items
- **Test Notifications**: Send test notifications to verify everything works

### 🔍 Advanced Search & Filtering
- **Real-time Search**: Search items by name or notes
- **Filter by Category**: View items from specific food categories
- **Filter by Location**: See items stored in particular locations
- **Advanced Sorting**: Sort by name, expiry date, category, location, or date added
- **View Modes**: Switch between grid and list views

### 📋 Bulk Operations
- **Multi-select**: Select multiple items at once
- **Bulk Delete**: Delete multiple items simultaneously
- **Select All**: Quick selection of all visible items
- **Batch Actions**: Perform actions on multiple items efficiently

### 🏷️ Smart Organization
- **Categories**: Organize food by type (Fruits, Vegetables, Dairy, etc.)
- **Locations**: Track where items are stored (Fridge, Freezer, Pantry, etc.)
- **Custom Icons**: Visual icons for easy identification
- **Color Coding**: Status-based color coding for quick assessment
- **Image Upload**: Save photos of food items using Google Drive integration

### 📱 Progressive Web App (PWA)
- **Offline Support**: Works without internet connection
- **Install as App**: Add to home screen on mobile devices
- **Fast Loading**: Optimized performance with lazy loading
- **Responsive Design**: Works perfectly on all devices

### 🛡️ Enhanced Error Handling
- **Error Boundaries**: Graceful error handling with recovery options
- **Toast Notifications**: Modern, non-intrusive feedback messages
- **Loading States**: Clear feedback during operations
- **Retry Mechanisms**: Easy recovery from failed operations

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd expiry-alert
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Firebase Hosting (optional)
   - Copy your Firebase config to `src/firebase.ts`

4. **Environment Configuration**
   - Update the Firebase configuration in `src/firebase.ts`
   - For push notifications, add your VAPID key to `src/services/notificationService.ts`
   - For image uploads, set up Google Drive integration (see `GOOGLE_DRIVE_INTEGRATION.md`)

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Allow notification permissions for full functionality

## 🔧 Configuration

### Firebase Setup
Update `src/firebase.ts` with your Firebase project configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### Push Notifications
To enable push notifications:

1. Generate VAPID keys in Firebase Console → Project Settings → Cloud Messaging
2. Update `VAPID_KEY` in `src/services/notificationService.ts`
3. Configure Firebase Cloud Messaging (optional for server-sent notifications)

## 📖 Usage Guide

### Adding Food Items
1. Click "➕ Add Item" from the dashboard
2. Fill in item details (name, expiry date, category, location, quantity)
3. Set reminder days (default: 3 days before expiry)
4. Save the item

### Managing Categories & Locations
- **Categories**: Create custom food categories with icons and colors
- **Locations**: Set up storage locations where you keep food
- **Icons**: Choose from a variety of emojis for visual identification

### Search & Filter
- **Search Bar**: Type to search items by name or notes
- **Category Filter**: Select a category to view only those items
- **Location Filter**: Filter by storage location
- **Sort Options**: Sort by expiry date, name, category, or location
- **View Toggle**: Switch between grid and list views

### Bulk Operations
1. Select items using checkboxes
2. Use "Select All" to select all visible items
3. Click "Delete Selected" to remove multiple items
4. Clear selection when done

### Notifications
1. Go to ⚙️ Settings
2. Enable notification permissions
3. Configure alert preferences
4. Test notifications to ensure they work
5. Adjust reminder days as needed

## 🏗️ Architecture

### Frontend Stack
- **React 19** with TypeScript
- **React Router 7** for navigation
- **React Hot Toast** for notifications
- **CSS3** with custom styling
- **Progressive Web App** features

### Backend & Database
- **Firebase Authentication** for user management
- **Cloud Firestore** for data storage
- **Firebase Hosting** for deployment
- **Firebase Cloud Messaging** for push notifications

### Key Components
- **Dashboard**: Main interface with search, filter, and item management
- **Settings**: Notification preferences and app configuration
- **Error Boundary**: Graceful error handling
- **Notification Service**: Browser push notification management
- **Firestore Service**: Database operations and data management

## 🔐 Security & Privacy

- **User Authentication**: Secure email/password authentication
- **Data Isolation**: Each user's data is completely separate
- **Client-side Validation**: Input validation and sanitization
- **Error Boundaries**: Prevent crashes from affecting user data
- **Privacy Policy**: Comprehensive privacy protection

## 🌐 Browser Support

### Supported Browsers
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### Features by Browser
- **Push Notifications**: Chrome, Firefox, Edge (full support)
- **Service Worker**: All modern browsers
- **PWA Installation**: Chrome, Edge, Firefox
- **Offline Mode**: All supported browsers

## 📱 Mobile Experience

- **Responsive Design**: Optimized for all screen sizes
- **Touch-friendly**: Large buttons and touch targets
- **PWA Installation**: Install as native app
- **Offline Support**: Works without internet
- **Fast Performance**: Optimized loading and interactions

## 🚀 Deployment

### Firebase Hosting
```bash
# Build the project
npm run build

# Deploy to Firebase
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Other Hosting Platforms
The built files in the `build/` directory can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Add/edit/delete food items
- [ ] Search and filtering functionality
- [ ] Bulk operations
- [ ] Notification permissions and alerts
- [ ] Category and location management
- [ ] Responsive design on mobile
- [ ] PWA installation
- [ ] Offline functionality

### Running Tests
```bash
npm test
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add proper error handling
- Include responsive design considerations
- Test on multiple browsers
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Contact support at support@expiryalert.com

## 🎯 Roadmap

### Upcoming Features
- [ ] Barcode scanning for easy item entry
- [ ] Recipe suggestions for expiring items
- [ ] Shopping list generation
- [ ] Export data functionality
- [ ] Multi-language support expansion
- [ ] Mobile app versions (iOS/Android)
- [ ] Integration with grocery stores
- [ ] AI-powered expiry predictions

## 📊 Analytics & Performance

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: Optimized with code splitting

### Monitoring
- Error boundaries catch and report issues
- Performance monitoring with Web Vitals
- User experience tracking
- Notification delivery rates

## 🌟 Acknowledgments

- Icons provided by emoji sets
- Firebase for backend infrastructure
- React community for excellent libraries
- All contributors and testers

---

**Made with ❤️ for reducing food waste and saving money!**

*Help us fight food waste one notification at a time.* 🌱
