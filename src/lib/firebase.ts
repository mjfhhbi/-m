import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0588900920",
  appId: "1:952621128066:web:d54dee3d1dff377922179b",
  apiKey: "AIzaSyDtglR2ON8Ublt1s2uCgH-AWv50COnzJUI",
  authDomain: "gen-lang-client-0588900920.firebaseapp.com",
  storageBucket: "gen-lang-client-0588900920.firebasestorage.app",
  messagingSenderId: "952621128066"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use initializeFirestore with experimentalForceLongPolling for bypass gRPC/WebSocket blocking
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-webcraft-e223ee03-05ed-4d15-b687-10b9744488fa");

