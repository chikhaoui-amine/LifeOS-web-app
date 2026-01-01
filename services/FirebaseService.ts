
import { BackupData } from '../types';

// --- TYPES ---
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// --- MOCK SERVICE ---
// This simulates Firebase Auth and Firestore for demonstration purposes.
// To use real Firebase:
// 1. Run `npm install firebase`
// 2. Import initializeApp, getAuth, getFirestore, etc.
// 3. Replace the methods below with real Firebase calls.

const MOCK_STORAGE_KEY = 'lifeos_mock_cloud_db';
const MOCK_USER: User = {
  uid: 'mock-user-123',
  email: 'demo@example.com',
  displayName: 'Demo User',
  photoURL: null
};

export const FirebaseService = {
  currentUser: null as User | null,
  authListener: null as ((user: User | null) => void) | null,

  /**
   * Initialize and listen for auth changes
   */
  init: (onUserChange: (user: User | null) => void) => {
    FirebaseService.authListener = onUserChange;
    // Check if previously signed in
    const wasSignedIn = sessionStorage.getItem('lifeos_is_signed_in') === 'true';
    if (wasSignedIn) {
      FirebaseService.currentUser = MOCK_USER;
      onUserChange(MOCK_USER);
    } else {
      onUserChange(null);
    }
    
    // Return unsubscribe function
    return () => {
      FirebaseService.authListener = null;
    };
  },

  /**
   * Sign in (Simulated)
   */
  signIn: async (): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        sessionStorage.setItem('lifeos_is_signed_in', 'true');
        FirebaseService.currentUser = MOCK_USER;
        if (FirebaseService.authListener) FirebaseService.authListener(MOCK_USER);
        resolve(MOCK_USER);
      }, 800); // Simulate network delay
    });
  },

  /**
   * Sign Out (Simulated)
   */
  signOut: async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        sessionStorage.removeItem('lifeos_is_signed_in');
        FirebaseService.currentUser = null;
        if (FirebaseService.authListener) FirebaseService.authListener(null);
        resolve();
      }, 300);
    });
  },

  /**
   * Save Data (Simulated Cloud Save)
   */
  saveUserData: async (data: BackupData): Promise<void> => {
    if (!FirebaseService.currentUser) return;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify({
          data,
          updatedAt: Date.now(),
          uid: FirebaseService.currentUser?.uid
        }));
        console.log("Data saved to Mock Cloud");
        resolve();
      }, 500);
    });
  },

  /**
   * Subscribe to Data (Simulated Real-time)
   */
  subscribeToUserData: (onDataReceived: (data: BackupData) => void) => {
    if (!FirebaseService.currentUser) return () => {};

    // 1. Initial Fetch
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.uid === FirebaseService.currentUser.uid) {
          onDataReceived(parsed.data);
        }
      } catch (e) {
        console.error("Failed to parse mock cloud data");
      }
    }

    // 2. Listen for "Storage" events (simulates updates from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MOCK_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.uid === FirebaseService.currentUser?.uid) {
            console.log("Received update from another tab/device");
            onDataReceived(parsed.data);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
};
