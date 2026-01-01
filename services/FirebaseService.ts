
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { BackupData } from '../types';

const getFirebaseConfig = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('lifeos_firebase_config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse stored firebase config", e);
      }
    }
  }
  
  return {
    apiKey: "AIzaSyBVij7Op3syRyNkf74dywyepxnQ1Y94ers",
    authDomain: "lifeos-c12c6.firebaseapp.com",
    projectId: "lifeos-c12c6",
    storageBucket: "lifeos-c12c6.firebasestorage.app",
    messagingSenderId: "930274272186",
    appId: "1:930274272186:web:d45482df340e67bf8fb383",
    measurementId: "G-VQ3KXPQPT2"
  };
};

const firebaseConfig = getFirebaseConfig();

// Initialize App dynamically
let app: any;
let auth: any;
let db: any;
let provider: any;
let analytics: any;

const initializeFirebase = () => {
  if (!firebaseConfig) return;

  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    try {
      app = initializeApp(firebaseConfig);
      // Initialize analytics if supported
      if (typeof window !== 'undefined') {
          try {
              analytics = getAnalytics(app);
          } catch(e) {
              console.warn("Firebase Analytics not supported in this environment");
          }
      }
    } catch (e) {
      console.error("Firebase init failed", e);
    }
  }

  if (app) {
    try {
      auth = getAuth(app);
      db = getFirestore(app);
      provider = new GoogleAuthProvider();

      // Enable offline persistence (Web)
      enableIndexedDbPersistence(db).catch((err) => {
          if (err.code == 'failed-precondition') {
              console.log('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
          } else if (err.code == 'unimplemented') {
              console.log('The current browser does not support all of the features required to enable persistence');
          }
      });
    } catch(e) {
      console.warn("Firebase services init failed (persistence or other)", e);
    }
  }
};

initializeFirebase();

export const FirebaseService = {
  auth,
  db,
  currentUser: null as User | null,

  /**
   * Check if configured
   */
  isConfigured: (): boolean => {
    return !!auth;
  },

  /**
   * Save custom configuration
   */
  saveConfiguration: (config: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifeos_firebase_config', JSON.stringify(config));
      window.location.reload();
    }
  },

  /**
   * Initialize and listen for auth changes
   */
  init: (onUserChange: (user: User | null) => void) => {
    if (!auth) return () => {};
    
    return onAuthStateChanged(auth, (user: User | null) => {
      FirebaseService.currentUser = user;
      onUserChange(user);
    });
  },

  /**
   * Sign in with Google Popup
   */
  signIn: async (): Promise<User> => {
    if (!auth) throw new Error("Firebase not configured");
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
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Firebase Sign Out Error:", error);
      throw error;
    }
  },

  /**
   * Save Data to Firestore (Auto Backup)
   * Path: users/{uid}
   */
  saveUserData: async (data: BackupData): Promise<void> => {
    if (!auth || !auth.currentUser) return;

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userRef, { 
        backupData: data, 
        lastUpdated: new Date().toISOString(),
        device: navigator.userAgent
      }, { merge: true });
      console.log("Data synced to Cloud Firestore");
    } catch (error) {
      console.error("Error saving data:", error);
      throw error;
    }
  },

  /**
   * Subscribe to Data Changes (Real-time Sync)
   */
  subscribeToUserData: (onDataReceived: (data: BackupData) => void) => {
    if (!auth || !auth.currentUser) return () => {};

    const userRef = doc(db, "users", auth.currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      // metadata.hasPendingWrites is true if the event is from a local write.
      if (docSnap.metadata.hasPendingWrites) {
        return;
      }

      if (docSnap.exists()) {
        const content = docSnap.data();
        if (content && content.backupData) {
          console.log("Received update from cloud");
          onDataReceived(content.backupData as BackupData);
        }
      }
    });

    return unsubscribe;
  }
};

export type { User };