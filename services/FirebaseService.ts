
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { BackupData } from '../types';

// --- CONFIGURATION ---
// 🚨 IMPORTANT: Replace the values below with your specific Firebase Project configuration.
// 1. Go to console.firebase.google.com
// 2. Create a project
// 3. Add a Web App
// 4. Copy the `firebaseConfig` object here.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export const FirebaseService = {
  auth,
  db,
  currentUser: null as User | null,

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
    // Safety check for placeholder config
    if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
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
    if (!auth.currentUser) return;
    
    // Safety check for placeholder config
    if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") return;

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      // We wrap it in a 'data' field to keep the document clean
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
   * This handles the "PC changes -> Phone updates" flow
   */
  subscribeToUserData: (onDataReceived: (data: BackupData) => void) => {
    if (!auth.currentUser) return () => {};
    
    // Safety check
    if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") return () => {};

    const userRef = doc(db, "users", auth.currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      // metadata.hasPendingWrites is true if the event is from a local write.
      // We usually want to ignore local writes to prevent loops, 
      // but 'onSnapshot' is smart enough. 
      // However, to be safe, if we are the ones writing, we don't need to "restore" it.
      if (docSnap.metadata.hasPendingWrites) {
        // Local change, ignore
        return;
      }

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

export type { User }; // Export User type for consumption
