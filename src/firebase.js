import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const runtimeConfig =
  typeof window !== 'undefined' && window.__firebase_config
    ? JSON.parse(window.__firebase_config)
    : {};

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || runtimeConfig.apiKey || 'YOUR_API_KEY',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || runtimeConfig.authDomain || 'YOUR_PROJECT.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || runtimeConfig.projectId || 'YOUR_PROJECT_ID',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || runtimeConfig.storageBucket || 'YOUR_PROJECT.appspot.com',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    runtimeConfig.messagingSenderId ||
    'YOUR_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || runtimeConfig.appId || 'YOUR_APP_ID',
};

export const hasFirebaseConfig =
  firebaseConfig.apiKey !== 'YOUR_API_KEY' && firebaseConfig.projectId !== 'YOUR_PROJECT_ID';

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
