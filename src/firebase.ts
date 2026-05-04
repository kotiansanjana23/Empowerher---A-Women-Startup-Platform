// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCSGS2ApEPENpgECC1pWpCJrMSGM1rBjh8",
  authDomain: "empowerher-7d677.firebaseapp.com",
  projectId: "empowerher-7d677",
  storageBucket: "empowerher-7d677.firebasestorage.app",
  messagingSenderId: "664285773073",
  appId: "1:664285773073:web:cb6953dcaf90e852cea0b0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;