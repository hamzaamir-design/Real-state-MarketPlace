// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "mern-estate1-9733.firebaseapp.com",
  projectId: "mern-estate1-9733",
  storageBucket: "mern-estate1-9733.firebasestorage.app",
  messagingSenderId: "1089277714279",
  appId: "1:1089277714279:web:e27fe6f1686dd3a6b119c2"
};

// Initialize Firebase
 const app = initializeApp(firebaseConfig);
export default app