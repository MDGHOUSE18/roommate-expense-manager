import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB1RmUC-F82yMP7GJCyugIBdvOdBk-_zUw",
  authDomain: "roommate-expense-manager-f2055.firebaseapp.com",
  projectId: "roommate-expense-manager-f2055",
  storageBucket: "roommate-expense-manager-f2055.firebasestorage.app",
  messagingSenderId: "87267745140",
  appId: "1:87267745140:web:f646f55028dff38b3d2021",
  measurementId: "G-9QWLLX8FM5",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
