
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "smart-hum",
  "appId": "1:407823150903:web:fd3b3ad90e60712c1cf4b2",
  "storageBucket": "smart-hum.firebasestorage.app",
  "apiKey": "AIzaSyCNY1QeJY-F4LueCfbtu4VS1EMQdqh-dBQ",
  "authDomain": "smart-hum.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "407823150903"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
