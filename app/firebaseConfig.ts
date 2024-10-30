import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';
import 'dotenv/config';


const firebaseConfig = {
  apiKey:process.env.FIREBASE_APIKEY,
  authDomain: process.env.FIREBASE_AUTHDOMAIN,
  databaseURL: "https://my-chat-app-214c0-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECTID,
  storageBucket: process.env.FIREBASE_STORAGEBUCKET,
  messagingSenderId:process.env.FIREBASE_MESSAGINGSENDERID,
  appId:process.env.FIREBASE_APPID,
  measurementId: process.env.FIREBASE_MEASUREMENTID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


export { db };