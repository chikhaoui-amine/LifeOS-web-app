
import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, enableIndexedDbPersistence, collection } from "firebase/firestore";
import { BackupData } from '../types';

const CONFIG_STORAGE_KEY = 'lifeos_firebase_config';

// --- Configuration Management ---

const getStoredConfig = () => {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

// Default placeholder to prevent crash on initial load if no config exists
const defaultBufferConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize App dynamically
let app: any;
let auth: any;
let db: any;
let provider: any;

const initializeFirebase = () => {
  const activeConfig = getStoredConfig() || defaultBufferConfig;
  
  // Prevent re-initialization error
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    app = initializeApp(activeConfig);
  }

  auth = getAuth(app);
  db = getFirestore(app);
  provider = new GoogleAuthProvider();

  // Enable offline persistence (Web)
  // Note: This might fail if multiple tabs are open, so we catch the error silently
  try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
        } else if (err.code == 'unimplemented') {
            console.log('The current browser does not support all of the features required to enable persistence');
        }
    });
  } catch(e) {
    // Ignore environments where persistence isn't supported
  }
};

initializeFirebase();

export const FirebaseService = {
  auth,
  db,
  currentUser: null as User | null,

  /**
   * Check if the current configuration is valid (not placeholder)
   */
  isConfigured: (): boolean => {
    const config = getStoredConfig();
    return config && config.apiKey !== "YOUR_API_KEY_HERE";
  },

  /**
   * Save new configuration and reload app to initialize correctly
   */
  saveConfiguration: (config: any) => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    window.location.reload(); 
  },

  /**
   * Initialize and listen for auth changes
   */
  init: (onUserChange: (user: User | null) => void) => {
    return onAuthStateChanged(auth, (user: User | null) => {
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
   * Path: users/{uid}
   */
  saveUserData: async (data: BackupData): Promise<void> => {
    if (!auth.currentUser || !FirebaseService.isConfigured()) return;

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      // We store the huge JSON object in a single document for atomic consistency.
      // Firestore document limit is 1MB. If app grows larger, we would need to split collections.
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
   * This listens to the Firestore document. If another device updates it,
   * this callback fires with the new data.
   */
  subscribeToUserData: (onDataReceived: (data: BackupData) => void) => {
    if (!auth.currentUser || !FirebaseService.isConfigured()) return () => {};

    const userRef = doc(db, "users", auth.currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      // metadata.hasPendingWrites is true if the event is from a local write.
      // We typically ignore local writes to prevent feedback loops in the UI
      // (though our context logic handles this too).
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
