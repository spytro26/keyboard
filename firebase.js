import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Also import compat for web compatibility with expo-firebase-recaptcha
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

// Platform detection for web
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const firebaseConfig = {
    apiKey: "AIzaSyA1AhcHvYfeAClJEIssiSssEbnpKifeQ-8",
    authDomain: "enzo-d373f.firebaseapp.com",
    projectId: "enzo-d373f",
    storageBucket: "enzo-d373f.firebasestorage.app",
    messagingSenderId: "553571608389",
    appId: "1:553571608389:web:1059436d6512bd5fa8402c",
};

// Initialize modular SDK (for your app)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize compat SDK for web (for expo-firebase-recaptcha)
if (isWeb && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;