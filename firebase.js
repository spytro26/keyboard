import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const firebaseConfig = {
    apiKey: "AIzaSyA1AhcHvYfeAClJEIssiSssEbnpKifeQ-8",
    authDomain: "enzo-d373f.firebaseapp.com",
    projectId: "enzo-d373f",
    storageBucket: "enzo-d373f.firebasestorage.app",
    messagingSenderId: "553571608389",
    appId: "1:553571608389:web:1059436d6512bd5fa8402c",
};

// Initialize modular SDK
let app;
let auth;

if (getApps().length === 0) {
    // First time initialization
    app = initializeApp(firebaseConfig);
    // Initialize Auth with AsyncStorage persistence for React Native
    // This ensures user stays logged in after app restart
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} else {
    // App already initialized (hot reload case)
    app = getApp();
    auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;