// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import Firebase from 'firebase/compat/app';
// import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
import { exit } from "process";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
if(firebaseConfig == undefined) {
  console.error("⚠ Firebase config does not exist. Please set NEXT_PUBLIC_FIREBASE_CONFIG in .env first!");
  exit(99);
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const parseJSON: {
  apiKey: string,
  authDomain: string,
  projectId: string,
  storageBucket: string,
  messagingSenderId: string,
  appId: string,
  measurementId: string
} = JSON.parse(firebaseConfig)


// let firebaseApp: FirebaseApp;

// Initialize Firebase
const app = initializeApp(parseJSON);
export const auth = getAuth(app);
// const analytics = getAnalytics(app);
export default Firebase;