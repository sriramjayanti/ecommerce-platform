import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Your web app's Firebase configuration provided by Firebase Console
export const firebaseConfig = {
  apiKey: "AIzaSyCVaoX7wj6r1kubGQiEEBzlAG_FJEa7r8U",
  authDomain: "dailyfresh-wholesale-mart.firebaseapp.com",
  projectId: "dailyfresh-wholesale-mart",
  storageBucket: "dailyfresh-wholesale-mart.firebasestorage.app",
  messagingSenderId: "519957366977",
  appId: "1:519957366977:web:fa5077020c74638d0f6c40"
};

// Safe initialization supporting client-side Vite builds, hot reload, and SSR
export const firebaseApp: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(firebaseApp);
export const firestore: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);

export default firebaseApp;
