@echo off
echo 🔥 Firebase Setup Script for Expiry Alert
echo ==========================================

echo.
echo Step 1: Login to Firebase
npx firebase login

echo.
echo Step 2: Initialize Firebase Project
npx firebase init

echo.
echo Step 3: Build React App
npm run build

echo.
echo Step 4: Deploy to Firebase
npx firebase deploy

echo.
echo ✅ Setup Complete!
echo Your app will be available at: https://expiry-alert-9c004.web.app

pause 