import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCwYMECiASJyaGCSkDWzSmzJv-JUBGcF68",
  authDomain: "my-chat-app-214c0.firebaseapp.com",
  databaseURL: "https://my-chat-app-214c0-default-rtdb.firebaseio.com",
  projectId: "my-chat-app-214c0",
  storageBucket: "my-chat-app-214c0.appspot.com",
  messagingSenderId: "52024154303",
  appId: "1:52024154303:web:52109a2159ec8fd1370e0a",
  measurementId: "G-MPQ69JVESP"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


export { db };