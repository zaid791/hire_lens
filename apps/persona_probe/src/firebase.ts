import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAQA5XAaud1D6TWEoJilqRSOXF5j9ofLJA",
  authDomain: "hire-lens-498217.firebaseapp.com",
  projectId: "hire-lens-498217",
  storageBucket: "hire-lens-498217.firebasestorage.app",
  messagingSenderId: "406092103365",
  appId: "1:406092103365:web:5d8c7f13067de2e0b8faac"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
