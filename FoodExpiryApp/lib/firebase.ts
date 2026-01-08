// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// Replace with your own Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Collection names - matching MySQL table names for easier migration
export const COLLECTIONS = {
  USERS: 'users',
  GROUPS: 'groups',
  GROUP_MEMBERSHIPS: 'group_memberships',
  FOOD_ITEMS: 'food_items',
  CATEGORIES: 'categories',
  LOCATIONS: 'locations',
  SHOPPING_ITEMS: 'shopping_items',
  WISH_ITEMS: 'wish_items',
};

// Helper function to generate IDs compatible with both Firebase and MySQL
export const generateId = () => {
  // Generate a UUID-like string that can work in both Firebase and MySQL
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
