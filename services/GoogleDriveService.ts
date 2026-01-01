
import { BackupData } from '../types';

/**
 * Google Drive Service for LifeOS.
 * Uses Google Identity Services (GIS) and GAPI.
 */

// --- CONFIGURATION ---
const CLIENT_ID = '974151663350-ug6a9u07gp4fmjb7gmhmf35jo5fvbtra.apps.googleusercontent.com'; 
const API_KEY = 'AIzaSyBrhp_DuvPz8Fi9micUWlcx1ae5wTmhEcU'; 

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file'; 
const MASTER_SYNC_FILENAME = 'lifeos_sync_master.json';
const TOKEN_STORAGE_KEY = 'lifeos_g_token';

export interface GoogleDriveFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  data?: any; 
}

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

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
      const checkInit = () => {
        if (gapiInited && gisInited) {
          GoogleDriveService.tryRestoreToken();
          resolve();
          return;
        }
      };

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
            checkInit();
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
               GoogleDriveService.handleTokenResponse(resp);
            },
          });
          gisInited = true;
          checkInit();
      }
    });
  },

  handleTokenResponse: (tokenResponse: any) => {
    GoogleDriveService.isSignedIn = true;
    // Cache token with expiry
    const expiry = Date.now() + (tokenResponse.expires_in * 1000);
    const storedToken = {
        value: tokenResponse,
        expiry: expiry
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(storedToken));
  },

  tryRestoreToken: () => {
    try {
        const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Date.now() < parsed.expiry && window.gapi) {
                window.gapi.client.setToken(parsed.value);
                GoogleDriveService.isSignedIn = true;
                console.log("Restored Google Token from cache");
            } else {
                localStorage.removeItem(TOKEN_STORAGE_KEY);
                GoogleDriveService.isSignedIn = false;
            }
        }
    } catch (e) {
        console.error("Failed to restore token", e);
    }
  },

  signIn: async (): Promise<boolean> => {
    await GoogleDriveService.initialize();
    
    // If valid token exists, skip popup
    if (GoogleDriveService.isSignedIn) return true;

    return new Promise((resolve, reject) => {
      try {
        tokenClient.callback = (resp: any) => {
          if (resp.error) {
            reject(resp);
          }
          GoogleDriveService.handleTokenResponse(resp);
          resolve(true);
        };
        
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (e) {
        console.error("Sign in error", e);
        reject(e);
      }
    });
  },

  signOut: async (): Promise<void> => {
    if (window.google && window.google.accounts) {
       const token = window.gapi.client.getToken();
       if (token !== null) {
         window.google.accounts.oauth2.revoke(token.access_token, () => {});
         window.gapi.client.setToken('');
         localStorage.removeItem(TOKEN_STORAGE_KEY);
         GoogleDriveService.isSignedIn = false;
       }
    }
  },

  saveMasterSync: async (data: BackupData): Promise<void> => {
    if (!GoogleDriveService.isSignedIn) {
        // Try to restore silently before failing
        await GoogleDriveService.initialize();
        if (!GoogleDriveService.isSignedIn) return; 
    }
    
    try {
      const existing = await GoogleDriveService.findFileByName(MASTER_SYNC_FILENAME);
      if (existing) {
        await GoogleDriveService.updateFile(existing.id, data);
      } else {
        await GoogleDriveService.uploadBackup(data, MASTER_SYNC_FILENAME);
      }
    } catch (e) {
      console.error("Failed to save master sync", e);
      throw e;
    }
  },

  getLatestMasterSync: async (): Promise<BackupData | null> => {
    if (!GoogleDriveService.isSignedIn) {
        await GoogleDriveService.initialize();
        if (!GoogleDriveService.isSignedIn) return null;
    }

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

  findFileByName: async (name: string): Promise<GoogleDriveFile | null> => {
    try {
        const response = await window.gapi.client.drive.files.list({
        q: `name = '${name}' and trashed = false`,
        fields: 'files(id, name, createdTime, size)',
        });
        const files = response.result.files;
        if (files && files.length > 0) {
        return files[0];
        }
        return null;
    } catch (e) {
        // Token might be invalid despite check
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        GoogleDriveService.isSignedIn = false;
        throw e;
    }
  },

  uploadBackup: async (data: BackupData, filename?: string): Promise<string> => {
    const finalName = filename || `LifeOS_Backup_${new Date().toISOString()}.json`;
    const fileContent = JSON.stringify(data);
    const file = new Blob([fileContent], { type: 'application/json' });
    const metadata = { name: finalName, mimeType: 'application/json' };

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

  updateFile: async (fileId: string, data: BackupData): Promise<void> => {
    const fileContent = JSON.stringify(data);
    const file = new Blob([fileContent], { type: 'application/json' });
    const accessToken = window.gapi.client.getToken().access_token;
    
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: new Headers({ 
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json' 
      }),
      body: file,
    });
  },

  downloadFile: async (fileId: string): Promise<BackupData> => {
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
