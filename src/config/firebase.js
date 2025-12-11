import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging'; // <--- NOVO (1)

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAu4CdKcPyB3Cp-EOgH_IXC_Iunip9L3wo",
  authDomain: "cigarats.firebaseapp.com",
  projectId: "cigarats",
  storageBucket: "cigarats.firebasestorage.app",
  messagingSenderId: "15257458742",
  appId: "1:15257458742:web:cb7e0b55f5a705fdcde097",
  measurementId: "G-JV5BZJ84F7"
};

// Inicialização
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app); // <--- NOVO (2)

// Nomes das coleções (constantes centralizadas)
export const COLLECTIONS = {
  USERS: 'users',
  POSTS: 'posts',
  GROUPS: 'groups'
};

// Para compatibilidade com código antigo
export const USERS_COLLECTION = COLLECTIONS.USERS;
export const POSTS_COLLECTION = COLLECTIONS.POSTS;
export const GROUPS_COLLECTION = COLLECTIONS.GROUPS;