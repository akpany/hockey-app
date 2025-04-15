import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCnkzb19KGfVYg8ETuB7hcxbjWD7fE97TY",
  authDomain: "hockey-predictions-3a346.firebaseapp.com",
  projectId: "hockey-predictions-3a346",
  storageBucket: "hockey-predictions-3a346.firebasestorage.app",
  messagingSenderId: "691642441784",
  appId: "1:691642441784:web:aa85bf0317c50d178946cd"
};

const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);

export const auth = getAuth(app);
export const db = getFirestore(app);