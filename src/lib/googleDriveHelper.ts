import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { firebaseConfig } from './firebaseHelper';
import { initializeApp, getApp, getApps } from 'firebase/app';

// Ensure the same app instance is reused
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request broad Google Drive scope as requested by user
provider.addScope('https://www.googleapis.com/auth/drive');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener and cache token in memory
export const initGoogleDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google using Drive scope
export const googleDriveSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Erro de login Google Drive:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleDriveToken = (): string | null => {
  return cachedAccessToken;
};

export const googleDriveLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Drive API services

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime?: string;
  size?: string;
  description?: string;
}

// List backups in Google Drive
export const listBackupsFromDrive = async (token: string): Promise<DriveBackupFile[]> => {
  const query = encodeURIComponent("name contains 'taverna_digital_backup' and mimeType = 'application/json' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size,description)&orderBy=createdTime%20desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('List backups failed:', errorBody);
    throw new Error('Falha ao listar backups do Google Drive.');
  }

  const data = await response.json();
  return data.files || [];
};

// Upload backup bundle containing all relevant local states
export const uploadBackupToDrive = async (token: string, name: string, backupData: any): Promise<DriveBackupFile> => {
  const metadata = {
    name: name.endsWith('.json') ? name : `${name}.json`,
    mimeType: 'application/json',
    description: 'Backup completo da Taverna Digital - Personagens, Chat, Mapas e Missôes'
  };

  const boundary = 'taverna_drive_backup_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const close_delim = `\r\n--${boundary}--`;

  const body = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(backupData) +
    close_delim;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: body
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Upload backup failed:', errorBody);
    throw new Error('Falha ao salvar o backup no Google Drive.');
  }

  return await response.json();
};

// Download backup bundle contents
export const downloadBackupFromDrive = async (token: string, fileId: string): Promise<any> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Download backup failed:', errorBody);
    throw new Error('Falha ao obter os dados do backup selecionado.');
  }

  return await response.json();
};

// Delete backup file from Google Drive
export const deleteBackupFromDrive = async (token: string, fileId: string): Promise<void> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Delete backup failed:', errorBody);
    throw new Error('Falha ao remover o backup selecionado.');
  }
};
