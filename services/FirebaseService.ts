
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { BackupData } from '../types';

const CONFIG_STORAGE_KEY = 'lifeos_firebase_config';

// 1. Try to get config from LocalStorage
const getStoredConfig = () => {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

// 2. Default Placeholder (or load from Env if available)
const defaultBufferConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 3. Initialize with best available config
const activeConfig = getStoredConfig() || defaultBufferConfig;
const app = initializeApp(activeConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export const FirebaseService = {
  auth,
  db,
  currentUser: null as User | null,

  /**
   * Check if the current configuration is valid (not placeholder)
   */
  isConfigured: (): boolean => {
    return activeConfig.apiKey !== "YOUR_API_KEY_HERE";
  },

  /**
   * Save new configuration and reload app
   */
  saveConfiguration: (config: any) => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    window.location.reload(); // Reload to re-initialize Firebase with new keys
  },

  /**
   * Initialize and listen for auth changes
   */
  init: (onUserChange: (user: User | null) => void) => {
    return onAuthStateChanged(auth, (user) => {
      FirebaseService.currentUser = user;
      onUserChange(user);
    });
  },

  /**
   * Sign in with Google Popup
   */
  signIn: async (): Promise<User> => {
    if (!FirebaseService.isConfigured()) {
        throw new Error("FIREBASE_CONFIG_MISSING");
    }

    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Firebase Sign In Error:", error);
      throw error;
    }
  },

  /**
   * Sign Out
   */
  signOut: async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Firebase Sign Out Error:", error);
      throw error;
    }
  },

  /**
   * Save Data to Firestore (Auto Backup)
   */
  saveUserData: async (data: BackupData): Promise<void> => {
    if (!auth.currentUser || !FirebaseService.isConfigured()) return;

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userRef, { 
        data, 
        updatedAt: Date.now(),
        email: auth.currentUser.email 
      }, { merge: true });
      console.log("Data saved to Firestore");
    } catch (error) {
      console.error("Error saving data:", error);
      throw error;
    }
  },

  /**
   * Subscribe to Data Changes (Real-time Sync)
   */
  subscribeToUserData: (onDataReceived: (data: BackupData) => void) => {
    if (!auth.currentUser || !FirebaseService.isConfigured()) return () => {};

    const userRef = doc(db, "users", auth.currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.metadata.hasPendingWrites) return;

      if (docSnap.exists()) {
        const remoteData = docSnap.data().data as BackupData;
        if (remoteData) {
          console.log("Received update from cloud");
          onDataReceived(remoteData);
        }
      }
    });

    return unsubscribe;
  }
};

export type { User };
