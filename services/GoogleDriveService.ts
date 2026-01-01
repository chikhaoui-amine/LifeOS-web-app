
import { BackupData } from '../types';

/**
 * Google Drive Service for LifeOS.
 * Uses Google Identity Services (GIS) and GAPI.
 */

// --- CONFIGURATION ---
// Credentials provided by user
const CLIENT_ID = '974151663350-ug6a9u07gp4fmjb7gmhmf35jo5fvbtra.apps.googleusercontent.com'; 
const API_KEY = 'AIzaSyBrhp_DuvPz8Fi9micUWlcx1ae5wTmhEcU'; 

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file'; // Only access files created by this app
const MASTER_SYNC_FILENAME = 'lifeos_sync_master.json';

export interface GoogleDriveFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  data?: any; // populated only on download
}

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Types for window globals
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export const GoogleDriveService = {
  isSignedIn: false,

  /**
   * Initialize GAPI and GIS
   */
  initialize: async (): Promise<void> => {
    return new Promise((resolve) => {
      if (gapiInited && gisInited) {
        resolve();
        return;
      }

      // Initialize GAPI
      if(window.gapi) {
          window.gapi.load('client', async () => {
            await window.gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: [DISCOVERY_DOC],
            });
            gapiInited = true;
            if (gisInited) resolve();
          });
      }

      // Initialize GIS
      if(window.google) {
          tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (resp: any) => {
               if (resp.error !== undefined) {
                 throw (resp);
               }
               GoogleDriveService.isSignedIn = true;
            },
          });
          gisInited = true;
          if (gapiInited) resolve();
      }
    });
  },

  signIn: async (): Promise<boolean> => {
    await GoogleDriveService.initialize();
    
    return new Promise((resolve, reject) => {
      try {
        // Trigger the popup
        tokenClient.callback = (resp: any) => {
          if (resp.error) {
            reject(resp);
          }
          GoogleDriveService.isSignedIn = true;
          // Store token in session for simple persistence across reloads in same tab
          // (Note: In production, handle token expiry/refresh)
          resolve(true);
        };
        
        // Request access token
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (e) {
        console.error("Sign in error", e);
        reject(e);
      }
    });
  },

  signOut: async (): Promise<void> => {
    if (window.google && window.google.accounts && GoogleDriveService.isSignedIn) {
       const token = window.gapi.client.getToken();
       if (token !== null) {
         window.google.accounts.oauth2.revoke(token.access_token, () => {});
         window.gapi.client.setToken('');
         GoogleDriveService.isSignedIn = false;
       }
    }
  },

  // Real-time Master Sync logic
  saveMasterSync: async (data: BackupData): Promise<void> => {
    if (!GoogleDriveService.isSignedIn) return;
    
    try {
      // Check if master file exists
      const existing = await GoogleDriveService.findFileByName(MASTER_SYNC_FILENAME);
      
      if (existing) {
        await GoogleDriveService.updateFile(existing.id, data);
      } else {
        await GoogleDriveService.uploadBackup(data, MASTER_SYNC_FILENAME);
      }
    } catch (e) {
      console.error("Failed to save master sync", e);
    }
  },

  getLatestMasterSync: async (): Promise<BackupData | null> => {
    if (!GoogleDriveService.isSignedIn) return null;

    try {
      const existing = await GoogleDriveService.findFileByName(MASTER_SYNC_FILENAME);
      if (existing) {
        return await GoogleDriveService.downloadFile(existing.id);
      }
    } catch (e) {
      console.error("Failed to get master sync", e);
    }
    return null;
  },

  /**
   * Helper to find a file by exact name
   */
  findFileByName: async (name: string): Promise<GoogleDriveFile | null> => {
    const response = await window.gapi.client.drive.files.list({
      q: `name = '${name}' and trashed = false`,
      fields: 'files(id, name, createdTime, size)',
    });
    const files = response.result.files;
    if (files && files.length > 0) {
      return files[0];
    }
    return null;
  },

  /**
   * Upload a new file (create)
   */
  uploadBackup: async (data: BackupData, filename?: string): Promise<string> => {
    if (!GoogleDriveService.isSignedIn) throw new Error("Not signed in");

    const finalName = filename || `LifeOS_Backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    const fileContent = JSON.stringify(data);
    
    const file = new Blob([fileContent], { type: 'application/json' });
    const metadata = {
      name: finalName,
      mimeType: 'application/json',
    };

    const accessToken = window.gapi.client.getToken().access_token;
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
      body: form,
    });
    
    const json = await response.json();
    return json.id;
  },

  /**
   * Update existing file content
   */
  updateFile: async (fileId: string, data: BackupData): Promise<void> => {
    const fileContent = JSON.stringify(data);
    const file = new Blob([fileContent], { type: 'application/json' });
    
    const accessToken = window.gapi.client.getToken().access_token;
    
    // Simple upload for update (media only)
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: new Headers({ 
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json' 
      }),
      body: file,
    });
  },

  listFiles: async (): Promise<GoogleDriveFile[]> => {
    if (!GoogleDriveService.isSignedIn) throw new Error("Not signed in");
    
    try {
      const response = await window.gapi.client.drive.files.list({
        pageSize: 10,
        fields: 'files(id, name, createdTime, size)',
        orderBy: 'createdTime desc',
        q: "name contains 'LifeOS_Backup' and trashed = false" // Filter for manual backups only
      });
      return response.result.files;
    } catch (e) {
      console.error("List files error", e);
      return [];
    }
  },

  downloadFile: async (fileId: string): Promise<BackupData> => {
     if (!GoogleDriveService.isSignedIn) throw new Error("Not signed in");
     
     try {
       const response = await window.gapi.client.drive.files.get({
         fileId: fileId,
         alt: 'media',
       });
       return response.result as BackupData;
     } catch (e) {
       console.error("Download file error", e);
       throw e;
     }
  }
};
