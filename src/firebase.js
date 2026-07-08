import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "../firebase-config";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
// In-memory auth: we sign in on each launch (matches the login-on-relaunch gate).
export const auth = getAuth(app);
