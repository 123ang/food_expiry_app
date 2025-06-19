# Food Expiry Tracker - Mobile App

![App Logo](./assets/icon.png)

## Overview

Food Expiry Tracker is a React Native mobile application that helps users track food expiration dates to reduce waste and save money. This repository contains the mobile app implementation built with Expo.

## Features

- **Track Food Items**: Add, edit, and manage food items with expiration dates
- **Smart Organization**: Categorize by food type and storage location
- **Visual Calendar**: See when items expire in a calendar view
- **Notifications**: Get reminders before food expires
- **Multilingual**: Full support for English, Thai, Chinese, Malay, and Japanese
- **Photo Capture**: Add photos to easily identify items
- **Dark/Light Theme**: Comfortable viewing in any environment
- **Offline-First**: Works without internet connection

## Tech Stack

- **React Native**: Cross-platform mobile framework
- **Expo**: Development and deployment tooling
- **SQLite**: Local database storage
- **Context API**: State management
- **React Navigation**: Navigation system
- **Expo Image Picker**: Camera and gallery integration
- **Expo Notifications**: Local notifications

## Project Structure

- `/app`: Main application screens using Expo Router
- `/assets`: Images, icons and other static assets
- `/components`: Reusable UI components
- `/context`: React Context providers for state management
- `/database`: SQLite database setup and repositories
- `/hooks`: Custom React hooks
- `/services`: Business logic and services
- `/translations`: Language files for multilingual support
- `/utils`: Utility functions and helpers

## Development Setup

1. **Prerequisites**:
   - Node.js (v16+)
   - npm or yarn
   - Expo CLI (`npm install -g expo-cli`)
   - Android Studio or Xcode (for emulators)

2. **Installation**:
   ```bash
   # Clone the repository
   git clone [repository-url]
   
   # Navigate to project directory
   cd FoodExpiryApp
   
   # Install dependencies
   npm install
   # or
   yarn install
   ```

3. **Running the App**:
   ```bash
   # Start the development server
   npx expo start
   
   # Run on iOS simulator
   npx expo run:ios
   
   # Run on Android emulator
   npx expo run:android
   ```

## Building for Production

1. **Android**:
   ```bash
   eas build -p android --profile production
   ```

2. **iOS**:
   ```bash
   eas build -p ios --profile production
   ```

## Recent Improvements

### Enhanced Multilingual System
- **Translation Key Architecture**: Categories and locations now use translation keys instead of storing translated text
- **Efficient Language Switching**: No database rewrites when changing languages
- **Complete Translations**: Full support for all UI elements in all languages

### Performance Optimizations
- **Targeted Cache Invalidation**: Only refreshes necessary data when language changes
- **Reduced Startup Time**: Optimized database initialization
- **Efficient Image Handling**: Better compression and storage

### User Experience Enhancements
- **Quick Setup Themes**: Intelligent detection of existing categories prevents duplicates
- **Improved Category Management**: Better organization of food types
- **Enhanced Calendar View**: More intuitive display of expiring items

## Contributing

We welcome contributions to improve the Food Expiry Tracker app! Please feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.