// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBA3Y2VFks8E8dgcSmwRjoL1ISN4AN7S9E",
  authDomain: "monitask-27c8f.firebaseapp.com",
  projectId: "monitask-27c8f",
  storageBucket: "monitask-27c8f.firebasestorage.app",
  messagingSenderId: "559896353067",
  appId: "1:559896353067:web:90f5d33bdcf59068afcd6e",
  measurementId: "G-M9BNCC5KJC"
};


const app = initializeApp(firebaseConfig);


export const database = getDatabase(app);


export default app;
