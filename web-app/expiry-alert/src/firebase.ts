// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDb4HJYdGJ1HS-bvvKJsFCY_Lzq063nmu0",
  authDomain: "expiry-alert-9c004.firebaseapp.com",
  projectId: "expiry-alert-9c004",
  storageBucket: "expiry-alert-9c004.firebasestorage.app",
  messagingSenderId: "1059614977887",
  appId: "1:1059614977887:web:fb2d0650d9f5ac613d10ea",
  measurementId: "G-5MGQL3JN13"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 