import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCmf4X4aYPmkHW34zUEzFRtMEQOACmCUvQ",
  authDomain: "deathnote-game.firebaseapp.com",
  databaseURL: "https://deathnote-game-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "deathnote-game",
  storageBucket: "deathnote-game.firebasestorage.app",
  messagingSenderId: "728920717639",
  appId: "1:728920717639:web:4815c7edb6a988b7e67462"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Realtime Databaseの参照を取得
export const database = getDatabase(app);