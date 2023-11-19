import {initializeApp} from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getAuth} from "firebase/auth";
import {getStorage} from "firebase/storage";
import {getDatabase} from "firebase/database";

const firebaseConfig = {
  apiKey: `${process.env.FIREBASE_KEY}`,
  authDomain: `${process.env.FIREBASE_AUTH}`,
  projectId: `${process.env.FIREBASE_PROJECT_ID}`,
  storageBucket: `${process.env.FIREBASE_BUCKET}`,
  messagingSenderId: `${process.env.FIREBASE_MSGID}`,
  appId: `${process.env.FIREBASE_APPID}`,
  measurementId: `${process.env.FIREBASE_MEASUREMENTID}`,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const authFirebase = getAuth(app);
export const storage = getStorage(app);
export const database = getDatabase(app);
