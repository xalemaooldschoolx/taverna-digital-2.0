import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, onValue, update } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyDZxKVH7v_F8vmx_D9jd8C9byhHbCvFX-Y",
  authDomain: "taverna-forge-core.firebaseapp.com",
  databaseURL: "https://taverna-forge-core-default-rtdb.firebaseio.com",
  projectId: "taverna-forge-core",
  storageBucket: "taverna-forge-core.firebasestorage.app",
  messagingSenderId: "1074679072751",
  appId: "1:1074679072751:web:b33e58860a2681934ad81a"
};

// Extremely resilient initialization to prevent "[DEFAULT] app already exists" errors
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);

export { ref, set, onValue, update };
