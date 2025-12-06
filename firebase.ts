import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDo_M74b3Q5ZmEAuGyT0Do9i-Jp1dVOEy0",
  authDomain: "japan-ski-2025.firebaseapp.com",
  projectId: "japan-ski-2025",
  storageBucket: "japan-ski-2025.firebasestorage.app",
  messagingSenderId: "374122368640",
  appId: "1:374122368640:web:3d698ee8215c09f07b2065"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
