
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9OAxwv7z3GJfj_Pvh8lI_WjihHTBLNQk",
  authDomain: "bridgely-5dc72.firebaseapp.com",
  projectId: "bridgely-5dc72",
  storageBucket: "bridgely-5dc72.firebasestorage.app",
  messagingSenderId: "979048881128",
  appId: "1:979048881128:web:9b4f9abf1f5454c3b5625d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);